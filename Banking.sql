CREATE TABLE Branch (
    branch_id char(7) PRIMARY KEY,
    branch_name varchar(30) ,
    location varchar(30),
    branch_phone_number char(10) ,
    status Boolean 
);
CREATE TYPE etype AS ENUM('Agent','Branch Manager','Admin');
CREATE TABLE Employee(
    employee_id char(10) PRIMARY KEY,
    name varchar(50),
    nic varchar(12),
    phone_number char(10),
    address varchar(255),
    date_started date,
    last_login_time timestamp,
    type etype,
    status boolean,
    branch_id char(7) REFERENCES Branch(branch_id)    
);


CREATE TABLE Token(
    token_id varchar(128) PRIMARY KEY,
    token_value varchar(255),
    created_time timestamp,
    last_used timestamp,
    employee_id char(10) REFERENCES Employee(employee_id)
);

CREATE TABLE Authentication(
    username varchar(30) PRIMARY KEY,
    password varchar(255),
    type etype,
    employee_id char(10) REFERENCES Employee(employee_id)
);

CREATE TABLE Customer(
    customer_id char(10) PRIMARY KEY,
    name varchar(50),
    nic  varchar(12),
    phone_number char(10),
    address varchar(255),
    date_of_birth date,
    email varchar(255),
    status boolean,
    employee_id char(10) REFERENCES Employee(employee_id)
);
CREATE TYPE stype AS ENUM('Children','Teen','Adult','Senior','Joint');
CREATE TABLE SavingsAccount_Plans(
   s_plan_id char(5) PRIMARY KEY,
   plan_name stype,
   interest_rate char(5),
   min_balance numeric(12,2)
);


CREATE TABLE SavingsAccount(
    saving_account_id char(10) PRIMARY KEY,
    open_date timestamp,
    balance numeric(12,2),
    employee_id char(10) REFERENCES Employee(employee_id),
    s_plan_id char(5) REFERENCES SavingsAccount_Plans(s_plan_id),
    status boolean,
    branch_id char(7) REFERENCES Branch(branch_id)
);

CREATE TABLE FixedDeposit_Plans (
    f_plan_id CHAR(5) PRIMARY KEY,
    months INT,                 -- now stores numeric month count (e.g., 6, 12, 36)
    interest_rate DECIMAL(5,2)  -- better for percentages than CHAR(5)
);

CREATE TABLE FixedDeposit(
   fixed_deposit_id char(10) PRIMARY KEY ,
   saving_account_id char(10) REFERENCES SavingsAccount(saving_account_id),
   f_plan_id char(5) REFERENCES FixedDeposit_Plans(f_plan_id),
   start_date timestamp,
   end_date timestamp,
   principal_amount numeric(12,2),
   interest_payment_type boolean,
   last_payout_date timestamp,
   status boolean
);

INSERT INTO FixedDeposit_Plans (f_plan_id, months, interest_rate)
VALUES
('FD001', 6, 13.00),
('FD002', 12, 14.00),
('FD003', 36, 15.00);

CREATE TABLE AccountHolder(
   holder_id char(10) PRIMARY KEY,
   customer_id char(10)REFERENCES Customer(customer_id),
   saving_account_id char(10) REFERENCES SavingsAccount(saving_account_id)
);

CREATE TYPE transtype AS ENUM('Interest','Withdrawal','Deposit');
CREATE TABLE Transactions(
   transaction_id int PRIMARY KEY,
   holder_id char(10) REFERENCES AccountHolder(holder_id),
   type transtype,
   amount numeric(12,2),
   timestamp timestamp,
   ref_number int,
   description varchar(255));

-- Employee
CREATE INDEX idx_employee_branch_id ON Employee(branch_id);

-- Customer
CREATE INDEX idx_customer_employee_id ON Customer(employee_id);

-- Token
CREATE INDEX idx_token_employee_id ON Token(employee_id);

-- AccountHolder
CREATE INDEX idx_holder_customer_id ON AccountHolder(customer_id);

-- Transactions
CREATE INDEX idx_transaction_holder_id ON Transactions(holder_id);


Triggers:

To make a branch id
CREATE SEQUENCE branch_seq START 1;


