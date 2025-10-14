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


@router.put("/customer/update", response_model=CustomerRead)
def update_customer_details(update_request: CustomerUpdateRequest, conn=Depends(get_db), current_user=Depends(get_current_user)) -> CustomerRead:

    # Security: Check user permissions
    if current_user.get('type') not in ['admin', 'agent']:
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
