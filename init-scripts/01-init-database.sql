-- ============================================================================
-- Micro Banking System - Database Initialization Script
-- ============================================================================
-- This script creates all tables, triggers, views, and sample data
-- for the Micro Banking System
-- ============================================================================

-- Drop existing database objects if they exist (for clean reinitialization)
DROP MATERIALIZED VIEW IF EXISTS vw_monthly_interest_summary_mv CASCADE;
DROP VIEW IF EXISTS vw_customer_activity CASCADE;
DROP VIEW IF EXISTS vw_agent_transactions CASCADE;
DROP VIEW IF EXISTS vw_fd_details CASCADE;
DROP VIEW IF EXISTS vw_account_summary CASCADE;
DROP VIEW IF EXISTS holder_balance_min CASCADE;
DROP VIEW IF EXISTS savings_account_with_customer CASCADE;
DROP VIEW IF EXISTS vw_active_fds CASCADE;
DROP VIEW IF EXISTS vw_account_transactions CASCADE;
DROP VIEW IF EXISTS customer_owned_accounts CASCADE;

DROP TABLE IF EXISTS Transactions CASCADE;
DROP TABLE IF EXISTS AccountHolder CASCADE;
DROP TABLE IF EXISTS FixedDeposit CASCADE;
DROP TABLE IF EXISTS FixedDeposit_Plans CASCADE;
DROP TABLE IF EXISTS SavingsAccount CASCADE;
DROP TABLE IF EXISTS SavingsAccount_Plans CASCADE;
DROP TABLE IF EXISTS Customer CASCADE;
DROP TABLE IF EXISTS Authentication CASCADE;
DROP TABLE IF EXISTS Token CASCADE;
DROP TABLE IF EXISTS Employee CASCADE;
DROP TABLE IF EXISTS Branch CASCADE;

DROP TYPE IF EXISTS transtype CASCADE;
DROP TYPE IF EXISTS stype CASCADE;
DROP TYPE IF EXISTS etype CASCADE;

DROP SEQUENCE IF EXISTS branch_seq CASCADE;
DROP SEQUENCE IF EXISTS customer_seq CASCADE;

-- ============================================================================
-- 1. CREATE CUSTOM TYPES
-- ============================================================================

-- Employee types
CREATE TYPE etype AS ENUM('Agent','Branch Manager','Admin');

-- Savings account plan types
CREATE TYPE stype AS ENUM('Children','Teen','Adult','Senior','Joint');

-- Transaction types
CREATE TYPE transtype AS ENUM('Interest','Withdrawal','Deposit');

-- ============================================================================
-- 2. CREATE SEQUENCES
-- ============================================================================

CREATE SEQUENCE branch_seq START 1;
CREATE SEQUENCE customer_seq START 1;

-- ============================================================================
-- 3. CREATE TABLES
-- ============================================================================

-- Branch Table
CREATE TABLE Branch (
    branch_id char(7) PRIMARY KEY,
    branch_name varchar(30),
    location varchar(30),
    branch_phone_number char(10),
    status Boolean
);

-- Employee Table
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

-- Token Table for JWT management
CREATE TABLE Token(
    token_id varchar(128) PRIMARY KEY,
    token_value varchar(255),
    created_time timestamp,
    last_used timestamp,
    employee_id char(10) REFERENCES Employee(employee_id)
);

-- Authentication Table
CREATE TABLE Authentication(
    username varchar(30) PRIMARY KEY,
    password varchar(255),
    type etype,
    employee_id char(10) REFERENCES Employee(employee_id)
);

-- Customer Table
CREATE TABLE Customer(
    customer_id char(10) PRIMARY KEY,
    name varchar(50),
    nic varchar(12),
    phone_number char(10),
    address varchar(255),
    date_of_birth date,
    email varchar(255),
    status boolean,
    employee_id char(10) REFERENCES Employee(employee_id)
);

-- Savings Account Plans Table
CREATE TABLE SavingsAccount_Plans(
   s_plan_id char(5) PRIMARY KEY,
   plan_name stype,
   interest_rate char(5),
   min_balance numeric(12,2)
);

-- Savings Account Table
CREATE TABLE SavingsAccount(
    saving_account_id char(10) PRIMARY KEY,
    open_date timestamp,
    balance numeric(12,2),
    employee_id char(10) REFERENCES Employee(employee_id),
    s_plan_id char(5) REFERENCES SavingsAccount_Plans(s_plan_id),
    status boolean,
    branch_id char(7) REFERENCES Branch(branch_id)
);

