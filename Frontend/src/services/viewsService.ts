import { buildApiUrl, getAuthHeaders } from '../config/api';

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

// Type definitions for reports
export interface AgentTransactionSummary {
    employee_id: string;
    employee_name: string;
    branch_id: string;
    branch_name: string;
    total_transactions: number;
    total_value: number;
    employee_status: boolean;
}

export interface AgentTransactionReport {
    success: boolean;
    report_name: string;
    data: AgentTransactionSummary[];
    summary: {
        total_agents: number;
        total_transactions: number;
        total_value: number;
    };
    count: number;
}

export interface AccountTransactionSummary {
    saving_account_id: string;
    customer_id: string;
    customer_name: string;
    plan_name: string;
    open_date: string;
    current_balance: number;
    total_transactions: number;
    account_status: boolean;
    branch_name: string;
    agent_name: string;
    agent_id: string;
    branch_id: string;
}

export interface AccountTransactionReport {
    success: boolean;
    report_name: string;
    data: AccountTransactionSummary[];
    summary: {
        total_accounts: number;
        total_balance: number;
        average_balance: number;
    };
    count: number;
}

export interface ActiveFixedDeposit {
    fixed_deposit_id: string;
    saving_account_id: string;
    customer_name: string;
    customer_id: string;
    principal_amount: number;
    interest_rate: number;
    plan_months: number;
    start_date: string;
    end_date: string;
    next_payout_date: string | null;
    fd_status: string;
    total_interest: number;
    branch_name: string;
    agent_name: string;
    agent_id: string;
    branch_id: string;
    status: boolean;
}

export interface ActiveFixedDepositReport {
    success: boolean;
    report_name: string;
    data: ActiveFixedDeposit[];
    summary: {
        total_fds: number;
        total_principal_amount: number;
        total_expected_interest: number;
        pending_payouts: number;
    };
    count: number;
}

export interface MonthlyInterestDistribution {
    plan_name: string;
    month: string;
    year: number;
    month_num: number;
    branch_name: string;
    account_count: number;
    total_interest_paid: number;
    average_interest_per_account: number;
    min_interest: number;
    max_interest: number;
}

export interface MonthlyInterestDistributionReport {
    success: boolean;
    report_name: string;
    data: MonthlyInterestDistribution[];
    summary: {
        total_interest_paid: number;
        total_accounts_with_interest: number;
        unique_months: number;
    };
    count: number;
}

export interface CustomerActivity {
    customer_id: string;
    customer_name: string;
    total_accounts: number;
    total_deposits: number;
    total_withdrawals: number;
    net_change: number;
    current_total_balance: number;
    customer_status: boolean;
    branch_name: string;
    agent_name: string;
    agent_id: string;
    branch_id: string;
}

export interface CustomerActivityReport {
    success: boolean;
    report_name: string;
    data: CustomerActivity[];
    summary: {
        total_customers: number;
        total_deposits: number;
        total_withdrawals: number;
        total_current_balance: number;
        net_flow: number;
    };
    count: number;
}

export interface RefreshViewsResponse {
    success: boolean;
    message: string;
    refreshed_views: string[];
    refreshed_by: string;
    employee_id: string;
}

// Views/Reports Service
export class ViewsService {
    /**
     * Report 1: Agent-wise Transaction Summary
     * Shows total transactions and value per agent
     */
    static async getAgentTransactionReport(
        token: string,
        employeeId?: string
    ): Promise<AgentTransactionReport> {
        const url = employeeId
            ? buildApiUrl(`/views/report/agent-transactions?employee_id=${employeeId}`)
            : buildApiUrl('/views/report/agent-transactions');

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        return response.json();
    }

    /**
     * Report 2: Account-wise Transaction Summary
     * Shows transaction summary and current balance per account
     */
    static async getAccountTransactionReport(
        token: string,
        savingAccountId?: string,
        customerId?: string
    ): Promise<AccountTransactionReport> {
        const params = new URLSearchParams();
        if (savingAccountId) params.append('saving_account_id', savingAccountId);
        if (customerId) params.append('customer_id', customerId);

        const url = buildApiUrl(
            `/views/report/account-transactions${params.toString() ? '?' + params.toString() : ''}`
        );

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        return response.json();
    }

    /**
     * Report 3: Active Fixed Deposits with Payout Dates
     * Lists all active FDs and their next interest payout dates
     */
    static async getActiveFixedDeposits(token: string): Promise<ActiveFixedDepositReport> {
        const response = await fetch(buildApiUrl('/views/report/active-fixed-deposits'), {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        return response.json();
    }

    /**
     * Report 4: Monthly Interest Distribution Summary
     * Shows interest paid by month and account type
     */
    static async getMonthlyInterestDistribution(
        token: string,
        year?: number,
        month?: number
    ): Promise<MonthlyInterestDistributionReport> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());

        const url = buildApiUrl(
            `/views/report/monthly-interest-distribution${params.toString() ? '?' + params.toString() : ''}`
        );

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        return response.json();
    }

    /**
     * Report 5: Customer Activity Report
     * Shows customer deposits, withdrawals, and net balance
     */
    static async getCustomerActivityReport(
        token: string,
        customerId?: string
    ): Promise<CustomerActivityReport> {
        const url = customerId
            ? buildApiUrl(`/views/report/customer-activity?customer_id=${customerId}`)
            : buildApiUrl('/views/report/customer-activity');

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        return response.json();
    }

    /**
     * Refresh All Materialized Views
     * Only accessible to Branch Managers and Admins
     */
    static async refreshMaterializedViews(token: string): Promise<RefreshViewsResponse> {
        const response = await fetch(buildApiUrl('/views/refresh-views'), {
            method: 'POST',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(JSON.stringify(error));
        }

        return response.json();
    }
}
