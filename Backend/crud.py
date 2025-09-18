from psycopg2.extras import RealDictCursor
from psycopg2 import Error as PsycopgError
from fastapi import HTTPException
from schemas import (
    BranchCreate, BranchRead,
    EmployeeCreate, EmployeeRead,
    TokenCreate, TokenRead,
    AuthenticationCreate, AuthenticationRead,
    CustomerCreate, CustomerRead,
    SavingsAccountPlansCreate, SavingsAccountPlansRead,
    SavingsAccountCreate, SavingsAccountRead,
    FixedDepositPlansCreate, FixedDepositPlansRead,
    FixedDepositCreate, FixedDepositRead,
    AccountHolderCreate, AccountHolderRead,
    TransactionsCreate, TransactionsRead
)
from datetime import datetime

def create_branch(conn, branch: BranchCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO Branch (branch_name, location, branch_phone_number, status)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """, (branch.branch_name, branch.location, branch.branch_phone_number, branch.status))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create branch")
        return BranchRead(**result)

def get_branch(conn, branch_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM Branch WHERE branch_id = %s;", (branch_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Branch not found")
        return BranchRead(**result)

def update_branch(conn, branch_id: str, branch: BranchCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE Branch
            SET branch_name = %s, location = %s, branch_phone_number = %s, status = %s
            WHERE branch_id = %s
            RETURNING *;
        """, (branch.branch_name, branch.location, branch.branch_phone_number, branch.status, branch_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Branch not found")
        return BranchRead(**result)

def delete_branch(conn, branch_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM Branch WHERE branch_id = %s RETURNING *;", (branch_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Branch not found")
        return {"message": "Branch deleted", "branch_id": branch_id}

def create_employee(conn, employee: EmployeeCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO Employee (name, nic, phone_number, address, date_started, last_login_time, type, status, branch_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (employee.name, employee.nic, employee.phone_number, employee.address, employee.date_started, employee.last_login_time, employee.type, employee.status, employee.branch_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create employee")
        return EmployeeRead(**result)

def get_employee(conn, employee_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM Employee WHERE employee_id = %s;", (employee_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Employee not found")
        return EmployeeRead(**result)

def update_employee(conn, employee_id: str, employee: EmployeeCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE Employee
            SET name = %s, nic = %s, phone_number = %s, address = %s, date_started = %s,
                last_login_time = %s, type = %s, status = %s, branch_id = %s
            WHERE employee_id = %s
            RETURNING *;
        """, (employee.name, employee.nic, employee.phone_number, employee.address, employee.date_started, employee.last_login_time, employee.type, employee.status, employee.branch_id, employee_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Employee not found")
        return EmployeeRead(**result)

def delete_employee(conn, employee_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM Employee WHERE employee_id = %s RETURNING *;", (employee_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Employee not found")
        return {"message": "Employee deleted", "employee_id": employee_id}

def create_token(conn, token: TokenCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO Token (token_id, token_value, created_time, last_used, employee_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *;
        """, (token.token_id, token.token_value, token.created_time, token.last_used, token.employee_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create token")
        return TokenRead(**result)

def get_token(conn, token_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM Token WHERE token_id = %s;", (token_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Token not found")
        return TokenRead(**result)

def update_token(conn, token_id: str, token: TokenCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE Token
            SET token_value = %s, created_time = %s, last_used = %s, employee_id = %s
            WHERE token_id = %s
            RETURNING *;
        """, (token.token_value, token.created_time, token.last_used, token.employee_id, token_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Token not found")
        return TokenRead(**result)

def delete_token(conn, token_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM Token WHERE token_id = %s RETURNING *;", (token_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Token not found")
        return {"message": "Token deleted", "token_id": token_id}

def create_authentication(conn, auth: AuthenticationCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO Authentication (username, password, type, employee_id)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """, (auth.username, auth.password, auth.type, auth.employee_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create authentication")
        return AuthenticationRead(**result)

def get_authentication(conn, username: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM Authentication WHERE username = %s;", (username,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Authentication not found")
        return AuthenticationRead(**result)

def update_authentication(conn, username: str, auth: AuthenticationCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE Authentication
            SET password = %s, type = %s, employee_id = %s
            WHERE username = %s
            RETURNING *;
        """, (auth.password, auth.type, auth.employee_id, username))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Authentication not found")
        return AuthenticationRead(**result)

def delete_authentication(conn, username: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM Authentication WHERE username = %s RETURNING *;", (username,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Authentication not found")
        return {"message": "Authentication deleted", "username": username}

def create_customer(conn, customer: CustomerCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO Customer (name, nic, phone_number, address, date_of_birth, email, status, employee_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (customer.name, customer.nic, customer.phone_number, customer.address, customer.date_of_birth, customer.email, customer.status, customer.employee_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create customer")
        return CustomerRead(**result)

def get_customer(conn, customer_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM Customer WHERE customer_id = %s;", (customer_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Customer not found")
        return CustomerRead(**result)

def update_customer(conn, customer_id: str, customer: CustomerCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE Customer
            SET name = %s, nic = %s, phone_number = %s, address = %s, date_of_birth = %s,
                email = %s, status = %s, employee_id = %s
            WHERE customer_id = %s
            RETURNING *;
        """, (customer.name, customer.nic, customer.phone_number, customer.address, customer.date_of_birth, customer.email, customer.status, customer.employee_id, customer_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Customer not found")
        return CustomerRead(**result)

def delete_customer(conn, customer_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM Customer WHERE customer_id = %s RETURNING *;", (customer_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {"message": "Customer deleted", "customer_id": customer_id}

def create_savings_account_plans(conn, plan: SavingsAccountPlansCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO SavingsAccount_Plans (plan_name, interest_rate, min_balance)
            VALUES (%s, %s, %s)
            RETURNING *;
        """, (plan.plan_name, plan.interest_rate, plan.min_balance))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create savings account plan")
        return SavingsAccountPlansRead(**result)

def get_savings_account_plans(conn, s_plan_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM SavingsAccount_Plans WHERE s_plan_id = %s;", (s_plan_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Savings account plan not found")
        return SavingsAccountPlansRead(**result)

def update_savings_account_plans(conn, s_plan_id: str, plan: SavingsAccountPlansCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE SavingsAccount_Plans
            SET plan_name = %s, interest_rate = %s, min_balance = %s
            WHERE s_plan_id = %s
            RETURNING *;
        """, (plan.plan_name, plan.interest_rate, plan.min_balance, s_plan_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Savings account plan not found")
        return SavingsAccountPlansRead(**result)

def delete_savings_account_plans(conn, s_plan_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM SavingsAccount_Plans WHERE s_plan_id = %s RETURNING *;", (s_plan_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Savings account plan not found")
        return {"message": "Savings account plan deleted", "s_plan_id": s_plan_id}

def create_savings_account(conn, account: SavingsAccountCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO SavingsAccount (open_date, balance, employee_id, s_plan_id, status, branch_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (account.open_date, account.balance, account.employee_id, account.s_plan_id, account.status, account.branch_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create savings account")
        return SavingsAccountRead(**result)

def get_savings_account(conn, saving_account_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM SavingsAccount WHERE saving_account_id = %s;", (saving_account_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Savings account not found")
        return SavingsAccountRead(**result)

def update_savings_account(conn, saving_account_id: str, account: SavingsAccountCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE SavingsAccount
            SET open_date = %s, balance = %s, employee_id = %s, s_plan_id = %s, status = %s, branch_id = %s
            WHERE saving_account_id = %s
            RETURNING *;
        """, (account.open_date, account.balance, account.employee_id, account.s_plan_id, account.status, account.branch_id, saving_account_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Savings account not found")
        return SavingsAccountRead(**result)

def delete_savings_account(conn, saving_account_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM SavingsAccount WHERE saving_account_id = %s RETURNING *;", (saving_account_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Savings account not found")
        return {"message": "Savings account deleted", "saving_account_id": saving_account_id}

def create_fixed_deposit_plans(conn, plan: FixedDepositPlansCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO FixedDeposit_Plans (months, interest_rate)
            VALUES (%s, %s)
            RETURNING *;
        """, (plan.months, plan.interest_rate))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create fixed deposit plan")
        return FixedDepositPlansRead(**result)

def get_fixed_deposit_plans(conn, f_plan_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM FixedDeposit_Plans WHERE f_plan_id = %s;", (f_plan_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Fixed deposit plan not found")
        return FixedDepositPlansRead(**result)

def update_fixed_deposit_plans(conn, f_plan_id: str, plan: FixedDepositPlansCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE FixedDeposit_Plans
            SET months = %s, interest_rate = %s
            WHERE f_plan_id = %s
            RETURNING *;
        """, (plan.months, plan.interest_rate, f_plan_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Fixed deposit plan not found")
        return FixedDepositPlansRead(**result)

def delete_fixed_deposit_plans(conn, f_plan_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM FixedDeposit_Plans WHERE f_plan_id = %s RETURNING *;", (f_plan_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Fixed deposit plan not found")
        return {"message": "Fixed deposit plan deleted", "f_plan_id": f_plan_id}

def create_fixed_deposit(conn, deposit: FixedDepositCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO FixedDeposit (saving_account_id, f_plan_id, start_date, end_date, principal_amount, interest_payment_type, last_payout_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (deposit.saving_account_id, deposit.f_plan_id, deposit.start_date, deposit.end_date, deposit.principal_amount, deposit.interest_payment_type, deposit.last_payout_date, deposit.status))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create fixed deposit")
        return FixedDepositRead(**result)

def get_fixed_deposit(conn, fixed_deposit_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM FixedDeposit WHERE fixed_deposit_id = %s;", (fixed_deposit_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Fixed deposit not found")
        return FixedDepositRead(**result)

def update_fixed_deposit(conn, fixed_deposit_id: str, deposit: FixedDepositCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE FixedDeposit
            SET saving_account_id = %s, f_plan_id = %s, start_date = %s, end_date = %s,
                principal_amount = %s, interest_payment_type = %s, last_payout_date = %s, status = %s
            WHERE fixed_deposit_id = %s
            RETURNING *;
        """, (deposit.saving_account_id, deposit.f_plan_id, deposit.start_date, deposit.end_date, deposit.principal_amount, deposit.interest_payment_type, deposit.last_payout_date, deposit.status, fixed_deposit_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Fixed deposit not found")
        return FixedDepositRead(**result)

def delete_fixed_deposit(conn, fixed_deposit_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM FixedDeposit WHERE fixed_deposit_id = %s RETURNING *;", (fixed_deposit_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Fixed deposit not found")
        return {"message": "Fixed deposit deleted", "fixed_deposit_id": fixed_deposit_id}

def create_account_holder(conn, holder: AccountHolderCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO AccountHolder (customer_id, saving_account_id)
            VALUES (%s, %s)
            RETURNING *;
        """, (holder.customer_id, holder.saving_account_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create account holder")
        return AccountHolderRead(**result)

def get_account_holder(conn, holder_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM AccountHolder WHERE holder_id = %s;", (holder_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Account holder not found")
        return AccountHolderRead(**result)

def update_account_holder(conn, holder_id: str, holder: AccountHolderCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE AccountHolder
            SET customer_id = %s, saving_account_id = %s
            WHERE holder_id = %s
            RETURNING *;
        """, (holder.customer_id, holder.saving_account_id, holder_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Account holder not found")
        return AccountHolderRead(**result)

def delete_account_holder(conn, holder_id: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM AccountHolder WHERE holder_id = %s RETURNING *;", (holder_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Account holder not found")
        return {"message": "Account holder deleted", "holder_id": holder_id}

def create_transaction(conn, transaction: TransactionsCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO Transactions (holder_id, type, amount, timestamp, ref_number, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (transaction.holder_id, transaction.type, transaction.amount, transaction.timestamp or datetime.now(), transaction.ref_number, transaction.description))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        return TransactionsRead(**result)

def get_transaction(conn, transaction_id: int):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM Transactions WHERE transaction_id = %s;", (transaction_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return TransactionsRead(**result)

def update_transaction(conn, transaction_id: int, transaction: TransactionsCreate):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE Transactions
            SET holder_id = %s, type = %s, amount = %s, timestamp = %s, ref_number = %s, description = %s
            WHERE transaction_id = %s
            RETURNING *;
        """, (transaction.holder_id, transaction.type, transaction.amount, transaction.timestamp or datetime.now(), transaction.ref_number, transaction.description, transaction_id))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return TransactionsRead(**result)

def delete_transaction(conn, transaction_id: int):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("DELETE FROM Transactions WHERE transaction_id = %s RETURNING *;", (transaction_id,))
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted", "transaction_id": transaction_id}