-- Fixed Deposit Plans Table
CREATE TABLE FixedDeposit_Plans (
    f_plan_id CHAR(5) PRIMARY KEY,
    months INT,
    interest_rate DECIMAL(5,2)
);

-- Fixed Deposit Table
CREATE TABLE FixedDeposit(
   fixed_deposit_id char(10) PRIMARY KEY,
   saving_account_id char(10) REFERENCES SavingsAccount(saving_account_id),
   f_plan_id char(5) REFERENCES FixedDeposit_Plans(f_plan_id),
   start_date timestamp,
   end_date timestamp,
   principal_amount numeric(12,2),
   interest_payment_type boolean,
   last_payout_date timestamp,
   status boolean
);

-- Account Holder Table (for joint accounts)
CREATE TABLE AccountHolder(
   holder_id char(10) PRIMARY KEY,
   customer_id char(10) REFERENCES Customer(customer_id),
   saving_account_id char(10) REFERENCES SavingsAccount(saving_account_id)
);

-- Transactions Table
CREATE TABLE Transactions(
   transaction_id int PRIMARY KEY,
   holder_id char(10) REFERENCES AccountHolder(holder_id),
   type transtype,
   amount numeric(12,2),
   timestamp timestamp,
   ref_number int,
   description varchar(255)
);

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Employee indexes
CREATE INDEX idx_employee_branch_id ON Employee(branch_id);

-- Customer indexes
CREATE INDEX idx_customer_employee_id ON Customer(employee_id);

-- Token indexes
CREATE INDEX idx_token_employee_id ON Token(employee_id);

-- AccountHolder indexes
CREATE INDEX idx_holder_customer_id ON AccountHolder(customer_id);

-- Transaction indexes
CREATE INDEX idx_transaction_holder_id ON Transactions(holder_id);

-- ============================================================================
-- 5. CREATE TRIGGER FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Branch ID auto-generation trigger
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

-- Employee ID auto-generation trigger
CREATE OR REPLACE FUNCTION set_employee_id()
RETURNS TRIGGER AS $$
DECLARE
    random_num INT;
    new_id TEXT;
BEGIN
    IF NEW.employee_id IS NULL THEN
        random_num := floor(random() * 900 + 100)::int;
        new_id := 'EMP' || random_num::text;

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

-- Customer ID auto-generation trigger
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

CREATE TRIGGER customer_id_trigger
BEFORE INSERT ON customer
FOR EACH ROW
EXECUTE FUNCTION set_customer_id();

-- Savings Account ID auto-generation trigger
CREATE OR REPLACE FUNCTION set_saving_account_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.saving_account_id IS NULL THEN
        LOOP
            new_id := lpad((floor(random() * 1e10))::text, 10, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM SavingsAccount WHERE saving_account_id = new_id);
        END LOOP;
        NEW.saving_account_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saving_account_id_trigger
BEFORE INSERT ON SavingsAccount
FOR EACH ROW
EXECUTE FUNCTION set_saving_account_id();

-- Account Holder ID auto-generation trigger
CREATE OR REPLACE FUNCTION set_holder_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.holder_id IS NULL THEN
        LOOP
            new_id := lpad((floor(random() * 1e10))::text, 10, '0');
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

-- Fixed Deposit ID auto-generation trigger
CREATE OR REPLACE FUNCTION set_fixed_deposit_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
BEGIN
    IF NEW.fixed_deposit_id IS NULL THEN
        LOOP
            new_id := lpad((floor(random() * 1e10))::text, 10, '0');
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

-- Transaction ID auto-generation trigger
CREATE OR REPLACE FUNCTION set_transaction_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id INT;
BEGIN
    IF NEW.transaction_id IS NULL THEN
        LOOP
            new_id := floor(random() * 90000 + 10000)::int;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM Transactions WHERE transaction_id = new_id);
        END LOOP;
        NEW.transaction_id := new_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_id_trigger
BEFORE INSERT ON Transactions
FOR EACH ROW
EXECUTE FUNCTION set_transaction_id();

-- Reference Number auto-generation trigger
CREATE OR REPLACE FUNCTION set_ref_number()
RETURNS TRIGGER AS $$
DECLARE
    new_ref INT;
BEGIN
    IF NEW.ref_number IS NULL THEN
        LOOP
            new_ref := floor(random() * 90000 + 10000)::int;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM Transactions WHERE ref_number = new_ref);
        END LOOP;
        NEW.ref_number := new_ref;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ref_number_trigger
BEFORE INSERT ON Transactions
FOR EACH ROW
EXECUTE FUNCTION set_ref_number();

