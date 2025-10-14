from psycopg2.extras import RealDictCursor
from fastapi import HTTPException, APIRouter, Depends
from database import get_db
from auth import get_current_user
from schemas import AccountHolderCreate, AccountHolderRead

router = APIRouter()


@router.post("/account-holder", response_model=AccountHolderRead)
def create_account_holder(holder: AccountHolderCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> AccountHolderRead:
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
				INSERT INTO AccountHolder (customer_id, saving_account_id)
				VALUES (%s, %s)
				RETURNING holder_id, customer_id, saving_account_id
			""", (holder.customer_id, holder.saving_account_id))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=500, detail="Failed to create account holder")

            conn.commit()
            return AccountHolderRead(**row)

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
