CREATE TABLE branch (
    branch_id char(5) PRIMARY KEY,
    branch_name varchar(30) ,
    location varchar(30),
    branch_phone_number char(10) ,
    status Boolean
);

CREATE TYPE etype AS ENUM('Agent','Branch Manager','Admin');
CREATE TABLE employee(
    employee_id char(5) PRIMARY KEY,
    name varchar(50),
    nic varchar(12),
    phone_number char(10),
    address varchar(255),
    date_started date,
    last_login_time timestamp,
    type etype,
    status boolean,
    branch_id char(5) REFERENCES Branch(branch_id)
);

CREATE TABLE token(
    token_id varchar(128) PRIMARY KEY,
    token_value varchar(255),
    created_time timestamp,
    last_used timestamp,
    employee_id char(5) REFERENCES Employee(employee_id)
);

CREATE TABLE authentication(
    username varchar(30) PRIMARY KEY,
    password varchar(255),
    type etype,
    employee_id char(5) REFERENCES Employee(employee_id)
);

CREATE TABLE customer(
    customer_id char(5) PRIMARY KEY,
    name varchar(50),
    nic  varchar(12),
    phone_number char(10),
    address varchar(255),
    date_of_birth date,
    email varchar(255),
    status boolean,
    employee_id char(5) REFERENCES Employee(employee_id)
);

CREATE TYPE stype AS ENUM('Children','Teen','Adult','Senior','Joint');
CREATE TABLE savingsaccount_plans(
   s_plan_id char(5) PRIMARY KEY,
   plan_name stype,
   interest_rate numeric(5,2),
   min_balance numeric(12,2)
);

CREATE TABLE savingsaccount(
    saving_account_id char(5) PRIMARY KEY,
    open_date timestamp,
    balance numeric(12,2),
    employee_id char(5) REFERENCES Employee(employee_id),
    s_plan_id char(5) REFERENCES SavingsAccount_Plans(s_plan_id),
    status boolean,
    branch_id char(5) REFERENCES Branch(branch_id)
);

CREATE TABLE fixeddeposit_plans(
   f_plan_id char(5) PRIMARY KEY ,
   months varchar(10),
   interest_rate numeric(5,2)
);

CREATE TABLE fixeddeposit(
   fixed_deposit_id char(5) PRIMARY KEY ,
   saving_account_id char(5) REFERENCES SavingsAccount(saving_account_id),
   f_plan_id char(5) REFERENCES FixedDeposit_Plans(f_plan_id),
   start_date timestamp,
   end_date timestamp,
   principal_amount numeric(12,2),
   interest_payment_type boolean,
   last_payout_date timestamp,
   status boolean
);

CREATE TABLE accountholder(
   holder_id char(5) PRIMARY KEY,
   customer_id char(5)REFERENCES Customer(customer_id),
   saving_account_id char(5) REFERENCES SavingsAccount(saving_account_id)
);

