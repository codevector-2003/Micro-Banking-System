from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db
from auth import get_current_user
from schemas import JointAccountCreate, JointAccountRead, AccountSearchRequest
from datetime import datetime
from decimal import Decimal

router = APIRouter()


@router.post("/joint-account", response_model=JointAccountRead)
def create_joint_account(joint_account: JointAccountCreate, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Create a joint account by creating a new savings account and linking two customers to it.
    Only agents can create joint accounts.
    """
    user_type = current_user.get("user_type", "").lower()
    if user_type != "agent":
        raise HTTPException(
            status_code=403, detail="Only agents can create joint accounts.")

    employee_id = current_user.get('employee_id')

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get agent's branch_id
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

            # Verify both customers exist and are active
            cursor.execute("""
                SELECT customer_id, name, nic FROM Customer 
                WHERE customer_id IN (%s, %s) AND status = true
            """, (joint_account.primary_customer_id, joint_account.secondary_customer_id))
            customers = cursor.fetchall()
            if len(customers) != 2:
                raise HTTPException(
                    status_code=400, detail="Both customers must exist and be active")

            # Check minimum balance for the selected plan
            cursor.execute(
                "SELECT min_balance FROM SavingsAccount_Plans WHERE s_plan_id = %s",
                (joint_account.s_plan_id,)
            )
            plan = cursor.fetchone()
            if not plan:
                raise HTTPException(
                    status_code=400, detail="Invalid savings plan selected")
            if joint_account.initial_balance < plan['min_balance']:
                raise HTTPException(
                    status_code=400,
                    detail=f"Initial deposit ({joint_account.initial_balance}) is less than the minimum required balance ({plan['min_balance']}) for this plan."
                )

            # Create new savings account
            cursor.execute("""
                INSERT INTO SavingsAccount (open_date, balance, employee_id, s_plan_id, status, branch_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING saving_account_id
            """, (
                datetime.now(),
                joint_account.initial_balance,
                employee_id,
                joint_account.s_plan_id,
                True,
                branch_id
            ))

            account_result = cursor.fetchone()
            if not account_result:
                raise HTTPException(
                    status_code=500, detail="Failed to create savings account")

            saving_account_id = account_result['saving_account_id']

            # Create holder entries for both customers
            holder_ids = []
            customer_names = []
            customer_nics = []

            for customer in customers:
                cursor.execute("""
                    INSERT INTO AccountHolder (customer_id, saving_account_id)
                    VALUES (%s, %s)
                    RETURNING holder_id
                """, (customer['customer_id'], saving_account_id))
                holder_result = cursor.fetchone()
                holder_ids.append(holder_result['holder_id'])
                customer_names.append(customer['name'])
                customer_nics.append(customer['nic'])

            conn.commit()
            return JointAccountRead(
                saving_account_id=saving_account_id,
                holder_ids=holder_ids,
                customer_names=customer_names,
                customer_nics=customer_nics
            )

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/joint-account/search", response_model=JointAccountRead)
def search_joint_account(request: AccountSearchRequest, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get joint account details by savings account ID.
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get all holders for the account
            cursor.execute("""
                SELECT ah.holder_id, c.name, c.nic
                FROM AccountHolder ah
                JOIN Customer c ON ah.customer_id = c.customer_id
                WHERE ah.saving_account_id = %s
            """, (request.saving_account_id,))
            holders = cursor.fetchall()

            if len(holders) < 2:
                raise HTTPException(
                    status_code=404, detail="Not a joint account or account not found")

            holder_ids = [holder['holder_id'] for holder in holders]
            customer_names = [holder['name'] for holder in holders]
            customer_nics = [holder['nic'] for holder in holders]

            return JointAccountRead(
                saving_account_id=request.saving_account_id,
                holder_ids=holder_ids,
                customer_names=customer_names,
                customer_nics=customer_nics
            )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/joint-accounts", response_model=list[JointAccountRead])
def list_joint_accounts(conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    List all joint accounts. Branch managers see only their branch accounts.
    """
    user_type = current_user.get("user_type", "").lower()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            if user_type == "branch_manager":
                # Branch managers see only their branch accounts
                cursor.execute("""
                    SELECT DISTINCT sa.saving_account_id
                    FROM SavingsAccount sa
                    JOIN AccountHolder ah ON sa.saving_account_id = ah.saving_account_id
                    WHERE sa.branch_id = %s AND sa.status = true
                    GROUP BY sa.saving_account_id
                    HAVING COUNT(ah.holder_id) >= 2
                """, (current_user.get("branch_id"),))
            else:
                # Admins see all joint accounts
                cursor.execute("""
                    SELECT DISTINCT sa.saving_account_id
                    FROM SavingsAccount sa
                    JOIN AccountHolder ah ON sa.saving_account_id = ah.saving_account_id
                    WHERE sa.status = true
                    GROUP BY sa.saving_account_id
                    HAVING COUNT(ah.holder_id) >= 2
                """)

            account_ids = cursor.fetchall()
            joint_accounts = []

            for account in account_ids:
                cursor.execute("""
                    SELECT ah.holder_id, c.name, c.nic
                    FROM AccountHolder ah
                    JOIN Customer c ON ah.customer_id = c.customer_id
                    WHERE ah.saving_account_id = %s
                """, (account['saving_account_id'],))
                holders = cursor.fetchall()

                holder_ids = [holder['holder_id'] for holder in holders]
                customer_names = [holder['name'] for holder in holders]
                customer_nics = [holder['nic'] for holder in holders]

                joint_accounts.append(JointAccountRead(
                    saving_account_id=account['saving_account_id'],
                    holder_ids=holder_ids,
                    customer_names=customer_names,
                    customer_nics=customer_nics
                ))

            return joint_accounts

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
