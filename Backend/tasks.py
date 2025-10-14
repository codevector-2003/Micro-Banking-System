from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
from auth import get_current_user
from datetime import datetime, timedelta
from decimal import Decimal
from schemas import TransactionsCreate, Trantype
from transaction import create_transaction
import threading
import time
import logging

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Background scheduler flag
scheduler_running = False
scheduler_thread = None


def get_admin_user():
    """Create a mock admin user for automated tasks"""
    return {
        "user_type": "admin",
        "employee_id": "SYSTEM",
        "branch_id": None
    }


def auto_calculate_fixed_deposit_interest():
    """
    Automatically calculate and pay interest for all active fixed deposits.
    This function runs without API dependencies.
    """
    try:
        import psycopg2
        from database import DATABASE_CONFIG
        conn = psycopg2.connect(**DATABASE_CONFIG)

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            current_date = datetime.now()
            logger.info(
                f"Starting automatic interest calculation at {current_date}")

            # Get all active fixed deposits that haven't matured yet
            cursor.execute("""
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.principal_amount, 
                       fd.start_date, fd.end_date, fd.last_payout_date, fd.interest_payment_type,
                       fdp.interest_rate, fdp.months
                FROM FixedDeposit fd
                JOIN FixedDeposit_Plans fdp ON fd.f_plan_id = fdp.f_plan_id
                WHERE fd.status = true AND fd.end_date > %s
            """, (current_date,))

            fixed_deposits = cursor.fetchall()
            processed_count = 0
            total_interest_paid = Decimal('0.00')

            for fd in fixed_deposits:
                # Calculate days since last payout
                last_payout = fd['last_payout_date'] or fd['start_date']
                days_since_payout = (current_date - last_payout).days

                # Only process if at least 30 days have passed since last payout
                if days_since_payout >= 30:
                    # Calculate number of complete 30-day periods
                    complete_periods = days_since_payout // 30

                    # Convert interest rate from string (e.g., "13%") to decimal
                    interest_rate_str = fd['interest_rate'].replace('%', '')
                    annual_interest_rate = Decimal(
                        interest_rate_str) / Decimal('100')

                    # Calculate monthly interest rate (annual rate / 12)
                    monthly_interest_rate = annual_interest_rate / \
                        Decimal('12')

                    # Calculate interest for complete periods
                    interest_amount = fd['principal_amount'] * \
                        monthly_interest_rate * complete_periods

                    if interest_amount > 0:
                        # Get a holder for this account (use first one if joint)
                        cursor.execute("""
                            SELECT holder_id FROM AccountHolder WHERE saving_account_id = %s LIMIT 1
                        """, (fd['saving_account_id'],))
                        holder_row = cursor.fetchone()

                        if holder_row:
                            # Add interest to savings account balance
                            cursor.execute("""
                                UPDATE SavingsAccount 
                                SET balance = balance + %s 
                                WHERE saving_account_id = %s
                            """, (interest_amount, fd['saving_account_id']))

                            # Create interest transaction directly in database
                            cursor.execute("""
                                INSERT INTO Transactions (holder_id, type, amount, timestamp, description)
                                VALUES (%s, %s, %s, %s, %s)
                            """, (
                                holder_row['holder_id'],
                                'Interest',
                                interest_amount,
                                current_date,
                                f"Auto-calculated fixed deposit interest for {complete_periods} month(s) - FD ID: {fd['fixed_deposit_id']}"
                            ))

                            # Update last payout date
                            new_payout_date = last_payout + \
                                timedelta(days=complete_periods * 30)
                            cursor.execute("""
                                UPDATE FixedDeposit 
                                SET last_payout_date = %s 
                                WHERE fixed_deposit_id = %s
                            """, (new_payout_date, fd['fixed_deposit_id']))

                            processed_count += 1
                            total_interest_paid += interest_amount

                            logger.info(
                                f"Processed FD {fd['fixed_deposit_id']}: Interest {interest_amount}, Periods: {complete_periods}")

        conn.commit()
        logger.info(
            f"Interest calculation completed: {processed_count} deposits, Total interest: {total_interest_paid}")

    except Exception as e:
        logger.error(f"Error in automatic interest calculation: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()


def auto_process_matured_deposits():
    """
    Automatically process matured fixed deposits.
    """
    try:
        import psycopg2
        from database import DATABASE_CONFIG
        conn = psycopg2.connect(**DATABASE_CONFIG)

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            current_date = datetime.now()
            logger.info(
                f"Starting automatic maturity processing at {current_date}")

            # Get all fixed deposits that have matured
            cursor.execute("""
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.principal_amount, 
                       fd.start_date, fd.end_date, fd.last_payout_date,
                       fdp.interest_rate, fdp.months
                FROM FixedDeposit fd
                JOIN FixedDeposit_Plans fdp ON fd.f_plan_id = fdp.f_plan_id
                WHERE fd.status = true AND fd.end_date <= %s
            """, (current_date,))

            matured_deposits = cursor.fetchall()
            processed_count = 0
            total_amount_returned = Decimal('0.00')

            for fd in matured_deposits:
                # Calculate any remaining interest from last payout to maturity
                last_payout = fd['last_payout_date'] or fd['start_date']
                days_remaining = (fd['end_date'] - last_payout).days

                remaining_interest = Decimal('0.00')
                if days_remaining > 0:
                    # Convert interest rate from string to decimal
                    interest_rate_str = fd['interest_rate'].replace('%', '')
                    annual_interest_rate = Decimal(
                        interest_rate_str) / Decimal('100')
                    daily_interest_rate = annual_interest_rate / Decimal('365')

                    # Calculate proportional interest for remaining days
                    remaining_interest = fd['principal_amount'] * \
                        daily_interest_rate * days_remaining

                # Total amount to return (principal + remaining interest)
                total_return = fd['principal_amount'] + remaining_interest

                # Get a holder for this account
                cursor.execute("""
                    SELECT holder_id FROM AccountHolder WHERE saving_account_id = %s LIMIT 1
                """, (fd['saving_account_id'],))
                holder_row = cursor.fetchone()

                if holder_row:
                    # Add total amount to savings account
                    cursor.execute("""
                        UPDATE SavingsAccount 
                        SET balance = balance + %s 
                        WHERE saving_account_id = %s
                    """, (total_return, fd['saving_account_id']))

                    # Create maturity transaction
                    cursor.execute("""
                        INSERT INTO Transactions (holder_id, type, amount, timestamp, description)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        holder_row['holder_id'],
                        'Deposit',
                        total_return,
                        current_date,
                        f"Auto-processed fixed deposit maturity - Principal: {fd['principal_amount']}, Interest: {remaining_interest} - FD ID: {fd['fixed_deposit_id']}"
                    ))

                    # Mark fixed deposit as inactive/completed
                    cursor.execute("""
                        UPDATE FixedDeposit 
                        SET status = false 
                        WHERE fixed_deposit_id = %s
                    """, (fd['fixed_deposit_id'],))

                    processed_count += 1
                    total_amount_returned += total_return

                    logger.info(
                        f"Matured FD {fd['fixed_deposit_id']}: Total return {total_return}")

        conn.commit()
        logger.info(
            f"Maturity processing completed: {processed_count} deposits, Total returned: {total_amount_returned}")

    except Exception as e:
        logger.error(f"Error in automatic maturity processing: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()


def run_daily_tasks():
    """Run the daily scheduled tasks continuously"""
    global scheduler_running

    while scheduler_running:
        current_time = datetime.now()

        # Check if it's 00:01 AM (interest calculation time)
        if current_time.hour == 0 and current_time.minute == 1:
            logger.info("Running scheduled interest calculation")
            auto_calculate_fixed_deposit_interest()
            # Sleep for 1 minute to avoid running multiple times
            time.sleep(60)

        # Check if it's 00:05 AM (maturity processing time)
        elif current_time.hour == 0 and current_time.minute == 5:
            logger.info("Running scheduled maturity processing")
            auto_process_matured_deposits()
            # Sleep for 1 minute to avoid running multiple times
            time.sleep(60)

        else:
            time.sleep(30)  # Check every 30 seconds


def start_automatic_tasks():
    """
    Start the automatic interest calculation scheduler.
    Runs daily at 00:01 AM to check for interest payments and matured deposits.
    """
    global scheduler_running, scheduler_thread
    if not scheduler_running:
        scheduler_running = True

        # Start scheduler in background thread
        scheduler_thread = threading.Thread(
            target=run_daily_tasks, daemon=True)
        scheduler_thread.start()

        logger.info(
            "Automatic fixed deposit tasks started - runs daily at 00:01 AM")
        return {"message": "Automatic tasks started successfully"}
    else:
        return {"message": "Automatic tasks already running"}


def stop_automatic_tasks():
    """Stop the automatic tasks"""
    global scheduler_running
    scheduler_running = False
    logger.info("Automatic fixed deposit tasks stopped")
    return {"message": "Automatic tasks stopped successfully"}


@router.post("/start-automatic-tasks")
def start_automatic_tasks_endpoint(current_user=Depends(get_current_user)):
    """
    API endpoint to start automatic fixed deposit tasks.
    Only admins can start automatic tasks.
    """
    user_type = current_user.get("type").lower()
    if user_type != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can start automatic tasks.")

    return start_automatic_tasks()


@router.post("/stop-automatic-tasks")
def stop_automatic_tasks_endpoint(current_user=Depends(get_current_user)):
    """
    API endpoint to stop automatic fixed deposit tasks.
    Only admins can stop automatic tasks.
    """
    user_type = current_user.get("type").lower()
    if user_type != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can stop automatic tasks.")

    return stop_automatic_tasks()


@router.get("/automatic-tasks-status")
def get_automatic_tasks_status(current_user=Depends(get_current_user)):
    """
    Get the status of automatic tasks.
    """
    user_type = current_user.get("type").lower()
    if user_type not in ["admin", "branch_manager"]:
        raise HTTPException(
            status_code=403, detail="Only admins and branch managers can check task status.")

    return {
        "scheduler_running": scheduler_running,
        "next_interest_calculation": "Daily at 00:01 AM" if scheduler_running else "Not scheduled",
        "next_maturity_processing": "Daily at 00:05 AM" if scheduler_running else "Not scheduled",
        "current_time": datetime.now().isoformat()
    }


@router.post("/calculate-fixed-deposit-interest")
def calculate_fixed_deposit_interest(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Calculate and pay interest for all active fixed deposits based on 30-day monthly cycles.
    Only admins can trigger this calculation.
    Interest is calculated proportionally if maturity date hasn't been reached.
    """
    user_type = current_user.get("type").lower()
    if user_type != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can calculate fixed deposit interest.")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            current_date = datetime.now()

            # Get all active fixed deposits that haven't matured yet
            cursor.execute("""
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.principal_amount, 
                       fd.start_date, fd.end_date, fd.last_payout_date, fd.interest_payment_type,
                       fdp.interest_rate, fdp.months
                FROM FixedDeposit fd
                JOIN FixedDeposit_Plans fdp ON fd.f_plan_id = fdp.f_plan_id
                WHERE fd.status = true AND fd.end_date > %s
            """, (current_date,))

            fixed_deposits = cursor.fetchall()
            processed_count = 0
            total_interest_paid = Decimal('0.00')

            for fd in fixed_deposits:
                # Calculate days since last payout
                last_payout = fd['last_payout_date'] or fd['start_date']
                days_since_payout = (current_date - last_payout).days

                # Only process if at least 30 days have passed since last payout
                if days_since_payout >= 30:
                    # Calculate number of complete 30-day periods
                    complete_periods = days_since_payout // 30

                    # Convert interest rate from string (e.g., "13%") to decimal
                    interest_rate_str = fd['interest_rate'].replace('%', '')
                    annual_interest_rate = Decimal(
                        interest_rate_str) / Decimal('100')

                    # Calculate monthly interest rate (annual rate / 12)
                    monthly_interest_rate = annual_interest_rate / \
                        Decimal('12')

                    # Calculate interest for complete periods
                    interest_amount = fd['principal_amount'] * \
                        monthly_interest_rate * complete_periods

                    if interest_amount > 0:
                        # Get a holder for this account (use first one if joint)
                        cursor.execute("""
                            SELECT holder_id FROM AccountHolder WHERE saving_account_id = %s LIMIT 1
                        """, (fd['saving_account_id'],))
                        holder_row = cursor.fetchone()

                        if holder_row:
                            # Add interest to savings account balance
                            cursor.execute("""
                                UPDATE SavingsAccount 
                                SET balance = balance + %s 
                                WHERE saving_account_id = %s
                            """, (interest_amount, fd['saving_account_id']))

                            # Create interest transaction
                            transaction_data = TransactionsCreate(
                                holder_id=holder_row['holder_id'],
                                type=Trantype.interest,
                                amount=interest_amount,
                                timestamp=current_date,
                                description=f"Fixed deposit interest for {complete_periods} month(s) - FD ID: {fd['fixed_deposit_id']}"
                            )

                            # Record the transaction
                            create_transaction(
                                transaction_data, conn, current_user)

                            # Update last payout date
                            new_payout_date = last_payout + \
                                timedelta(days=complete_periods * 30)
                            cursor.execute("""
                                UPDATE FixedDeposit 
                                SET last_payout_date = %s 
                                WHERE fixed_deposit_id = %s
                            """, (new_payout_date, fd['fixed_deposit_id']))

                            processed_count += 1
                            total_interest_paid += interest_amount

            conn.commit()

            return {
                "message": "Fixed deposit interest calculation completed successfully",
                "processed_deposits": processed_count,
                "total_interest_paid": float(total_interest_paid),
                "calculation_date": current_date.isoformat()
            }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/mature-fixed-deposits")
def mature_fixed_deposits(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Process matured fixed deposits by returning principal + final interest to savings account.
    Only admins can trigger this process.
    """
    user_type = current_user.get("type").lower()
    if user_type != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can process matured fixed deposits.")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            current_date = datetime.now()

            # Get all fixed deposits that have matured
            cursor.execute("""
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.principal_amount, 
                       fd.start_date, fd.end_date, fd.last_payout_date,
                       fdp.interest_rate, fdp.months
                FROM FixedDeposit fd
                JOIN FixedDeposit_Plans fdp ON fd.f_plan_id = fdp.f_plan_id
                WHERE fd.status = true AND fd.end_date <= %s
            """, (current_date,))

            matured_deposits = cursor.fetchall()
            processed_count = 0
            total_amount_returned = Decimal('0.00')

            for fd in matured_deposits:
                # Calculate any remaining interest from last payout to maturity
                last_payout = fd['last_payout_date'] or fd['start_date']
                days_remaining = (fd['end_date'] - last_payout).days

                remaining_interest = Decimal('0.00')
                if days_remaining > 0:
                    # Convert interest rate from string to decimal
                    interest_rate_str = fd['interest_rate'].replace('%', '')
                    annual_interest_rate = Decimal(
                        interest_rate_str) / Decimal('100')
                    daily_interest_rate = annual_interest_rate / Decimal('365')

                    # Calculate proportional interest for remaining days
                    remaining_interest = fd['principal_amount'] * \
                        daily_interest_rate * days_remaining

                # Total amount to return (principal + remaining interest)
                total_return = fd['principal_amount'] + remaining_interest

                # Get a holder for this account
                cursor.execute("""
                    SELECT holder_id FROM AccountHolder WHERE saving_account_id = %s LIMIT 1
                """, (fd['saving_account_id'],))
                holder_row = cursor.fetchone()

                if holder_row:
                    # Add total amount to savings account
                    cursor.execute("""
                        UPDATE SavingsAccount 
                        SET balance = balance + %s 
                        WHERE saving_account_id = %s
                    """, (total_return, fd['saving_account_id']))

                    # Create maturity transaction
                    transaction_data = TransactionsCreate(
                        holder_id=holder_row['holder_id'],
                        type=Trantype.deposit,
                        amount=total_return,
                        timestamp=current_date,
                        description=f"Fixed deposit maturity - Principal: {fd['principal_amount']}, Interest: {remaining_interest} - FD ID: {fd['fixed_deposit_id']}"
                    )

                    # Record the transaction
                    create_transaction(transaction_data, conn, current_user)

                    # Mark fixed deposit as inactive/completed
                    cursor.execute("""
                        UPDATE FixedDeposit 
                        SET status = false 
                        WHERE fixed_deposit_id = %s
                    """, (fd['fixed_deposit_id'],))

                    processed_count += 1
                    total_amount_returned += total_return

            conn.commit()

            return {
                "message": "Fixed deposit maturity processing completed successfully",
                "matured_deposits": processed_count,
                "total_amount_returned": float(total_amount_returned),
                "processing_date": current_date.isoformat()
            }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/fixed-deposit-interest-report")
def get_fixed_deposit_interest_report(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Generate a report showing fixed deposits due for interest payment.
    """
    user_type = current_user.get("type").lower()
    if user_type not in ["admin", "branch_manager"]:
        raise HTTPException(
            status_code=403, detail="Only admins and branch managers can view interest reports.")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            current_date = datetime.now()

            # Get fixed deposits due for interest payment (30+ days since last payout)
            cursor.execute("""
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.principal_amount, 
                       fd.start_date, fd.end_date, fd.last_payout_date,
                       fdp.interest_rate, fdp.months,
                       EXTRACT(DAYS FROM %s - COALESCE(fd.last_payout_date, fd.start_date)) as days_since_payout
                FROM FixedDeposit fd
                JOIN FixedDeposit_Plans fdp ON fd.f_plan_id = fdp.f_plan_id
                WHERE fd.status = true 
                AND fd.end_date > %s
                AND EXTRACT(DAYS FROM %s - COALESCE(fd.last_payout_date, fd.start_date)) >= 30
                ORDER BY days_since_payout DESC
            """, (current_date, current_date, current_date))

            due_deposits = cursor.fetchall()

            # Calculate potential interest for each
            report_data = []
            total_potential_interest = Decimal('0.00')

            for fd in due_deposits:
                days_since_payout = int(fd['days_since_payout'])
                complete_periods = days_since_payout // 30

                # Calculate interest
                interest_rate_str = fd['interest_rate'].replace('%', '')
                annual_interest_rate = Decimal(
                    interest_rate_str) / Decimal('100')
                monthly_interest_rate = annual_interest_rate / Decimal('12')
                potential_interest = fd['principal_amount'] * \
                    monthly_interest_rate * complete_periods

                total_potential_interest += potential_interest

                report_data.append({
                    "fixed_deposit_id": fd['fixed_deposit_id'],
                    "saving_account_id": fd['saving_account_id'],
                    "principal_amount": float(fd['principal_amount']),
                    "interest_rate": fd['interest_rate'],
                    "days_since_payout": days_since_payout,
                    "complete_periods": complete_periods,
                    "potential_interest": float(potential_interest),
                    "last_payout_date": fd['last_payout_date'].isoformat() if fd['last_payout_date'] else fd['start_date'].isoformat()
                })

            return {
                "report_date": current_date.isoformat(),
                "total_deposits_due": len(due_deposits),
                "total_potential_interest": float(total_potential_interest),
                "deposits": report_data
            }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
