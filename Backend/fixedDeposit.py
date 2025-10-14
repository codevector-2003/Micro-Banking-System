from psycopg2.extras import RealDictCursor
from schemas import FixedDepositCreate, FixedDepositRead
from fastapi import HTTPException, APIRouter, Depends
from database import get_db
from auth import get_current_user
from datetime import datetime, timedelta
from decimal import Decimal

router = APIRouter()

@router.post("/fixed-deposit", response_model=FixedDepositRead)
def create_fixed_deposit(fd: FixedDepositCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> FixedDepositRead:
    """
    Create a fixed deposit linked to an existing savings account.
    Only agents and branch managers can create fixed deposits.
    The principal amount will be deducted from the savings account balance.
    """
    user_type = current_user.get('type').lower()
    if user_type not in ['agent', 'branch_manager']:
        raise HTTPException(
            status_code=403, 
            detail="Only agents and branch managers can create fixed deposits"
        )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Verify savings account exists and get its details
            cursor.execute("""
                SELECT sa.saving_account_id, sa.balance, sa.status, sa.branch_id, sa.employee_id
                FROM SavingsAccount sa 
                WHERE sa.saving_account_id = %s AND sa.status = true
            """, (fd.saving_account_id,))
            
            savings_account = cursor.fetchone()
            if not savings_account:
                raise HTTPException(
                    status_code=404, 
                    detail="Savings account not found or inactive"
                )

            # Check if user has permission to access this account
            if user_type == 'agent' and savings_account['employee_id'] != current_user.get('employee_id'):
                raise HTTPException(
                    status_code=403, 
                    detail="Agents can only create FDs for their own accounts"
                )
            elif user_type == 'branch_manager' and savings_account['branch_id'] != current_user.get('branch_id'):
                raise HTTPException(
                    status_code=403, 
                    detail="Branch managers can only create FDs for accounts in their branch"
                )

            # Verify FD plan exists
            cursor.execute("""
                SELECT f_plan_id, months, interest_rate 
                FROM FixedDeposit_Plans 
                WHERE f_plan_id = %s
            """, (fd.fd_plan_id,))
            
            fd_plan = cursor.fetchone()
            if not fd_plan:
                raise HTTPException(
                    status_code=404, 
                    detail="Fixed deposit plan not found"
                )

            # Check if savings account has sufficient balance
            if savings_account['balance'] < fd.principal_amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient balance in savings account. Available: {savings_account['balance']}, Required: {fd.principal_amount}"
                )

            # Generate unique FD ID
            cursor.execute("""
                SELECT generate_fd_id() as fd_id
            """)
            fd_id_row = cursor.fetchone()
            if not fd_id_row:
                # Fallback ID generation if function doesn't exist
                import random
                fd_id = f"FD{random.randint(100000, 999999)}"
            else:
                fd_id = fd_id_row['fd_id']

            # Create the fixed deposit
            cursor.execute("""
                INSERT INTO FixedDeposit (
                    fixed_deposit_id, saving_account_id, f_plan_id, start_date, 
                    end_date, principal_amount, interest_payment_type, 
                    last_payout_date, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING fixed_deposit_id, saving_account_id, f_plan_id, start_date, 
                         end_date, principal_amount, interest_payment_type, 
                         last_payout_date, status
            """, (
                fd_id,
                fd.saving_account_id,
                fd.fd_plan_id,
                fd.start_date,
                fd.end_date,
                fd.principal_amount,
                fd.interest_payment_type,
                fd.last_payout_date,
                fd.status
            ))

            fd_row = cursor.fetchone()
            if not fd_row:
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to create fixed deposit"
                )

            # Deduct amount from savings account
            new_balance = savings_account['balance'] - fd.principal_amount
            cursor.execute("""
                UPDATE SavingsAccount 
                SET balance = %s 
                WHERE saving_account_id = %s
            """, (new_balance, fd.saving_account_id))

            conn.commit()
            return FixedDepositRead(**fd_row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )

