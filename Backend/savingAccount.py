# Change account status function
from psycopg2.extras import RealDictCursor
from schemas import SavingsAccountCreate, SavingsAccountRead, AccountStatusRequest
from fastapi import HTTPException, APIRouter, Depends
from database import get_db
from auth import get_current_user
from schemas import Stype
from schemas import SavingsAccountRead

from pydantic import BaseModel


router = APIRouter()


@router.post("/saving-account", response_model=SavingsAccountRead)
def create_saving_account(account: SavingsAccountCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> SavingsAccountRead:
    # Only agents can create accounts
    if current_user.get('type').lower() != 'agent':
        raise HTTPException(
            status_code=403, detail="Only agents can create savings accounts")

    employee_id = current_user.get('employee_id')
    branch_id = current_user.get('branch_id')

    try:
        from datetime import datetime
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
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

            conn.commit()
            return SavingsAccountRead(**row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.put("/saving-account/status", response_model=SavingsAccountRead)
def change_saving_account_status(status_request: AccountStatusRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> SavingsAccountRead:
    # Only agents and admins can change status
    if current_user.get('type').lower() not in ['agent', 'admin']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to change account status")

    # If agent, restrict to their own accounts
    if current_user.get('type').lower() == 'agent':
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT saving_account_id FROM SavingsAccount WHERE saving_account_id = %s AND employee_id = %s",
                (status_request.saving_account_id, current_user.get('employee_id')))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=403, detail="Agent not authorized to change this account's status")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # If agent, update only if employee_id matches
            if current_user.get('type').lower() == 'agent':
                cursor.execute(
                    """
                    UPDATE SavingsAccount SET status = %s
                    WHERE saving_account_id = %s AND employee_id = %s
                    RETURNING saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id
                    """,
                    (status_request.status, status_request.saving_account_id,
                     current_user.get('employee_id'))
                )
            else:
                cursor.execute(
                    """
                    UPDATE SavingsAccount SET status = %s
                    WHERE saving_account_id = %s
                    RETURNING saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id
                    """,
                    (status_request.status, status_request.saving_account_id)
                )

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404, detail="Savings account not found or not authorized")

            conn.commit()
            return SavingsAccountRead(**row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