-- ============================================================================
-- 6. CREATE STORED PROCEDURES/FUNCTIONS
-- ============================================================================

-- Function to get accounts pending monthly interest
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

-- ============================================================================
-- 7. INSERT INITIAL DATA
-- ============================================================================

-- Insert Fixed Deposit Plans
INSERT INTO FixedDeposit_Plans (f_plan_id, months, interest_rate)
VALUES
('FD001', 6, 13.00),
('FD002', 12, 14.00),
('FD003', 36, 15.00);

-- Insert Savings Account Plans
INSERT INTO SavingsAccount_Plans (s_plan_id, plan_name, interest_rate, min_balance) 
VALUES
('CH001', 'Children', '12', 0.00),
('TE001', 'Teen', '11', 500.00),
('AD001', 'Adult', '10', 1000.00),
('SE001', 'Senior', '13', 1000.00),
('JO001', 'Joint', '7', 5000.00);

-- Insert Sample Branches
INSERT INTO Branch (branch_id, branch_name, location, branch_phone_number, status) 
VALUES
('BT001', 'Main Branch', 'Colombo 01', '0112345678', true),
('BT002', 'Kandy Branch', 'Kandy', '0812345678', true),
('BT003', 'Galle Branch', 'Galle', '0912345678', true);

-- Insert Sample Employees
INSERT INTO Employee (employee_id, name, nic, phone_number, address, date_started, type, status, branch_id)
VALUES
('EMP101', 'John Admin', '199012345678', '0771234567', '123 Admin St, Colombo', '2020-01-01', 'Admin', true, 'BT001'),
('EMP102', 'Jane Manager', '198523456789', '0772345678', '456 Manager Ave, Colombo', '2020-02-01', 'Branch Manager', true, 'BT001'),
('EMP103', 'Bob Agent', '199134567890', '0773456789', '789 Agent Rd, Colombo', '2020-03-01', 'Agent', true, 'BT001'),
('EMP104', 'Alice Manager', '198745678901', '0774567890', '321 Manager St, Kandy', '2020-04-01', 'Branch Manager', true, 'BT002'),
('EMP105', 'Charlie Agent', '199256789012', '0775678901', '654 Agent Ave, Kandy', '2020-05-01', 'Agent', true, 'BT002');

-- Insert Sample Authentication Records (admin password is 'admin123', others are 'password123')
INSERT INTO Authentication (username, password, type, employee_id)
VALUES
('admin', '$2b$12$uOcY6MuMJ9PlfttVqa0.VOduxLUldCsxvrvBV8i8N3wKdXCaTbGv2', 'Admin', 'EMP101'),
('manager1', '$2b$12$A4lBdnZXEa2UPSNYi4T0luz/WLCfKEdTLFM.G9v0e8frnnwY8wqX2', 'Branch Manager', 'EMP102'),
('agent1', '$2b$12$utBX6P3cdB4RxoDcbJ.DVu6h6tpn31O7fsPOWykLAB6bmR.9R8/02', 'Agent', 'EMP103'),
('manager2', '$2b$12$TgaXrbwzbKxL9gqxRoJfUu002EWohCdMPlUb5a2PapKDsdLKl.mVy', 'Branch Manager', 'EMP104'),
('agent2', '$2b$12$/2KZ8a1Qy9E8qlFW/AKldOBfiJRk5QgZeUGODKSpDkhpkfmggDfpm', 'Agent', 'EMP105');

-- Insert Sample Customers
INSERT INTO Customer (customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id)
VALUES
('CUST001', 'David Customer', '199087654321', '0771111111', '111 Customer St, Colombo', '1990-06-15', 'david@email.com', true, 'EMP103'),
('CUST002', 'Emma Client', '199198765432', '0772222222', '222 Client Ave, Colombo', '1991-08-20', 'emma@email.com', true, 'EMP103'),
('CUST003', 'Frank User', '198909876543', '0773333333', '333 User Rd, Kandy', '1989-12-10', 'frank@email.com', true, 'EMP105'),
('CUST004', 'Grace Member', '199210987654', '0774444444', '444 Member St, Kandy', '1992-03-25', 'grace@email.com', true, 'EMP105'),
('CUST005', 'Henry Client', '198721098765', '0775555555', '555 Client Ave, Galle', '1987-09-30', 'henry@email.com', true, 'EMP103');

-- ============================================================================
-- 8. CREATE VIEWS
-- ============================================================================

-- Customer Owned Accounts View
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

-- Account Transactions View
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

-- Active Fixed Deposits View
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

-- Savings Account with Customer Details View
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

