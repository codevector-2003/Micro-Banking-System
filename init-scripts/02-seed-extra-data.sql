-- ============================================================================
-- Micro-Banking-System: Extra seed data with transactions
-- ============================================================================
-- Populates customers, savings accounts, holders, fixed deposits, and transactions
-- to generate meaningful materialized view data
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) CUSTOMERS (CUST006..CUST015)
-- ============================================================================
INSERT INTO Customer (customer_id, name, nic, phone_number, address, date_of_birth, email, status, employee_id) VALUES
('CUST006','Ishan Perera','199301010001','0711000001','10 Lake Rd, Colombo','1993-01-01','ishan@example.com',true,'EMP103'),
('CUST007','Nimali Silva','199407020002','0711000002','22 Temple Rd, Colombo','1994-07-02','nimali@example.com',true,'EMP103'),
('CUST008','Kasun Bandara','198812120003','0711000003','5 Rose Ave, Kandy','1988-12-12','kasun@example.com',true,'EMP105'),
('CUST009','Tharindu Jayasuriya','199206150004','0711000004','18 Hill St, Kandy','1992-06-15','tharindu@example.com',true,'EMP105'),
('CUST010','Dilini Wickramasinghe','199511230005','0711000005','45 Sea View, Galle','1995-11-23','dilini@example.com',true,'EMP103'),
('CUST011','Sahan Madushan','198706300006','0711000006','7 Palm Grove, Colombo','1987-06-30','sahan@example.com',true,'EMP103'),
('CUST012','Ruwani Karunarathne','199008080007','0711000007','12 Queen St, Kandy','1990-08-08','ruwani@example.com',true,'EMP105'),
('CUST013','Malith Gunasekara','198311040008','0711000008','3 Station Rd, Galle','1983-11-04','malith@example.com',true,'EMP105'),
('CUST014','Amaya Dissanayake','199902140009','0711000009','9 Green Park, Colombo','1999-02-14','amaya@example.com',true,'EMP103'),
('CUST015','Shehan Fonseka','199105050010','0711000010','11 Lake Side, Colombo','1991-05-05','shehan@example.com',true,'EMP103')
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================================================
-- 2) SAVINGS ACCOUNTS (10 individual + 1 joint)
-- ============================================================================
INSERT INTO SavingsAccount (saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id) VALUES
('1000000001','2024-01-15 10:00:00', 25000.00,'EMP103','AD001',true,'BT001'),
('1000000002','2024-02-01 10:00:00',  5000.00,'EMP103','TE001',true,'BT001'),
('1000000003','2024-03-10 10:00:00', 75000.00,'EMP105','AD001',true,'BT002'),
('1000000004','2024-03-15 10:00:00', 12000.00,'EMP105','TE001',true,'BT002'),
('1000000005','2024-04-05 10:00:00',100000.00,'EMP103','SE001',true,'BT001'),
('1000000006','2024-04-20 10:00:00',  8000.00,'EMP103','CH001',true,'BT001'),
('1000000007','2024-05-01 10:00:00', 60000.00,'EMP105','AD001',true,'BT002'),
('1000000008','2024-05-10 10:00:00',  5200.00,'EMP105','TE001',true,'BT002'),
('1000000009','2024-05-20 10:00:00', 30000.00,'EMP103','AD001',true,'BT001'),
('1000000010','2024-06-01 10:00:00', 45000.00,'EMP103','AD001',true,'BT001'),
-- Joint account (plan JO001) owned by CUST014 and CUST015
('1000000011','2024-06-10 10:00:00', 70000.00,'EMP103','JO001',true,'BT001')
ON CONFLICT (saving_account_id) DO NOTHING;

