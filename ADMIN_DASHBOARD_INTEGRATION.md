# Admin Dashboard Integration Guide

## Overview
This document details the integration between the Admin Dashboard frontend component and the backend API endpoints. The Admin Dashboard provides comprehensive system management capabilities including branch management, employee management, customer oversight, user registration, system settings, and reporting.

## Integration Summary

### Services Used
- **adminService.ts**: Core admin functionality (branches, employees, tasks, FD plans, customers, system stats)
- **viewsService.ts**: Database views and reports
- **savingsPlansService.ts**: Savings account plans management
- **authService.ts**: User registration

### Key Features Integrated
1. **System Statistics Dashboard** - Real-time system-wide metrics
2. **Branch Management** - CRUD operations for branches
3. **Employee Management** - CRUD operations for employees
4. **Customer Management** - View and update all customers
5. **User Registration** - Create new user accounts
6. **Settings Management** - Savings and FD plans
7. **Reports/Views** - System-wide database views
8. **Interest Calculation** - Automated task management

---

## 1. System Statistics Integration

### Overview Cards
The dashboard displays 4 main statistics cards:

#### Data Sources
```typescript
SystemStatsService.getSystemStatistics(token)
```

#### Statistics Calculated
1. **Total Branches** (Active + Inactive)
   - Source: `BranchService.getAllBranches()`
   - Display: Count of all branches

2. **Total Employees** (Active + Inactive)
   - Source: `EmployeeService.getAllEmployees()`
   - Display: Count of all employees

3. **Total Customers**
   - Source: `GET /customers/`
   - Display: Count of all customer records
   - Admin privilege: Can view ALL customers system-wide

4. **Total Deposits**
   - Source: `GET /views/report/active-fixed-deposits`
   - Calculation: Sum of all `total_principal` from active FDs
   - Display: Formatted as currency (Rs. X,XXX,XXX)

#### Additional Metrics
- **Active Branches**: Filtered from branches where `status = true`
- **Active Employees**: Filtered from employees where `status = true`
- **Active FDs**: Count from active fixed deposits report
- **Monthly Interest Payout**: From `GET /views/report/monthly-interest-distribution`

### Implementation Details

#### Backend Endpoints Used
```
GET /branches/branch/all
GET /employees/employee/all
GET /customers/
GET /views/report/active-fixed-deposits
GET /views/report/monthly-interest-distribution?year={year}&month={month}
```

#### Service Method
```typescript
static async getSystemStatistics(token: string): Promise<SystemStats> {
  const [branches, employees, customers, activeFDs, monthlyInterest] = 
    await Promise.all([
      BranchService.getAllBranches(token),
      EmployeeService.getAllEmployees(token),
      fetch(buildApiUrl('/customers/'), { headers: getAuthHeaders(token) }),
      fetch(buildApiUrl('/views/report/active-fixed-deposits'), { ... }),
      fetch(buildApiUrl('/views/report/monthly-interest-distribution'), { ... })
    ]);
    
  return {
    totalBranches: branches.length,
    totalEmployees: employees.length,
    totalCustomers: customers.length,
    totalDeposits: activeFDs.summary.total_principal,
    monthlyInterestPayout: monthlyInterest.summary.total_interest,
    activeFDs: activeFDs.summary.total_active_fds,
    activeBranches: branches.filter(b => b.status).length,
    activeEmployees: employees.filter(e => e.status).length
  };
}
```

---

## 2. Branch Management Integration

### Endpoints Used
| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List All | GET | `/branches/branch/all` | Get all branches |
| List Active | GET | `/branches/branch/active` | Get only active branches |
| Get By ID | GET | `/branches/branch/{branch_id}` | Get specific branch |
| Create | POST | `/branches/branch` | Create new branch |
| Update | PUT | `/branches/branch/update` | Update branch details |
| Change Status | PUT | `/branches/branch/status` | Activate/deactivate branch |
| Search | POST | `/branches/branch/search` | Search branches by criteria |

### Service Methods

#### BranchService.getAllBranches()
```typescript
static async getAllBranches(token: string): Promise<Branch[]>
```
**Returns:**
```typescript
interface Branch {
  branch_id: string;
  branch_name: string;
  location: string;
  branch_phone_number: string;
  status: boolean;
}
```

