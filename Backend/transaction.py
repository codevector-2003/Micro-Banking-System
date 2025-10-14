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
            # Insert the transaction record
            cursor.execute("""
                INSERT INTO Transactions (holder_id, type, amount, timestamp, ref_number, description)
                VALUES (%s, %s, %s, COALESCE(%s, NOW()), %s, %s)
                RETURNING transaction_id, holder_id, type, amount, timestamp, ref_number, description
            """, (
                transaction.holder_id,
                transaction.type.value,
                transaction.amount,
                transaction.timestamp,
                transaction.ref_number,
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
