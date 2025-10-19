// Admin Service for AdminDashboard backend integration

import { buildApiUrl, getAuthHeaders } from '../config/api';

// Helper function to handle API errors
export function handleApiError(error: any): string {
    if (error instanceof Error) {
        try {
            // Try to parse error message as JSON
            const errorObj = JSON.parse(error.message);
            if (typeof errorObj.detail === 'string') {
                return errorObj.detail;
            }
            if (typeof errorObj.message === 'string') {
                return errorObj.message;
            }
            // If detail or message is an object, stringify it properly
            if (errorObj.detail) {
                return JSON.stringify(errorObj.detail);
            }
            if (errorObj.message) {
                return JSON.stringify(errorObj.message);
            }
            return JSON.stringify(errorObj);
        } catch {
            // If parsing fails, return the original error message
            return error.message;
        }
    }

    // Handle cases where error is already a string
    if (typeof error === 'string') {
        return error;
    }

    // Handle cases where error is an object
    if (typeof error === 'object' && error !== null) {
        if (error.detail) {
            return typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
        }
        if (error.message) {
            return typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
        }
        return JSON.stringify(error);
    }

    return 'An unexpected error occurred';
}

// Type definitions
export interface Branch {
    branch_id: string;
    branch_name: string;
    location: string;
    branch_phone_number: string;
    status: boolean;
}

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

export interface SavingsPlan {
    s_plan_id: string;
    plan_name: string;
    interest_rate: string;
    min_balance: number;
}

