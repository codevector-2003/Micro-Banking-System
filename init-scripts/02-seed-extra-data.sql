-- ============================================================================
-- Micro-Banking-System: Extra seed data with transactions
-- ============================================================================
-- Requirements:
-- • At least 5 agents and 3 branches
-- • 15 customers (including at least 2 joint accounts)
-- • 10 fixed deposits
-- • 100 transactions (deposits, withdrawals, interest credits)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) BRANCHES (3 new branches - BT004, BT005, BT006)
-- ============================================================================
INSERT INTO Branch (branch_id, branch_name, location, branch_phone_number, status) VALUES
('BT004', 'Negombo Branch', 'Negombo', '0312345678', true),
('BT005', 'Matara Branch', 'Matara', '0412345678', true),
('BT006', 'Kurunegala Branch', 'Kurunegala', '0372345678', true)
ON CONFLICT (branch_id) DO NOTHING;

-- ============================================================================
-- 2) EMPLOYEES (5 new agents + 3 new managers)
-- ============================================================================
INSERT INTO Employee (employee_id, name, nic, phone_number, address, date_started, type, status, branch_id) VALUES
-- Agents
('EMP106', 'Sandun Perera', '199367890123', '0776789012', '100 Beach Rd, Negombo', '2021-01-15', 'Agent', true, 'BT004'),
('EMP107', 'Priyanka Fernando', '199478901234', '0777890123', '200 Lake View, Negombo', '2021-03-20', 'Agent', true, 'BT004'),
('EMP108', 'Nuwan Silva', '199189012345', '0778901234', '50 Fort St, Matara', '2021-06-10', 'Agent', true, 'BT005'),
('EMP109', 'Chamari Jayawardena', '199290123456', '0779012345', '75 Beach Front, Matara', '2021-08-05', 'Agent', true, 'BT005'),
('EMP110', 'Dinesh Bandara', '199001234567', '0770123456', '25 Main St, Kurunegala', '2022-01-12', 'Agent', true, 'BT006'),
-- Branch Managers
('EMP111', 'Samantha Wijesinghe', '198512345670', '0771234560', '10 Manager Villa, Negombo', '2020-06-01', 'Branch Manager', true, 'BT004'),
('EMP112', 'Nishantha Karunaratne', '198623456781', '0772345671', '20 Executive Lane, Matara', '2020-07-01', 'Branch Manager', true, 'BT005'),
('EMP113', 'Geethika Amarasinghe', '198734567892', '0773456782', '30 Director Rd, Kurunegala', '2020-08-01', 'Branch Manager', true, 'BT006')
ON CONFLICT (employee_id) DO NOTHING;

