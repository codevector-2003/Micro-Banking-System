# Change account status function
from psycopg2.extras import RealDictCursor
from schemas import SavingsAccountCreate, SavingsAccountRead, AccountStatusRequest
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


@router.post("/saving-account/search", response_model=list[SavingsAccountRead])
def search_saving_accounts(query: dict, conn=Depends(get_db), current_user=Depends):
    """
    Search savings accounts by various criteria.

    You can filter by:
    - saving_account_id
    - employee_id
    - s_plan_id
    - status
    - branch_id

    Agents can only search for accounts assigned to themselves.
    Branch managers can search all accounts in their branch.
    Admins can search all accounts.
    Provide any combination of fields in the request body to filter results.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            base_query = "SELECT saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id FROM SavingsAccount WHERE 1=1"
            params = []

            user_type = current_user.get('type').lower()
            # If agent, restrict to their own accounts
            if user_type == 'agent':
                base_query += " AND employee_id = %s"
                params.append(current_user.get('employee_id'))
            # If branch manager, restrict to their branch
            elif user_type == 'branch_manager':
                base_query += " AND branch_id = %s"
                params.append(current_user.get('branch_id'))

            # Add filters based on provided query fields
            if 'saving_account_id' in query:
                base_query += " AND saving_account_id = %s"
                params.append(query['saving_account_id'])
            if 'employee_id' in query:
                base_query += " AND employee_id = %s"
                params.append(query['employee_id'])
            if 's_plan_id' in query:
                base_query += " AND s_plan_id = %s"
                params.append(query['s_plan_id'])
            if 'status' in query:
                base_query += " AND status = %s"
                params.append(query['status'])
            if 'branch_id' in query:
                base_query += " AND branch_id = %s"
                params.append(query['branch_id'])

            cursor.execute(base_query, tuple(params))
            rows = cursor.fetchall()
            return [SavingsAccountRead(**row) for row in rows]

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
