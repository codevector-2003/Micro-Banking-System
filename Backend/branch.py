from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, Depends, HTTPException
from schemas import BranchCreate, BranchRead
from database import get_db
from auth import get_current_user
from typing import Optional

router = APIRouter()


@router.post("/branch", response_model=BranchRead)
def create_branch(branch: BranchCreate, conn=Depends(get_db), current_user=Depends(get_current_user)) -> BranchRead:
    """
    Create a new branch - Admin access only.
    """
    # Only admin can create branches
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admin can create branches")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                INSERT INTO branch (branch_name, location, branch_phone_number, status)
                VALUES (%s, %s, %s, %s)
                RETURNING branch_id, branch_name, location, branch_phone_number, status
            """, (branch.branch_name, branch.location, branch.branch_phone_number, branch.status))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(
                    status_code=500, detail="Failed to create branch")

            conn.commit()
            return BranchRead(**result)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400, detail="Branch with this phone number already exists")
        else:
            raise HTTPException(
                status_code=500, detail=f"Database error: {str(e)}")


@router.get("/branch/all", response_model=list[BranchRead])
def get_all_branches(skip: int = 0, limit: int = 100, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[BranchRead]:
    """
    Get all branches with pagination - Admin access only.
    """
    # Only admin can view all branches
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admin can view all branches")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT branch_id, branch_name, location, branch_phone_number, status
                FROM branch
                ORDER BY branch_name
                OFFSET %s LIMIT %s
            """, (skip, limit))

            rows = cursor.fetchall()
            return [BranchRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/branch/active", response_model=list[BranchRead])
def get_active_branches(conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[BranchRead]:
    """
    Get only active branches - Available for branch managers and admins.
    """
    # Branch managers can see active branches for operational purposes
    if current_user.get('type').lower() not in ['admin', 'branch_manager']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT branch_id, branch_name, location, branch_phone_number, status
                FROM branch
                WHERE status = true
                ORDER BY branch_name
            """)

            rows = cursor.fetchall()
            return [BranchRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.post("/branch/search", response_model=list[BranchRead])
def search_branches(search_request: dict, conn=Depends(get_db), current_user=Depends(get_current_user)) -> list[BranchRead]:
    """
    Search branches by various criteria - Admin access only.
    """
    # Only admin can search branches
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admin can search branches")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Base query
            query = """
                SELECT branch_id, branch_name, location, branch_phone_number, status
                FROM branch
                WHERE 1=1
            """
            values = []
            # Add search conditions
            if search_request.get('branch_id'):
                query += " AND branch_id = %s"
                values.append(search_request['branch_id'])

            if search_request.get('branch_name'):
                query += " AND branch_name ILIKE %s"
                values.append(f"%{search_request['branch_name']}%")

            if search_request.get('location'):
                query += " AND location ILIKE %s"
                values.append(f"%{search_request['location']}%")

            if search_request.get('status') is not None:
                query += " AND status = %s"
                values.append(search_request['status'])

            query += " ORDER BY branch_name"

            cursor.execute(query, values)
            rows = cursor.fetchall()

            return [BranchRead(**row) for row in rows]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.put("/branch/update", response_model=BranchRead)
def update_branch_details(update_request: dict, conn=Depends(get_db), current_user=Depends(get_current_user)) -> BranchRead:
    """
    Update branch details - Admin access only.
    """
    # Only admin can update branch details
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admin can update branch details")

    try:
        branch_id = update_request.get('branch_id')
        if not branch_id:
            raise HTTPException(
                status_code=400, detail="branch_id is required")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if branch exists
            cursor.execute(
                "SELECT branch_id FROM branch WHERE branch_id = %s", (branch_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Branch not found")

            # Build dynamic update query
            update_fields = []
            update_values = []

            if update_request.get('branch_name'):
                update_fields.append("branch_name = %s")
                update_values.append(update_request['branch_name'])

            if update_request.get('location'):
                update_fields.append("location = %s")
                update_values.append(update_request['location'])

            if update_request.get('branch_phone_number'):
                update_fields.append("branch_phone_number = %s")
                update_values.append(update_request['branch_phone_number'])

            if update_request.get('status') is not None:
                update_fields.append("status = %s")
                update_values.append(update_request['status'])

            if not update_fields:
                raise HTTPException(
                    status_code=400, detail="No fields provided for update")

            update_values.append(branch_id)

            query = f"""
                UPDATE branch 
                SET {', '.join(update_fields)}
                WHERE branch_id = %s
                RETURNING branch_id, branch_name, location, branch_phone_number, status
            """

            cursor.execute(query, update_values)
            result = cursor.fetchone()

            if not result:
                raise HTTPException(
                    status_code=500, detail="Failed to update branch")

            conn.commit()
            return BranchRead(**result)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400, detail="Branch phone number already exists")
        else:
            raise HTTPException(
                status_code=500, detail=f"Database error: {str(e)}")


@router.put("/branch/status", response_model=BranchRead)
def change_branch_status(status_request: dict, conn=Depends(get_db), current_user=Depends(get_current_user)) -> BranchRead:
    """
    Change branch status (active/inactive) - Admin access only.
    """
    # Only admin can change branch status
    if current_user.get('type').lower() != 'admin':
        raise HTTPException(
            status_code=403, detail="Only admin can change branch status")

    try:
        branch_id = status_request.get('branch_id')
        new_status = status_request.get('status')

        if not branch_id:
            raise HTTPException(
                status_code=400, detail="branch_id is required")
        if new_status is None:
            raise HTTPException(status_code=400, detail="status is required")

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if branch exists and update status
            cursor.execute("""
                UPDATE branch 
                SET status = %s
                WHERE branch_id = %s
                RETURNING branch_id, branch_name, location, branch_phone_number, status
            """, (new_status, branch_id))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Branch not found")

            conn.commit()
            return BranchRead(**result)

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")


@router.get("/branch/{branch_id}", response_model=BranchRead)
def get_branch_by_id(branch_id: str, conn=Depends(get_db), current_user=Depends(get_current_user)) -> BranchRead:
    """
    Get branch details by ID - Admin and branch managers can access.
    """
    # Admin and branch managers can view branch details
    if current_user.get('type').lower() not in ['admin', 'branch_manager']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT branch_id, branch_name, location, branch_phone_number, status
                FROM branch 
                WHERE branch_id = %s
            """, (branch_id,))

            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Branch not found")

            return BranchRead(**row)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {str(e)}")
