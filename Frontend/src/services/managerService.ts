// Manager Service for ManagerDashboard backend integration

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to build API URLs
function buildApiUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
}

// Helper function to get auth headers
function getAuthHeaders(token: string) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// Helper function to handle API errors
export function handleApiError(error: any): string {
    if (error instanceof Error) {
        try {
            const errorObj = JSON.parse(error.message);
            return errorObj.detail || errorObj.message || 'An error occurred';
        } catch {
            return error.message;
        }
    }
    return 'An unexpected error occurred';
}

// Type definitions
export interface Employee {
    employee_id: string;
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

export interface Customer {
    customer_id: string;
    name: string;
    nic: string;
    address: string;
    email?: string;
    phone_number?: string;
    date_of_birth: string;
    status: boolean;
    employee_id: string;
}

export interface Transaction {
    transaction_id: string;
    saving_account_id: string;
    amount: number;
    transaction_type: string;
    description?: string;
    timestamp: string;
}

export interface TaskStatus {
    scheduler_running: boolean;
    next_savings_interest_calculation: string;
    next_fd_interest_calculation: string;
    next_maturity_processing: string;
    current_time: string;
}

export interface InterestReport {
    report_date: string;
    month_year?: string;
    total_accounts_pending?: number;
    total_potential_interest: number;
    accounts?: any[];
    total_deposits_due?: number;
    deposits?: any[];
}

export interface SavingsAccount {
    saving_account_id: string;
    open_date: string;
    balance: number;
    employee_id: string;
    s_plan_id: string;
    status: boolean;
    branch_id: string;
    customer_id?: string;
    customer_name?: string;
    customer_nic?: string;
}

export interface FixedDeposit {
    fixed_deposit_id: string;
    saving_account_id: string;
    f_plan_id: string;
    start_date: string;
    end_date: string;
    principal_amount: number;
    interest_payment_type: string;
    last_payout_date: string;
    status: boolean;
}

export interface BranchSavingsStats {
    total_accounts: number;
    active_accounts: number;
    total_balance: number;
    average_balance: number;
    new_accounts_this_month: number;
    branch_id: string;
}

export interface BranchFixedDepositStats {
    total_fixed_deposits: number;
    active_fixed_deposits: number;
    total_principal_amount: number;
    average_principal_amount: number;
    new_fds_this_month: number;
    matured_fds: number;
    branch_id: string;
}

// Employee Service (Branch Manager can view employees in their branch)
export class ManagerEmployeeService {
    static async getBranchEmployees(token: string): Promise<Employee[]> {
        const response = await fetch(buildApiUrl('/employees/employee/branch'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch employees');
        }

        return response.json();
    }

    static async searchEmployees(token: string, searchQuery: {
        employee_id?: string;
        name?: string;
        nic?: string;
        branch_id?: string;
    }): Promise<Employee[]> {
        const response = await fetch(buildApiUrl('/employees/employee/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(searchQuery),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Employee search failed');
        }

        return response.json();
    }

    static async updateEmployeeContact(token: string, employeeId: string, updates: {
        phone_number?: string;
        address?: string
    }): Promise<Employee> {
        const response = await fetch(buildApiUrl('/employees/employee/contact'), {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ employee_id: employeeId, ...updates }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update employee contact');
        }

        return response.json();
    }

    static async changeEmployeeStatus(token: string, employeeId: string, status: boolean): Promise<Employee> {
        const response = await fetch(buildApiUrl('/employees/employee/status'), {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ employee_id: employeeId, status }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change employee status');
        }

        return response.json();
    }
}

// Customer Service (Branch Manager can view customers managed by their branch employees)
export class ManagerCustomerService {
    static async getAllCustomers(token: string): Promise<Customer[]> {
        const response = await fetch(buildApiUrl('/customers/customers/branch'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch customers');
        }

        return response.json();
    }

    static async getCustomersByBranch(token: string, branchId?: string): Promise<Customer[]> {
        const url = branchId
            ? `/customers/customers/branch/${branchId}`
            : '/customers/customers/branch';

        const response = await fetch(buildApiUrl(url), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch customers');
        }

        return response.json();
    }

    static async getBranchCustomerStats(token: string, branchId?: string): Promise<any> {
        // For branch managers, we need to get their branch ID first if not provided
        if (!branchId) {
            const response = await fetch(buildApiUrl('/customers/customers/branch'), {
                method: 'GET',
                headers: getAuthHeaders(token),
            });

            if (!response.ok) {
                throw new Error('Failed to determine branch');
            }

            // Get branch ID from the first customer's employee record
            const customers = await response.json();
            if (customers.length === 0) {
                return {
                    total_customers: 0,
                    active_customers: 0,
                    inactive_customers: 0,
                    new_customers_this_month: 0
                };
            }
        }

        const url = branchId
            ? `/customers/customers/branch/${branchId}/stats`
            : '/customers/customers/branch/stats'; // This would need to be implemented

        const response = await fetch(buildApiUrl(url), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch customer statistics');
        }

        return response.json();
    }

    static async searchCustomers(searchParams: any, token: string): Promise<Customer[]> {
        const response = await fetch(buildApiUrl('/customers/customer/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(searchParams),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Customer search failed');
        }

        return response.json();
    }
}

// Transaction Service
export class ManagerTransactionService {
    static async searchTransactions(searchParams: any, token: string): Promise<Transaction[]> {
        const response = await fetch(buildApiUrl('/transactions/transaction/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(searchParams),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Transaction search failed');
        }

        return response.json();
    }
}

// Savings Account Service (Branch Manager can view savings accounts in their branch)
export class ManagerSavingsAccountService {
    static async getBranchSavingsAccounts(token: string): Promise<SavingsAccount[]> {
        const response = await fetch(buildApiUrl('/saving-accounts/saving-account/branch'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch savings accounts');
        }

        return response.json();
    }

    static async getBranchSavingsStats(token: string): Promise<BranchSavingsStats> {
        const response = await fetch(buildApiUrl('/saving-accounts/saving-account/branch/stats'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch savings statistics');
        }

        return response.json();
    }
}

// Fixed Deposit Service (Branch Manager can view fixed deposits in their branch)
export class ManagerFixedDepositService {
    static async getBranchFixedDeposits(token: string): Promise<FixedDeposit[]> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit/branch'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch fixed deposits');
        }

