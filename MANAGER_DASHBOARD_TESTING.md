# Manager Dashboard Testing Checklist

## Pre-Testing Setup

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173
- [ ] Database has at least one branch with:
  - [ ] Branch manager account
  - [ ] 2+ agents assigned to branch
  - [ ] 5+ customers in branch
  - [ ] Multiple savings accounts
  - [ ] At least 2 fixed deposits
- [ ] Can login as branch manager

## Testing by Report Tab

### 1. Original Reports (ViewsService)

#### Agent Transactions Report
- [ ] Tab loads when clicked
- [ ] Shows agents from manager's branch only
- [ ] Displays:
  - [ ] Employee ID and name
  - [ ] Total transactions count
  - [ ] Total transaction value
  - [ ] Branch name
  - [ ] Status badge
- [ ] Summary cards show totals
- [ ] Refresh button works
- [ ] No agents from other branches visible

#### Account Transactions Report
- [ ] Tab loads successfully
- [ ] Shows accounts from manager's branch
- [ ] Displays:
  - [ ] Account ID
  - [ ] Customer name
  - [ ] Plan name
  - [ ] Current balance
  - [ ] Transaction count
  - [ ] Account status
- [ ] Summary shows total accounts and balance
- [ ] Account search/filter works

#### Active Fixed Deposits Report
- [ ] Tab loads successfully
- [ ] Shows FDs from manager's branch
- [ ] Displays:
  - [ ] FD ID
  - [ ] Customer name
  - [ ] Principal amount
  - [ ] Interest rate
  - [ ] Start and end dates
  - [ ] Next payout date
  - [ ] Status
- [ ] Summary cards show totals
- [ ] Sorting options work

#### Monthly Interest Distribution
- [ ] Tab loads successfully
- [ ] Shows interest data by month
- [ ] Month/year selector works
- [ ] Displays:
  - [ ] Plan name
  - [ ] Account count
  - [ ] Total interest paid
  - [ ] Average per account
- [ ] Summary shows totals
- [ ] Data changes when month changes

#### Customer Activity Report
- [ ] Tab loads successfully
- [ ] Shows customers from manager's branch
- [ ] Displays:
  - [ ] Customer ID and name
  - [ ] Total deposits
  - [ ] Total withdrawals
  - [ ] Net change
  - [ ] Account status
- [ ] Summary shows aggregate data
- [ ] Filter options work

### 2. Enhanced Reports (ManagerReportsService)

#### Branch Overview
- [ ] Tab loads automatically on dashboard
- [ ] Shows branch statistics:
  - [ ] Branch name
  - [ ] Total customers
  - [ ] Total accounts
  - [ ] Total deposits
  - [ ] Total withdrawals
  - [ ] Total FDs
  - [ ] Branch balance
  - [ ] Active/inactive accounts
- [ ] Cards display with correct numbers
- [ ] No data from other branches

#### Agent Performance Report
- [ ] Enhanced tab shows detailed agent metrics
- [ ] Displays:
  - [ ] Agent name and ID
  - [ ] Number of deposits
  - [ ] Number of withdrawals
  - [ ] Deposit value
  - [ ] Withdrawal value
  - [ ] Net volume
  - [ ] Assigned customers
  - [ ] Last activity date
- [ ] Date filter works
- [ ] Summary calculations correct
- [ ] Only branch agents shown

#### Account Summary Report
- [ ] Enhanced view with filtering
- [ ] Account type filter works
- [ ] Shows detailed account metrics
- [ ] Date range filter functional
- [ ] Export options (if implemented)

#### FD Detailed Report
- [ ] Shows comprehensive FD information
- [ ] Sort by maturity date works
- [ ] Sort by payout date works
- [ ] Sort by principal amount works
- [ ] Days to maturity calculated correctly
- [ ] Expected maturity amount shown

#### Interest Analysis Report
- [ ] Breakdown by account type
- [ ] Monthly trends visible
- [ ] Year/month filter works
- [ ] Shows average interest rates
- [ ] Totals calculated correctly