-- ============================================================================
-- 3) ACCOUNT HOLDERS (map customers to accounts; include joint holders)
-- ============================================================================
INSERT INTO AccountHolder (holder_id, customer_id, saving_account_id) VALUES
('2000000001','CUST006','1000000001'),
('2000000002','CUST007','1000000002'),
('2000000003','CUST008','1000000003'),
('2000000004','CUST009','1000000004'),
('2000000005','CUST010','1000000005'),
('2000000006','CUST011','1000000006'),
('2000000007','CUST012','1000000007'),
('2000000008','CUST013','1000000008'),
('2000000009','CUST014','1000000009'),
('2000000010','CUST015','1000000010'),
-- Joint account holders
('2000000011','CUST014','1000000011'),
('2000000012','CUST015','1000000011')
ON CONFLICT (holder_id) DO NOTHING;

-- ============================================================================
-- 4) FIXED DEPOSITS
-- ============================================================================
INSERT INTO FixedDeposit (fixed_deposit_id, saving_account_id, f_plan_id, start_date, end_date, principal_amount, interest_payment_type, last_payout_date, status) VALUES
('3000000001','1000000001','FD001','2024-06-15','2024-12-15', 50000.00, true ,'2024-09-15', true),
('3000000002','1000000005','FD002','2024-01-01','2025-01-01',150000.00, false, NULL       , true),
('3000000003','1000000007','FD003','2023-07-01','2026-07-01',200000.00, true ,'2025-09-01', true),
('3000000004','1000000011','FD001','2025-01-01','2025-07-01',100000.00, true , NULL       , true)
ON CONFLICT (fixed_deposit_id) DO NOTHING;

-- ============================================================================
-- 5) TRANSACTIONS
-- ============================================================================
-- Strategy: Create realistic transaction history over 6+ months
-- - Initial deposits (account opening)
-- - Monthly deposits/withdrawals
-- - Monthly interest payments (realistic for accounts meeting min balance)
-- - Varying amounts and frequencies per account type
-- ============================================================================

-- Account 1000000001 (CUST006, Adult, opened 2024-01-15)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000001','Deposit', 20000.00,'2024-01-15 10:30:00','Initial deposit'),
('2000000001','Deposit',  5000.00,'2024-02-10 14:20:00','Monthly savings'),
('2000000001','Interest',   166.67,'2024-02-28 23:59:00','Monthly savings account interest for January 2024'),
('2000000001','Withdrawal', 3000.00,'2024-03-05 11:15:00','ATM withdrawal'),
('2000000001','Interest',   183.33,'2024-03-31 23:59:00','Monthly savings account interest for February 2024'),
('2000000001','Deposit',  7000.00,'2024-04-12 09:45:00','Salary deposit'),
('2000000001','Interest',   191.67,'2024-04-30 23:59:00','Monthly savings account interest for March 2024'),
('2000000001','Withdrawal', 5000.00,'2024-05-18 16:30:00','Personal expense'),
('2000000001','Interest',   195.83,'2024-05-31 23:59:00','Monthly savings account interest for April 2024'),
('2000000001','Deposit',  3000.00,'2024-06-22 10:10:00','Cash deposit'),
('2000000001','Interest',   191.67,'2024-06-30 23:59:00','Monthly savings account interest for May 2024');

-- Account 1000000002 (CUST007, Teen, opened 2024-02-01)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000002','Deposit',  3000.00,'2024-02-01 11:00:00','Initial deposit'),
('2000000002','Deposit',  1500.00,'2024-03-05 14:30:00','Birthday gift'),
('2000000002','Interest',    22.92,'2024-03-31 23:59:00','Monthly savings account interest for February 2024'),
('2000000002','Deposit',   800.00,'2024-04-15 09:20:00','Allowance'),
('2000000002','Interest',    41.25,'2024-04-30 23:59:00','Monthly savings account interest for March 2024'),
('2000000002','Withdrawal', 500.00,'2024-05-10 13:45:00','Shopping'),
('2000000002','Interest',    46.67,'2024-05-31 23:59:00','Monthly savings account interest for April 2024'),
('2000000002','Deposit',   600.00,'2024-06-20 10:30:00','Part-time job'),
('2000000002','Interest',    44.58,'2024-06-30 23:59:00','Monthly savings account interest for May 2024');