export interface FixedDepositPlan {
    f_plan_id: string;
    months: number;
    interest_rate: string;
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

// Branch Service
export class BranchService {
    static async getAllBranches(token: string): Promise<Branch[]> {
        const response = await fetch(buildApiUrl('/branches/branch/all'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branches');
        }

        return response.json();
    }

    static async getActiveBranches(token: string): Promise<Branch[]> {
        const response = await fetch(buildApiUrl('/branches/branch/active'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch active branches');
        }

        return response.json();
    }

    static async createBranch(branchData: Omit<Branch, 'branch_id'>, token: string): Promise<Branch> {
        const response = await fetch(buildApiUrl('/branches/branch'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(branchData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create branch');
        }

        return response.json();
    }

    static async updateBranch(branchId: string, updates: Partial<Branch>, token: string): Promise<Branch> {
        const response = await fetch(buildApiUrl('/branches/branch/update'), {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ branch_id: branchId, ...updates }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update branch');
        }

        return response.json();
    }

    static async changeBranchStatus(branchId: string, status: boolean, token: string): Promise<Branch> {
        const response = await fetch(buildApiUrl('/branches/branch/status'), {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ branch_id: branchId, status }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change branch status');
        }

        return response.json();
    }

    static async searchBranches(searchQuery: {
        branch_id?: string;
        branch_name?: string;
        location?: string;
        status?: boolean;
    }, token: string): Promise<Branch[]> {
        const response = await fetch(buildApiUrl('/branches/branch/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(searchQuery),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Branch search failed');
        }

        return response.json();
    }

    static async getBranchById(branchId: string, token: string): Promise<Branch> {
        const response = await fetch(buildApiUrl(`/branches/branch/${branchId}`), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch');
        }

        return response.json();
    }
}

// Employee Service
export class EmployeeService {
    static async getAllEmployees(token: string): Promise<Employee[]> {
        const response = await fetch(buildApiUrl('/employees/employee/all'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch employees');
        }

        return response.json();
    }

    static async createEmployee(token: string, employeeData: {
        name: string;
        nic: string;
        phone_number: string;
        address: string;
        date_started: string;
        type: string;
        status: boolean;
        branch_id: string;
    }): Promise<Employee> {
        const response = await fetch(buildApiUrl('/employees/employee'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(employeeData),
        });

        if (!response.ok) {
            try {
                const error = await response.json();
                console.error('Employee creation error:', error); // Debug log
                throw new Error(JSON.stringify(error));
            } catch (parseError) {
                // If we can't parse the error response, throw a generic error with status
                console.error('Failed to parse error response:', parseError);
                throw new Error(`Failed to create employee (HTTP ${response.status}): ${response.statusText}`);
            }
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

    static async updateEmployeeContact(token: string, employeeId: string, updates: { phone_number?: string; address?: string }): Promise<Employee> {
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

// Tasks Service
export class TasksService {
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

    static async startAutomaticTasks(token: string): Promise<{ message: string }> {
        const response = await fetch(buildApiUrl('/tasks/start-automatic-tasks'), {
            method: 'POST',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to start automatic tasks');
        }

        return response.json();
    }

    static async stopAutomaticTasks(token: string): Promise<{ message: string }> {
        const response = await fetch(buildApiUrl('/tasks/stop-automatic-tasks'), {
            method: 'POST',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to stop automatic tasks');
        }

        return response.json();
    }

    static async calculateSavingsAccountInterest(token: string): Promise<any> {
        const response = await fetch(buildApiUrl('/tasks/calculate-savings-account-interest'), {
            method: 'POST',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to calculate savings account interest');
        }

        return response.json();
    }

    static async calculateFixedDepositInterest(token: string): Promise<any> {
        const response = await fetch(buildApiUrl('/tasks/calculate-fixed-deposit-interest'), {
            method: 'POST',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to calculate fixed deposit interest');
        }

        return response.json();
    }

    static async matureFixedDeposits(token: string): Promise<any> {
        const response = await fetch(buildApiUrl('/tasks/mature-fixed-deposits'), {
            method: 'POST',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to mature fixed deposits');
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

// Fixed Deposit Plans Service
export class FDPlansService {
    static async getAllFDPlans(token: string): Promise<FixedDepositPlan[]> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit-plan'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch fixed deposit plans');
        }

        return response.json();
    }

    static async createFDPlan(planData: FixedDepositPlan, token: string): Promise<{ message: string }> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit-plan'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(planData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create fixed deposit plan');
        }

        return response.json();
    }
}

// Customer Service (for Admin use)
export class CustomerService {
    static async getAllCustomers(token: string): Promise<any[]> {
        const response = await fetch(buildApiUrl('/customers/'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch customers');
        }

        return response.json();
    }

    static async searchCustomers(searchQuery: {
        customer_id?: string;
        name?: string;
        nic?: string;
        phone_number?: string;
    }, token: string): Promise<any[]> {
        const response = await fetch(buildApiUrl('/customer/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(searchQuery),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Customer search failed');
        }

        return response.json();
    }

    static async updateCustomer(customerId: string, updates: any, token: string): Promise<any> {
        const response = await fetch(buildApiUrl('/customer/update'), {
            method: 'PUT',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ customer_id: customerId, ...updates }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update customer');
        }

        return response.json();
    }
}

// System Statistics Service
export class SystemStatsService {
    static async getSystemStatistics(token: string): Promise<any> {
        try {
            // Get data from multiple endpoints to compile comprehensive statistics
            const [
                branches, 
                employees, 
                customers, 
                agentTransactions,
                activeFDs,
                monthlyInterest
            ] = await Promise.all([
                BranchService.getAllBranches(token),
                EmployeeService.getAllEmployees(token),
                // Get all customers (admin can see all)
                fetch(buildApiUrl('/customers/'), {
                    headers: getAuthHeaders(token)
                }).then(res => res.ok ? res.json() : []),
                // Get agent transaction report for total transaction values
                fetch(buildApiUrl('/views/report/agent-transactions'), {
                    headers: getAuthHeaders(token)
                }).then(res => res.ok ? res.json() : { data: [], summary: { total_value: 0 } }),
                // Get active fixed deposits
                fetch(buildApiUrl('/views/report/active-fixed-deposits'), {
                    headers: getAuthHeaders(token)
                }).then(res => res.ok ? res.json() : { data: [], summary: { total_active_fds: 0, total_principal: 0 } }),
                // Get monthly interest distribution for interest payout
                fetch(buildApiUrl('/views/report/monthly-interest-distribution'), {
                    headers: getAuthHeaders(token)
                }).then(res => res.ok ? res.json() : { data: [], summary: { total_interest: 0 } })
            ]);

            // Calculate totals from the data
            const totalCustomers = Array.isArray(customers) ? customers.length : 0;
            const totalDeposits = activeFDs?.summary?.total_principal || 0;
            const monthlyInterestPayout = monthlyInterest?.summary?.total_interest || 0;
            const activeFDsCount = activeFDs?.summary?.total_active_fds || activeFDs?.data?.length || 0;

            return {
                totalBranches: branches.length,
                totalEmployees: employees.length,
                totalCustomers: totalCustomers,
                totalDeposits: totalDeposits,
                monthlyInterestPayout: monthlyInterestPayout,
                activeFDs: activeFDsCount,
                activeBranches: branches.filter(b => b.status).length,
                activeEmployees: employees.filter(e => e.status).length,
            };
        } catch (error) {
            console.error('Failed to compile system statistics:', error);
            // Return default values on error rather than throwing
            return {
                totalBranches: 0,
                totalEmployees: 0,
                totalCustomers: 0,
                totalDeposits: 0,
                monthlyInterestPayout: 0,
                activeFDs: 0,
                activeBranches: 0,
                activeEmployees: 0,
            };
        }
    }

    static async getCustomerCount(token: string): Promise<number> {
        try {
            const response = await fetch(buildApiUrl('/customers/'), {
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                console.error('Failed to fetch customers');
                return 0;
            }

            const customers = await response.json();
            return Array.isArray(customers) ? customers.length : 0;
        } catch (error) {
            console.error('Error fetching customer count:', error);
            return 0;
        }
    }

    static async getDepositTotals(token: string): Promise<{ totalSavings: number; totalFDs: number; totalDeposits: number }> {
        try {
            const activeFDsResponse = await fetch(buildApiUrl('/views/report/active-fixed-deposits'), {
                headers: getAuthHeaders(token)
            });

            if (!activeFDsResponse.ok) {
                return { totalSavings: 0, totalFDs: 0, totalDeposits: 0 };
            }

            const activeFDs = await activeFDsResponse.json();
            const totalFDs = activeFDs?.summary?.total_principal || 0;

            // For savings accounts, we'll need to calculate from account transactions or estimate
            // For now, we'll use the FD total as the main metric
            const totalDeposits = totalFDs;

            return {
                totalSavings: 0, // Can be implemented with a dedicated endpoint if needed
                totalFDs: totalFDs,
                totalDeposits: totalDeposits
            };
        } catch (error) {
            console.error('Error fetching deposit totals:', error);
            return { totalSavings: 0, totalFDs: 0, totalDeposits: 0 };
        }
    }

    static async getMonthlyInterestPayout(token: string): Promise<number> {
        try {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;

            const response = await fetch(
                buildApiUrl(`/views/report/monthly-interest-distribution?year=${currentYear}&month=${currentMonth}`),
                { headers: getAuthHeaders(token) }
            );

            if (!response.ok) {
                return 0;
            }

            const interestData = await response.json();
            return interestData?.summary?.total_interest || 0;
        } catch (error) {
            console.error('Error fetching monthly interest payout:', error);
            return 0;
        }
    }
}