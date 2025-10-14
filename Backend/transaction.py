from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, Depends, HTTPException
from schemas import TransactionsCreate, TransactionsRead, Trantype
from database import get_db
from auth import get_current_user
from datetime import date
from pydantic import BaseModel

router = APIRouter()


@router.post("/transaction", response_model=TransactionsRead)
def create_transaction(transaction: TransactionsCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> TransactionsRead:
    """
    Create a new account transaction atomically.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT balance, min_balance, saving_account_id
                FROM holder_balance_min
                WHERE holder_id = %s
            """, (transaction.holder_id,))
            account = cursor.fetchone()
            if not account:
                raise HTTPException(
                    status_code=400, detail="Invalid holder_id or account not found")
            if transaction.type == Trantype.withdrawal:
                if account['balance'] - transaction.amount < account['min_balance']:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient funds: Cannot withdraw {transaction.amount}. Minimum balance requirement of {account['min_balance']} must be maintained."
                    )
                new_balance = account['balance'] - transaction.amount
            elif transaction.type == Trantype.deposit:
                new_balance = account['balance'] + transaction.amount
            elif transaction.type == Trantype.interest:
                new_balance = account['balance'] + transaction.amount

            cursor.execute("""
                UPDATE SavingsAccount
                SET balance = %s
                WHERE saving_account_id = %s
            """, (new_balance, account['saving_account_id']))

            cursor.execute("""
                INSERT INTO Transactions (holder_id, type, amount, timestamp, description)
                VALUES (%s, %s, %s, COALESCE(%s, NOW()), %s)
                RETURNING transaction_id, holder_id, type, amount, timestamp, ref_number, description
            """, (
                transaction.holder_id,
                transaction.type.value,
                transaction.amount,
                transaction.timestamp,
                transaction.description
            ))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(
                    status_code=500, detail="Failed to create transaction")

            conn.commit()
            return TransactionsRead(**result)
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
