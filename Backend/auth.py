import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from psycopg2.extras import RealDictCursor
from database import get_db
from schemas import Token, TokenData, Etype, AuthenticationCreate, AuthenticationRead


SECRET_KEY = os.getenv("JWT_SECRET", "your_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/token')
router = APIRouter()


def verify_password(plain_password, hashed_password):
    """Verify a password against its hash using bcrypt directly"""
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')

    return bcrypt.checkpw(plain_password, hashed_password)


def get_password_hash(password):
    """Hash a password using bcrypt directly"""
    if isinstance(password, str):
        password = password.encode('utf-8')

    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')


def get_user_by_username(conn, username: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM authentication WHERE username = %s", (username,))
        return cursor.fetchone()


def get_user_by_id(conn, user_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM authentication WHERE employee_id = %s", (user_id,))
        return cursor.fetchone()


def authenticate_user(conn, username: str, password: str):
    user = get_user_by_username(conn, username)
    if not user:
        return None
    if not verify_password(password, user['password']):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_user_account(conn, user):
    cursor = conn.cursor()
    # Convert string "NULL" or empty string to Python None
    hashed_password = get_password_hash(user.password)
    employee_id = None if user.employee_id in (
        "NULL", "", None) else user.employee_id
    cursor.execute(
        "INSERT INTO authentication (username, password, type, employee_id) VALUES (%s, %s, %s, %s)",
        (user.username, hashed_password, user.type.value, employee_id)
    )
    conn.commit()
    return employee_id


@router.post("/user/register", response_model=AuthenticationRead)
async def register_user(user: AuthenticationCreate, conn=Depends(get_db)):
    employee_id = create_user_account(conn, user)
    return AuthenticationRead(
        username=user.username,
        password="********",  # Do not return real password
        type=user.type,
        employee_id=employee_id
    )


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), conn=Depends(get_db)
):
    user = authenticate_user(conn, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Use username for admins, employee_id for others
    subject = user["username"] if user["employee_id"] is None else user["employee_id"]

    # Update last_login_time for branch_manager and agent
    if user["type"] in ["Branch Manager", "Agent"] and user["employee_id"]:
        from datetime import datetime
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE employee SET last_login_time = %s WHERE employee_id = %s",
                (datetime.now(), user["employee_id"])
            )
        conn.commit()

    access_token = create_access_token(
        data={"sub": subject,
              "type": user["type"],
              "is_admin": user["employee_id"] is None},  # Flag for admin
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(oauth2_scheme), conn=Depends(get_db)):
    """Dependency that decodes JWT and returns user row or raises 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject: Optional[str] = payload.get("sub")
        is_admin: bool = payload.get("is_admin", False)

        if subject is None:
            raise credentials_exception

    except JWTError as exc:
        raise credentials_exception from exc

    # Look up user by username if admin, by employee_id if not
    if is_admin:
        user = get_user_by_username(conn, subject)
    else:
        user = get_user_by_id(conn, subject)

    if user is None:
        raise credentials_exception
    return user


@router.get("/users/me", response_model=AuthenticationRead)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Protected endpoint that returns information about the currently authenticated user."""
    return AuthenticationRead(
        username=current_user["username"],
        password="********",  # Never return the actual password
        type=Etype(current_user["type"]),
        employee_id=current_user["employee_id"]
    )


@router.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello {current_user['username']}! This is a protected route.", "user_type": current_user['type']}