CREATE TYPE transtype AS ENUM('Interest','Withdrawal','Deposit');
CREATE TABLE transactions(
   transaction_id int AUTO_INCREMENT PRIMARY KEY,
   ref_number VARCHAR(20) UNIQUE,
   holder_id char(5) REFERENCES AccountHolder(holder_id),
   type transtype,
   amount numeric(12,2),
   timestamp timestamp,
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

-- Update Transactions
CREATE PROCEDURE make_transaction(
    IN p_customer_id char(5),
    IN p_saving_account_id char(5),
    IN p_type transtype,
    IN p_amount numeric(12,2),
    IN p_description varchar(255),
    OUT new_balance numeric(12,2)
    )
LANGUAGE plpgsql
AS $$
DECLARE current_balance numeric(12,2);
DECLARE current_holder_id char(5);
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM savingsaccount
    WHERE saving_account_id = p_saving_account_id;

    -- Get current holder ID
    SELECT holder_id INTO current_holder_id
    FROM accountholder
    JOIN savingsaccount
    USING (saving_account_id)
    WHERE accountholder.customer_id = p_customer_id AND savingsaccount.saving_account_id = p_saving_account_id;

    IF p_type = 'Deposit' THEN
        new_balance := current_balance + p_amount;
    ELSIF p_type = 'Withdrawal' THEN
        IF current_balance > p_amount THEN
            new_balance := current_balance - p_amount;
        ELSE
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
    END IF;

    -- Update balance
    UPDATE savingsaccount
    SET balance = new_balance
    WHERE saving_account_id = p_saving_account_id;

    -- Insert transaction
    INSERT INTO transactions(holder_id, amount, type, description)
    VALUES (current_holder_id, p_amount, p_type, p_description);
END;
$$;

-- Auto assign transaction reference no
CREATE SEQUENCE txn_ref_no START WITH 1 INCREMENT BY 1;
CREATE OR REPLACE FUNCTION assign_ref_no()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE prefix TEXT;
BEGIN
    IF NEW.type = 'Deposit' THEN
        prefix := 'DEP';
    ELSIF NEW.type = 'Withdrawal' THEN
        prefix := 'WDR';
    ELSIF NEW.type = 'Transfer' THEN
        prefix := 'TRF';
    ELSIF NEW.type = 'Interest' THEN
        prefix := 'INT';
    ELSE
        prefix := 'TXN';
    END IF;

    NEW.ref_no := prefix || '-' || TO_CHAR(NEW.timestamp, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('txn_ref_no')::TEXT, 5, '0');

    RETURN NEW;
END;
$$;

CREATE TRIGGER assign_ref_no_trigger
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION assign_ref_no();

-- Multiple FD per savings account validation check
CREATE PROCEDURE validate_multiple_FDS(
    IN p_customer_id char(5),
    OUT available_savings_account_id char(5)
    )
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT ah.saving_account_id
    INTO available_savings_account_id
    FROM accountholder AS ah
    LEFT JOIN fixeddeposit AS fd USING (saving_account_id)
    WHERE ah.customer_id = p_customer_id
      AND fd.fixed_deposit_id IS NULL
      AND ah.saving_account_id IN (
          SELECT saving_account_id
          FROM accountholder
          GROUP BY saving_account_id
          HAVING COUNT(*) = 1
      )
    LIMIT 1;

    IF available_savings_account_id IS NULL THEN
        RAISE EXCEPTION 'No eligible savings account found for customer %', p_customer_id;
    ELSE
        RAISE NOTICE 'Eligible savings account: %', available_savings_account_id;
    END IF;

END;
$$;

-- Auto credit interest to FD accounts
CREATE PROCEDURE credit_fd_int()
LANGUAGE plpgsql
AS $$
DECLARE rec RECORD;
DECLARE interest_amount numeric(12,2);
DECLARE duration_months integer;
BEGIN
    FOR rec IN
        SELECT fd.fixed_deposit_id,
               fd.saving_account_id,
               fd.f_plan_id,
               fd.status,
               fd.principal_amount,
               fd.start_date,
               fd.end_date,
               fd.interest_payment_type,
               fd.last_payout_date,
               fp.interest_rate,
               fp.months
        FROM fixeddeposit AS fd
        JOIN fixeddeposit_plans AS fp
        USING (f_plan_id)
        WHERE fd.status = TRUE
        AND (fd.last_payout_date IS NULL OR fd.last_payout_date < NOW() - INTERVAL '1 month')
    LOOP
        -- Calculate duration in months since last payout or start
        duration_months := EXTRACT(MONTH FROM AGE(NOW(), COALESCE(rec.last_payout_date, rec.start_date)));

        -- Calculate monthly interest amount
        interest_amount := (rec.principal_amount * (rec.interest_rate / 100)) / 12;

        IF (rec.end_date <= NOW()) THEN
            -- Maturity payout to savings account
            CALL make_transaction(
                (SELECT customer_id FROM accountholder WHERE saving_account_id = rec.saving_account_id LIMIT 1),
                rec.saving_account_id,
                'Interest',
                rec.principal_amount + (interest_amount * CAST(SPLIT_PART(rec.months, ' ', 1) AS INTEGER)),
                'FD Maturity Payout',
                new_balance
            );

            -- Close the FD
            UPDATE fixeddeposit
            SET status = FALSE
            WHERE fixed_deposit_id = rec.fixed_deposit_id;
        ELSIF (rec.interest_payment_type = TRUE AND duration_months >= 1) THEN
            -- Payout interest to savings account
            CALL make_transaction(
                (SELECT customer_id FROM accountholder WHERE saving_account_id = rec.saving_account_id LIMIT 1),
                rec.saving_account_id,
                'Interest',
                interest_amount * duration_months,
                'FD Interest Payout',
                new_balance
            );

            -- Update last_payout_date to today
            UPDATE fixeddeposit
            SET last_payout_date = NOW()
            WHERE fixed_deposit_id = rec.fixed_deposit_id;
        END IF;
    END LOOP;
END;
$$;
