import { buildApiUrl, getAuthHeaders } from '../config/api';

// Import the new reports service
import {
    ReportsService,
    type AgentTransaction,
    type AgentTransactionSummary,
    type AccountTransaction,
    type AccountTransactionSummary,
    type ActiveFixedDeposit,
    type ActiveFDSummary,
    type MonthlyInterestDistribution,
    type MonthlyInterestSummary,
    type CustomerActivity,
    type CustomerActivitySummary,
    type DateFilter,
    handleReportsError
} from './reportsService';

// Legacy type aliases for backward compatibility
export interface MyTransaction {
    employee_id: string;
    agent_name: string;
    branch_name: string;
    total_transactions: number;
    total_value: number;
    avg_transaction_value: number;
    last_transaction_date: string;
}

export interface MyTransactionSummary {
    total_agents: number;
    total_transactions: number;
    total_value: number;
    // Keep legacy properties for backward compatibility
    total_deposits?: number;
    total_withdrawals?: number;
    net_inflow?: number;
    transactions?: MyTransaction[];
}

export interface MyCustomer {
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
    // Legacy properties for backward compatibility
    phone_number?: string;
    email?: string;
    linked_accounts?: number;
    total_balance?: number;
    last_activity_date?: string;
    status?: 'Active' | 'Inactive';
}

export interface AccountDetail {
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
    // Legacy properties for backward compatibility
    account_id?: string;
    account_type?: string;
    minimum_balance?: number;
    status?: 'Active' | 'Inactive';
    interest_rate?: number;
}

export interface AccountDetailsWithHistory {
    account: AccountDetail;
    transactions: AccountDetail[]; // This represents the account transaction list from the report
    summary: {
        total_accounts: number;
        total_balance: number;
        average_balance: number;
    };
}

export interface LinkedFixedDeposit {
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
    // Legacy properties for backward compatibility
    linked_savings_account?: string;
    total_interest_credited?: number;
    status?: 'Active' | 'Matured';
    plan_months?: number;
}
export type { MonthlyInterestSummary, CustomerActivitySummary, DateFilter };

// Agent Reports Service using real backend APIs
export class AgentReportsService {
    /**
     * Get agent's transaction summary
     */
    static async getMyTransactionSummary(
        token: string,
        filters?: DateFilter
    ): Promise<{ summary: MyTransactionSummary; agents: MyTransaction[] }> {
        try {
            const response = await ReportsService.getAgentTransactions(token);

            // Transform the data to match the legacy interface
            return {
                summary: {
                    total_agents: response.summary.total_agents,
                    total_transactions: response.summary.total_transactions,
                    total_value: response.summary.total_value
                },
                agents: response.data.map(agent => ({
                    employee_id: agent.employee_id,
                    agent_name: agent.agent_name,
                    branch_name: agent.branch_name,
                    total_transactions: agent.total_transactions,
                    total_value: agent.total_value,
                    avg_transaction_value: agent.avg_transaction_value,
                    last_transaction_date: agent.last_transaction_date
                }))
            };
        } catch (error) {
            // Don't use handleReportsError here as it might cause redirects
            console.error('Error loading transaction summary:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to load transaction summary');
        }
    }    /**
     * Get list of agent's customers (using customer activity report)
     */
    static async getMyCustomers(token: string): Promise<MyCustomer[]> {
        try {
            const response = await ReportsService.getCustomerActivity(undefined, token);
            return response.data;
        } catch (error) {
            console.error('Error loading customers:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to load customers');
        }
    }

    /**
     * Get account details with transaction history
     */
    static async getAccountDetailsWithHistory(
        accountId: string,
        token: string,
        filters?: DateFilter
    ): Promise<AccountDetailsWithHistory> {
        try {
            const response = await ReportsService.getAccountTransactions(accountId, token);

            if (response.data.length === 0) {
                throw new Error('Account not found');
            }

            const account = response.data[0];

            // Return the account details in the expected format
            return {
                account,
                transactions: response.data,
                summary: response.summary
            };
        } catch (error) {
            console.error('Error loading account details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to load account details');
        }
    }

    /**
     * Get linked fixed deposits for agent's customers
     */
    static async getLinkedFixedDeposits(token: string): Promise<LinkedFixedDeposit[]> {
        try {
            const response = await ReportsService.getActiveFixedDeposits(token);
            // Map the API response to match the expected interface
            return response.data.map((fd: any) => ({
                ...fd,
                customer_names: fd.customer_name ? [fd.customer_name] : [],
                fd_id: fd.fixed_deposit_id,
                maturity_date: fd.end_date,
                status: fd.fd_status || 'Active',
                total_interest_credited: fd.total_interest || 0
            }));
        } catch (error) {
            console.error('Error loading fixed deposits:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to load fixed deposits');
        }
    }

    /**
     * Get monthly interest distribution summary
     */
    static async getMonthlyInterestSummary(
        token: string,
        month?: string
    ): Promise<MonthlyInterestDistribution[]> {
        try {
            let year: number | undefined;
            let monthNum: number | undefined;

            if (month) {
                const [yearStr, monthStr] = month.split('-');
                year = parseInt(yearStr);
                monthNum = parseInt(monthStr);
            }

            const response = await ReportsService.getMonthlyInterestDistribution(year, monthNum, token);
            return response.data;
        } catch (error) {
            console.error('Error loading monthly interest:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to load monthly interest distribution');
        }
    }

    /**
     * Get customer activity summary
     */
    static async getCustomerActivitySummary(
        token: string,
        filters?: DateFilter
    ): Promise<CustomerActivity[]> {
        try {
            const response = await ReportsService.getCustomerActivity(undefined, token);
            return response.data;
        } catch (error) {
            console.error('Error loading customer activity:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to load customer activity');
        }
    }    /**
     * Utility function to generate date filter options
     */
    static getDateFilterOptions(): { label: string; value: string }[] {
        return ReportsService.getDateFilterOptions();
    }

    /**
     * Utility function to format currency
     */
    static formatCurrency(amount: number): string {
        return ReportsService.formatCurrency(amount);
    }

    /**
     * Utility function to get date range for predefined periods
     */
    static getDateRange(period: string): { start_date: string; end_date: string } {
        return ReportsService.getDateRange(period);
    }
}

// Export the error handling utility
export { handleReportsError as handleAgentReportsError };