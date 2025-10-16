import { buildApiUrl, getAuthHeaders } from '../config/api';

// Types for Agent Dashboard API calls
export interface Customer {
    customer_id: string;
    name: string;
    nic: string;
    phone_number: string;
    address: string;
    date_of_birth: string;
    email?: string;
    status: boolean;
    employee_id: string;
}

export interface SavingsAccount {
    saving_account_id: string;
    open_date: string;
    balance: number;
    employee_id: string;
    s_plan_id: string;
    status: boolean;
    branch_id: string;
    customer_id: string;
    customer_name: string;
    customer_nic: string;
}

export interface Transaction {
    transaction_id: number;
    holder_id: string;
    type: 'Deposit' | 'Withdrawal' | 'Interest';
    amount: number;
    timestamp: string;
    ref_number?: number;
    description?: string;
    saving_account_id?: string; // Added to identify which account the transaction belongs to
}

export interface FixedDeposit {
    fixed_deposit_id: string;
    saving_account_id: string;
    f_plan_id: string;
    start_date: string;
    end_date: string;
    principal_amount: number;
    interest_payment_type: boolean;
    last_payout_date?: string;
    status: boolean;
}

export interface FixedDepositPlan {
    f_plan_id: string;
    months: number;
    interest_rate: number;
}

export interface JointAccount {
    saving_account_id: string;
    holder_ids: string[];
    customer_names: string[];
    customer_nics: string[];
}