#### BranchService.createBranch()
**Request Body:**
```json
{
  "branch_name": "Main Branch",
  "location": "123 Main St, City",
  "branch_phone_number": "+94771234567",
  "status": true
}
```

#### BranchService.searchBranches()
**Search Criteria:**
```typescript
{
  branch_id?: string;
  branch_name?: string;
  location?: string;
  status?: boolean;
}
```

### UI Features
- **Search**: By branch name, location, or ID
- **Create**: Modal form for new branch
- **Edit**: Inline editing with modal
- **Status Toggle**: Activate/deactivate branches
- **Manager Assignment**: View assigned manager for each branch

---

## 3. Employee Management Integration

### Endpoints Used
| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List All | GET | `/employees/employee/all` | Get all employees |
| Create | POST | `/employees/employee` | Create new employee |
| Update Contact | PUT | `/employees/employee/contact` | Update phone/address |
| Change Status | PUT | `/employees/employee/status` | Activate/deactivate |
| Search | POST | `/employees/employee/search` | Search employees |

### Service Methods

#### EmployeeService.createEmployee()
**Request Body:**
```typescript
{
  name: string;
  nic: string;
  phone_number: string;
  address: string;
  date_started: string; // ISO date format
  type: 'Admin' | 'Branch Manager' | 'Agent';
  status: boolean;
  branch_id: string;
}
```

**Returns:**
```typescript
interface Employee {
  employee_id: string; // Auto-generated
  name: string;
  nic: string;
  phone_number: string;
  address: string;
  date_started: string;
  last_login_time?: string;
  type: string;
  status: boolean;
  branch_id: string;
}
```

#### EmployeeService.updateEmployeeContact()
**Request Body:**
```json
{
  "employee_id": "EMP001",
  "phone_number": "+94771234567",
  "address": "New address"
}
```

### UI Features
- **Search**: By name, NIC, employee ID, or branch
- **Create**: Modal form with branch selection
- **Edit Contact**: Update phone and address only
- **Status Toggle**: Activate/deactivate employees
- **Type Badges**: Visual indicators for Admin/Manager/Agent
- **Branch Display**: Shows assigned branch name

---

## 4. Customer Management Integration

### Endpoints Used
| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List All | GET | `/customers/` | Get all customers (Admin only) |
| Search | POST | `/customer/search` | Search by criteria |
| Update | PUT | `/customer/update` | Update customer details |

### Service Methods

#### CustomerService.getAllCustomers()
```typescript
static async getAllCustomers(token: string): Promise<Customer[]>
```
**Admin Privilege**: Can view ALL customers system-wide (no filtering)

**Returns:**
```typescript
interface Customer {
  customer_id: string;
  name: string;
  nic: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  email: string;
  status: boolean;
  employee_id: string; // Assigned agent
}
```

#### CustomerService.searchCustomers()
**Search Criteria:**
```typescript
{
  customer_id?: string;
  name?: string;
  nic?: string;
  phone_number?: string;
}
```

#### CustomerService.updateCustomer()
**Updatable Fields:**
- name
- phone_number
- address
- email

**Note**: Cannot update customer_id, nic, date_of_birth, employee_id

### UI Features
- **Search**: By customer ID, name, NIC, or phone
- **View All**: Load all customers (Admin privilege)
- **Edit**: Modal form for updating details
- **View Details**: Display full customer information
- **Agent Assignment**: Shows which agent manages each customer

---

## 5. User Registration Integration

### Endpoint Used
```
POST /auth/register
```

### Service Method

#### AuthService.register()
**Request Body:**
```typescript
interface RegisterRequest {
  username: string;
  password: string;
  type: 'Admin' | 'Branch Manager' | 'Agent';
  employee_id: string | null; // null for Admin
}
```

### Validation Rules
1. **Username**: Required, must be unique
2. **Password**: Required, minimum length (backend enforced)
3. **Type**: Required, one of the three types
4. **Employee ID**: 
   - Required for Branch Manager and Agent
   - Must be null for Admin
   - Must reference existing employee

### UI Features
- **Modal Form**: Popup for registration
- **Type Selection**: Dropdown for user type
- **Employee Lookup**: Shows available employees
- **Validation**: Client-side validation before submission
- **Success Feedback**: Confirmation message on successful registration

---

## 6. Settings Management Integration

### Savings Plans

#### Endpoint
```
GET /savings-accounts/plans
```