-- Holder Balance and Minimum View
CREATE OR REPLACE VIEW holder_balance_min AS
SELECT
    ah.holder_id,
    sa.saving_account_id,
    sa.balance,
    sp.min_balance
FROM AccountHolder ah
JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
JOIN SavingsAccount_Plans sp ON sa.s_plan_id = sp.s_plan_id;

-- Enhanced Agent Transaction Summary with Branch Info
CREATE OR REPLACE VIEW vw_agent_transactions AS
SELECT 
    e.employee_id,
    e.name AS agent_name,
    e.branch_id,
    b.branch_name,
    e.type as employee_type,
    e.status as employee_status,
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    SUM(t.amount) AS total_value,
    COUNT(DISTINCT c.customer_id) AS total_customers,
    COUNT(DISTINCT sa.saving_account_id) AS total_accounts
FROM Employee e
LEFT JOIN Branch b ON e.branch_id = b.branch_id
LEFT JOIN Customer c ON e.employee_id = c.employee_id
LEFT JOIN AccountHolder ah ON c.customer_id = ah.customer_id
LEFT JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
LEFT JOIN Transactions t ON ah.holder_id = t.holder_id
WHERE e.type = 'Agent'
GROUP BY e.employee_id, e.name, e.branch_id, b.branch_name, e.type, e.status;

-- Enhanced Customer Activity Summary with Complete Details
CREATE OR REPLACE VIEW vw_customer_activity AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    c.nic AS customer_nic,
    c.phone_number,
    c.email,
    c.date_of_birth,
    c.status AS customer_status,
    e.employee_id AS agent_id,
    e.name AS agent_name,
    e.branch_id,
    b.branch_name,
    COUNT(DISTINCT ah.saving_account_id) AS total_accounts,
    SUM(sa.balance) AS current_total_balance,
    SUM(CASE WHEN t.type = 'Deposit' THEN t.amount ELSE 0 END) AS total_deposits,
    SUM(CASE WHEN t.type = 'Withdrawal' THEN t.amount ELSE 0 END) AS total_withdrawals,
    SUM(CASE WHEN t.type = 'Deposit' THEN t.amount
             WHEN t.type = 'Withdrawal' THEN -t.amount
             ELSE 0 END) AS net_change,
    COUNT(DISTINCT CASE WHEN fd.status = TRUE THEN fd.fixed_deposit_id END) AS active_fds,
    SUM(CASE WHEN fd.status = TRUE THEN fd.principal_amount ELSE 0 END) AS total_fd_amount
FROM Customer c
JOIN Employee e ON c.employee_id = e.employee_id
JOIN Branch b ON e.branch_id = b.branch_id
LEFT JOIN AccountHolder ah ON c.customer_id = ah.customer_id
LEFT JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
LEFT JOIN Transactions t ON ah.holder_id = t.holder_id
LEFT JOIN FixedDeposit fd ON sa.saving_account_id = fd.saving_account_id
GROUP BY c.customer_id, c.name, c.nic, c.phone_number, c.email, c.date_of_birth, 
         c.status, e.employee_id, e.name, e.branch_id, b.branch_name;

-- ============================================================================
-- 9. MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Enhanced Monthly Interest Summary with Branch and Customer Info
CREATE MATERIALIZED VIEW vw_monthly_interest_summary_mv AS
SELECT 
    sp.plan_name,
    sa.saving_account_id,
    sa.branch_id,
    b.branch_name,
    c.customer_id,
    c.name AS customer_name,
    c.employee_id AS agent_id,
    DATE_TRUNC('month', t.timestamp) AS month,
    SUM(t.amount) AS monthly_interest,
    COUNT(t.transaction_id) AS interest_payment_count
FROM Transactions t
JOIN AccountHolder ah ON t.holder_id = ah.holder_id
JOIN SavingsAccount sa ON ah.saving_account_id = sa.saving_account_id
JOIN SavingsAccount_Plans sp ON sa.s_plan_id = sp.s_plan_id
JOIN Customer c ON ah.customer_id = c.customer_id
JOIN Branch b ON sa.branch_id = b.branch_id
WHERE t.type = 'Interest'
GROUP BY sp.plan_name, sa.saving_account_id, sa.branch_id, b.branch_name, 
         c.customer_id, c.name, c.employee_id, DATE_TRUNC('month', t.timestamp)
WITH DATA;

