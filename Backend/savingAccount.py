# Change account status function
from psycopg2.extras import RealDictCursor
from schemas import SavingsAccountCreate, SavingsAccountRead, AccountStatusRequest, SavingsAccountWithCustomerRead
from schemas import AccountHolderCreate
from fastapi import HTTPException, APIRouter, Depends
from database import get_db
from auth import get_current_user
from schemas import Stype
from schemas import SavingsAccountRead

from pydantic import BaseModel


router = APIRouter()


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