#### Service
```typescript
SavingsPlansService.getAllSavingsPlans(token)
```

**Returns:**
```typescript
interface SavingsPlan {
  s_plan_id: string;
  plan_name: string;
  interest_rate: string; // Decimal as string
  min_balance: number;
}
```

### Fixed Deposit Plans

#### Endpoints
| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List All | GET | `/fixed-deposits/fixed-deposit-plan` | Get all FD plans |
| Create | POST | `/fixed-deposits/fixed-deposit-plan` | Create new FD plan |

#### Service Methods

##### FDPlansService.getAllFDPlans()
**Returns:**
```typescript
interface FixedDepositPlan {
  f_plan_id: string;
  months: number; // Duration
  interest_rate: string; // Decimal as string
}
```

##### FDPlansService.createFDPlan()
**Request Body:**
```json
{
  "f_plan_id": "FD6M",
  "months": 6,
  "interest_rate": "11.0"
}
```

---

## 7. Reports/Views Integration

### Endpoints Used
All endpoints from ViewsService:

| Report | Endpoint | Description |
|--------|----------|-------------|
| Agent Transactions | `/views/report/agent-transactions` | Agent-wise transaction summary |
| Account Transactions | `/views/report/account-transactions` | Account-wise transaction summary |
| Active FDs | `/views/report/active-fixed-deposits` | All active fixed deposits |
| Monthly Interest | `/views/report/monthly-interest-distribution` | Interest distribution by month |
| Customer Activity | `/views/report/customer-activity` | Customer activity summary |
| Refresh Views | `/views/refresh-views` | Refresh materialized views |

### Service Methods

#### ViewsService.getAgentTransactionReport()
**Returns:**
```typescript
{
  success: true,
  report_name: string,
  data: Array<{
    employee_id: string,
    employee_name: string,
    branch_id: string,
    branch_name: string,
    total_transactions: number,
    total_value: number,
    employee_status: boolean
  }>,
  summary: {
    total_agents: number,
    total_transactions: number,
    total_value: number
  },
  count: number
}
```

#### ViewsService.refreshMaterializedViews()
**Admin Only**: Refreshes all materialized views for updated statistics

**Request:**
```typescript
POST /views/refresh-views
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Materialized views refreshed successfully",
  "refreshed_views": ["vw_monthly_interest_summary_mv"],
  "timestamp": "2024-01-20T10:30:00"
}
```

### UI Features
- **Tab Navigation**: Separate tab for Reports
- **Load All**: Button to fetch all reports at once
- **Refresh Views**: Admin button to refresh materialized views
- **Year/Month Filter**: For monthly interest report
- **Last Refresh Time**: Display timestamp of last refresh
- **Summary Cards**: Display key metrics from each report
- **Data Tables**: Paginated tables for detailed data

---

## 8. Interest Calculation & Tasks Integration

### Endpoints Used
| Task | Method | Endpoint | Description |
|------|--------|----------|-------------|
| Status | GET | `/tasks/automatic-tasks-status` | Get scheduler status |
| Start Tasks | POST | `/tasks/start-automatic-tasks` | Start automated scheduler |
| Stop Tasks | POST | `/tasks/stop-automatic-tasks` | Stop automated scheduler |
| Calc Savings | POST | `/tasks/calculate-savings-account-interest` | Manual savings interest |
| Calc FD | POST | `/tasks/calculate-fixed-deposit-interest` | Manual FD interest |
| Mature FDs | POST | `/tasks/mature-fixed-deposits` | Process mature FDs |
| Savings Report | GET | `/tasks/savings-account-interest-report` | Get savings interest report |
| FD Report | GET | `/tasks/fixed-deposit-interest-report` | Get FD interest report |

### Service Methods

#### TasksService.getTaskStatus()
**Returns:**
```typescript
interface TaskStatus {
  scheduler_running: boolean;
  next_savings_interest_calculation: string; // ISO timestamp
  next_fd_interest_calculation: string;
  next_maturity_processing: string;
  current_time: string;
}
```

#### TasksService.calculateSavingsAccountInterest()
**Manual Trigger**: Calculate interest for all eligible savings accounts

**Returns:**
```json
{
  "success": true,
  "message": "Interest calculated for X accounts",
  "total_interest": 123456.78,
  "accounts_processed": 250
}
```