-- Enhanced Account Transaction Summary View
CREATE OR REPLACE VIEW vw_account_summary AS
SELECT 
    sa.saving_account_id,
    sa.balance AS current_balance,
    sa.open_date,
    sa.status AS account_status,
    sa.branch_id,
    b.branch_name,
    sp.plan_name,
    sp.interest_rate,
    sp.min_balance,
    c.customer_id,
    c.name AS customer_name,
    c.nic AS customer_nic,
    e.employee_id AS agent_id,
    e.name AS agent_name,
    COUNT(DISTINCT t.transaction_id) AS total_transactions,
    SUM(CASE WHEN t.type = 'Deposit' THEN t.amount ELSE 0 END) AS total_deposits,
    SUM(CASE WHEN t.type = 'Withdrawal' THEN t.amount ELSE 0 END) AS total_withdrawals,
    SUM(CASE WHEN t.type = 'Interest' THEN t.amount ELSE 0 END) AS total_interest,
    MAX(t.timestamp) AS last_transaction_date
FROM SavingsAccount sa
JOIN SavingsAccount_Plans sp ON sa.s_plan_id = sp.s_plan_id
JOIN Branch b ON sa.branch_id = b.branch_id
JOIN AccountHolder ah ON sa.saving_account_id = ah.saving_account_id
JOIN Customer c ON ah.customer_id = c.customer_id
JOIN Employee e ON c.employee_id = e.employee_id
LEFT JOIN Transactions t ON ah.holder_id = t.holder_id
GROUP BY sa.saving_account_id, sa.balance, sa.open_date, sa.status, sa.branch_id,
         b.branch_name, sp.plan_name, sp.interest_rate, sp.min_balance,
         c.customer_id, c.name, c.nic, e.employee_id, e.name;

-- Enhanced Fixed Deposit View with Complete Details
CREATE OR REPLACE VIEW vw_fd_details AS
SELECT 
    fd.fixed_deposit_id,
    fd.saving_account_id,
    fd.start_date,
    fd.end_date,
    fd.principal_amount,
    fd.interest_payment_type,
    fd.last_payout_date,
    fd.status,
    CASE 
        WHEN fd.interest_payment_type = TRUE THEN 
            COALESCE(fd.last_payout_date, fd.start_date) + INTERVAL '1 month'
        ELSE fd.end_date
    END AS next_payout_date,
    fdp.f_plan_id,
    fdp.months AS plan_months,
    fdp.interest_rate,
    (fd.principal_amount * fdp.interest_rate / 100) AS total_interest,
    sa.branch_id,
    b.branch_name,
    c.customer_id,
    c.name AS customer_name,
    c.nic AS customer_nic,
    e.employee_id AS agent_id,
    e.name AS agent_name,
    CASE 
        WHEN fd.end_date < CURRENT_DATE THEN 'Matured'
        WHEN fd.interest_payment_type = TRUE 
             AND COALESCE(fd.last_payout_date, fd.start_date) + INTERVAL '1 month' < CURRENT_DATE 
             THEN 'Payout Pending'
        ELSE 'Active'
    END AS fd_status
FROM FixedDeposit fd
JOIN FixedDeposit_Plans fdp ON fd.f_plan_id = fdp.f_plan_id
JOIN SavingsAccount sa ON fd.saving_account_id = sa.saving_account_id
JOIN Branch b ON sa.branch_id = b.branch_id
JOIN AccountHolder ah ON sa.saving_account_id = ah.saving_account_id
JOIN Customer c ON ah.customer_id = c.customer_id
JOIN Employee e ON c.employee_id = e.employee_id
WHERE fd.status = TRUE;

-- Create indexes for the materialized view
CREATE INDEX idx_monthly_interest_mv_branch ON vw_monthly_interest_summary_mv(branch_id);
CREATE INDEX idx_monthly_interest_mv_agent ON vw_monthly_interest_summary_mv(agent_id);

-- ============================================================================
-- 10. COMPLETION MESSAGE
-- ============================================================================

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Micro Banking System Database Initialized Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created Objects:';
    RAISE NOTICE '- 11 Tables with relationships';
    RAISE NOTICE '- 3 Custom Types (etype, stype, transtype)';
    RAISE NOTICE '- 8 Auto-ID generation triggers';
    RAISE NOTICE '- 6 Indexes for performance';
    RAISE NOTICE '- 8 Regular views';
    RAISE NOTICE '- 1 Materialized view';
    RAISE NOTICE '- 1 Stored function';
    RAISE NOTICE '- Sample data for testing';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Default Login Credentials:';
    RAISE NOTICE 'Admin: admin / password123';
    RAISE NOTICE 'Manager: manager1 / password123';
    RAISE NOTICE 'Agent: agent1 / password123';
    RAISE NOTICE '========================================';
END $$;