-- ============================================================================
-- 3) AUTHENTICATION (for new employees - password: 'password123')
-- ============================================================================
INSERT INTO Authentication (username, password, employee_id) VALUES
('agent.sandun', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP106'),
('agent.priyanka', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP107'),
('agent.nuwan', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP108'),
('agent.chamari', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP109'),
('agent.dinesh', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP110'),
('manager.samantha', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP111'),
('manager.nishantha', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP112'),
('manager.geethika', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfqVzOQf8W', 'EMP113')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 4) CUSTOMERS (15 customers - CUST006..CUST020)
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
('CUST015','Shehan Fonseka','199105050010','0711000010','11 Lake Side, Colombo','1991-05-05','shehan@example.com',true,'EMP103'),
-- New customers for joint accounts and more coverage
('CUST016','Harsha Weerasinghe','198901230011','0711000011','15 Beach Rd, Negombo','1989-01-23','harsha@example.com',true,'EMP106'),
('CUST017','Buddhika Rathnayake','199102340012','0711000012','20 Sea Side, Negombo','1991-02-14','buddhika@example.com',true,'EMP106'),
('CUST018','Sudarshani Perera','199503450013','0711000013','30 Hill View, Matara','1995-03-15','sudarshani@example.com',true,'EMP108'),
('CUST019','Lakmal Fernando','198804560014','0711000014','40 Garden St, Kurunegala','1988-04-20','lakmal@example.com',true,'EMP110'),
('CUST020','Sandali Jayawardena','199605670015','0711000015','50 Park Lane, Kurunegala','1996-05-25','sandali@example.com',true,'EMP110')
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================================================
-- 5) SAVINGS ACCOUNTS (13 individual + 3 joint = 16 accounts for 15 customers)
-- ============================================================================
INSERT INTO SavingsAccount (saving_account_id, open_date, balance, employee_id, s_plan_id, status, branch_id) VALUES
-- Individual accounts
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
('1000000013','2024-07-01 10:00:00', 22000.00,'EMP106','AD001',true,'BT004'),
('1000000015','2024-08-01 10:00:00', 18000.00,'EMP108','TE001',true,'BT005'),
('1000000016','2024-08-15 10:00:00', 35000.00,'EMP110','AD001',true,'BT006'),
-- Joint accounts (3 joint accounts for requirement)
('1000000011','2024-06-10 10:00:00', 70000.00,'EMP103','JO001',true,'BT001'),  -- CUST014 + CUST015
('1000000012','2024-06-20 10:00:00', 85000.00,'EMP106','JO001',true,'BT004'),  -- CUST016 + CUST017
('1000000014','2024-07-15 10:00:00', 95000.00,'EMP110','JO001',true,'BT006')   -- CUST019 + CUST020
ON CONFLICT (saving_account_id) DO NOTHING;

-- ============================================================================
-- 6) ACCOUNT HOLDERS (map customers to accounts; include joint holders)
-- ============================================================================
INSERT INTO AccountHolder (holder_id, customer_id, saving_account_id) VALUES
-- Individual account holders
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
('2000000013','CUST018','1000000013'),
('2000000015','CUST018','1000000015'),
('2000000016','CUST019','1000000016'),
-- Joint account holders (3 joint accounts = 6 holder records)
('2000000011','CUST014','1000000011'),  -- Joint account 1
('2000000012','CUST015','1000000011'),  -- Joint account 1
('2000000017','CUST016','1000000012'),  -- Joint account 2
('2000000018','CUST017','1000000012'),  -- Joint account 2
('2000000019','CUST019','1000000014'),  -- Joint account 3
('2000000020','CUST020','1000000014')   -- Joint account 3
ON CONFLICT (holder_id) DO NOTHING;

-- ============================================================================
-- 7) FIXED DEPOSITS (10 fixed deposits as required)
-- ============================================================================
INSERT INTO FixedDeposit (fixed_deposit_id, saving_account_id, f_plan_id, start_date, end_date, principal_amount, interest_payment_type, last_payout_date, status) VALUES
('3000000001','1000000001','FD001','2024-06-15','2024-12-15', 50000.00, true ,'2024-09-15', true),
('3000000002','1000000005','FD002','2024-01-01','2025-01-01',150000.00, false, NULL       , true),
('3000000003','1000000007','FD003','2023-07-01','2026-07-01',200000.00, true ,'2025-09-01', true),
('3000000004','1000000011','FD001','2025-01-01','2025-07-01',100000.00, true , NULL       , true),
('3000000005','1000000003','FD001','2024-05-01','2024-11-01', 75000.00, true ,'2024-08-01', true),
('3000000006','1000000010','FD002','2024-07-01','2025-07-01',120000.00, false, NULL       , true),
('3000000007','1000000012','FD003','2024-08-01','2027-08-01',180000.00, true ,'2025-02-01', true),
('3000000008','1000000013','FD001','2024-09-01','2025-03-01', 60000.00, true , NULL       , true),
('3000000009','1000000014','FD002','2024-09-15','2025-09-15',140000.00, false, NULL       , true),
('3000000010','1000000016','FD001','2024-10-01','2025-04-01', 80000.00, true , NULL       , true)
ON CONFLICT (fixed_deposit_id) DO NOTHING;

-- ============================================================================
-- 8) TRANSACTIONS (100+ transactions - deposits, withdrawals, interest)
-- ============================================================================
-- Strategy: Create realistic transaction history over 6+ months
-- - Initial deposits (account opening)
-- - Regular deposits/withdrawals
-- - Monthly interest payments
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

-- Account 1000000012 (CUST016+CUST017 Joint, opened 2024-06-20)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000017','Deposit', 60000.00,'2024-06-20 10:00:00','Initial joint deposit - Holder 1'),
('2000000018','Deposit', 25000.00,'2024-06-20 10:10:00','Initial joint deposit - Holder 2'),
('2000000017','Deposit',  8000.00,'2024-07-10 14:30:00','Monthly contribution'),
('2000000017','Interest',   708.33,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000018','Withdrawal', 6000.00,'2024-08-15 11:20:00','Emergency expense'),
('2000000017','Interest',   729.17,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000018','Deposit',  12000.00,'2024-09-05 10:45:00','Business income');

-- Account 1000000013 (CUST018, Adult, opened 2024-07-01)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000013','Deposit', 20000.00,'2024-07-01 10:00:00','Initial deposit'),
('2000000013','Deposit',  5000.00,'2024-08-10 14:00:00','Salary deposit'),
('2000000013','Interest',   166.67,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000013','Withdrawal', 3000.00,'2024-09-15 11:30:00','Personal expense'),
('2000000013','Deposit',  8000.00,'2024-09-25 09:20:00','Freelance payment');

-- Account 1000000014 (CUST019+CUST020 Joint, opened 2024-07-15)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000019','Deposit', 70000.00,'2024-07-15 10:00:00','Initial joint deposit - Holder 1'),
('2000000020','Deposit', 25000.00,'2024-07-15 10:15:00','Initial joint deposit - Holder 2'),
('2000000019','Interest',   791.67,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000020','Deposit', 10000.00,'2024-09-08 13:00:00','Joint savings'),
('2000000019','Withdrawal', 8000.00,'2024-09-20 15:45:00','Home renovation');

-- Account 1000000015 (CUST018, Teen, opened 2024-08-01)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000015','Deposit', 15000.00,'2024-08-01 10:00:00','Initial deposit'),
('2000000015','Deposit',  3000.00,'2024-09-12 11:30:00','Birthday gift'),
('2000000015','Interest',   137.50,'2024-09-30 23:59:00','Monthly savings account interest for August 2024');

-- Account 1000000016 (CUST019, Adult, opened 2024-08-15)
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
('2000000016','Deposit', 30000.00,'2024-08-15 10:00:00','Initial deposit'),
('2000000016','Deposit',  8000.00,'2024-09-18 14:20:00','Consulting fee'),
('2000000016','Interest',   291.67,'2024-09-30 23:59:00','Monthly savings account interest for August 2024'),
('2000000016','Withdrawal', 4000.00,'2024-10-05 11:00:00','Personal expense');

-- Additional diverse transactions across accounts for variety
INSERT INTO Transactions (holder_id, type, amount, timestamp, description) VALUES
-- More activity on Account 1000000001
('2000000001','Deposit',  4000.00,'2024-07-15 10:30:00','Cash deposit'),
('2000000001','Withdrawal', 2000.00,'2024-07-22 14:15:00','ATM withdrawal'),
('2000000001','Interest',   195.83,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000001','Deposit',  6000.00,'2024-08-18 11:20:00','Salary bonus'),
('2000000001','Interest',   229.17,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000001','Withdrawal', 3500.00,'2024-09-12 16:40:00','Shopping'),

-- More activity on Account 1000000003
('2000000003','Deposit', 12000.00,'2024-07-08 10:15:00','Client payment'),
('2000000003','Interest',   725.00,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000003','Withdrawal',15000.00,'2024-08-14 13:30:00','Supplier payment'),
('2000000003','Deposit', 18000.00,'2024-08-25 09:45:00','Project milestone'),
('2000000003','Interest',   745.83,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),

-- More activity on Account 1000000005
('2000000005','Interest',  1083.33,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000005','Deposit', 15000.00,'2024-08-10 10:30:00','Pension deposit'),
('2000000005','Withdrawal',10000.00,'2024-08-22 14:20:00','Medical expenses'),
('2000000005','Interest',  1112.50,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000005','Deposit', 15000.00,'2024-09-10 10:45:00','Pension deposit'),

-- More activity on Account 1000000007
('2000000007','Interest',   458.33,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000007','Deposit', 12000.00,'2024-08-08 11:00:00','Salary deposit'),
('2000000007','Withdrawal', 7000.00,'2024-08-18 15:30:00','Utility bills'),
('2000000007','Interest',   462.50,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),

-- More activity on Account 1000000009
('2000000009','Interest',   287.50,'2024-07-31 23:59:00','Monthly savings account interest for June 2024'),
('2000000009','Deposit',  7000.00,'2024-08-20 10:20:00','Client payment'),
('2000000009','Interest',   308.33,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000009','Withdrawal', 4000.00,'2024-09-15 14:10:00','Equipment purchase'),

-- More activity on Account 1000000010
('2000000010','Interest',   395.83,'2024-08-31 23:59:00','Monthly savings account interest for July 2024'),
('2000000010','Deposit',  9000.00,'2024-09-05 11:15:00','Salary'),
('2000000010','Withdrawal', 6000.00,'2024-09-18 13:25:00','Travel'),
('2000000010','Interest',   420.83,'2024-09-30 23:59:00','Monthly savings account interest for August 2024');

COMMIT;

-- ============================================================================
-- 9) REFRESH MATERIALIZED VIEWS
-- ============================================================================
REFRESH MATERIALIZED VIEW vw_agent_transactions_mv;
REFRESH MATERIALIZED VIEW vw_monthly_interest_summary_mv;
REFRESH MATERIALIZED VIEW vw_customer_activity_mv;

-- ============================================================================
-- 10) VERIFICATION QUERIES (optional, run these in psql to verify)
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
-- 11) COMPLETION MESSAGE & STATISTICS
-- ============================================================================
DO $$
DECLARE
    v_branches INT;
    v_agents INT;
    v_customers INT;
    v_accounts INT;
    v_joint_accounts INT;
    v_fds INT;
    v_transactions INT;
BEGIN
    -- Count the data
    SELECT COUNT(*) INTO v_branches FROM branch WHERE branch_id IN ('BT004','BT005','BT006');
    SELECT COUNT(*) INTO v_agents FROM employee WHERE employee_id IN ('EMP106','EMP107','EMP108','EMP109','EMP110');
    SELECT COUNT(*) INTO v_customers FROM customer WHERE customer_id BETWEEN 'CUST006' AND 'CUST020';
    SELECT COUNT(*) INTO v_accounts FROM savingsaccount WHERE saving_account_id >= '1000000001';
    SELECT COUNT(DISTINCT saving_account_id) INTO v_joint_accounts FROM accountholder 
        WHERE saving_account_id IN ('1000000011','1000000012','1000000014');
    SELECT COUNT(*) INTO v_fds FROM fixeddeposit WHERE fixed_deposit_id >= '3000000001';
    SELECT COUNT(*) INTO v_transactions FROM transactions WHERE holder_id >= '2000000001';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Extra Seed Data Loaded Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REQUIREMENTS CHECK:';
    RAISE NOTICE '✓ Branches added: % (Required: 3)', v_branches;
    RAISE NOTICE '✓ Agents added: % (Required: 5)', v_agents;
    RAISE NOTICE '✓ Customers added: % (Required: 15)', v_customers;
    RAISE NOTICE '✓ Joint accounts: % (Required: 2)', v_joint_accounts;
    RAISE NOTICE '✓ Fixed deposits: % (Required: 10)', v_fds;
    RAISE NOTICE '✓ Transactions: % (Required: 100)', v_transactions;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Savings Accounts: %', v_accounts;
    RAISE NOTICE '- Individual: %', v_accounts - v_joint_accounts;
    RAISE NOTICE '- Joint: %', v_joint_accounts;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refreshed all materialized views';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Run verification queries:';
    RAISE NOTICE 'SELECT * FROM vw_agent_transactions_mv;';
    RAISE NOTICE 'SELECT * FROM vw_customer_activity_mv;';
    RAISE NOTICE 'SELECT * FROM vw_monthly_interest_summary_mv LIMIT 20;';
    RAISE NOTICE '========================================';
END $$;
