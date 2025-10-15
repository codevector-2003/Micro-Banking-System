from psycopg2.extras import RealDictCursor
from datetime import datetime
from auth import get_current_user
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from schemas import FixedDepositCreate, FixedDepositRead, AccountSearchRequest, FixedDepositPlanCreate, FixedDepositPlanRead

router = APIRouter()


@router.post("/fixed-deposit", response_model=FixedDepositRead)
def create_fixed_deposit(fixed_deposit: FixedDepositCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> FixedDepositRead:
    """
    Create a fixed deposit linked to an existing savings account.
    Only agents and branch managers can create fixed deposits.
    The principal amount will be deducted from the savings account balance.
    """
    user_type = current_user.get("type")
    if not user_type:
        raise HTTPException(status_code=401, detail="Invalid user type")
    user_type = user_type.lower()
    if user_type not in ["agent", "branch_manager"]:
        raise HTTPException(status_code=403, detail="Operation not permitted")

    employee_id = current_user.get("employee_id")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get branch_id from employee table if needed for branch manager
            user_branch_id = None
            if user_type == 'branch_manager':
                cursor.execute(
                    "SELECT branch_id FROM Employee WHERE employee_id = %s",
                    (employee_id,)
                )
                branch_row = cursor.fetchone()
                if not branch_row or not branch_row['branch_id']:
                    raise HTTPException(
                        status_code=400, detail="Branch manager does not have a branch assigned"
                    )
                user_branch_id = branch_row['branch_id']

            # Verify savings account exists and get its details
            cursor.execute("""
                SELECT sa.saving_account_id, sa.balance, sa.status, sa.branch_id, sa.employee_id
                FROM SavingsAccount sa 
                WHERE sa.saving_account_id = %s AND sa.status = true
            """, (fixed_deposit.saving_account_id,))

            account = cursor.fetchone()
            if not account:
                raise HTTPException(
                    status_code=400, detail="Invalid or inactive saving_account_id")
            if user_type == 'agent' and account['employee_id'] != employee_id:
                raise HTTPException(
                    status_code=403, detail="Agents can only create fixed deposits for their own accounts")
            if user_type == 'branch_manager' and account['branch_id'] != user_branch_id:
                raise HTTPException(
                    status_code=403, detail="Branch managers can only create fixed deposits for accounts in their branch")

            cursor.execute("""
                SELECT months, interest_rate 
                FROM FixedDeposit_Plans 
                WHERE f_plan_id = %s
            """, (fixed_deposit.f_plan_id,))
            plan_row = cursor.fetchone()
            if not plan_row:
                raise HTTPException(
                    status_code=400, detail="Invalid fixed deposit plan ID")
            months = int(plan_row['months'])
            # interest_rate is now decimal, but not used here

            # Check if a fixed deposit already exists for this account
            cursor.execute("""
                SELECT fixed_deposit_id FROM FixedDeposit WHERE saving_account_id = %s AND status = true
            """, (fixed_deposit.saving_account_id,))
            existing_fd = cursor.fetchone()
            if existing_fd:
                raise HTTPException(
                    status_code=400,
                    detail="Only one fixed deposit is allowed per account."
                )

            # Prepare fixed deposit details
            start_date = datetime.now()
            # Calculate end_date by adding months
            end_month = start_date.month + months
            end_year = start_date.year + (end_month - 1) // 12
            end_month = ((end_month - 1) % 12) + 1
            end_date = start_date.replace(year=end_year, month=end_month)
            principal_amount = fixed_deposit.principal_amount
            interest_payment_type = fixed_deposit.interest_payment_type
            last_payout_date = start_date
            status = True

            cursor.execute("""
                INSERT INTO FixedDeposit (
                    saving_account_id, f_plan_id, start_date, 
                    end_date, principal_amount, interest_payment_type, 
                    last_payout_date, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING fixed_deposit_id, saving_account_id, f_plan_id, start_date, 
                         end_date, principal_amount, interest_payment_type, 
                         last_payout_date, status
            """, (
                fixed_deposit.saving_account_id,
                fixed_deposit.f_plan_id,
                start_date,
                end_date,
                principal_amount,
                interest_payment_type,
                last_payout_date,
                status
            ))

            fd_row = cursor.fetchone()
            if not fd_row:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create fixed deposit"
                )

            # Check if account has sufficient funds for the fixed deposit
            if account['balance'] < principal_amount:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient funds: Account balance is {account['balance']}, but {principal_amount} is required for the fixed deposit."
                )

            # Deduct amount from savings account
            new_balance = account['balance'] - principal_amount
            cursor.execute("""
                UPDATE SavingsAccount 
                SET balance = %s 
                WHERE saving_account_id = %s
            """, (new_balance, fixed_deposit.saving_account_id))

            # Get holder_id for transaction record
            cursor.execute("""
                SELECT holder_id FROM AccountHolder WHERE saving_account_id = %s LIMIT 1
            """, (fixed_deposit.saving_account_id,))
            holder_row = cursor.fetchone()
            if not holder_row:
                raise HTTPException(
                    status_code=400, detail="No holder found for this account")
            holder_id = holder_row['holder_id']

            # Create withdrawal transaction directly (bypassing minimum balance check for FD)
            cursor.execute("""
                INSERT INTO Transactions (holder_id, type, amount, timestamp, description)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING transaction_id, holder_id, type, amount, timestamp, ref_number, description
            """, (
                holder_id,
                'Withdrawal',
                principal_amount,
                datetime.now(),
                "Fixed deposit principal deduction"
            ))

            conn.commit()
            return FixedDepositRead(**fd_row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.post("/fixed-deposit/search", response_model=list[FixedDepositRead])
def search_fixed_deposits_by_account_number(
    request: AccountSearchRequest,
    conn=Depends(get_db),
):
    """
    Search fixed deposits by account number.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get saving_account_id from account_number
            cursor.execute("""
                SELECT saving_account_id FROM SavingsAccount WHERE saving_account_id = %s
            """, (request.saving_account_id,))
            account_row = cursor.fetchone()
            if not account_row:
                raise HTTPException(
                    status_code=404, detail="Account not found")

            saving_account_id = account_row['saving_account_id']

            # Get all fixed deposits for this account
            cursor.execute("""
                SELECT fixed_deposit_id, saving_account_id, f_plan_id, start_date, end_date,
                       principal_amount, interest_payment_type, last_payout_date, status
                FROM FixedDeposit
                WHERE saving_account_id = %s
                ORDER BY start_date DESC
            """, (saving_account_id,))
            fd_rows = cursor.fetchall()
            return [FixedDepositRead(**fd) for fd in fd_rows]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/fixed-deposit-plan", status_code=201)
def create_fixed_deposit_plan(plan: FixedDepositPlanCreate, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Create a new fixed deposit plan. Only admins can access this endpoint.
    """
    user_type = current_user.get("type", "").lower()
    if user_type != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can create fixed deposit plans.")
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Ensure months is int and interest_rate is decimal
            months = int(plan.months) if isinstance(
                plan.months, str) else plan.months
            interest_rate = float(plan.interest_rate) if isinstance(
                plan.interest_rate, str) else plan.interest_rate
            cursor.execute("""
                INSERT INTO FixedDeposit_Plans (f_plan_id, months, interest_rate)
                VALUES (%s, %s, %s)
            """, (plan.f_plan_id, months, interest_rate))
            conn.commit()
        return {"message": "Fixed deposit plan created successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/fixed-deposit-plan", response_model=list[FixedDepositPlanRead])
def read_fixed_deposit_plans(conn=Depends(get_db)):
    """
    Get all fixed deposit plans.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT f_plan_id, months, interest_rate FROM FixedDeposit_Plans ORDER BY months
            """)
            plans = cursor.fetchall()
            return [FixedDepositPlanRead(**plan) for plan in plans]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/fixed-deposit/branch", response_model=list[FixedDepositRead])