#### Interest Reports
**Returns:**
```typescript
interface InterestReport {
  report_date: string;
  month_year?: string;
  total_accounts_pending?: number;
  total_potential_interest: number;
  accounts?: Array<{
    account_id: string,
    customer_name: string,
    balance: number,
    interest_rate: string,
    calculated_interest: number
  }>;
  total_deposits_due?: number;
  deposits?: Array<any>;
}
```

### UI Features
- **Scheduler Status**: Display if automated tasks are running
- **Next Run Times**: Show scheduled times for each task
- **Manual Triggers**: Buttons to manually run calculations
- **Start/Stop Scheduler**: Control automated task system
- **Interest Reports**: View calculated interest details
- **Report Loading**: Separate loading state for reports

---

## Error Handling

### Error Handler Function
```typescript
export function handleApiError(error: any): string {
  if (error instanceof Error) {
    try {
      const errorObj = JSON.parse(error.message);
      if (typeof errorObj.detail === 'string') return errorObj.detail;
      if (typeof errorObj.message === 'string') return errorObj.message;
      return JSON.stringify(errorObj.detail || errorObj.message || errorObj);
    } catch {
      return error.message;
    }
  }
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object' && error !== null) {
    if (error.detail) return typeof error.detail === 'string' 
      ? error.detail : JSON.stringify(error.detail);
    if (error.message) return typeof error.message === 'string' 
      ? error.message : JSON.stringify(error.message);
    return JSON.stringify(error);
  }
  
  return 'An unexpected error occurred';
}
```

### Error Display
- **Alert Component**: Red alert banner at top of dashboard
- **Auto-dismiss**: Errors clear after 5 seconds
- **Contextual**: Errors shown relevant to current operation

### Success Messages
- **Alert Component**: Green alert banner
- **Auto-dismiss**: Success messages clear after 5 seconds
- **Confirmation**: Shown after successful operations

---

## Data Flow Examples

### Example 1: Loading Dashboard Statistics
```
1. User logs in as Admin
2. AdminDashboard component mounts
3. useEffect triggers loadInitialData()
4. SystemStatsService.getSystemStatistics(token) executes
5. Parallel API calls:
   - GET /branches/branch/all
   - GET /employees/employee/all
   - GET /customers/
   - GET /views/report/active-fixed-deposits
   - GET /views/report/monthly-interest-distribution
6. Responses aggregated and calculated
7. setSystemStats() updates state
8. UI re-renders with statistics
```

### Example 2: Creating New Branch
```
1. Admin clicks "Add Branch" button
2. Modal opens with empty form
3. Admin fills in branch details
4. Admin clicks "Create Branch"
5. Validation checks run
6. BranchService.createBranch() called
7. POST /branches/branch with data
8. Backend validates and creates branch
9. Success response with new branch_id
10. loadBranches() refreshes the list
11. Success message displayed
12. Modal closes
```

### Example 3: Searching Customers
```
1. Admin navigates to Customers tab
2. useEffect triggers loadAllCustomers()
3. GET /customers/ loads ALL customers
4. Admin enters search term in search box
5. Admin selects search type (name/NIC/phone/ID)
6. Admin clicks Search
7. CustomerService.searchCustomers() called
8. POST /customer/search with criteria
9. Backend filters and returns matching customers
10. setCustomers() updates state
11. Table re-renders with filtered results
12. Success message shows result count
```

---

## Role-Based Access Control

### Admin Privileges
Admins have FULL access to all features:
- ✅ View ALL branches (system-wide)
- ✅ View ALL employees (system-wide)
- ✅ View ALL customers (system-wide)
- ✅ Create/update branches
- ✅ Create/update employees
- ✅ Update customers
- ✅ Register new users (all types)
- ✅ Manage system settings
- ✅ View ALL reports (no filtering)
- ✅ Control automated tasks
- ✅ Refresh materialized views
- ✅ View/trigger interest calculations

### Backend Enforcement
All endpoints check user type:
```python
user_type = current_user.get('type', '').lower().replace(' ', '_')
if user_type != 'admin':
    raise HTTPException(status_code=403, detail="Admin access required")
```

---

## Testing Checklist

### System Statistics
- [ ] All 4 overview cards display correct numbers
- [ ] Total branches count is accurate
- [ ] Total employees count is accurate
- [ ] Total customers count includes all system customers
- [ ] Total deposits shows FD principal amounts
- [ ] Active counts filter by status correctly

