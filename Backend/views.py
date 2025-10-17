from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from database import get_db_connection
from auth import get_current_user
from schemas import User
import psycopg2.extras

router = APIRouter(prefix="/views", tags=["Database Views"])

# Helper function to check user permissions
def check_user_permission(current_user: User, required_roles: List[str]):
    """Check if user has required role"""
    if current_user.role not in required_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Required roles: {', '.join(required_roles)}"
        )

# ==================== Customer Owned Accounts View ====================
@router.get("/customer-owned-accounts")
async def get_customer_owned_accounts(
    customer_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get customer owned accounts view
    - Customers: Can only see their own accounts
    - Agents/Managers: Can see all accounts
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Customers can only see their own data
        if current_user.role == "customer":
            if customer_id and customer_id != current_user.customer_id:
                raise HTTPException(status_code=403, detail="Access denied to other customer data")
            customer_id = current_user.customer_id
        
        # Agents and Managers can see all or specific customer data
        check_user_permission(current_user, ["customer", "agent", "manager"])
        
        query = "SELECT * FROM customer_owned_accounts"
        params = []
        
        if customer_id:
            query += " WHERE customer_id = %s"
            params.append(customer_id)
        
        query += " ORDER BY customer_id, saving_account_id"
        
        cursor.execute(query, params)
        accounts = cursor.fetchall()
        
        return {
            "success": True,
            "data": accounts,
            "count": len(accounts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Account Transactions View ====================
@router.get("/account-transactions/{saving_account_id}")
async def get_account_transactions(
    saving_account_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get transactions for a specific account
    - Customers: Can only see their own account transactions
    - Agents/Managers: Can see all account transactions
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Verify customer owns this account if role is customer
        if current_user.role == "customer":
            cursor.execute("""
                SELECT 1 FROM AccountHolder ah
                WHERE ah.saving_account_id = %s AND ah.customer_id = %s
            """, (saving_account_id, current_user.customer_id))
            
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Access denied to this account")
        else:
            check_user_permission(current_user, ["agent", "manager"])
        
        cursor.execute("""
            SELECT * FROM vw_account_transactions
            WHERE saving_account_id = %s
            ORDER BY timestamp DESC
        """, (saving_account_id,))
        
        transactions = cursor.fetchall()
        
        return {
            "success": True,
            "saving_account_id": saving_account_id,
            "data": transactions,
            "count": len(transactions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Active Fixed Deposits View ====================
@router.get("/active-fixed-deposits")
async def get_active_fixed_deposits(
    saving_account_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get active fixed deposits
    - Customers: Can only see their own FDs
    - Agents/Managers: Can see all FDs
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        query = "SELECT * FROM vw_active_fds"
        params = []
        
        if current_user.role == "customer":
            # Get customer's accounts
            cursor.execute("""
                SELECT saving_account_id FROM AccountHolder
                WHERE customer_id = %s
            """, (current_user.customer_id,))
            customer_accounts = [row['saving_account_id'] for row in cursor.fetchall()]
            
            if not customer_accounts:
                return {"success": True, "data": [], "count": 0}
            
            query += " WHERE saving_account_id = ANY(%s)"
            params.append(customer_accounts)
            
            if saving_account_id:
                if saving_account_id not in customer_accounts:
                    raise HTTPException(status_code=403, detail="Access denied to this account")
                query += " AND saving_account_id = %s"
                params.append(saving_account_id)
        else:
            check_user_permission(current_user, ["agent", "manager"])
            if saving_account_id:
                query += " WHERE saving_account_id = %s"
                params.append(saving_account_id)
        
        query += " ORDER BY start_date DESC"
        
        cursor.execute(query, params)
        fds = cursor.fetchall()
        
        return {
            "success": True,
            "data": fds,
            "count": len(fds)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Joint Accounts & Holders View ====================
@router.get("/joint-accounts")
async def get_joint_accounts(
    current_user: User = Depends(get_current_user)
):
    """
    Get joint accounts with holders
    - Customers: Can only see joint accounts they are part of
    - Agents/Managers: Can see all joint accounts
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Refresh materialized view (managers only)
        if current_user.role == "manager":
            cursor.execute("REFRESH MATERIALIZED VIEW joint_accounts_holders_mv")
            conn.commit()
        
        query = "SELECT * FROM joint_accounts_holders_mv"
        
        if current_user.role == "customer":
            # Get customer's joint accounts
            cursor.execute("""
                SELECT DISTINCT ah.saving_account_id 
                FROM AccountHolder ah
                WHERE ah.customer_id = %s
                AND ah.saving_account_id IN (
                    SELECT saving_account_id 
                    FROM AccountHolder 
                    GROUP BY saving_account_id 
                    HAVING COUNT(*) > 1
                )
            """, (current_user.customer_id,))
            
            customer_joint_accounts = [row['saving_account_id'] for row in cursor.fetchall()]
            
            if not customer_joint_accounts:
                return {"success": True, "data": [], "count": 0}
            
            query += " WHERE saving_account_id = ANY(%s)"
            cursor.execute(query, (customer_joint_accounts,))
        else:
            check_user_permission(current_user, ["agent", "manager"])
            cursor.execute(query)
        
        joint_accounts = cursor.fetchall()
        
        return {
            "success": True,
            "data": joint_accounts,
            "count": len(joint_accounts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Agent Transaction Summary View ====================
@router.get("/agent-transactions-summary")
async def get_agent_transactions_summary(
    employee_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get agent transaction summary
    - Only Managers can access this view
    """
    check_user_permission(current_user, ["manager"])
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Refresh materialized view
        cursor.execute("REFRESH MATERIALIZED VIEW vw_agent_transactions_mv")
        conn.commit()
        
        query = "SELECT * FROM vw_agent_transactions_mv"
        params = []
        
        if employee_id:
            query += " WHERE employee_id = %s"
            params.append(employee_id)
        
        query += " ORDER BY total_value DESC"
        
        cursor.execute(query, params)
        summary = cursor.fetchall()
        
        return {
            "success": True,
            "data": summary,
            "count": len(summary)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Monthly Interest Summary View ====================
@router.get("/monthly-interest-summary")
async def get_monthly_interest_summary(
    saving_account_id: Optional[int] = None,
    plan_name: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get monthly interest summary
    - Customers: Can only see their own account interest
    - Agents/Managers: Can see all interest summaries
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Refresh materialized view (managers only)
        if current_user.role == "manager":
            cursor.execute("REFRESH MATERIALIZED VIEW vw_monthly_interest_summary_mv")
            conn.commit()
        
        query = "SELECT * FROM vw_monthly_interest_summary_mv"
        conditions = []
        params = []
        
        if current_user.role == "customer":
            # Get customer's accounts
            cursor.execute("""
                SELECT saving_account_id FROM AccountHolder
                WHERE customer_id = %s
            """, (current_user.customer_id,))
            customer_accounts = [row['saving_account_id'] for row in cursor.fetchall()]
            
            if not customer_accounts:
                return {"success": True, "data": [], "count": 0}
            
            conditions.append("saving_account_id = ANY(%s)")
            params.append(customer_accounts)
        else:
            check_user_permission(current_user, ["agent", "manager"])
        
        if saving_account_id:
            if current_user.role == "customer" and saving_account_id not in customer_accounts:
                raise HTTPException(status_code=403, detail="Access denied to this account")
            conditions.append("saving_account_id = %s")
            params.append(saving_account_id)
        
        if plan_name:
            conditions.append("plan_name = %s")
            params.append(plan_name)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY month DESC, saving_account_id"
        
        cursor.execute(query, params)
        summary = cursor.fetchall()
        
        return {
            "success": True,
            "data": summary,
            "count": len(summary)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Customer Activity Summary View ====================
@router.get("/customer-activity-summary")
async def get_customer_activity_summary(
    customer_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get customer activity summary
    - Customers: Can only see their own activity
    - Agents/Managers: Can see all customer activities
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Customers can only see their own data
        if current_user.role == "customer":
            if customer_id and customer_id != current_user.customer_id:
                raise HTTPException(status_code=403, detail="Access denied to other customer data")
            customer_id = current_user.customer_id
        else:
            check_user_permission(current_user, ["agent", "manager"])
        
        query = "SELECT * FROM vw_customer_activity_mv"
        params = []
        
        if customer_id:
            query += " WHERE customer_id = %s"
            params.append(customer_id)
        
        query += " ORDER BY net_change DESC"
        
        cursor.execute(query, params)
        activities = cursor.fetchall()
        
        return {
            "success": True,
            "data": activities,
            "count": len(activities)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Savings Account with Customer View ====================
@router.get("/savings-accounts-with-customers")
async def get_savings_accounts_with_customers(
    saving_account_id: Optional[int] = None,
    customer_nic: Optional[str] = None,
    customer_name: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Search savings accounts with customer details
    - Customers: Can only see their own accounts
    - Agents/Managers: Can search all accounts
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        query = "SELECT * FROM savings_account_with_customer"
        conditions = []
        params = []
        
        if current_user.role == "customer":
            conditions.append("customer_id = %s")
            params.append(current_user.customer_id)
        else:
            check_user_permission(current_user, ["agent", "manager"])
        
        if saving_account_id:
            conditions.append("saving_account_id = %s")
            params.append(saving_account_id)
        
        if customer_nic:
            conditions.append("customer_nic = %s")
            params.append(customer_nic)
        
        if customer_name:
            conditions.append("customer_name ILIKE %s")
            params.append(f"%{customer_name}%")
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY saving_account_id"
        
        cursor.execute(query, params)
        accounts = cursor.fetchall()
        
        return {
            "success": True,
            "data": accounts,
            "count": len(accounts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Holder Balance Minimum View ====================
@router.get("/holder-balance-minimum/{holder_id}")
async def get_holder_balance_minimum(
    holder_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get holder balance and minimum balance requirement
    - Customers: Can only see their own holder info
    - Agents/Managers: Can see all holder info
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Verify customer owns this holder if role is customer
        if current_user.role == "customer":
            cursor.execute("""
                SELECT 1 FROM AccountHolder
                WHERE holder_id = %s AND customer_id = %s
            """, (holder_id, current_user.customer_id))
            
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="Access denied to this holder")
        else:
            check_user_permission(current_user, ["agent", "manager"])
        
        cursor.execute("""
            SELECT * FROM holder_balance_min
            WHERE holder_id = %s
        """, (holder_id,))
        
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Holder not found")
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# ==================== Refresh All Materialized Views ====================
@router.post("/refresh-materialized-views")
async def refresh_all_materialized_views(
    current_user: User = Depends(get_current_user)
):
    """
    Refresh all materialized views
    - Only Managers can access this endpoint
    """
    check_user_permission(current_user, ["manager"])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        materialized_views = [
            "joint_accounts_holders_mv",
            "vw_agent_transactions_mv",
            "vw_monthly_interest_summary_mv",
            "vw_customer_activity_mv"
        ]
        
        refreshed = []
        for view in materialized_views:
            cursor.execute(f"REFRESH MATERIALIZED VIEW {view}")
            refreshed.append(view)
        
        conn.commit()
        
        return {
            "success": True,
            "message": "All materialized views refreshed successfully",
            "refreshed_views": refreshed
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()