def get_branch_fixed_deposits(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get all fixed deposits in the same branch as the current branch manager.
    Only branch managers can access this endpoint.
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    if user_type != 'branch_manager':
        raise HTTPException(
            status_code=403, detail="Only branch managers can view branch fixed deposits")

    try:
        employee_id = current_user.get('employee_id')

        # If user doesn't have employee_id, they might be an admin user - reject access
        if not employee_id:
            raise HTTPException(
                status_code=403, detail="User is not associated with an employee record")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get branch_id of the current branch manager
            cursor.execute(
                "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
            manager_row = cursor.fetchone()
            if not manager_row or not manager_row['branch_id']:
                raise HTTPException(
                    status_code=400, detail="Branch manager does not have a branch assigned")

            branch_id = manager_row['branch_id']

            # Get all fixed deposits in the same branch
            cursor.execute("""
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.f_plan_id, fd.start_date, fd.end_date,
                       fd.principal_amount, fd.interest_payment_type, fd.last_payout_date, fd.status
                FROM FixedDeposit fd
                INNER JOIN SavingsAccount sa ON fd.saving_account_id = sa.saving_account_id
                WHERE sa.branch_id = %s
                ORDER BY fd.start_date DESC
            """, (branch_id,))

            rows = cursor.fetchall()
            return [FixedDepositRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/fixed-deposit/branch/stats")
def get_branch_fixed_deposit_stats(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get fixed deposit statistics for the branch manager's branch.
    Only branch managers can access this endpoint.
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    if user_type != 'branch_manager':
        raise HTTPException(
            status_code=403, detail="Only branch managers can view branch statistics")

    try:
        employee_id = current_user.get('employee_id')

        # If user doesn't have employee_id, they might be an admin user - reject access
        if not employee_id:
            raise HTTPException(
                status_code=403, detail="User is not associated with an employee record")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get branch_id of the current branch manager
            cursor.execute(
                "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
            manager_row = cursor.fetchone()
            if not manager_row or not manager_row['branch_id']:
                raise HTTPException(
                    status_code=400, detail="Branch manager does not have a branch assigned")

            branch_id = manager_row['branch_id']

            # Get fixed deposit statistics for the branch
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_fixed_deposits,
                    COUNT(CASE WHEN fd.status = true THEN 1 END) as active_fixed_deposits,
                    SUM(CASE WHEN fd.status = true THEN fd.principal_amount ELSE 0 END) as total_principal_amount,
                    AVG(CASE WHEN fd.status = true THEN fd.principal_amount ELSE NULL END) as average_principal_amount,
                    COUNT(CASE WHEN DATE_TRUNC('month', fd.start_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_fds_this_month,
                    COUNT(CASE WHEN fd.end_date <= CURRENT_DATE AND fd.status = true THEN 1 END) as matured_fds
                FROM FixedDeposit fd
                INNER JOIN SavingsAccount sa ON fd.saving_account_id = sa.saving_account_id
                WHERE sa.branch_id = %s
            """, (branch_id,))

            stats = cursor.fetchone()
            return {
                "total_fixed_deposits": stats['total_fixed_deposits'] or 0,
                "active_fixed_deposits": stats['active_fixed_deposits'] or 0,
                "total_principal_amount": float(stats['total_principal_amount'] or 0),
                "average_principal_amount": float(stats['average_principal_amount'] or 0),
                "new_fds_this_month": stats['new_fds_this_month'] or 0,
                "matured_fds": stats['matured_fds'] or 0,
                "branch_id": branch_id
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
