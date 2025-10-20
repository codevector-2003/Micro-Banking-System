import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../config/api';

// Type definitions for Reports API responses
export interface AgentTransaction {
    employee_id: string;
    agent_name: string;
    branch_name: string;
    total_transactions: number;
    total_value: number;
    avg_transaction_value: number;
    last_transaction_date: string;
}

export interface AgentTransactionSummary {
    total_agents: number;
    total_transactions: number;
    total_value: number;
}

export interface AccountTransaction {
    saving_account_id: string;
    customer_id: string;
    customer_name: string;
    plan_name: string;
    current_balance: number;
    total_deposits: number;
    total_withdrawals: number;
    transaction_count: number;
    open_date: string;
    last_transaction_date: string;
    account_status: boolean;
    agent_name: string;
    branch_name: string;
}

export interface AccountTransactionSummary {
    total_accounts: number;
    total_balance: number;
    average_balance: number;
}

export interface ActiveFixedDeposit {
    fd_id: string;
    customer_names: string[];
    saving_account_id: string;
    principal_amount: number;
    interest_rate: number;
    start_date: string;
    maturity_date: string;
    plan_name: string;
    total_interest: number;
    next_payout_date: string;
    fd_status: string;
    agent_name: string;
    branch_name: string;
}

export interface ActiveFDSummary {
    total_fds: number;
    total_principal_amount: number;
    total_expected_interest: number;
    pending_payouts: number;
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

export interface MonthlyInterestSummary {
    total_interest_paid: number;
    total_accounts_with_interest: number;
    unique_months: number;
}

export interface CustomerActivity {
    customer_id: string;
    customer_name: string;
    total_deposits: number;
    total_withdrawals: number;
    current_total_balance: number;
    net_change: number;
    total_accounts: number;
    active_fd_count: number;
    registration_date: string;
    last_transaction_date: string;
    agent_name: string;
    branch_name: string;
}

export interface CustomerActivitySummary {
    total_customers: number;
    total_deposits: number;
    total_withdrawals: number;
    total_current_balance: number;
    net_flow: number;
}

export interface ReportResponse<T, S> {
    success: boolean;
    report_name: string;
    data: T[];
    summary: S;
    count: number;
}

export interface DateFilter {
    start_date?: string;
    end_date?: string;
    period?: 'this_week' | 'this_month' | 'last_month' | 'custom';
}

// Reports Service
export class ReportsService {
    private static baseURL = `${API_BASE_URL}/views/report`;

    // Create request headers with token parameter (similar to other services)
    private static getHeaders(token?: string): HeadersInit {
        console.log('ReportsService: Using token:', token ? `${token.substring(0, 20)}...` : 'No token provided');
        return getAuthHeaders(token);
    }    // Handle fetch responses with graceful error handling
    private static async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            if (response.status === 401) {
                // Don't automatically logout, just throw a user-friendly error
                throw new Error('Please ensure you are logged in to access reports');
            }

