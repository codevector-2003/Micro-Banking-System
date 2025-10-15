# Change account status function
from psycopg2.extras import RealDictCursor
from schemas import SavingsAccountCreate, SavingsAccountRead, AccountStatusRequest, SavingsAccountWithCustomerRead
from schemas import AccountHolderCreate, SavingsAccountPlansRead
from fastapi import HTTPException, APIRouter, Depends
from database import get_db
from auth import get_current_user
from schemas import Stype
from schemas import SavingsAccountRead

from pydantic import BaseModel


router = APIRouter()


@router.get("/plans", response_model=list[SavingsAccountPlansRead])
def get_savings_plans(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """Get all available savings account plans"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT s_plan_id, plan_name, interest_rate, min_balance
                FROM SavingsAccount_Plans
                ORDER BY s_plan_id
            """)
            rows = cursor.fetchall()
            return [SavingsAccountPlansRead(**row) for row in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/saving-account", response_model=SavingsAccountRead)
def create_saving_account(account: SavingsAccountCreate, customer_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)) -> SavingsAccountRead:
    """
    Create a savings account and automatically link it to a customer via AccountHolder.
    Workflow:
    1. Customer must be created first; pass customer_id here.
    2. SavingsAccount is created.
    3. AccountHolder is created to link customer and savings account.
    """
    # Only agents can create accounts
    if current_user.get('type').lower() != 'agent':
        raise HTTPException(
            status_code=403, detail="Only agents can create savings accounts")

    employee_id = current_user.get('employee_id')

    try:
        from datetime import datetime
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get branch_id from employee table
            cursor.execute(
                "SELECT branch_id FROM Employee WHERE employee_id = %s",
                (employee_id,)
            )
            branch_row = cursor.fetchone()
            if not branch_row or not branch_row['branch_id']:
                raise HTTPException(
                    status_code=400, detail="Agent does not have a branch assigned"
                )
            branch_id = branch_row['branch_id']

            # Check minimum balance for the selected plan
            cursor.execute(
                "SELECT min_balance FROM SavingsAccount_Plans WHERE s_plan_id = %s",
                (account.s_plan_id,)
            )
            plan = cursor.fetchone()
            if not plan:
                raise HTTPException(
                    status_code=400, detail="Invalid savings plan selected")
            if account.balance < plan['min_balance']:
                raise HTTPException(
                    status_code=400,
                    detail=f"Initial deposit ({account.balance}) is less than the minimum required balance ({plan['min_balance']}) for this plan."
                )

            cursor.execute("""
                INSERT INTO SavingsAccount (open_date, balance, employee_id, s_plan_id, status, branch_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id
            """,
                           (
                               account.open_date if account.open_date else datetime.now(),
                               account.balance,
                               employee_id,
                               account.s_plan_id,
                               account.status,
                               branch_id
                           ))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=500, detail="Failed to create savings account")

            # Create AccountHolder to link customer and savings account
            cursor.execute("""
                INSERT INTO AccountHolder (customer_id, saving_account_id)
                VALUES (%s, %s)
            """, (customer_id, row['saving_account_id']))

            conn.commit()
            return SavingsAccountRead(**row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/saving-account/search", response_model=list[SavingsAccountWithCustomerRead])
def search_saving_accounts(query: dict, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Search savings accounts by NIC, customer_id, or saving_account_id using the savings_account_with_customer view.
    Agents see only their customers' accounts.
    Managers see only accounts in their branch.
    Admins see all accounts.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            user_type = current_user.get('type').lower()
            employee_id = current_user.get('employee_id')

            base_query = """
                SELECT saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id,
                       customer_id, customer_name, customer_nic
                FROM savings_account_with_customer
                WHERE 1=1
            """
            params = []

            # Agent: only accounts for their customers
            if user_type == 'agent':
                base_query += " AND employee_id = %s"
                params.append(employee_id)

            # Manager: only accounts in their branch
            elif user_type == 'branch_manager':
                cursor.execute(
                    "SELECT branch_id FROM Employee WHERE employee_id = %s", (employee_id,))
                branch_row = cursor.fetchone()
                if not branch_row or not branch_row['branch_id']:
                    raise HTTPException(
                        status_code=400, detail="Manager does not have a branch assigned")
                branch_id = branch_row['branch_id']
                base_query += " AND branch_id = %s"
                params.append(branch_id)

            # Filters
            if 'nic' in query:
                base_query += " AND customer_nic = %s"
                params.append(query['nic'])
            if 'customer_id' in query:
                base_query += " AND customer_id = %s"
                params.append(query['customer_id'])
            if 'saving_account_id' in query:
                base_query += " AND saving_account_id = %s"
                params.append(query['saving_account_id'])

            cursor.execute(base_query, tuple(params))
            rows = cursor.fetchall()
            return [SavingsAccountWithCustomerRead(**row) for row in rows]

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/holder/{saving_account_id}")
def get_account_holder(saving_account_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """Get the holder_id for a given saving_account_id"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT holder_id, customer_id
                FROM AccountHolder
                WHERE saving_account_id = %s
                LIMIT 1
            """, (saving_account_id,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(
                    status_code=404, detail="Account holder not found")

            return {
                "holder_id": result['holder_id'],
                "customer_id": result['customer_id'],
                "saving_account_id": saving_account_id
            }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/saving-account/branch", response_model=list[SavingsAccountWithCustomerRead])
def get_branch_savings_accounts(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get all savings accounts in the same branch as the current branch manager.
    Only branch managers can access this endpoint.
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    if user_type != 'branch_manager':
        raise HTTPException(
            status_code=403, detail="Only branch managers can view branch savings accounts")

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

            # Get all savings accounts in the same branch with customer details
            cursor.execute("""
                SELECT saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id,
                       customer_id, customer_name, customer_nic
                FROM savings_account_with_customer
                WHERE branch_id = %s
                ORDER BY open_date DESC
            """, (branch_id,))

            rows = cursor.fetchall()
            return [SavingsAccountWithCustomerRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/saving-account/branch/stats")
def get_branch_savings_stats(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get savings account statistics for the branch manager's branch.
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

            # Get savings account statistics for the branch
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_accounts,
                    COUNT(CASE WHEN status = true THEN 1 END) as active_accounts,
                    SUM(CASE WHEN status = true THEN balance ELSE 0 END) as total_balance,
                    AVG(CASE WHEN status = true THEN balance ELSE NULL END) as average_balance,
                    COUNT(CASE WHEN DATE_TRUNC('month', open_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_accounts_this_month
                FROM SavingsAccount
                WHERE branch_id = %s
            """, (branch_id,))

            stats = cursor.fetchone()
            return {
                "total_accounts": stats['total_accounts'] or 0,
                "active_accounts": stats['active_accounts'] or 0,
                "total_balance": float(stats['total_balance'] or 0),
                "average_balance": float(stats['average_balance'] or 0),
                "new_accounts_this_month": stats['new_accounts_this_month'] or 0,
                "branch_id": branch_id
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
