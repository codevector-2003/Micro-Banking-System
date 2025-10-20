from psycopg2.extras import RealDictCursor
from fastapi import HTTPException, APIRouter, Depends
from schemas import CustomerCreate, CustomerRead, CustomerSearchRequest, CustomerUpdateRequest, CustomerStatusRequest
from database import get_db
from auth import get_current_user


router = APIRouter()


@router.post("/customer/", response_model=CustomerRead)
def create_customer(customer: CustomerCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> CustomerRead:
    # Security: Check user permissions
    if current_user.get('type').lower() not in 'agent':
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to create customers")
    current_user_id = current_user.get('employee_id')
    status = True  # New customers are active by default
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                INSERT INTO customer (name, nic, phone_number, address, date_of_birth, email, status, employee_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id
            """, (customer.name, customer.nic, customer.phone_number, customer.address,
                  customer.date_of_birth, customer.email, status, current_user_id))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=500, detail="Failed to create customer")

            conn.commit()  # Move commit after successful fetch
            return CustomerRead(**row)

    except Exception as e:
        conn.rollback()  # Rollback on error
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400, detail="Customer with this NIC already exists") from e
        elif "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=400, detail="Invalid employee_id provided")
        else:
            raise HTTPException(
                status_code=500, detail=f"Database error: {str(e)}")


@router.post("/customer/search", response_model=list[CustomerRead])
def search_customers(search_request: CustomerSearchRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[CustomerRead]:
    """
    Secure customer search using request body instead of URL parameters.
    Supports search by customer_id, nic, name, or phone_number.
    """
    # Security: Check user permissions
    if current_user.get('type').lower() not in ['admin', 'agent']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to search customers")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            conditions = []
            values = []

            if search_request.customer_id:
                conditions.append("customer_id = %s")
                values.append(search_request.customer_id)
            elif search_request.nic:
                conditions.append("nic = %s")
                values.append(search_request.nic)
            elif search_request.name:
                conditions.append("name ILIKE %s")
                values.append(f"%{search_request.name}%")
            elif search_request.phone_number:
                conditions.append("phone_number = %s")
                values.append(search_request.phone_number)
            else:
                raise HTTPException(
                    status_code=400, detail="Provide at least one search criteria")

            # If agent, restrict to their own customers
            if current_user.get('type') == 'agent':
                conditions.append("employee_id = %s")
                values.append(current_user.get('employee_id'))

            query = f"""
                SELECT customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id
                FROM customer
                WHERE {' AND '.join(conditions)}
            """

            cursor.execute(query, values)
            rows = cursor.fetchall()

            if not rows:
                raise HTTPException(
                    status_code=404, detail="No customers found")

            return [CustomerRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/customers/", response_model=list[CustomerRead],)
def get_all_customers(conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[CustomerRead]:
    query = """SELECT customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id
            From customer
            """
    values = ()  # Initialize empty tuple for admin users

    if current_user.get('type').lower() == 'agent':
        query += " WHERE employee_id = %s"
        values = (current_user.get('employee_id'),)

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, values)

            rows = cursor.fetchall()
            return [CustomerRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/customers/agent/{employee_id}", response_model=list[CustomerRead])
def get_customers_by_agent(employee_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[CustomerRead]:
    """
    Get all customers assigned to a specific agent.
    - Agents: Can only view their own customers
    - Branch Managers: Can view customers of agents in their branch
    - Admins: Can view customers of any agent
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    
    # Check user permissions
    if user_type not in ['admin', 'branch_manager', 'agent']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to view agent customers")
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Verify the employee exists and is an agent
            cursor.execute(
                "SELECT employee_id, type, branch_id FROM employee WHERE employee_id = %s", 
                (employee_id,)
            )
            agent_row = cursor.fetchone()
            
            if not agent_row:
                raise HTTPException(status_code=404, detail="Agent not found")
            
            if agent_row['type'] != 'Agent':
                raise HTTPException(
                    status_code=400, detail="The specified employee is not an agent")
            
            # If agent, they can only view their own customers
            if user_type == 'agent':
                if current_user.get('employee_id') != employee_id:
                    raise HTTPException(
                        status_code=403, detail="Agents can only view their own customers")
            
            # If branch manager, verify the agent is in their branch
            elif user_type == 'branch_manager':
                current_employee_id = current_user.get('employee_id')
                
                if not current_employee_id:
                    raise HTTPException(
                        status_code=403, detail="User is not associated with an employee record")
                
                # Get branch_id of the current branch manager
                cursor.execute(
                    "SELECT branch_id FROM employee WHERE employee_id = %s", 
                    (current_employee_id,)
                )
                manager_row = cursor.fetchone()
                
                if not manager_row or not manager_row['branch_id']:
                    raise HTTPException(
                        status_code=400, detail="Branch manager does not have a branch assigned")
                
                # Check if the agent is in the same branch
                if agent_row['branch_id'] != manager_row['branch_id']:
                    raise HTTPException(
                        status_code=403, 
                        detail="Branch managers can only view customers of agents in their branch")
            
            # Get all customers for the specified agent
            cursor.execute("""
                SELECT customer_id, name, nic, phone_number, address, 
                       date_of_birth, email, status, employee_id
                FROM customer
                WHERE employee_id = %s
                ORDER BY name
            """, (employee_id,))
            
            rows = cursor.fetchall()
            return [CustomerRead(**row) for row in rows]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/customers/branch", response_model=list[CustomerRead])
def get_customers_by_branch(conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[CustomerRead]:
    """
    Get all customers in the same branch as the current branch manager.
    Only branch managers can access this endpoint.
    """
    user_type = current_user.get('type', '').lower()
    if user_type != 'branch manager':
        raise HTTPException(
            status_code=403, detail="Only branch managers can view branch customers")

    try:
        employee_id = current_user.get('employee_id')

        # If user doesn't have employee_id, they might be an admin user - reject access
        if not employee_id:
            raise HTTPException(
                status_code=403, detail="User is not associated with an employee record")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get branch_id of the current branch manager
            cursor.execute(
                "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
            manager_row = cursor.fetchone()
            if not manager_row or not manager_row['branch_id']:
                raise HTTPException(
                    status_code=400, detail="Branch manager does not have a branch assigned")

            branch_id = manager_row['branch_id']

            # Get all customers whose employees belong to the same branch
            cursor.execute("""
                SELECT c.customer_id, c.name, c.nic, c.phone_number, c.address, 
                       c.date_of_birth, c.email, c.status, c.employee_id
                FROM customer c
                INNER JOIN employee e ON c.employee_id = e.employee_id
                WHERE e.branch_id = %s
                ORDER BY c.name
            """, (branch_id,))

            rows = cursor.fetchall()
            return [CustomerRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/customers/agent/{employee_id}/stats")
def get_agent_customer_stats(employee_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get customer statistics for a specific agent.
    - Agents: Can only view their own statistics
    - Branch Managers: Can view statistics of agents in their branch
    - Admins: Can view statistics of any agent
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    
    # Check user permissions
    if user_type not in ['admin', 'branch_manager', 'agent']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to view agent statistics")
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Verify the employee exists and is an agent
            cursor.execute(
                "SELECT employee_id, name, type, branch_id FROM employee WHERE employee_id = %s", 
                (employee_id,)
            )
            agent_row = cursor.fetchone()
            
            if not agent_row:
                raise HTTPException(status_code=404, detail="Agent not found")
            
            if agent_row['type'] != 'Agent':
                raise HTTPException(
                    status_code=400, detail="The specified employee is not an agent")
            
            # If agent, they can only view their own statistics
            if user_type == 'agent':
                if current_user.get('employee_id') != employee_id:
                    raise HTTPException(
                        status_code=403, detail="Agents can only view their own statistics")
            
            # If branch manager, verify the agent is in their branch
            elif user_type == 'branch_manager':
                current_employee_id = current_user.get('employee_id')
                
                if not current_employee_id:
                    raise HTTPException(
                        status_code=403, detail="User is not associated with an employee record")
                
                # Get branch_id of the current branch manager
                cursor.execute(
                    "SELECT branch_id FROM employee WHERE employee_id = %s", 
                    (current_employee_id,)
                )
                manager_row = cursor.fetchone()
                
                if not manager_row or not manager_row['branch_id']:
                    raise HTTPException(
                        status_code=400, detail="Branch manager does not have a branch assigned")
                
                # Check if the agent is in the same branch
                if agent_row['branch_id'] != manager_row['branch_id']:
                    raise HTTPException(
                        status_code=403, 
                        detail="Branch managers can only view statistics of agents in their branch")
            
            # Get customer statistics for the agent
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_customers,
                    COUNT(CASE WHEN status = true THEN 1 END) as active_customers,
                    COUNT(CASE WHEN status = false THEN 1 END) as inactive_customers
                FROM customer
                WHERE employee_id = %s
            """, (employee_id,))
            
            stats = cursor.fetchone()
            
            # Get account statistics
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT sa.saving_account_id) as total_accounts,
                    SUM(sa.balance) as total_balance
                FROM customer c
                JOIN accountholder ah ON c.customer_id = ah.customer_id
                JOIN savingsaccount sa ON ah.saving_account_id = sa.saving_account_id
                WHERE c.employee_id = %s AND sa.status = true
            """, (employee_id,))
            
            account_stats = cursor.fetchone()
            
            return {
                "employee_id": employee_id,
                "agent_name": agent_row['name'],
                "branch_id": agent_row['branch_id'],
                "total_customers": stats['total_customers'] or 0,
                "active_customers": stats['active_customers'] or 0,
                "inactive_customers": stats['inactive_customers'] or 0,
                "total_accounts": account_stats['total_accounts'] or 0,
                "total_balance": float(account_stats['total_balance']) if account_stats['total_balance'] else 0.0
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/customers/branch/{branch_id}", response_model=list[CustomerRead])
def get_customers_by_branch_id(branch_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[CustomerRead]:
    """
    Get all customers under a specific branch ID.
    Only admins and branch managers can access this endpoint.
    Branch managers can only access their own branch.
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')

    # Check user permissions
    if user_type not in ['admin', 'branch_manager']:
        raise HTTPException(
            status_code=403, detail="Only admins and branch managers can view customers by branch")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # If branch manager, verify they can only access their own branch
            if user_type == 'branch_manager':
                employee_id = current_user.get('employee_id')

                if not employee_id:
                    raise HTTPException(
                        status_code=403, detail="User is not associated with an employee record")

                # Get branch_id of the current branch manager
                cursor.execute(
                    "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
                manager_row = cursor.fetchone()
                if not manager_row or not manager_row['branch_id']:
                    raise HTTPException(
                        status_code=400, detail="Branch manager does not have a branch assigned")

                # Check if the requested branch_id matches the manager's branch
                if manager_row['branch_id'] != branch_id:
                    raise HTTPException(
                        status_code=403, detail="Branch managers can only access customers from their own branch")

            # Verify the branch exists
            cursor.execute(
                "SELECT branch_id FROM branch WHERE branch_id = %s", (branch_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Branch not found")

            # Get all customers whose employees belong to the specified branch
            cursor.execute("""
                SELECT c.customer_id, c.name, c.nic, c.phone_number, c.address, 
                       c.date_of_birth, c.email, c.status, c.employee_id
                FROM customer c
                INNER JOIN employee e ON c.employee_id = e.employee_id
                WHERE e.branch_id = %s
                ORDER BY c.name
            """, (branch_id,))

            rows = cursor.fetchall()
            return [CustomerRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/customers/branch/{branch_id}/stats")
def get_branch_customer_stats(branch_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get customer statistics for a specific branch.
    Only admins and branch managers can access this endpoint.
    Branch managers can only access their own branch.
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')

    # Check user permissions
    if user_type not in ['admin', 'branch_manager']:
        raise HTTPException(
            status_code=403, detail="Only admins and branch managers can view branch statistics")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # If branch manager, verify they can only access their own branch
            if user_type == 'branch_manager':
                employee_id = current_user.get('employee_id')

                if not employee_id:
                    raise HTTPException(
                        status_code=403, detail="User is not associated with an employee record")

                # Get branch_id of the current branch manager
                cursor.execute(
                    "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
                manager_row = cursor.fetchone()
                if not manager_row or not manager_row['branch_id']:
                    raise HTTPException(
                        status_code=400, detail="Branch manager does not have a branch assigned")

                # Check if the requested branch_id matches the manager's branch
                if manager_row['branch_id'] != branch_id:
                    raise HTTPException(
                        status_code=403, detail="Branch managers can only access statistics from their own branch")

            # Verify the branch exists
            cursor.execute(
                "SELECT branch_id FROM branch WHERE branch_id = %s", (branch_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Branch not found")

            # Get customer statistics for the branch
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_customers,
                    COUNT(CASE WHEN c.status = true THEN 1 END) as active_customers,
                    COUNT(CASE WHEN c.status = false THEN 1 END) as inactive_customers,
                    COUNT(CASE WHEN DATE_TRUNC('month', e.date_started) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_customers_this_month
                FROM customer c
                INNER JOIN employee e ON c.employee_id = e.employee_id
                WHERE e.branch_id = %s
            """, (branch_id,))

            stats = cursor.fetchone()
            return {
                "total_customers": stats['total_customers'] or 0,
                "active_customers": stats['active_customers'] or 0,
                "inactive_customers": stats['inactive_customers'] or 0,
                "new_customers_this_month": stats['new_customers_this_month'] or 0,
                "branch_id": branch_id
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.put("/customer/update", response_model=CustomerRead)
def update_customer_details(update_request: CustomerUpdateRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> CustomerRead:

    # Security: Check user permissions
    if current_user.get('type').lower() not in ['admin', 'agent']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to update customer details")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # First check if customer exists and, if agent, restrict to their own customers
            if current_user.get('type') == 'agent':
                cursor.execute(
                    "SELECT customer_id FROM customer WHERE customer_id = %s AND employee_id = %s",
                    (update_request.customer_id, current_user.get('employee_id')))
            else:
                cursor.execute(
                    "SELECT customer_id FROM customer WHERE customer_id = %s",
                    (update_request.customer_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404, detail="Customer not found or not authorized")

            # Build dynamic update query based on provided fields
            update_fields = []
            update_values = []

            for field, value in update_request.model_dump(exclude={'customer_id'}, exclude_none=True).items():
                update_fields.append(f"{field} = %s")
                update_values.append(value)

            if not update_fields:
                raise HTTPException(
                    status_code=400, detail="No fields provided for update")

            # Add customer_id to values for WHERE clause
            update_values.append(update_request.customer_id)

            # If agent, restrict update to their own customers
            if current_user.get('type') == 'agent':
                query = f"""
                    UPDATE customer 
                    SET {', '.join(update_fields)}
                    WHERE customer_id = %s AND employee_id = %s
                    RETURNING customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id
                """
                update_values.append(current_user.get('employee_id'))
            else:
                query = f"""
                    UPDATE customer 
                    SET {', '.join(update_fields)}
                    WHERE customer_id = %s
                    RETURNING customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id
                """

            cursor.execute(query, update_values)

            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=500, detail="Failed to update customer")

            conn.commit()
            return CustomerRead(**row)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400, detail="Email already exists for another customer")
        else:
            raise HTTPException(
                status_code=500, detail=f"Database error: {str(e)}")


@router.put("/customer/status", response_model=CustomerRead)
def change_customer_status(status_request: CustomerStatusRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> CustomerRead:
    """
    Secure customer status update using request body instead of URL parameters.
    Only admin and authorized agent can update customer status.
    """
    # Security: Check user permissions
    if current_user.get('type') not in ['admin', 'agent']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to update customer status")

    # If agent, check customer belongs to agent
    if current_user.get('type') == 'agent':
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT customer_id FROM customer WHERE customer_id = %s AND employee_id = %s",
                (status_request.customer_id, current_user.get('employee_id')))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=403, detail="Agent not authorized to update this customer's status")

    return update_customer_details(
        CustomerUpdateRequest(
            customer_id=status_request.customer_id, status=status_request.status),
        conn=conn,
        current_user=current_user
    )


@router.put("/customer/contact", response_model=CustomerRead)
def update_customer_contact(contact_request: CustomerUpdateRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> CustomerRead:
    """
    Secure contact information update using request body instead of URL parameters.
    Only admin and authorized agent can update customer contact details.
    """
    # Security: Check user permissions
    if current_user.get('type') not in ['admin', 'agent']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to update customer contact details")

    # Restrict to contact fields only for security
    allowed_fields = {'phone_number', 'email', 'address'}
    update_data = contact_request.model_dump(
        exclude={'customer_id'}, exclude_none=True)

    # Filter to only allow contact field updates
    filtered_data = {k: v for k, v in update_data.items()
                     if k in allowed_fields}

    if not filtered_data:
        raise HTTPException(
            status_code=400, detail="No contact fields provided for update")

    # Create a new request with only contact fields
    contact_update = CustomerUpdateRequest(
        customer_id=contact_request.customer_id, **filtered_data)

    return update_customer_details(contact_update, conn=conn, current_user=current_user)