-- Account 1000000003 (CUST008, Adult, opened 2024-03-10)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000003','Deposit', 50000.00,'2024-03-10 10:00:00','Initial deposit'),
('2000000003','Deposit', 20000.00,'2024-04-05 11:30:00','Business income'),
('2000000003','Interest',   416.67,'2024-04-30 23:59:00','Monthly savings account interest for March 2024'),
('2000000003','Deposit', 15000.00,'2024-05-12 15:20:00','Investment return'),
('2000000003','Interest',   583.33,'2024-05-31 23:59:00','Monthly savings account interest for April 2024'),
('2000000003','Withdrawal',10000.00,'2024-06-08 14:10:00','Equipment purchase'),
('2000000003','Interest',   708.33,'2024-06-30 23:59:00','Monthly savings account interest for May 2024');

-- Account 1000000004 (CUST009, Teen, opened 2024-03-15)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000004','Deposit',  8000.00,'2024-03-15 12:00:00','Initial deposit'),
('2000000004','Deposit',  2000.00,'2024-04-20 10:15:00','Monthly savings'),
('2000000004','Interest',    73.33,'2024-04-30 23:59:00','Monthly savings account interest for March 2024'),
('2000000004','Withdrawal', 1500.00,'2024-05-25 16:45:00','School fees'),
('2000000004','Interest',    91.67,'2024-05-31 23:59:00','Monthly savings account interest for April 2024'),
('2000000004','Deposit',  3000.00,'2024-06-18 09:30:00','Freelance income'),
('2000000004','Interest',    95.42,'2024-06-30 23:59:00','Monthly savings account interest for May 2024');

-- Account 1000000005 (CUST010, Senior, opened 2024-04-05)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000005','Deposit', 80000.00,'2024-04-05 10:30:00','Initial deposit'),
('2000000005','Deposit', 15000.00,'2024-05-10 11:00:00','Pension deposit'),
('2000000005','Interest',   866.67,'2024-05-31 23:59:00','Monthly savings account interest for April 2024'),
('2000000005','Withdrawal', 8000.00,'2024-06-15 14:20:00','Medical expenses'),
('2000000005','Interest',  1029.17,'2024-06-30 23:59:00','Monthly savings account interest for May 2024'),
('2000000005','Deposit', 15000.00,'2024-07-10 10:45:00','Pension deposit');

-- Account 1000000006 (CUST011, Children, opened 2024-04-20)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000006','Deposit',  5000.00,'2024-04-20 09:00:00','Initial deposit by parent'),
('2000000006','Interest',    50.00,'2024-05-31 23:59:00','Monthly savings account interest for April 2024'),
('2000000006','Deposit',  1500.00,'2024-06-01 10:30:00','Birthday money'),
('2000000006','Interest',    65.00,'2024-06-30 23:59:00','Monthly savings account interest for May 2024'),
('2000000006','Deposit',  2000.00,'2024-07-15 11:00:00','Grandparent gift');

-- Account 1000000007 (CUST012, Adult, opened 2024-05-01)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000007','Deposit', 40000.00,'2024-05-01 10:00:00','Initial deposit'),
('2000000007','Deposit', 15000.00,'2024-06-05 14:30:00','Salary'),
('2000000007','Interest',   333.33,'2024-06-30 23:59:00','Monthly savings account interest for May 2024'),
('2000000007','Withdrawal', 8000.00,'2024-07-10 11:20:00','Rent payment'),
('2000000007','Deposit', 10000.00,'2024-08-12 09:45:00','Bonus');

-- Account 1000000008 (CUST013, Teen, opened 2024-05-10)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000008','Deposit',  4000.00,'2024-05-10 11:30:00','Initial deposit'),
('2000000008','Deposit',  1000.00,'2024-06-15 10:00:00','Part-time earnings'),
('2000000008','Interest',    45.83,'2024-06-30 23:59:00','Monthly savings account interest for May 2024'),
('2000000008','Deposit',   800.00,'2024-07-20 14:15:00','Allowance'),
('2000000008','Withdrawal', 500.00,'2024-08-05 16:30:00','Books purchase');

