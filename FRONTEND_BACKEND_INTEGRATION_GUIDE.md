# Frontend-Backend Integration Guide

## Overview
This guide documents the completed integration between the React frontend and FastAPI backend for the Agent Dashboard.

## Completed Work

### ✅ Backend API Endpoints

#### Views API (`/views/*`)
Located in: `Backend/views.py`

1. **GET `/views/report/agent-transactions`**
   - Returns agent-wise transaction summary
   - Uses: `vw_agent_transactions` view
   - Access: Admin sees all, Branch Manager sees branch agents, Agent sees own data

2. **GET `/views/report/account-transactions`**
   - Returns account-wise transaction summary
   - Query param: `account_number` (optional)
   - Uses: `vw_account_summary` view

3. **GET `/views/report/active-fixed-deposits`**
   - Returns list of active FDs with next payout dates
   - Uses: `vw_fd_details` view

4. **GET `/views/report/monthly-interest-distribution`**
   - Returns monthly interest summary by account type
   - Query param: `month_year` (optional, format: YYYY-MM)
   - Uses: `vw_monthly_interest_summary_mv` materialized view

5. **GET `/views/report/customer-activity`**
   - Returns customer activity with deposits, withdrawals, FD info
   - Uses: `vw_customer_activity` view

6. **POST `/views/refresh-views`**
   - Refreshes the materialized view
   - Admin only

#### Customer API (`/customers/*`)
Located in: `Backend/customer.py`

1. **GET `/customers/`**
   - Returns customers filtered by user type
   - Agent: sees only their customers
   - Manager: sees branch customers
   - Admin: sees all customers

2. **GET `/customers/agent/{employee_id}`**
   - Returns customers for a specific agent
   - With role-based access control

3. **GET `/customers/agent/{employee_id}/stats`**
   - Returns statistics for agent's customers
   - Includes total count, active count, total balance

### ✅ Frontend Service Layer

#### Agent Reports Service (`Frontend/src/services/agentReportsService.ts`)

All methods have been converted from hardcoded mock data to real API calls:

1. **`getMyCustomers(token)`**
   - Endpoint: `/customers/`
   - Also fetches accounts and transactions for each customer
   - Returns: `MyCustomer[]`

2. **`getMyTransactionSummary(token, filters?)`**
   - Endpoint: `/views/report/customer-activity`
   - Calculates totals from customer activity data
   - Returns: `MyTransactionSummary`

3. **`getAccountDetailsWithHistory(accountId, token, filters?)`**
   - Endpoints: 
     - `/views/report/account-transactions`
     - `/transaction/search`
     - `/saving-account/{id}`
   - Returns: `AccountDetailsWithHistory`

4. **`getLinkedFixedDeposits(token)`**
   - Endpoint: `/views/report/active-fixed-deposits`
   - Returns: `LinkedFixedDeposit[]`

5. **`getMonthlyInterestSummary(token, month?)`**
   - Endpoint: `/views/report/monthly-interest-distribution`
   - Optional month filter (YYYY-MM format)
   - Returns: `MonthlyInterestSummary[]`

6. **`getCustomerActivitySummary(token, filters?)`**
   - Endpoint: `/views/report/customer-activity`
   - Returns: `CustomerActivitySummary[]`

**Helper Functions:**
- `formatCurrency(amount)` - Formats numbers as currency
- `getDateRange(period)` - Returns date range for preset periods
- `handleAgentReportsError(error)` - Error handling utility

### ✅ Frontend UI Component

#### Agent Dashboard (`Frontend/src/components/AgentDashboard.tsx`)

The dashboard is fully integrated with:
- Loading states for all reports
- Error handling and display
- Date filters (this week, this month, last month, custom range)
- Tab-based navigation for different reports
- Refresh buttons for each report
- Auto-loading when switching tabs

## Database Views

Located in: `init-scripts/01-init-database.sql`

### Regular Views (8)
1. `vw_agent_transactions` - Agent transaction summary
2. `vw_customer_activity` - Customer activity report
3. `vw_account_summary` - Account transaction summary
4. `vw_fd_details` - Fixed deposit details with payouts
5. `vw_customer_accounts` - Customer account summary
6. `vw_branch_performance` - Branch performance metrics
7. `vw_employee_workload` - Employee workload distribution
8. `vw_high_value_customers` - High-value customer list

### Materialized View (1)
1. `vw_monthly_interest_summary_mv` - Monthly interest distribution
   - Needs periodic refresh via `/views/refresh-views` endpoint

## Testing Instructions

