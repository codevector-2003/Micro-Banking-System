from psycopg2.extras import RealDictCursor
from schemas import FixedDepositCreate, FixedDepositRead, AccountStatusRequest
from fastapi import HTTPException, APIRouter, Depends
from database import get_db
from auth import get_current_user
from datetime import datetime, timedelta
from decimal import Decimal

router = APIRouter()


@router.post("/fixed-deposit", response_model=FixedDepositRead)
def create_fixed_deposit(deposit: FixedDepositCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> FixedDepositRead:
    # Only agents can create fixed deposits
    if current_user.get('type').lower() != 'agent':
        raise HTTPException(
            status_code=403, detail="Only agents can create fixed deposits")

    employee_id = current_user.get('employee_id')
    branch_id = current_user.get('branch_id')

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Calculate maturity date based on FD plan
            cursor.execute(
                "SELECT time_period FROM FixedDeposit_Plans WHERE fd_plan_id = %s", 
                (deposit.fd_plan_id,)
            )
            plan = cursor.fetchone()
            if not plan:
                raise HTTPException(
                    status_code=404, detail="Fixed deposit plan not found")
            
            start_date = deposit.start_date if deposit.start_date else datetime.now().date()
            maturity_date = start_date + timedelta(days=plan['time_period'] * 30)  # Assuming time_period is in months
            
            cursor.execute("""
                INSERT INTO FixedDeposit (start_date, amount, maturity_date, employee_id, fd_plan_id, status, branch_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING fd_id, start_date, amount, maturity_date, employee_id, fd_plan_id, status, branch_id
            """,
                           (
                               start_date,
                               deposit.amount,
                               maturity_date,
                               employee_id,
                               deposit.fd_plan_id,
                               deposit.status or 'Active',
                               branch_id
                           ))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=500, detail="Failed to create fixed deposit")

            conn.commit()
            return FixedDepositRead(**row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.put("/fixed-deposit/status", response_model=FixedDepositRead)
def change_fixed_deposit_status(status_request: AccountStatusRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> FixedDepositRead:
    # Only agents and admins can change status
    if current_user.get('type').lower() not in ['agent', 'admin']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to change fixed deposit status")

    # If agent, restrict to their own fixed deposits
    if current_user.get('type').lower() == 'agent':
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT fd_id FROM FixedDeposit WHERE fd_id = %s AND employee_id = %s",
                (status_request.fd_id, current_user.get('employee_id')))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=403, detail="Agent not authorized to change this fixed deposit's status")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # If agent, update only if employee_id matches
            if current_user.get('type').lower() == 'agent':
                cursor.execute(
                    """
                    UPDATE FixedDeposit SET status = %s
                    WHERE fd_id = %s AND employee_id = %s
                    RETURNING fd_id, start_date, amount, maturity_date, employee_id, fd_plan_id, status, branch_id
                    """,
                    (status_request.status, status_request.fd_id,
                     current_user.get('employee_id'))
                )
            else:
                cursor.execute(
                    """
                    UPDATE FixedDeposit SET status = %s
                    WHERE fd_id = %s
                    RETURNING fd_id, start_date, amount, maturity_date, employee_id, fd_plan_id, status, branch_id
                    """,
                    (status_request.status, status_request.fd_id)
                )

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404, detail="Fixed deposit not found or not authorized")

            conn.commit()
            return FixedDepositRead(**row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/fixed-deposit/{fd_id}", response_model=FixedDepositRead)
def get_fixed_deposit(fd_id: int, conn=Depends(get_db), current_user=Depends(get_current_user)) -> FixedDepositRead:
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # If agent, only allow access to their own fixed deposits
            if current_user.get('type').lower() == 'agent':
                cursor.execute(
                    "SELECT * FROM FixedDeposit WHERE fd_id = %s AND employee_id = %s",
                    (fd_id, current_user.get('employee_id')))
            else:
                cursor.execute(
                    "SELECT * FROM FixedDeposit WHERE fd_id = %s", (fd_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404, detail="Fixed deposit not found or not authorized")
            
            return FixedDepositRead(**row)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/fixed-deposits", response_model=list[FixedDepositRead])
def get_fixed_deposits(conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[FixedDepositRead]:
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # If agent, only show their own fixed deposits
            if current_user.get('type').lower() == 'agent':
                cursor.execute(
                    "SELECT * FROM FixedDeposit WHERE employee_id = %s ORDER BY start_date DESC",
                    (current_user.get('employee_id'),))
            else:
                cursor.execute(
                    "SELECT * FROM FixedDeposit ORDER BY start_date DESC")
            
            rows = cursor.fetchall()
            return [FixedDepositRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/fixed-deposit/{fd_id}")
def delete_fixed_deposit(fd_id: int, conn=Depends(get_db), current_user=Depends(get_current_user)):
    # Only admins can delete fixed deposits
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admins can delete fixed deposits")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "DELETE FROM FixedDeposit WHERE fd_id = %s RETURNING fd_id", (fd_id,))
            
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404, detail="Fixed deposit not found")
            
            conn.commit()
            return {"message": "Fixed deposit deleted successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")