            let errorMessage = 'An error occurred';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    /**
     * Get agent transaction summary report
     */
    static async getAgentTransactions(token?: string, employeeId?: string): Promise<ReportResponse<AgentTransaction, AgentTransactionSummary>> {
        try {
            const params = new URLSearchParams();
            if (employeeId) {
                params.append('employee_id', employeeId);
            }

            const url = `${this.baseURL}/agent-transactions${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(token),
            });

            return this.handleResponse<ReportResponse<AgentTransaction, AgentTransactionSummary>>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get account transaction summary report
     */
    static async getAccountTransactions(
        token?: string,
        savingAccountId?: string,
        customerId?: string
    ): Promise<ReportResponse<AccountTransaction, AccountTransactionSummary>> {
        try {
            const params = new URLSearchParams();
            if (savingAccountId) {
                params.append('saving_account_id', savingAccountId);
            }
            if (customerId) {
                params.append('customer_id', customerId);
            }

            const url = `${this.baseURL}/account-transactions${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(token),
            });

            return this.handleResponse<ReportResponse<AccountTransaction, AccountTransactionSummary>>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get active fixed deposits report
     */
    static async getActiveFixedDeposits(token?: string): Promise<ReportResponse<ActiveFixedDeposit, ActiveFDSummary>> {
        try {
            const response = await fetch(`${this.baseURL}/active-fixed-deposits`, {
                method: 'GET',
                headers: this.getHeaders(token),
            });

            return this.handleResponse<ReportResponse<ActiveFixedDeposit, ActiveFDSummary>>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get monthly interest distribution report
     */
    static async getMonthlyInterestDistribution(
        year?: number,
        month?: number,
        token?: string
    ): Promise<ReportResponse<MonthlyInterestDistribution, MonthlyInterestSummary>> {
        try {
            const params = new URLSearchParams();
            if (year) {
                params.append('year', year.toString());
            }
            if (month) {
                params.append('month', month.toString());
            }

            const url = `${this.baseURL}/monthly-interest-distribution${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(token),
            });

            return this.handleResponse<ReportResponse<MonthlyInterestDistribution, MonthlyInterestSummary>>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get customer activity report
     */
    static async getCustomerActivity(customerId?: string, token?: string): Promise<ReportResponse<CustomerActivity, CustomerActivitySummary>> {
        try {
            const params = new URLSearchParams();
            if (customerId) {
                params.append('customer_id', customerId);
            }

            const url = `${this.baseURL}/customer-activity${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(token),
            });

            return this.handleResponse<ReportResponse<CustomerActivity, CustomerActivitySummary>>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Refresh materialized views (Branch Managers and Admins only)
     */
    static async refreshMaterializedViews(token?: string): Promise<{
        success: boolean;
        message: string;
        refreshed_views: string[];
        refreshed_by: string;
        employee_id: string;
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}/views/refresh-views`, {
                method: 'POST',
                headers: this.getHeaders(token),
            });

            return this.handleResponse<{
                success: boolean;
                message: string;
                refreshed_views: string[];
                refreshed_by: string;
                employee_id: string;
            }>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Utility function to get date range for predefined periods
     */
    static getDateRange(period: string): { start_date: string; end_date: string } {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'this_week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return {
                    start_date: startOfWeek.toISOString().split('T')[0],
                    end_date: endOfWeek.toISOString().split('T')[0]
                };

            case 'this_month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return {
                    start_date: startOfMonth.toISOString().split('T')[0],
                    end_date: endOfMonth.toISOString().split('T')[0]
                };

            case 'last_month':
                const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                return {
                    start_date: startOfLastMonth.toISOString().split('T')[0],
                    end_date: endOfLastMonth.toISOString().split('T')[0]
                };

            default:
                return {
                    start_date: today.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                };
        }
    }

    /**
     * Format currency
     */
    static formatCurrency(amount: number): string {
        return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Format date
     */
    static formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format datetime
     */
    static formatDateTime(dateString: string): string {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Handle API errors
     */
    private static handleError(error: any): Error {
        if (error instanceof Error) {
            return error;
        }
        return new Error('An unexpected error occurred');
    }

    /**
     * Get date filter options
     */
    static getDateFilterOptions(): { label: string; value: string }[] {
        return [
            { label: 'This Week', value: 'this_week' },
            { label: 'This Month', value: 'this_month' },
            { label: 'Last Month', value: 'last_month' },
            { label: 'Custom Range', value: 'custom' }
        ];
    }

    /**
     * Export data to CSV
     */
    static exportToCSV(data: any[], filename: string, headers?: string[]): void {
        if (!data.length) return;

        const csvHeaders = headers || Object.keys(data[0]);
        const csvContent = [
            csvHeaders.join(','),
            ...data.map(row =>
                csvHeaders.map(header => {
                    const value = row[header];
                    // Handle strings with commas
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Error handling utility
export const handleReportsError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred while loading reports';
};