CREATE OR REPLACE FUNCTION set_branch_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.branch_id IS NULL THEN
        NEW.branch_id := 'BT' || LPAD(nextval('branch_seq')::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER branch_id_trigger
BEFORE INSERT ON branch
FOR EACH ROW
EXECUTE FUNCTION set_branch_id();

to make employee id

CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
DECLARE
    random_num INT;
    new_id TEXT;
BEGIN
    IF NEW.employee_id IS NULL THEN
        -- Generate a random 3-digit number between 100 and 999
        random_num := floor(random() * 900 + 100)::int;
        new_id := 'EMP' || random_num::text;

        -- Ensure uniqueness (repeat until unique)
        WHILE EXISTS (SELECT 1 FROM employee WHERE employee_id = new_id) LOOP
            random_num := floor(random() * 900 + 100)::int;
            new_id := 'EMP' || random_num::text;
        END LOOP;

        NEW.employee_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER employee_id_trigger
BEFORE INSERT ON employee
FOR EACH ROW
EXECUTE FUNCTION set_employee_id();


for customer id creation
-- 1. Create a sequence for customer numbers
CREATE SEQUENCE customer_seq START 1;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION set_customer_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.customer_id IS NULL THEN
        new_id := 'CUST' || LPAD(nextval('customer_seq')::text, 3, '0');
        NEW.customer_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger on the customer table
CREATE TRIGGER customer_id_trigger
BEFORE INSERT ON customer
FOR EACH ROW
EXECUTE FUNCTION set_customer_id();

populate table
INSERT INTO SavingsAccount_Plans (s_plan_id, plan_name, interest_rate, min_balance) VALUES
('CH001', 'Children', '12', 0.00),
('TE001', 'Teen', '11', 500.00),
('AD001', 'Adult', '10', 1000.00),
('SE001', 'Senior', '13', 1000.00),
('JO001', 'Joint', '7', 5000.00);


-- Trigger to generate unique 10-digit saving_account_id
CREATE OR REPLACE FUNCTION set_saving_account_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.saving_account_id IS NULL THEN
        LOOP
            -- Generate a random 10-digit number as text
            new_id := lpad((floor(random() * 1e10))::text, 10, '0');
            -- Ensure uniqueness
            EXIT WHEN NOT EXISTS (SELECT 1 FROM SavingsAccount WHERE saving_account_id = new_id);
        END LOOP;
        NEW.saving_account_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the SavingsAccount table
CREATE TRIGGER saving_account_id_trigger
BEFORE INSERT ON SavingsAccount
FOR EACH ROW
EXECUTE FUNCTION set_saving_account_id();



-- Trigger to generate unique 10-digit holder_id
CREATE OR REPLACE FUNCTION set_holder_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.holder_id IS NULL THEN
        LOOP
            -- Generate a random 10-digit number as text
            new_id := lpad((floor(random() * 1e10))::text, 10, '0');
            -- Ensure uniqueness
            EXIT WHEN NOT EXISTS (SELECT 1 FROM AccountHolder WHERE holder_id = new_id);
        END LOOP;
        NEW.holder_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER holder_id_trigger
BEFORE INSERT ON AccountHolder
FOR EACH ROW
EXECUTE FUNCTION set_holder_id();



-- Trigger to generate unique 10-digit fixed_deposit_id
CREATE OR REPLACE FUNCTION set_fixed_deposit_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.fixed_deposit_id IS NULL THEN
        LOOP
            -- Generate a random 10-digit number as text
            new_id := lpad((floor(random() * 1e10))::text, 10, '0');
            -- Ensure uniqueness
            EXIT WHEN NOT EXISTS (SELECT 1 FROM FixedDeposit WHERE fixed_deposit_id = new_id);
        END LOOP;
        NEW.fixed_deposit_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fixed_deposit_id_trigger
BEFORE INSERT ON FixedDeposit
FOR EACH ROW
EXECUTE FUNCTION set_fixed_deposit_id();



-- 1. Create the trigger to make unique 10 digit transaction id
CREATE OR REPLACE FUNCTION set_transaction_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id INT;
BEGIN
    IF NEW.transaction_id IS NULL THEN
        LOOP
            -- Generate a random 5-digit integer (from 10000 to 99999)
            new_id := floor(random() * 90000 + 10000)::int;
            -- Ensure uniqueness
            EXIT WHEN NOT EXISTS (SELECT 1 FROM Transactions WHERE transaction_id = new_id);
        END LOOP;
        NEW.transaction_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the Transactions table
CREATE TRIGGER transaction_id_trigger
BEFORE INSERT ON Transactions
FOR EACH ROW
EXECUTE FUNCTION set_transaction_id();


-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION set_ref_number()
RETURNS TRIGGER AS $$
DECLARE
    new_ref INT;
BEGIN
    IF NEW.ref_number IS NULL THEN
        LOOP
            -- Generate a random 5-digit integer (from 10000 to 99999)
            new_ref := floor(random() * 90000 + 10000)::int;
            -- Ensure uniqueness
            EXIT WHEN NOT EXISTS (SELECT 1 FROM Transactions WHERE ref_number = new_ref);
        END LOOP;
        NEW.ref_number := new_ref;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the Transactions table
CREATE TRIGGER ref_number_trigger
BEFORE INSERT ON Transactions
FOR EACH ROW
EXECUTE FUNCTION set_ref_number();


CREATE OR REPLACE FUNCTION get_accounts_pending_monthly_interest(month INT, year INT)
RETURNS TABLE (
    saving_account_id CHAR(10),
    balance NUMERIC(12,2),
    open_date TIMESTAMP,
    interest_rate CHAR(5),
    plan_name STYPE,
    min_balance NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT sa.saving_account_id, sa.balance, sa.open_date,
           sap.interest_rate, sap.plan_name, sap.min_balance
    FROM SavingsAccount sa
    JOIN SavingsAccount_Plans sap ON sa.s_plan_id = sap.s_plan_id
    WHERE sa.status = true 
      AND sa.balance >= sap.min_balance
      AND NOT EXISTS (
          SELECT 1 FROM Transactions t
          JOIN AccountHolder ah ON t.holder_id = ah.holder_id
          WHERE ah.saving_account_id = sa.saving_account_id
            AND t.type = 'Interest'
            AND t.description LIKE 'Monthly savings account interest%'
            AND EXTRACT(MONTH FROM t.timestamp) = month
            AND EXTRACT(YEAR FROM t.timestamp) = year
      );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW customer_owned_accounts AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    sa.saving_account_id,
    sa.balance,
    sa.status AS account_status,
    sp.plan_name,
    sa.open_date
FROM Customer c
JOIN AccountHolder ah ON c.customer_id = ah.customer_id
JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
JOIN SavingsAccount_Plans sp ON sa.s_plan_id = sp.s_plan_id;

--  Account transactions
CREATE OR REPLACE VIEW vw_account_transactions AS
SELECT 
    sa.saving_account_id,
    t.transaction_id,
    t.type,
    t.amount,
    t.timestamp,
    t.ref_number,
    t.description
FROM Transactions t
JOIN AccountHolder ah ON t.holder_id = ah.holder_id
JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id;

--  Active Fixed Deposits
CREATE OR REPLACE VIEW vw_active_fds AS
SELECT 
    fd.fixed_deposit_id,
    fd.saving_account_id,
    fd.f_plan_id,
    fd.start_date,
    fd.end_date,
    fd.principal_amount,
    fd.interest_payment_type,
    fd.last_payout_date,
    fd.status
FROM FixedDeposit fd
WHERE fd.status = TRUE;

--  Joint Accounts & Holders
CREATE MATERIALIZED VIEW joint_accounts_holders_mv AS
SELECT 
    sa.saving_account_id,
    sa.balance,
    sa.status AS account_status,
    string_agg(c.name, ', ') AS joint_customers
FROM SavingsAccount sa
JOIN AccountHolder ah ON sa.saving_account_id = ah.saving_account_id
JOIN Customer c ON ah.customer_id = c.customer_id
GROUP BY sa.saving_account_id, sa.balance, sa.status
HAVING COUNT(ah.customer_id) > 1
WITH DATA;



-- Agent Transaction Summary
CREATE MATERIALIZED VIEW vw_agent_transactions_mv AS
SELECT 
    e.employee_id,
    e.name AS agent_name,
    COUNT(t.transaction_id) AS total_transactions,
    SUM(t.amount) AS total_value
FROM Employee e
JOIN Customer c ON e.employee_id = c.employee_id
JOIN AccountHolder ah ON c.customer_id = ah.customer_id
JOIN Transactions t ON ah.holder_id = t.holder_id
GROUP BY e.employee_id, e.name
WITH DATA;



-- Monthly Interest Summary
CREATE MATERIALIZED VIEW vw_monthly_interest_summary_mv AS
SELECT 
    sp.plan_name,
    sa.saving_account_id,
    DATE_TRUNC('month', t.timestamp) AS month,
    SUM(t.amount) AS monthly_interest
FROM Transactions t
JOIN AccountHolder ah ON t.holder_id = ah.holder_id
JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
JOIN SavingsAccount_Plans sp ON sa.s_plan_id = sp.s_plan_id
WHERE t.type = 'Interest'
GROUP BY sp.plan_name, sa.saving_account_id, DATE_TRUNC('month', t.timestamp)
WITH DATA;




-- Customer Activity Summary
CREATE MATERIALIZED VIEW vw_customer_activity_mv AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    SUM(CASE WHEN t.type = 'Deposit' THEN t.amount ELSE 0 END) AS total_deposits,
    SUM(CASE WHEN t.type = 'Withdrawal' THEN t.amount ELSE 0 END) AS total_withdrawals,
    SUM(CASE WHEN t.type = 'Deposit' THEN t.amount
             WHEN t.type = 'Withdrawal' THEN -t.amount
             ELSE 0 END) AS net_change
FROM Customer c
JOIN AccountHolder ah ON c.customer_id = ah.customer_id
JOIN Transactions t ON ah.holder_id = t.holder_id
GROUP BY c.customer_id, c.name;

--search saving accounts get details
CREATE OR REPLACE VIEW savings_account_with_customer AS
SELECT
    sa.saving_account_id,
    sa.open_date,
    sa.balance,
    sa.employee_id,
    sa.s_plan_id,
    sa.status,
    sa.branch_id,
    c.customer_id,
    c.name AS customer_name,
    c.nic AS customer_nic
FROM SavingsAccount sa
JOIN AccountHolder ah ON sa.saving_account_id = ah.saving_account_id
JOIN Customer c ON ah.customer_id = c.customer_id;

CREATE INDEX idx_customer_activity_mv_id ON vw_customer_activity_mv(customer_id);

CREATE OR REPLACE VIEW holder_balance_min AS
SELECT
    ah.holder_id,
    sa.saving_account_id,
    sa.balance,
    sp.min_balance
FROM AccountHolder ah
JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
JOIN SavingsAccount_Plans sp ON sa.s_plan_id = sp.s_plan_id;