-- Account 1000000009 (CUST014, Adult, opened 2024-05-20)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000009','Deposit', 25000.00,'2024-05-20 10:15:00','Initial deposit'),
('2000000009','Deposit',  5000.00,'2024-06-25 11:45:00','Freelance project'),
('2000000009','Interest',   250.00,'2024-06-30 23:59:00','Monthly savings account interest for May 2024'),
('2000000009','Withdrawal', 3000.00,'2024-07-18 15:20:00','Personal expense'),
('2000000009','Deposit',  8000.00,'2024-08-22 10:00:00','Client payment');

-- Account 1000000010 (CUST015, Adult, opened 2024-06-01)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000010','Deposit', 35000.00,'2024-06-01 09:30:00','Initial deposit'),
('2000000010','Deposit', 10000.00,'2024-07-05 14:00:00','Salary'),
('2000000010','Interest',   375.00,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000010','Withdrawal', 5000.00,'2024-08-15 11:30:00','Vacation'),
('2000000010','Deposit',  8000.00,'2024-09-10 10:20:00','Consulting fee');

-- Account 1000000011 (CUST014+CUST015 Joint, opened 2024-06-10)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000011','Deposit', 50000.00,'2024-06-10 10:00:00','Initial joint deposit - Holder 1'),
('2000000012','Deposit', 20000.00,'2024-06-10 10:05:00','Initial joint deposit - Holder 2'),
('2000000011','Interest',   583.33,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000012','Deposit', 10000.00,'2024-08-05 11:30:00','Joint savings'),
('2000000011','Withdrawal', 5000.00,'2024-08-20 14:15:00','Family vacation'),
('2000000011','Interest',   583.33,'2024-08-31 23:59:00','Monthly savings account interest for July 2024');

COMMIT;

-- ============================================================================
-- 6) REFRESH MATERIALIZED VIEWS
-- ============================================================================
REFRESH MATERIALIZED VIEW vw_agent_transactions_mv;
REFRESH MATERIALIZED VIEW vw_monthly_interest_summary_mv;
REFRESH MATERIALIZED VIEW vw_customer_activity_mv;

-- ============================================================================
-- 7) VERIFICATION QUERIES (optional, run these in psql to verify)
-- ============================================================================
-- Uncomment and run individually in psql to check results:

-- SELECT * FROM vw_agent_transactions_mv ORDER BY total_transactions DESC;
-- SELECT * FROM vw_monthly_interest_summary_mv ORDER BY month DESC, monthly_interest DESC LIMIT 20;
-- SELECT * FROM vw_customer_activity_mv ORDER BY current_total_balance DESC;
-- SELECT * FROM vw_account_summary ORDER BY total_transactions DESC LIMIT 15;
-- SELECT * FROM vw_fd_details ORDER BY principal_amount DESC;

-- Count check
-- SELECT 'Customers' AS entity, COUNT(*) FROM customer
-- UNION ALL SELECT 'Savings Accounts', COUNT(*) FROM savingsaccount
-- UNION ALL SELECT 'Account Holders', COUNT(*) FROM accountholder
-- UNION ALL SELECT 'Fixed Deposits', COUNT(*) FROM fixeddeposit
-- UNION ALL SELECT 'Transactions', COUNT(*) FROM transactions;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Extra Seed Data Loaded Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added:';
    RAISE NOTICE '- 10 new customers (CUST006-CUST015)';
    RAISE NOTICE '- 11 savings accounts (10 individual + 1 joint)';
    RAISE NOTICE '- 12 account holders (including joint)';
    RAISE NOTICE '- 4 fixed deposits';
    RAISE NOTICE '- ~60+ transactions (deposits, withdrawals, interest)';
    RAISE NOTICE '- Refreshed all materialized views';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Run verification queries to explore data:';
    RAISE NOTICE 'SELECT * FROM vw_agent_transactions_mv;';
    RAISE NOTICE 'SELECT * FROM vw_customer_activity_mv;';
    RAISE NOTICE '========================================';
END $$;