@router.get("/fixed-deposit/{fd_id}", response_model=FixedDepositRead)
def get_fixed_deposit(fd_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """Get a specific fixed deposit by ID"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT fd.*, sa.branch_id, sa.employee_id
                FROM FixedDeposit fd
                JOIN SavingsAccount sa ON fd.saving_account_id = sa.saving_account_id
                WHERE fd.fixed_deposit_id = %s
            """, (fd_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404, 
                    detail="Fixed deposit not found"
                )

            # Check permissions
            user_type = current_user.get('type').lower()
            if user_type == 'agent' and row['employee_id'] != current_user.get('employee_id'):
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied"
                )
            elif user_type == 'branch_manager' and row['branch_id'] != current_user.get('branch_id'):
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied"
                )

            # Remove extra fields for response
            fd_data = {k: v for k, v in row.items() if k not in ['branch_id', 'employee_id']}
            return FixedDepositRead(**fd_data)

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )

@router.post("/fixed-deposit/search", response_model=list[FixedDepositRead])
def search_fixed_deposits(query: dict, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Search fixed deposits by various criteria.
    
    Filters:
    - fixed_deposit_id
    - saving_account_id
    - f_plan_id
    - status
    
    Agents see only their accounts' FDs.
    Branch managers see FDs in their branch.
    Admins see all FDs.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            base_query = """
                SELECT fd.fixed_deposit_id, fd.saving_account_id, fd.f_plan_id, 
                       fd.start_date, fd.end_date, fd.principal_amount, 
                       fd.interest_payment_type, fd.last_payout_date, fd.status
                FROM FixedDeposit fd
                JOIN SavingsAccount sa ON fd.saving_account_id = sa.saving_account_id
                WHERE 1=1
            """
            params = []

            user_type = current_user.get('type').lower()
            # Apply user-based restrictions
            if user_type == 'agent':
                base_query += " AND sa.employee_id = %s"
                params.append(current_user.get('employee_id'))
            elif user_type == 'branch_manager':
                base_query += " AND sa.branch_id = %s"
                params.append(current_user.get('branch_id'))

            # Add search filters
            if 'fixed_deposit_id' in query:
                base_query += " AND fd.fixed_deposit_id = %s"
                params.append(query['fixed_deposit_id'])
            if 'saving_account_id' in query:
                base_query += " AND fd.saving_account_id = %s"
                params.append(query['saving_account_id'])
            if 'f_plan_id' in query:
                base_query += " AND fd.f_plan_id = %s"
                params.append(query['f_plan_id'])
            if 'status' in query:
                base_query += " AND fd.status = %s"
                params.append(query['status'])

            cursor.execute(base_query, tuple(params))
            rows = cursor.fetchall()
            return [FixedDepositRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )

@router.put("/fixed-deposit/{fd_id}/status")
def update_fixed_deposit_status(fd_id: str, status: bool, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """Update fixed deposit status (activate/deactivate)"""
    user_type = current_user.get('type').lower()
    if user_type not in ['agent', 'branch_manager', 'admin']:
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions"
        )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get FD details with associated account info
            cursor.execute("""
                SELECT fd.*, sa.branch_id, sa.employee_id, sa.balance
                FROM FixedDeposit fd
                JOIN SavingsAccount sa ON fd.saving_account_id = sa.saving_account_id
                WHERE fd.fixed_deposit_id = %s
            """, (fd_id,))
            
            fd_row = cursor.fetchone()
            if not fd_row:
                raise HTTPException(
                    status_code=404, 
                    detail="Fixed deposit not found"
                )

            # Check permissions
            if user_type == 'agent' and fd_row['employee_id'] != current_user.get('employee_id'):
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied"
                )
            elif user_type == 'branch_manager' and fd_row['branch_id'] != current_user.get('branch_id'):
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied"
                )

            # If closing FD (status = False), return principal to savings account
            if not status and fd_row['status']:
                new_balance = fd_row['balance'] + fd_row['principal_amount']
                cursor.execute("""
                    UPDATE SavingsAccount 
                    SET balance = %s 
                    WHERE saving_account_id = %s
                """, (new_balance, fd_row['saving_account_id']))

            # Update FD status
            cursor.execute("""
                UPDATE FixedDeposit 
                SET status = %s 
                WHERE fixed_deposit_id = %s
            """, (status, fd_id))

            conn.commit()
            return {"message": f"Fixed deposit status updated to {'active' if status else 'inactive'}"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )

@router.get("/fixed-deposit-plans", response_model=list)
def get_fd_plans(conn=Depends(get_db)):
    """Get all available fixed deposit plans"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT f_plan_id, months, interest_rate 
                FROM FixedDeposit_Plans 
                ORDER BY f_plan_id
            """)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}"
        )