# Agent Dashboard - Integration Checklist

## Pre-Testing Setup ✅

- [x] Backend API endpoints created (`views.py`, `customer.py`)
- [x] Database views created (8 regular views, 1 materialized view)
- [x] Frontend service methods converted from mock to real API
- [x] Error handling added to all service methods
- [x] Loading states implemented in dashboard
- [x] Authentication headers configured

## Testing Checklist

### 1. Environment Setup
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173  
- [ ] Database is running and seeded with data
- [ ] At least one agent account exists with assigned customers

### 2. Login & Navigation
- [ ] Can login as an agent
- [ ] Dashboard loads without errors
- [ ] "Reports" button is visible in navigation
- [ ] Clicking "Reports" navigates to reports page

### 3. Reports Tab - My Transactions
- [ ] Tab loads automatically when opening Reports
- [ ] Loading spinner appears while fetching
- [ ] Data appears after loading
- [ ] Four summary cards display:
  - [ ] Total Transactions (number)
  - [ ] Total Deposits (currency)
  - [ ] Total Withdrawals (currency)
  - [ ] Net Inflow (currency with color)
- [ ] Recent transactions table shows:
  - [ ] Transaction ID
  - [ ] Customer name
  - [ ] Account number
  - [ ] Transaction type (badge with color)
  - [ ] Amount (with +/- and color)
  - [ ] Date and time
  - [ ] Reference number
- [ ] Date filters work:
  - [ ] This Week
  - [ ] This Month
  - [ ] Last Month
  - [ ] Custom Range (with date inputs)
- [ ] Refresh button reloads data

### 4. Reports Tab - My Customers
- [ ] Tab loads when clicked
- [ ] Loading spinner shows
- [ ] Customer cards display with:
  - [ ] Customer name and ID
  - [ ] Status badge (Active/Inactive)
  - [ ] Phone number
  - [ ] Email address
  - [ ] Registration date
  - [ ] Number of linked accounts
  - [ ] Total balance
  - [ ] Last transaction date
- [ ] "View Accounts" button works
- [ ] "New Transaction" button exists
- [ ] Refresh button works

### 5. Reports Tab - Account Details
- [ ] Tab loads when clicked
- [ ] Search input is visible
- [ ] Can enter account ID and press Enter
- [ ] Can enter account ID and click Search button
- [ ] Loading spinner shows during search
- [ ] Account information card displays:
  - [ ] Account ID
  - [ ] Account Type
  - [ ] Current Balance
  - [ ] Minimum Balance
  - [ ] Open Date
  - [ ] Status
  - [ ] Plan Name
  - [ ] Interest Rate
- [ ] Transaction summary shows:
  - [ ] Total Transactions
  - [ ] Total Deposits
  - [ ] Total Withdrawals
- [ ] Transaction history table displays:
  - [ ] Transaction ID
  - [ ] Date and time
  - [ ] Transaction type
  - [ ] Amount
  - [ ] Balance after transaction
  - [ ] Description
  - [ ] Reference number

### 6. Reports Tab - Linked FDs
- [ ] Tab loads when clicked
- [ ] Loading spinner shows
- [ ] FD cards display with:
  - [ ] FD ID
  - [ ] Customer name(s)
  - [ ] Linked savings account
  - [ ] Principal amount
  - [ ] Interest rate
  - [ ] Start date
  - [ ] Maturity date
  - [ ] Next payout date
  - [ ] Total interest credited
  - [ ] Status badge
  - [ ] Plan duration (months)
- [ ] Refresh button works
- [ ] Multiple FDs display correctly

### 7. Reports Tab - Monthly Interest
- [ ] Tab loads when clicked
- [ ] Loading spinner shows
- [ ] Month selector is visible
- [ ] Can select different months (format: YYYY-MM)
- [ ] Interest summary table displays:
  - [ ] Month/Year
  - [ ] Account Type
  - [ ] Accounts Credited
  - [ ] Total Interest Amount
  - [ ] Average Interest Per Account
  - [ ] Credit Batch Date