        return response.json();
    }

    static async getBranchFixedDepositStats(token: string): Promise<BranchFixedDepositStats> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit/branch/stats'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch fixed deposit statistics');
        }

        return response.json();
    }
}

// Tasks Service (Branch managers can view task status and interest reports)
export class ManagerTasksService {
    static async getTaskStatus(token: string): Promise<TaskStatus> {
        const response = await fetch(buildApiUrl('/tasks/automatic-tasks-status'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get task status');
        }

        return response.json();
    }

    static async getSavingsAccountInterestReport(token: string): Promise<InterestReport> {
        const response = await fetch(buildApiUrl('/tasks/savings-account-interest-report'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get savings account interest report');
        }

        return response.json();
    }

    static async getFixedDepositInterestReport(token: string): Promise<InterestReport> {
        const response = await fetch(buildApiUrl('/tasks/fixed-deposit-interest-report'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get fixed deposit interest report');
        }

        return response.json();
    }
}

// Statistics Service for Manager Dashboard
export class ManagerStatsService {
    static async getBranchStatistics(token: string): Promise<any> {
        try {
            // Get data from multiple endpoints to compile branch-specific statistics
            const [employees, customers, savingsStats, fdStats] = await Promise.all([
                ManagerEmployeeService.getBranchEmployees(token),
                ManagerCustomerService.getAllCustomers(token),
                ManagerSavingsAccountService.getBranchSavingsStats(token),
                ManagerFixedDepositService.getBranchFixedDepositStats(token),
            ]);

            // Calculate statistics from the data
            const activeEmployees = employees.filter(emp => emp.status && emp.type === 'Agent');
            const activeCustomers = customers.filter(cust => cust.status);

            return {
                totalEmployees: employees.length,
                activeAgents: activeEmployees.length,
                totalCustomers: customers.length,
                activeCustomers: activeCustomers.length,
                newAccountsThisMonth: savingsStats.new_accounts_this_month + fdStats.new_fds_this_month,
                totalDeposits: savingsStats.total_balance + fdStats.total_principal_amount,
                totalWithdrawals: 0, // Would need transaction data to calculate
                netGrowth: savingsStats.total_balance + fdStats.total_principal_amount,
                employees: employees,
                customers: customers,
                savingsStats: savingsStats,
                fixedDepositStats: fdStats,
            };
        } catch (error) {
            throw new Error('Failed to compile branch statistics');
        }
    }
}