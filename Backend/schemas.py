from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

# Enum Definitions


class Etype(str, Enum):
    agent = "Agent"
    branch_manager = "Branch Manager"
    admin = "Admin"


class Stype(str, Enum):
    children = "Children"
    teen = "Teen"
    adult = "Adult"
    senior = "Senior"
    joint = "Joint"


class Trantype(str, Enum):
    interest = "Interest"
    withdrawal = "Withdrawal"
    deposit = "Deposit"

# Branch Models


class BranchCreate(BaseModel):
    branch_name: str = Field(max_length=30)
    location: str = Field(max_length=30)
    branch_phone_number: str = Field(max_length=10)
    status: bool


class BranchRead(BranchCreate):
    branch_id: str = Field(max_length=7)

# Employee Models


class EmployeeCreate(BaseModel):
    name: str = Field(max_length=50)
    nic: str = Field(max_length=12)
    phone_number: str = Field(max_length=10)
    address: str = Field(max_length=255)
    date_started: date
    last_login_time: datetime | None = None
    type: Etype
    status: bool
    branch_id: str = Field(max_length=7)


class EmployeeRead(EmployeeCreate):
    employee_id: str = Field(max_length=10)

# Token Models


class TokenCreate(BaseModel):
    token_value: str = Field(max_length=255)
    created_time: datetime
    last_used: datetime | None = None
    employee_id: str = Field(max_length=10)


class TokenRead(TokenCreate):
    token_id: str = Field(max_length=128)

# Authentication Models


class AuthenticationCreate(BaseModel):
    username: str = Field(max_length=30)
    password: str = Field(max_length=255)  # Hash before DB insert
    type: Etype
    employee_id: Optional[str] = Field(default=None, max_length=10)


class AuthenticationRead(AuthenticationCreate):
    pass  # No extra fields, but password should be excluded in practice

# JWT Token Models


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None

# Customer Models


class CustomerCreate(BaseModel):
    name: str = Field(max_length=50)
    nic: str = Field(max_length=12)
    phone_number: str = Field(max_length=10)
    address: str = Field(max_length=255)
    date_of_birth: date
    email: str | None = Field(default=None, max_length=255)
    status: bool
    employee_id: str = Field(max_length=10)


class CustomerRead(CustomerCreate):
    customer_id: str = Field(max_length=10)

# SavingsAccount_Plans Models


class SavingsAccountPlansCreate(BaseModel):
    plan_name: Stype
    interest_rate: str = Field(max_length=5)  # Store as string per schema
    min_balance: Decimal = Field(decimal_places=2)


class SavingsAccountPlansRead(SavingsAccountPlansCreate):
    s_plan_id: str = Field(max_length=5)

# SavingsAccount Models


class SavingsAccountCreate(BaseModel):
    open_date: datetime
    balance: Decimal = Field(default=Decimal("0.00"), decimal_places=2)
    employee_id: str = Field(max_length=10)
    s_plan_id: str = Field(max_length=5)
    status: bool
    branch_id: str = Field(max_length=7)


class SavingsAccountRead(SavingsAccountCreate):
    saving_account_id: str = Field(max_length=10)

# FixedDeposit_Plans Models


class FixedDepositPlansCreate(BaseModel):
    months: str = Field(max_length=15)
    interest_rate: str = Field(max_length=5)  # Store as string per schema


class FixedDepositPlansRead(FixedDepositPlansCreate):
    f_plan_id: str = Field(max_length=5)

# FixedDeposit Models


class FixedDepositCreate(BaseModel):
    saving_account_id: str = Field(max_length=10)
    f_plan_id: str = Field(max_length=5)
    start_date: datetime
    end_date: datetime
    principal_amount: Decimal = Field(decimal_places=2)
    interest_payment_type: bool
    last_payout_date: datetime | None = None
    status: bool


class FixedDepositRead(FixedDepositCreate):
    fixed_deposit_id: str = Field(max_length=10)

# AccountHolder Models


class AccountHolderCreate(BaseModel):
    customer_id: str = Field(max_length=10)
    saving_account_id: str = Field(max_length=10)


class AccountHolderRead(AccountHolderCreate):
    holder_id: str = Field(max_length=10)

# Transactions Models


class TransactionsCreate(BaseModel):
    holder_id: str = Field(max_length=10)
    type: Trantype
    amount: Decimal = Field(gt=Decimal("0"), decimal_places=2)
    timestamp: datetime | None = None  # Default to now in DB
    ref_number: int
    description: str | None = Field(default=None, max_length=255)


class TransactionsRead(TransactionsCreate):
    transaction_id: int

# Security: Secure request models for customer operations


class CustomerSearchRequest(BaseModel):
    """Secure search request model for customer search operations"""
    customer_id: Optional[str] = Field(default=None, max_length=10)
    nic: Optional[str] = Field(default=None, max_length=12)
    name: Optional[str] = Field(default=None, max_length=50)
    phone_number: Optional[str] = Field(default=None, max_length=10)


class CustomerUpdateRequest(BaseModel):
    """Secure update request model for customer update operations"""
    customer_id: str = Field(max_length=10)
    name: Optional[str] = Field(default=None, max_length=50)
    phone_number: Optional[str] = Field(default=None, max_length=10)
    address: Optional[str] = Field(default=None, max_length=255)
    email: Optional[str] = Field(default=None, max_length=100)
    status: Optional[bool] = Field(default=None)


class CustomerStatusRequest(BaseModel):
    """Secure status update request model for customer status operations"""
    customer_id: str = Field(max_length=10)
    status: bool
