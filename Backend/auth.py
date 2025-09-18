import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
import psycopg2
from psycopg2.extras import RealDictCursor
from database import get_db
from schemas import Token, TokenData, Etype, AuthenticationCreate, AuthenticationRead


SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/token')
router = APIRouter()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


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


def create_user_account(conn, user: AuthenticationCreate):
    hashed_password = get_password_hash(user.password)
    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO authentication (username, password, type, employee_id) VALUES (%s, %s, %s, %s) RETURNING employee_id",
            (user.username, hashed_password, user.type.value, user.employee_id)
        )
        employee_id = cursor.fetchone()[0]
        conn.commit()
        return employee_id


app = FastAPI(title="Micro Banking System", version="1.0.0")


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
    access_token = create_access_token(
        data={"sub": str(user["employee_id"]),
              "type": user["type"]},
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
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError as exc:
        raise credentials_exception from exc
    user = get_user_by_id(conn, token_data.user_id)
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
