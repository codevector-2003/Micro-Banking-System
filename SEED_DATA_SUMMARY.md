# Seed Data Summary - 02-seed-extra-data.sql

## Requirements Met ✓

### 1. Branches: 3+ ✓
- **BT004** - Negombo Branch
- **BT005** - Matara Branch  
- **BT006** - Kurunegala Branch

### 2. Agents: 5+ ✓
- **EMP106** - Sandun Perera (Agent @ BT004)
- **EMP107** - Priyanka Fernando (Agent @ BT004)
- **EMP108** - Nuwan Silva (Agent @ BT005)
- **EMP109** - Chamari Jayawardena (Agent @ BT005)
- **EMP110** - Dinesh Bandara (Agent @ BT006)

**Bonus:** 3 Branch Managers also added (EMP111, EMP112, EMP113)

### 3. Customers: 15+ ✓
| Customer ID | Name | Branch | Agent |
|-------------|------|--------|-------|
| CUST006 | Ishan Perera | BT001 | EMP103 |
| CUST007 | Nimali Silva | BT001 | EMP103 |
| CUST008 | Kasun Bandara | BT002 | EMP105 |
| CUST009 | Tharindu Jayasuriya | BT002 | EMP105 |
| CUST010 | Dilini Wickramasinghe | BT001 | EMP103 |
| CUST011 | Sahan Madushan | BT001 | EMP103 |
| CUST012 | Ruwani Karunarathne | BT002 | EMP105 |
| CUST013 | Malith Gunasekara | BT002 | EMP105 |
| CUST014 | Amaya Dissanayake | BT001 | EMP103 |
| CUST015 | Shehan Fonseka | BT001 | EMP103 |
| CUST016 | Harsha Weerasinghe | BT004 | EMP106 |
| CUST017 | Buddhika Rathnayake | BT004 | EMP106 |
| CUST018 | Sudarshani Perera | BT005 | EMP108 |
| CUST019 | Lakmal Fernando | BT006 | EMP110 |
| CUST020 | Sandali Jayawardena | BT006 | EMP110 |

### 4. Joint Accounts: 2+ ✓ (Actually 3)
| Account ID | Holders | Plan | Balance |
|------------|---------|------|---------|
| 1000000011 | CUST014 + CUST015 | Joint | 70,000 |
| 1000000012 | CUST016 + CUST017 | Joint | 85,000 |
| 1000000014 | CUST019 + CUST020 | Joint | 95,000 |

### 5. Fixed Deposits: 10+ ✓
| FD ID | Account | Plan | Amount | Start Date | End Date |
|-------|---------|------|--------|------------|----------|
| 3000000001 | 1000000001 | FD001 | 50,000 | 2024-06-15 | 2024-12-15 |
| 3000000002 | 1000000005 | FD002 | 150,000 | 2024-01-01 | 2025-01-01 |
| 3000000003 | 1000000007 | FD003 | 200,000 | 2023-07-01 | 2026-07-01 |
| 3000000004 | 1000000011 | FD001 | 100,000 | 2025-01-01 | 2025-07-01 |
| 3000000005 | 1000000003 | FD001 | 75,000 | 2024-05-01 | 2024-11-01 |
| 3000000006 | 1000000010 | FD002 | 120,000 | 2024-07-01 | 2025-07-01 |
| 3000000007 | 1000000012 | FD003 | 180,000 | 2024-08-01 | 2027-08-01 |
| 3000000008 | 1000000013 | FD001 | 60,000 | 2024-09-01 | 2025-03-01 |
| 3000000009 | 1000000014 | FD002 | 140,000 | 2024-09-15 | 2025-09-15 |
| 3000000010 | 1000000016 | FD001 | 80,000 | 2024-10-01 | 2025-04-01 |

### 6. Transactions: 100+ ✓ (Actually ~105)
- **Deposits:** ~50 transactions
- **Withdrawals:** ~25 transactions  
- **Interest Credits:** ~30 transactions

Transaction distribution across:
- 16 savings accounts
- Time period: January 2024 - October 2024
- Multiple transaction types per account

## Account Distribution by Type

| Plan Type | Count | Accounts |
|-----------|-------|----------|
| Adult (AD001) | 9 | Individual accounts |
| Teen (TE001) | 4 | Young savers |
| Senior (SE001) | 1 | Senior citizen |
| Children (CH001) | 1 | Minor account |
| Joint (JO001) | 3 | Joint accounts |

## How to Load This Data

### Option 1: Direct psql execution
```cmd
docker compose exec -T db psql -U postgres -d B_trust -f /docker-entrypoint-initdb.d/02-seed-extra-data.sql
```

### Option 2: Interactive psql
```cmd
docker compose exec db psql -U postgres -d B_trust
\i /docker-entrypoint-initdb.d/02-seed-extra-data.sql
```

## Verification Queries

After loading, run these in psql to verify:

```sql
-- Summary counts
SELECT 'Branches' AS entity, COUNT(*) FROM branch WHERE branch_id >= 'BT004'
UNION ALL SELECT 'Agents', COUNT(*) FROM employee WHERE employee_id >= 'EMP106' AND type='Agent'
UNION ALL SELECT 'Customers', COUNT(*) FROM customer WHERE customer_id >= 'CUST006'
UNION ALL SELECT 'Savings Accounts', COUNT(*) FROM savingsaccount WHERE saving_account_id >= '1000000001'
UNION ALL SELECT 'Fixed Deposits', COUNT(*) FROM fixeddeposit WHERE fixed_deposit_id >= '3000000001'
UNION ALL SELECT 'Transactions', COUNT(*) FROM transactions WHERE holder_id >= '2000000001';

-- Agent performance
SELECT * FROM vw_agent_transactions_mv ORDER BY total_transactions DESC;

-- Customer activity
SELECT customer_name, total_accounts, current_total_balance, total_deposits, total_withdrawals
FROM vw_customer_activity_mv
ORDER BY current_total_balance DESC;

-- Monthly interest summary
SELECT * FROM vw_monthly_interest_summary_mv 
ORDER BY month DESC, monthly_interest DESC 
LIMIT 20;

-- Transaction breakdown by type
SELECT type, COUNT(*) as count, SUM(amount) as total_amount
FROM transactions
WHERE holder_id >= '2000000001'
GROUP BY type
ORDER BY count DESC;

-- Joint accounts verification
SELECT sa.saving_account_id, COUNT(ah.holder_id) as holder_count, 
       STRING_AGG(c.name, ' + ' ORDER BY c.name) as holders,
       sa.balance
FROM savingsaccount sa
JOIN accountholder ah ON sa.saving_account_id = ah.saving_account_id
JOIN customer c ON ah.customer_id = c.customer_id
WHERE sa.s_plan_id = 'JO001' AND sa.saving_account_id >= '1000000001'
GROUP BY sa.saving_account_id, sa.balance
HAVING COUNT(ah.holder_id) > 1;
```

## Login Credentials for New Employees

All new employees have username/password:
- **Username format:** `agent.firstname` or `manager.firstname`
- **Password:** `password123` (hashed in DB)

Examples:
- `agent.sandun` / `password123`
- `agent.priyanka` / `password123`
- `manager.samantha` / `password123`

## Notes

- All data uses `ON CONFLICT DO NOTHING` for idempotent loading
- Materialized views are automatically refreshed after data load
- Transaction dates span Jan 2024 - Oct 2024 for realistic reporting
- Interest payments follow monthly patterns
- Account balances reflect cumulative transaction history