#### Customer Insights Report
- [ ] Shows customer activity patterns
- [ ] Filters by account type work
- [ ] Date range filter functional
- [ ] Shows customers with FDs
- [ ] Net flow calculated correctly

### 3. Dashboard Home/Overview

#### Employee Management
- [ ] Can see list of branch employees
- [ ] Employee search works
- [ ] Can update employee contact info
- [ ] Can toggle employee status
- [ ] Shows only branch employees

#### Customer Management  
- [ ] Can see branch customers
- [ ] Customer search works
- [ ] Can view customer details
- [ ] Shows only branch customers

#### Savings Accounts
- [ ] Can view branch savings accounts
- [ ] Shows account statistics
- [ ] Can filter accounts
- [ ] Account details accessible

#### Fixed Deposits
- [ ] Can view branch FDs
- [ ] Shows FD statistics
- [ ] Can see maturity dates
- [ ] Interest information visible

### 4. Cross-Feature Testing

#### Role-Based Access
- [ ] Manager cannot see other branches' data
- [ ] Can only manage own branch employees
- [ ] Can only view own branch reports
- [ ] Admin can see all branches (if testing as admin)

#### Data Consistency
- [ ] Numbers match across different reports
- [ ] Customer count consistent
- [ ] Account totals match
- [ ] Transaction sums correct
- [ ] FD totals accurate

#### Performance
- [ ] Reports load within 3 seconds
- [ ] No lag when switching tabs
- [ ] Filters apply quickly
- [ ] No memory leaks over time

### 5. Error Handling

#### Network Errors
- [ ] Stop backend, try loading reports
- [ ] Error alert displays
- [ ] No app crash
- [ ] Can recover after backend restarts

#### Invalid Data
- [ ] Handle empty result sets
- [ ] Handle missing branch data
- [ ] Handle invalid filters
- [ ] Graceful degradation

#### Authentication
- [ ] Token expiry handled
- [ ] Redirect to login if unauthorized
- [ ] Error message for forbidden access

### 6. UI/UX Testing

#### Layout
- [ ] All tabs accessible
- [ ] Navigation works smoothly
- [ ] Responsive on different screen sizes
- [ ] No layout breaks

#### Data Display
- [ ] Currency formatted correctly
- [ ] Dates formatted consistently
- [ ] Status badges have colors
- [ ] Tables are readable

#### Loading States
- [ ] Spinners show during loading
- [ ] Loading text descriptive
- [ ] UI not frozen during load
- [ ] Can navigate during load

#### Filtering & Sorting
- [ ] Filter options clear
- [ ] Filters apply correctly
- [ ] Sort options work
- [ ] Reset filters works

### 7. Browser Console

- [ ] No red errors in console
- [ ] API calls visible in Network tab
- [ ] JWT token in request headers
- [ ] Response status codes 200/201
- [ ] No 403/404 errors for allowed data

## Comparison Testing

### Agent vs Manager View
- [ ] Login as agent - sees only own data
- [ ] Login as manager - sees branch data
- [ ] Login as admin - sees all data
- [ ] Data scoping correct for each role

### Data Verification
- [ ] Open database
- [ ] Compare customer count in DB vs Dashboard
- [ ] Verify transaction amounts
- [ ] Check FD counts
- [ ] Confirm account balances

## Sign-off Checklist

- [ ] All report tabs load successfully
- [ ] All reports show real database data
- [ ] No hardcoded mock data visible
- [ ] Role-based filtering works correctly
- [ ] Error handling functional
- [ ] Loading states work
- [ ] Filters and sorting work
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Ready for production

## Test Results

**Tested By:** ________________

**Date:** ________________

**Branch Tested:** ________________

**Number of Agents in Branch:** ________________

**Number of Customers in Branch:** ________________

**Issues Found:** 
- [ ] None
- [ ] Minor (list below)
- [ ] Major (list below)

**Issue Details:**
_________________________________
_________________________________
_________________________________

**Overall Status:**
- [ ] ✅ Pass - All tests successful
- [ ] ⚠️  Pass with minor issues
- [ ] ❌ Fail - Critical issues found

**Notes:**
_________________________________
_________________________________
_________________________________
