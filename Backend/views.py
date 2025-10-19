from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
from psycopg2.extras import RealDictCursor
from database import get_db
from auth import get_current_user

router = APIRouter()

# ==================== Helper Functions ====================
def get_user_context(current_user: Dict[str, Any], cursor) -> Dict[str, Any]:
    """Get user context including employee_id, branch_id, and type"""
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    employee_id = current_user.get('employee_id')
    
    context = {
        'type': user_type,
        'employee_id': employee_id,
        'branch_id': None
    }
    
    # Get branch_id for agents and managers
    if employee_id and user_type in ['agent', 'branch_manager']:
        cursor.execute(
            "SELECT branch_id FROM Employee WHERE employee_id = %s",
            (employee_id,)
        )
        result = cursor.fetchone()
        if result:
            context['branch_id'] = result['branch_id']
    
    return context

def check_user_access(user_type: str, allowed_types: list):
    """Check if user type is allowed to access endpoint"""
    if user_type not in allowed_types:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Required roles: {', '.join(allowed_types)}"
        )

# ==================== REPORT 1: Agent-wise Transaction Summary ====================
@router.get("/report/agent-transactions")
def get_agent_transaction_report(
    employee_id: Optional[str] = None,
    conn=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Report 1: Agent-wise total number and value of transactions
    Uses enhanced vw_agent_transactions_mv materialized view
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            context = get_user_context(current_user, cursor)
            user_type = context['type']
            
            check_user_access(user_type, ['agent', 'branch_manager', 'admin'])
            
            # Refresh materialized view for managers and admins
            if user_type in ['branch_manager', 'admin']:
                cursor.execute("REFRESH MATERIALIZED VIEW vw_agent_transactions_mv")
                conn.commit()
            
            # Simple query - all data is in the materialized view
            query = "SELECT * FROM vw_agent_transactions_mv WHERE employee_status = TRUE"
            params = []
            
            # Agent: Only their own performance
            if user_type == 'agent':
                query += " AND employee_id = %s"
                params.append(context['employee_id'])
            
            # Branch Manager: Only agents in their branch
            elif user_type == 'branch_manager':
                if not context['branch_id']:
                    raise HTTPException(status_code=400, detail="Manager does not have a branch assigned")
                query += " AND branch_id = %s"
                params.append(context['branch_id'])
            
            query += " ORDER BY total_value DESC"

            cursor.execute(query, tuple(params))
            report = cursor.fetchall()
            
            # Calculate summary
            total_transactions = sum(row['total_transactions'] or 0 for row in report)
            total_value = sum(row['total_value'] or 0 for row in report)
            
            return {
                "success": True,
                "report_name": "Agent-wise Transaction Summary",
                "data": report,
                "summary": {
                    "total_agents": len(report),
                    "total_transactions": total_transactions,
                    "total_value": float(total_value) if total_value else 0
                },
                "count": len(report)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== REPORT 2: Account-wise Transaction Summary ====================
@router.get("/report/account-transactions")
def get_account_transaction_report(
    saving_account_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    conn=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Report 2: Account-wise transaction summary and current balance
    Uses vw_account_summary view with all necessary data
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            context = get_user_context(current_user, cursor)
            user_type = context['type']
            
            check_user_access(user_type, ['agent', 'branch_manager', 'admin'])
            
            # Simple query - all data is in the view
            query = "SELECT * FROM vw_account_summary WHERE account_status = TRUE"
            params = []
            
            # Agent: Only their customers' accounts
            if user_type == 'agent':
                query += " AND agent_id = %s"
                params.append(context['employee_id'])
            
            # Branch Manager: Only accounts in their branch
            elif user_type == 'branch_manager':
                if not context['branch_id']:
                    raise HTTPException(status_code=400, detail="Manager does not have a branch assigned")
                query += " AND branch_id = %s"
                params.append(context['branch_id'])
            
            # Apply filters
            if saving_account_id:
                query += " AND saving_account_id = %s"
                params.append(saving_account_id)
            
            if customer_id:
                query += " AND customer_id = %s"
                params.append(customer_id)
            
            query += " ORDER BY current_balance DESC, open_date DESC"
            
            cursor.execute(query, tuple(params))
            print(cursor.query)
            report = cursor.fetchall()
            
            # Calculate summary
            total_balance = sum(row['current_balance'] or 0 for row in report)
            total_accounts = len(report)
            
            return {
                "success": True,
                "report_name": "Account-wise Transaction Summary",
                "data": report,
                "summary": {
                    "total_accounts": total_accounts,
                    "total_balance": float(total_balance) if total_balance else 0,
                    "average_balance": float(total_balance / total_accounts) if total_accounts > 0 else 0
                },
                "count": len(report)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== REPORT 3: Active Fixed Deposits with Payout Dates ====================
@router.get("/report/active-fixed-deposits")
def get_active_fd_report(
    conn=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Report 3: List of active FDs and their next interest payout dates
    Uses vw_fd_details view with all necessary data
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            context = get_user_context(current_user, cursor)
            user_type = context['type']
            
            check_user_access(user_type, ['agent', 'branch_manager', 'admin'])
            
            # Simple query - all data is in the view
            query = "SELECT * FROM vw_fd_details WHERE status = TRUE"
            params = []
            
            # Agent: Only their customers' FDs
            if user_type == 'agent':
                query += " AND agent_id = %s"
                params.append(context['employee_id'])
            
            # Branch Manager: Only FDs in their branch
            elif user_type == 'branch_manager':
                if not context['branch_id']:
                    raise HTTPException(status_code=400, detail="Manager does not have a branch assigned")
                query += " AND branch_id = %s"
                params.append(context['branch_id'])
            
            query += " ORDER BY next_payout_date ASC NULLS LAST, start_date DESC"
            
            cursor.execute(query, tuple(params))
            report = cursor.fetchall()
            
            # Calculate summary
            total_principal = sum(row['principal_amount'] or 0 for row in report)
            total_interest = sum(row['total_interest'] or 0 for row in report)
            pending_payouts = sum(1 for row in report if row['fd_status'] == 'Payout Pending')
            
            return {
                "success": True,
                "report_name": "Active Fixed Deposits Report",
                "data": report,
                "summary": {
                    "total_fds": len(report),
                    "total_principal_amount": float(total_principal) if total_principal else 0,
                    "total_expected_interest": float(total_interest) if total_interest else 0,
                    "pending_payouts": pending_payouts
                },
                "count": len(report)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== REPORT 4: Monthly Interest Distribution Summary ====================
@router.get("/report/monthly-interest-distribution")
def get_monthly_interest_distribution_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    conn=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Report 4: Monthly interest distribution summary by account type
    Uses enhanced vw_monthly_interest_summary_mv materialized view
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            context = get_user_context(current_user, cursor)
            user_type = context['type']
            
            check_user_access(user_type, ['agent', 'branch_manager', 'admin'])
            
            # Refresh materialized view for managers and admins
            if user_type in ['branch_manager', 'admin']:
                cursor.execute("REFRESH MATERIALIZED VIEW vw_monthly_interest_summary_mv")
                conn.commit()
            
            # Aggregate from materialized view
            query = """
                SELECT 
                    plan_name,
                    month,
                    EXTRACT(YEAR FROM month) as year,
                    EXTRACT(MONTH FROM month) as month_num,
                    branch_name,
                    COUNT(DISTINCT saving_account_id) as account_count,
                    SUM(monthly_interest) as total_interest_paid,
                    AVG(monthly_interest) as average_interest_per_account,
                    MIN(monthly_interest) as min_interest,
                    MAX(monthly_interest) as max_interest
                FROM vw_monthly_interest_summary_mv
                WHERE 1=1
            """
            params = []
            
            # Agent: Only their customers' interest
            if user_type == 'agent':
                query += " AND agent_id = %s"
                params.append(context['employee_id'])
            
            # Branch Manager: Only interest in their branch
            elif user_type == 'branch_manager':
                if not context['branch_id']:
                    raise HTTPException(status_code=400, detail="Manager does not have a branch assigned")
                query += " AND branch_id = %s"
                params.append(context['branch_id'])
            
            # Apply filters
            if year:
                query += " AND EXTRACT(YEAR FROM month) = %s"
                params.append(year)
            
            if month:
                query += " AND EXTRACT(MONTH FROM month) = %s"
                params.append(month)
            
            query += """
                GROUP BY plan_name, month, branch_name
                ORDER BY month DESC, total_interest_paid DESC
            """
            
            cursor.execute(query, tuple(params))
            report = cursor.fetchall()
            
            # Calculate summary
            total_interest_paid = sum(row['total_interest_paid'] or 0 for row in report)
            total_accounts = sum(row['account_count'] or 0 for row in report)
            
            return {
                "success": True,
                "report_name": "Monthly Interest Distribution Summary",
                "data": report,
                "summary": {
                    "total_interest_paid": float(total_interest_paid) if total_interest_paid else 0,
                    "total_accounts_with_interest": total_accounts,
                    "unique_months": len(set(row['month'] for row in report))
                },
                "count": len(report)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== REPORT 5: Customer Activity Report ====================
@router.get("/report/customer-activity")
def get_customer_activity_report(
    customer_id: Optional[str] = None,
    conn=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Report 5: Customer activity report (total deposits, withdrawals, and net balance)
    Uses enhanced vw_customer_activity_mv materialized view with all data
    """
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            context = get_user_context(current_user, cursor)
            user_type = context['type']
            
            check_user_access(user_type, ['agent', 'branch_manager', 'admin'])
            
            # Simple query - all data is in the materialized view
            query = "SELECT * FROM vw_customer_activity_mv WHERE customer_status = TRUE"
            params = []
            
            # Agent: Only their customers
            if user_type == 'agent':
                query += " AND agent_id = %s"
                params.append(context['employee_id'])
            
            # Branch Manager: Only customers in their branch
            elif user_type == 'branch_manager':
                if not context['branch_id']:
                    raise HTTPException(status_code=400, detail="Manager does not have a branch assigned")
                query += " AND branch_id = %s"
                params.append(context['branch_id'])
            
            # Apply customer_id filter if provided
            if customer_id:
                query += " AND customer_id = %s"
                params.append(customer_id)
            
            query += " ORDER BY current_total_balance DESC, net_change DESC"
            
            cursor.execute(query, tuple(params))
            report = cursor.fetchall()
            
            # Calculate summary
            total_deposits = sum(row['total_deposits'] or 0 for row in report)
            total_withdrawals = sum(row['total_withdrawals'] or 0 for row in report)
            total_balance = sum(row['current_total_balance'] or 0 for row in report)
            
            return {
                "success": True,
                "report_name": "Customer Activity Report",
                "data": report,
                "summary": {
                    "total_customers": len(report),
                    "total_deposits": float(total_deposits) if total_deposits else 0,
                    "total_withdrawals": float(total_withdrawals) if total_withdrawals else 0,
                    "total_current_balance": float(total_balance) if total_balance else 0,
                    "net_flow": float(total_deposits - total_withdrawals) if (total_deposits and total_withdrawals) else 0
                },
                "count": len(report)
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== Utility: Refresh All Materialized Views ====================
@router.post("/refresh-views")
def refresh_materialized_views(
    conn=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Refresh all materialized views - Only Branch Managers and Admins"""
    try:
        with conn.cursor() as cursor:
            context = get_user_context(current_user, cursor)
            user_type = context['type']
            
            check_user_access(user_type, ['branch_manager', 'admin'])
            
            materialized_views = [
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
                "refreshed_views": refreshed,
                "refreshed_by": user_type,
                "employee_id": context['employee_id']
            }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")    