// Customer Service
export class CustomerService {
    static async createCustomer(customer: Omit<Customer, 'customer_id' | 'employee_id'>, token: string): Promise<Customer> {
        const response = await fetch(buildApiUrl('/customers/customer/'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(customer),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create customer');
        }

        return response.json();
    }

    static async searchCustomers(searchQuery: {
        customer_id?: string;
        nic?: string;
        name?: string;
        phone_number?: string;
    }, token: string): Promise<Customer[]> {
        const response = await fetch(buildApiUrl('/customers/customer/search'), {
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

    static async getAllCustomers(token: string): Promise<Customer[]> {
        const response = await fetch(buildApiUrl('/customers/customers/'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch customers');
        }

        return response.json();
    }

    static async updateCustomer(customerId: string, updates: Partial<Customer>, token: string): Promise<Customer> {
        const response = await fetch(buildApiUrl('/customers/customer/update'), {
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

// Savings Account Service
export class SavingsAccountService {
    static async createSavingsAccount(accountData: {
        open_date: string;
        balance: number;
        s_plan_id: string;
        status: boolean;
    }, customerId: string, token: string): Promise<SavingsAccount> {
        const response = await fetch(buildApiUrl(`/saving-accounts/saving-account?customer_id=${customerId}`), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(accountData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create savings account');
        }

        return response.json();
    }

    static async searchSavingsAccounts(searchQuery: {
        nic?: string;
        customer_id?: string;
        saving_account_id?: string;
    }, token: string): Promise<SavingsAccount[]> {
        const response = await fetch(buildApiUrl('/saving-accounts/saving-account/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(searchQuery),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Savings account search failed');
        }

        return response.json();
    }
}

// Transaction Service
export class TransactionService {
    static async getAccountHolder(savingAccountId: string, token: string): Promise<{ holder_id: string, customer_id: string, saving_account_id: string }> {
        const response = await fetch(buildApiUrl(`/saving-accounts/holder/${savingAccountId}`), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get account holder');
        }

        return response.json();
    }

    static async createTransaction(transactionData: {
        saving_account_id: string;
        type: 'Deposit' | 'Withdrawal' | 'Interest';
        amount: number;
        description?: string;
    }, token: string): Promise<Transaction> {
        // First get the holder_id for this saving account
        const accountHolder = await this.getAccountHolder(transactionData.saving_account_id, token);

        // Create transaction with the holder_id
        const response = await fetch(buildApiUrl('/transactions/transaction'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({
                holder_id: accountHolder.holder_id,
                type: transactionData.type,
                amount: transactionData.amount,
                description: transactionData.description
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create transaction');
        }

        return response.json();
    }

    static async getTransactionHistory(savingAccountId: string, token: string): Promise<Transaction[]> {
        const response = await fetch(buildApiUrl('/transactions/transaction/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ saving_account_id: savingAccountId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch transaction history');
        }

        return response.json();
    }
}

// Fixed Deposit Service
export class FixedDepositService {
    static async createFixedDeposit(fdData: {
        saving_account_id: string;
        f_plan_id: string;
        principal_amount: number;
        interest_payment_type: boolean;
    }, token: string): Promise<FixedDeposit> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({
                ...fdData,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(), // Backend calculates this
                status: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create fixed deposit');
        }

        return response.json();
    }

    static async getFixedDepositPlans(token: string): Promise<FixedDepositPlan[]> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit-plan'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch FD plans');
        }

        return response.json();
    }

    static async searchFixedDeposits(savingAccountId: string, token: string): Promise<FixedDeposit[]> {
        const response = await fetch(buildApiUrl('/fixed-deposits/fixed-deposit/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ saving_account_id: savingAccountId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to search fixed deposits');
        }

        return response.json();
    }
}

// Joint Account Service
export class JointAccountService {
    static async createJointAccount(jointAccountData: {
        primary_customer_id: string;
        secondary_customer_id: string;
        initial_balance: number;
        s_plan_id: string;
    }, token: string): Promise<JointAccount> {
        const response = await fetch(buildApiUrl('/joint-accounts/joint-account'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(jointAccountData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create joint account');
        }

        return response.json();
    }

    static async searchJointAccount(savingAccountId: string, token: string): Promise<JointAccount> {
        const response = await fetch(buildApiUrl('/joint-accounts/joint-account/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ saving_account_id: savingAccountId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to search joint account');
        }

        return response.json();
    }

    static async getAllJointAccounts(token: string): Promise<JointAccount[]> {
        const response = await fetch(buildApiUrl('/joint-accounts/joint-accounts'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch joint accounts');
        }

        return response.json();
    }
}

// Employee and Branch info for Agent Dashboard
export interface EmployeeInfo {
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

export interface BranchInfo {
    branch_id: string;
    branch_name: string;
    location: string;
    branch_phone_number: string;
    status: boolean;
}

export interface ManagerInfo {
    name: string;
    employee_id: string | null;
}

export interface MyEmployeeInfo {
    employee: EmployeeInfo;
    branch: BranchInfo;
    manager: ManagerInfo | null;
}

// Employee Service for Agent Dashboard
export class EmployeeService {
    static async getMyInfo(token: string): Promise<MyEmployeeInfo> {
        const response = await fetch(buildApiUrl('/employees/employee/my-info'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch employee information');
        }

        return response.json();
    }

    static async getEmployeeInfo(employeeId: string, token: string): Promise<EmployeeInfo> {
        const response = await fetch(buildApiUrl('/employees/employee/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ employee_id: employeeId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch employee information');
        }

        const employees = await response.json();
        if (employees.length === 0) {
            throw new Error('Employee not found');
        }

        return employees[0];
    }
}

// Branch Service for Agent Dashboard
export class BranchService {
    static async getBranchInfo(branchId: string, token: string): Promise<BranchInfo> {
        const response = await fetch(buildApiUrl(`/branches/branch/${branchId}`), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch information');
        }

        return response.json();
    }

    static async getBranchManager(branchId: string, token: string): Promise<EmployeeInfo | null> {
        // First get all employees in the branch
        const response = await fetch(buildApiUrl('/employees/employee/search'), {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({
                branch_id: branchId
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch branch employees');
        }

        const employees = await response.json();
        // Filter for managers (or branch managers) on the frontend
        const managers = employees.filter((emp: EmployeeInfo) =>
            emp.type.toLowerCase().includes('manager') ||
            emp.type.toLowerCase() === 'branch manager' ||
            emp.type.toLowerCase() === 'manager'
        );

        return managers.length > 0 ? managers[0] : null;
    }
}

// Utility function to handle API errors
export const handleApiError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};