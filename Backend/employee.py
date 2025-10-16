from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, Depends, HTTPException
from schemas import EmployeeCreate, EmployeeRead
from database import get_db
from auth import get_current_user
from datetime import date

router = APIRouter()


@router.post("/employee", response_model=EmployeeRead)
def create_employee(employee: EmployeeCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> EmployeeRead:
    if current_user.get('type').lower() not in ['admin']:
        raise HTTPException(
            status_code=403, detail="Insufficient permissions to create employees"
        )

    try:
        from datetime import datetime
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            start_date = employee.date_started if employee.date_started else date.today()
            last_login_time = datetime.now()
            cursor.execute("""
                INSERT INTO employee (name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING employee_id, name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id
            """, (
                employee.name,
                employee.nic,
                employee.phone_number,
                employee.address,
                start_date,
                last_login_time,
                employee.type,
                employee.status,
                employee.branch_id
            ))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(
                    status_code=500, detail="Failed to create employee")

            conn.commit()
            return EmployeeRead(**result)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/employee/search", response_model=list[EmployeeRead])
def get_employees(search_request: dict, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[EmployeeRead]:
    """
    Search employees by various criteria.
    Admin: Can search all employees
    Branch Manager: Can search employees in their branch
    Agent: Can search employees in their own branch (limited to basic info)
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')

    if user_type not in ['branch_manager', 'admin', 'agent']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Base query
            query = """
                SELECT employee_id, name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id
                FROM employee
                WHERE 1=1
            """
            values = []

            # For agents, restrict to their own branch only
            if user_type == 'agent':
                employee_id = current_user.get('employee_id')
                if not employee_id:
                    raise HTTPException(
                        status_code=403, detail="User is not associated with an employee record")

                # Get the agent's branch_id
                cursor.execute(
                    "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
                agent_branch = cursor.fetchone()
                if not agent_branch:
                    raise HTTPException(
                        status_code=400, detail="Agent's branch not found")

                # Restrict search to the agent's branch
                query += " AND branch_id = %s"
                values.append(agent_branch['branch_id'])

            # Add search conditions
            if search_request.get('employee_id'):
                query += " AND employee_id = %s"
                values.append(search_request['employee_id'])

            if search_request.get('name'):
                query += " AND name ILIKE %s"
                values.append(f"%{search_request['name']}%")

            if search_request.get('nic'):
                query += " AND nic = %s"
                values.append(search_request['nic'])

            if search_request.get('branch_id'):
                # For non-admin users, ensure they can only search their own branch
                if user_type != 'admin':
                    # For agents, this is already restricted above
                    # For branch managers, verify it's their branch
                    if user_type == 'branch_manager':
                        employee_id = current_user.get('employee_id')
                        if employee_id:
                            cursor.execute(
                                "SELECT branch_id FROM employee WHERE employee_id = %s", (employee_id,))
                            manager_branch = cursor.fetchone()
                            if manager_branch and manager_branch['branch_id'] != search_request['branch_id']:
                                raise HTTPException(
                                    status_code=403, detail="You can only search employees in your own branch")

                query += " AND branch_id = %s"
                values.append(search_request['branch_id'])

            query += " ORDER BY name"

            cursor.execute(query, values)
            rows = cursor.fetchall()

            return [EmployeeRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/employee/all", response_model=list[EmployeeRead])
def get_all_employees(skip: int = 0, limit: int = 100, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[EmployeeRead]:
    """
    Get all employees with pagination - Admin only.
    """
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admin can view all employees")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT employee_id, name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id
                FROM employee
                ORDER BY name
                OFFSET %s LIMIT %s
            """, (skip, limit))

            rows = cursor.fetchall()
            return [EmployeeRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/employee/branch", response_model=list[EmployeeRead])
def get_branch_employees(conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[EmployeeRead]:
    """
    Get employees in the same branch as the current branch manager.
    Only branch managers can access this endpoint.
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')
    if user_type != 'branch_manager':
        raise HTTPException(
            status_code=403, detail="Only branch managers can view branch employees")

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

            # Get all employees in the same branch
            cursor.execute("""
                SELECT employee_id, name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id
                FROM employee
                WHERE branch_id = %s
                ORDER BY name
            """, (branch_id,))

            rows = cursor.fetchall()
            return [EmployeeRead(**row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.put("/employee/contact", response_model=EmployeeRead)
def update_employee_contact(update_request: dict, conn=Depends(get_db), current_user=Depends(get_current_user)) -> EmployeeRead:
    """
    Update employee contact details (phone_number, address).
    """
    if current_user.get('type').lower() not in ['branch_manager', 'admin']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        employee_id = update_request.get('employee_id')
        if not employee_id:
            raise HTTPException(
                status_code=400, detail="employee_id is required")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if employee exists
            cursor.execute(
                "SELECT employee_id FROM employee WHERE employee_id = %s", (employee_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404, detail="Employee not found")

            # Build dynamic update query
            update_fields = []
            update_values = []

            if update_request.get('phone_number'):
                update_fields.append("phone_number = %s")
                update_values.append(update_request['phone_number'])

            if update_request.get('address'):
                update_fields.append("address = %s")
                update_values.append(update_request['address'])

            if not update_fields:
                raise HTTPException(
                    status_code=400, detail="No contact fields provided for update")

            update_values.append(employee_id)

            query = f"""
                UPDATE employee 
                SET {', '.join(update_fields)}
                WHERE employee_id = %s
                RETURNING employee_id, name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id
            """

            cursor.execute(query, update_values)
            result = cursor.fetchone()

            if not result:
                raise HTTPException(
                    status_code=500, detail="Failed to update employee")
                if current_user.get('type').lower() not in ['branch_manager', 'admin', 'agent']:
                    raise HTTPException(
                        status_code=403, detail="Insufficient permissions")
                # If branch manager, check status is True
                if current_user.get('type').lower() == 'branch_manager' and not current_user.get('status', False):
                    raise HTTPException(
                        status_code=403, detail="Branch manager account is not active")
            return EmployeeRead(**result)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/employee/my-info")
def get_my_employee_info(conn=Depends(get_db), current_user=Depends(get_current_user)) -> dict:
    """
    Get current user's employee information including branch and manager details.
    Available for all employee types (Agent, Branch Manager).
    """
    user_type = current_user.get('type', '').lower().replace(' ', '_')

    if user_type not in ['agent', 'branch_manager']:
        raise HTTPException(
            status_code=403, detail="Only employees can access this endpoint")

    try:
        employee_id = current_user.get('employee_id')
        if not employee_id:
            raise HTTPException(
                status_code=403, detail="User is not associated with an employee record")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get employee information with branch details
            cursor.execute("""
                SELECT 
                    e.employee_id, e.name, e.nic, e.phone_number, e.address, 
                    e.date_started, e.last_login_time, e.type, e.status, e.branch_id,
                    b.branch_name, b.location, b.branch_phone_number, b.status as branch_status
                FROM employee e
                JOIN branch b ON e.branch_id = b.branch_id
                WHERE e.employee_id = %s
            """, (employee_id,))

            employee_info = cursor.fetchone()
            if not employee_info:
                raise HTTPException(
                    status_code=404, detail="Employee information not found")

            # Get branch manager information
            cursor.execute("""
                SELECT name, employee_id
                FROM employee 
                WHERE branch_id = %s AND type = 'Branch Manager' AND status = true
                LIMIT 1
            """, (employee_info['branch_id'],))

            manager_info = cursor.fetchone()

            # Format the response
            result = {
                "employee": {
                    "employee_id": employee_info['employee_id'],
                    "name": employee_info['name'],
                    "nic": employee_info['nic'],
                    "phone_number": employee_info['phone_number'],
                    "address": employee_info['address'],
                    "date_started": employee_info['date_started'],
                    "last_login_time": employee_info['last_login_time'],
                    "type": employee_info['type'],
                    "status": employee_info['status'],
                    "branch_id": employee_info['branch_id']
                },
                "branch": {
                    "branch_id": employee_info['branch_id'],
                    "branch_name": employee_info['branch_name'],
                    "location": employee_info['location'],
                    "branch_phone_number": employee_info['branch_phone_number'],
                    "status": employee_info['branch_status']
                },
                "manager": {
                    "name": manager_info['name'] if manager_info else "No Manager Assigned",
                    "employee_id": manager_info['employee_id'] if manager_info else None
                } if manager_info else None
            }

            return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.put("/employee/status", response_model=EmployeeRead)
def change_employee_status(status_request: dict, conn=Depends(get_db), current_user=Depends(get_current_user)) -> EmployeeRead:
    """
    Change employee status (active/inactive).
    """
    if current_user.get('type').lower() != 'admin':  # Only admin can change status
        raise HTTPException(
            status_code=403, detail="Only admin can change employee status")

    try:
        employee_id = status_request.get('employee_id')
        new_status = status_request.get('status')

        if not employee_id:
            raise HTTPException(
                status_code=400, detail="employee_id is required")
        if new_status is None:
            raise HTTPException(status_code=400, detail="status is required")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if employee exists and update status
            cursor.execute("""
                UPDATE employee 
                SET status = %s
                WHERE employee_id = %s
                RETURNING employee_id, name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id
            """, (new_status, employee_id))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(
                    status_code=404, detail="Employee not found")

            conn.commit()
            return EmployeeRead(**result)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
