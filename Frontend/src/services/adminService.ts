// Admin Service for AdminDashboard backend integration

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
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create employee');
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
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
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
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create fixed deposit plan');
        }

        return response.json();
    }
}

// System Statistics Service
export class SystemStatsService {
    static async getSystemStatistics(token: string): Promise<any> {
        try {
            // Get data from multiple endpoints to compile statistics
            const [branches, employees] = await Promise.all([
                BranchService.getAllBranches(token),
                EmployeeService.getAllEmployees(token),
            ]);

            return {
                totalBranches: branches.length,
                totalEmployees: employees.length,
                activeBranches: branches.filter(b => b.status).length,
                activeEmployees: employees.filter(e => e.status).length,
            };
        } catch (error) {
            throw new Error('Failed to compile system statistics');
        }
    }
}