### 1. Start the Backend
```bash
cd Backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend
```bash
cd Frontend
npm run dev
```

### 3. Login as Agent
- Navigate to http://localhost:5173
- Login with agent credentials:
  - Username: (your agent username)
  - Password: (your agent password)

### 4. Test Each Report Tab

#### Transaction Summary Tab
- Should load automatically when opening Reports
- Test date filters: This Week, This Month, Last Month
- Test custom date range
- Click Refresh button
- Verify:
  - ✅ Total transactions count
  - ✅ Total deposits amount
  - ✅ Total withdrawals amount
  - ✅ Net inflow calculation
  - ✅ Recent transactions list

#### My Customers Tab
- Click "My Customers" tab
- Should load list of customers assigned to you
- Verify each customer card shows:
  - ✅ Customer name and ID
  - ✅ Phone and email
  - ✅ Registration date
  - ✅ Number of linked accounts
  - ✅ Total balance
  - ✅ Last transaction date
- Test "View Accounts" button

#### Account Details Tab
- Click "Account Details" tab
- Enter an account ID (e.g., from your customers)
- Click Search
- Verify:
  - ✅ Account information (type, balance, status)
  - ✅ Account summary (deposits, withdrawals, count)
  - ✅ Transaction history with dates and amounts

#### Linked FDs Tab
- Click "Linked FDs" tab
- Should load fixed deposits
- Verify:
  - ✅ FD ID and customer names
  - ✅ Principal amount
  - ✅ Interest rate
  - ✅ Start and maturity dates
  - ✅ Next payout date
  - ✅ Total interest credited
  - ✅ Status

#### Monthly Interest Tab
- Click "Monthly Interest" tab
- Test month selector (format: YYYY-MM)
- Verify:
  - ✅ Month/year display
  - ✅ Account type grouping
  - ✅ Accounts credited count
  - ✅ Total interest amount
  - ✅ Average interest per account
  - ✅ Credit batch date

#### Customer Activity Tab
- Click "Customer Activity" tab
- Test date filters
- Verify:
  - ✅ Customer name and ID
  - ✅ Total deposits
  - ✅ Total withdrawals
  - ✅ Net balance
  - ✅ Active FD count
  - ✅ FD total value
  - ✅ Last activity date
  - ✅ Account types list

### 5. Test Error Handling

#### Network Error
- Stop backend server
- Try to refresh any report
- Should show error alert: "Failed to fetch..."

#### Invalid Data
- Enter invalid account ID in Account Details
- Should show error message
- Should not crash

#### Permission Error
- Try to access data outside your scope
- Should be filtered by backend based on role

### 6. Test Loading States
- Watch for loading spinners when:
  - Switching between tabs
  - Clicking refresh buttons
  - Applying filters
- UI should be responsive during loading

## API Authentication

All API calls use JWT token from login:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

The token is managed by `AuthContext` and passed through service methods.

## Role-Based Access Control

### Agent
- ✅ Can see only their own customers
- ✅ Can see only their own transactions
- ✅ Can see accounts of their customers
- ✅ Can see FDs linked to their customers

### Branch Manager
- ✅ Can see all agents in their branch
- ✅ Can see all customers in their branch
- ✅ Can see branch-wide statistics

### Admin
- ✅ Can see all data across all branches
- ✅ Can refresh materialized views
- ✅ Can see system-wide reports

## Error Handling

All service methods include:
1. `try-catch` blocks
2. Appropriate error messages
3. Fallback to empty arrays/default values
4. Console logging for debugging

Example error handling:
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('Error:', error);
  return defaultValue;
}
```

## Data Transformation

Frontend service layer transforms backend data to match TypeScript interfaces:

**Backend** → **Frontend**
- `customer_id` → `customer_id`
- `name` → `customer_name`
- `employee_id` → Used for filtering, not displayed
- `saving_account_id` → `account_id`
- `transaction_type` → Normalized to 'Deposit' | 'Withdrawal' | 'Interest'

## Performance Considerations

1. **Lazy Loading**: Reports load only when tab is clicked
2. **Caching**: Consider adding React Query for caching
3. **Pagination**: Consider adding for large datasets
4. **Materialized View**: Refresh `vw_monthly_interest_summary_mv` periodically

## Known Limitations

1. **Real-time Updates**: Data doesn't auto-refresh (manual refresh required)
2. **Pagination**: Not implemented (loads all data at once)
3. **Export**: Download/export functionality not implemented
4. **Filters**: Date filters not fully implemented for all reports
5. **Search**: Account search in Account Details tab is basic

## Next Steps

### Recommended Enhancements
1. Add pagination for large datasets
2. Implement export to CSV/PDF
3. Add real-time data refresh (polling or WebSocket)
4. Add charts/graphs using Chart.js or Recharts
5. Add advanced filtering options
6. Implement caching with React Query
7. Add print functionality
8. Add email report functionality

### Performance Optimization
1. Implement virtual scrolling for long lists
2. Add debouncing for search inputs
3. Optimize database views with indexes
4. Consider Redis caching for frequently accessed data

## Troubleshooting

### Issue: Reports show no data
**Solution**: 
- Check if agent has assigned customers
- Check if database views exist
- Check browser console for errors
- Verify backend is running

### Issue: "Failed to fetch" errors
**Solution**:
- Verify backend is running on port 8000
- Check CORS configuration
- Verify authentication token is valid
- Check network tab in browser dev tools

### Issue: Wrong data displayed
**Solution**:
- Clear browser cache
- Check user role and permissions
- Verify database view definitions
- Check data transformation logic

### Issue: Loading spinner never stops
**Solution**:
- Check for JavaScript errors in console
- Verify API endpoint returns response
- Check for unhandled promise rejections
- Ensure finally blocks are executing

## Contact & Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs
3. Review this integration guide
4. Check API endpoint documentation
5. Test with Postman/curl to isolate frontend/backend issues

---

**Last Updated**: October 20, 2025
**Status**: ✅ Integration Complete - Ready for Testing