### Branch Management
- [ ] Load all branches on tab open
- [ ] Search branches by name/location/ID
- [ ] Create new branch with validation
- [ ] Update existing branch details
- [ ] Toggle branch status (activate/deactivate)
- [ ] View assigned branch manager

### Employee Management
- [ ] Load all employees on tab open
- [ ] Search employees by name/NIC/ID/branch
- [ ] Create new employee with branch assignment
- [ ] Update employee contact information
- [ ] Toggle employee status
- [ ] Display correct employee type badges

### Customer Management
- [ ] Load all customers (admin sees ALL)
- [ ] Search customers by various criteria
- [ ] Update customer details
- [ ] View assigned agent for each customer
- [ ] Cannot edit restricted fields (ID, NIC, DOB)

### User Registration
- [ ] Open registration modal
- [ ] Select user type (Admin/Manager/Agent)
- [ ] Employee ID required for non-Admin
- [ ] Employee ID null for Admin
- [ ] Username uniqueness validation
- [ ] Password requirements enforced
- [ ] Success confirmation on registration

### Settings
- [ ] Load all savings plans
- [ ] Display plan details (name, rate, min balance)
- [ ] Load all FD plans
- [ ] Create new FD plan with validation
- [ ] Plan ID uniqueness enforced

### Reports
- [ ] Load all system reports
- [ ] Display agent transaction summary
- [ ] Display account transaction summary
- [ ] Display active FD report
- [ ] Filter monthly interest by year/month
- [ ] Display customer activity report
- [ ] Refresh materialized views (admin only)
- [ ] Show last refresh timestamp

### Interest & Tasks
- [ ] Display scheduler status
- [ ] Show next scheduled run times
- [ ] Start automated tasks
- [ ] Stop automated tasks
- [ ] Manually calculate savings interest
- [ ] Manually calculate FD interest
- [ ] Process mature fixed deposits
- [ ] Load savings interest report
- [ ] Load FD interest report

### Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Validation errors shown appropriately
- [ ] Permission errors handled gracefully
- [ ] Errors auto-dismiss after 5 seconds
- [ ] Success messages appear and auto-dismiss

---

## Troubleshooting

### Common Issues

#### Issue: "Failed to compile system statistics"
**Cause**: One or more API endpoints returned an error
**Solution**: 
- Check backend is running
- Verify JWT token is valid
- Check user has Admin role
- Review backend logs for specific error

#### Issue: "Customer search returns no results"
**Cause**: Search criteria too restrictive or no matching data
**Solution**:
- Try broader search terms
- Use "Load All" to see all customers
- Verify data exists in database

#### Issue: "Cannot create employee - Invalid branch_id"
**Cause**: Selected branch doesn't exist or is invalid
**Solution**:
- Ensure branches are loaded
- Select branch from dropdown
- Verify branch exists in database

#### Issue: "User registration failed - Employee ID already has a user"
**Cause**: Employee already has a user account
**Solution**:
- Check if user account already exists
- Use different employee for new user
- Update existing user instead

#### Issue: "Interest calculation fails"
**Cause**: Database constraints or invalid data
**Solution**:
- Check backend logs
- Verify accounts have valid plans
- Ensure no conflicting transactions

---

## Performance Considerations

### Optimization Strategies
1. **Parallel Loading**: Use Promise.all() for independent API calls
2. **Conditional Loading**: Load data only when tab is selected
3. **Caching**: System stats cached until page reload
4. **Debouncing**: Search operations debounced (can be added)
5. **Pagination**: Large datasets should implement pagination (future)

### Current Limitations
- All customers loaded at once (can be slow with thousands)
- No pagination for large tables
- Reports load full datasets
- No client-side caching between tab switches

### Future Improvements
- Implement pagination for customers/employees
- Add client-side caching with React Query
- Implement infinite scroll for large lists
- Add debounced search
- Implement real-time updates with WebSockets

---

## Conclusion

The Admin Dashboard is now fully integrated with backend APIs, providing comprehensive system management capabilities. All CRUD operations, reporting, and system control features are connected to real endpoints with proper error handling and user feedback.

### Integration Status: ✅ COMPLETE

**Next Steps:**
1. Thorough testing with production-like data
2. Performance optimization for large datasets
3. Add pagination where needed
4. Implement advanced filtering
5. Add export functionality for reports