- [ ] Data changes when month is changed
- [ ] Refresh button works

### 8. Reports Tab - Customer Activity
- [ ] Tab loads when clicked
- [ ] Loading spinner shows
- [ ] Date filter dropdown works
- [ ] Customer activity table displays:
  - [ ] Customer ID and Name
  - [ ] Total Deposits (green)
  - [ ] Total Withdrawals (red)
  - [ ] Net Balance
  - [ ] Active FD Count
  - [ ] FD Total Value
  - [ ] Last Activity Date
  - [ ] Account Types (as badges/chips)
- [ ] Date filters change the data
- [ ] Refresh button works

### 9. Error Handling
- [ ] Stop backend and try refreshing a report
  - [ ] Error alert appears with message
  - [ ] No console errors that crash the app
- [ ] Enter invalid account ID in Account Details
  - [ ] Appropriate error message shows
  - [ ] App doesn't crash
- [ ] Network tab shows failed request with proper headers

### 10. Loading States
- [ ] All tabs show loading spinner when fetching
- [ ] Spinner disappears after data loads
- [ ] UI is not frozen during loading
- [ ] Can still navigate during loading

### 11. Data Accuracy
- [ ] Open database and verify customer count matches dashboard
- [ ] Verify a transaction amount matches database
- [ ] Check that only agent's customers are shown
- [ ] Verify FD interest rates match database
- [ ] Confirm account balances are correct

### 12. Browser Console
- [ ] No red errors in console
- [ ] API calls visible in Network tab
- [ ] JWT token present in request headers
- [ ] Responses have correct status codes (200, 201, etc.)

### 13. Role-Based Access (if testing multiple roles)
- [ ] Login as Agent - sees only own data
- [ ] Login as Manager - sees branch data
- [ ] Login as Admin - sees all data

### 14. Performance
- [ ] Reports load within 2-3 seconds
- [ ] No significant lag when switching tabs
- [ ] Date filters apply quickly
- [ ] No memory leaks (check dev tools)

## Common Issues & Solutions

### Issue: No data appears
**Check:**
- [ ] Backend is running
- [ ] Agent has assigned customers in database
- [ ] Database views exist (`SELECT * FROM vw_agent_transactions;`)
- [ ] JWT token is valid (check Network tab)

### Issue: "Failed to fetch" error
**Check:**
- [ ] Backend URL is correct (default: http://localhost:8000)
- [ ] CORS is configured in backend
- [ ] Network tab shows the request
- [ ] Firewall/antivirus not blocking

### Issue: Wrong data shown
**Check:**
- [ ] User is logged in as expected role
- [ ] Employee_id in JWT token is correct
- [ ] Database views filter correctly
- [ ] Frontend data transformation is correct

### Issue: Loading never stops
**Check:**
- [ ] Browser console for JavaScript errors
- [ ] Network tab for failed requests
- [ ] API endpoint returns a response
- [ ] Try-catch blocks are working

## Final Verification

- [ ] All 6 report tabs load successfully
- [ ] All tabs show real data from database
- [ ] No hardcoded mock data is displayed
- [ ] Error handling works correctly
- [ ] Loading states work correctly
- [ ] Date filters work where implemented
- [ ] Refresh buttons work for all tabs
- [ ] Currency formatting is correct (₹ symbol)
- [ ] Dates are formatted correctly
- [ ] Status badges have correct colors
- [ ] Navigation between tabs is smooth

## Success Criteria ✅

Integration is successful when:
1. ✅ All reports load real data from backend
2. ✅ No console errors appear
3. ✅ Error handling displays user-friendly messages
4. ✅ Loading states work correctly
5. ✅ Data matches what's in the database
6. ✅ Role-based access control works
7. ✅ All API endpoints return expected data

---

## Sign-off

- [ ] Functional testing complete
- [ ] All major features working
- [ ] No critical bugs found
- [ ] Ready for production/next phase

**Tested By:** ________________
**Date:** ________________
**Notes:** ________________
