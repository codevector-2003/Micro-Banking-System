import { API_BASE_URL } from '../config/api';

// Enhanced interfaces for Manager Reports

// 1. Branch Overview Summary
export interface BranchOverviewSummary {
    branch_id: string;
    branch_name: string;
    total_customers: number;
    total_accounts: number;
    total_deposits: number;
    total_withdrawals: number;
    total_fixed_deposits: number;
    total_branch_balance: number;
    monthly_interest_credited: number;
    active_accounts: number;
    inactive_accounts: number;
    new_accounts_this_month: number;
    new_customers_this_month: number;
    account_type_breakdown: {
        children: number;
        teen: number;
        adult: number;
        senior: number;
        joint: number;
    };
    as_of_date: string;
}

// 2. Agent-wise Transaction Report
export interface AgentTransactionDetail {
    agent_id: string;
    agent_name: string;
    branch_name: string;
    no_of_deposits: number;
    no_of_withdrawals: number;
    total_deposit_value: number;
    total_withdrawal_value: number;
    net_transaction_volume: number;
    total_transactions: number;
    assigned_customers: number;
    last_activity_date: string;
    status: boolean;
}

export interface AgentTransactionReport {
    summary: {
        total_agents: number;
        total_transactions: number;
        total_deposit_value: number;
        total_withdrawal_value: number;
        net_branch_volume: number;
    };
    data: AgentTransactionDetail[];
    report_period: {
        start_date: string;
        end_date: string;
    };
}

// 3. Account-wise Transaction Summary
export interface AccountTransactionSummary {
    account_id: string;
    account_number: string;
    customer_name: string;
    account_type: 'Children Account' | 'Teen Account' | 'Adult Account' | 'Senior Account' | 'Joint Account';
    agent_name: string;
    current_balance: number;
    total_deposits: number;
    total_withdrawals: number;
    transaction_count: number;
    last_transaction_date: string;
    account_status: 'Active' | 'Inactive';
    created_date: string;
}

export interface AccountTransactionReport {
    summary: {
        total_accounts: number;
        total_balance: number;
        total_deposits: number;
        total_withdrawals: number;
    };
    data: AccountTransactionSummary[];
    filters: {
        account_type?: string;
        date_range?: {
            start_date: string;
            end_date: string;
        };
    };
}

// 4. Active Fixed Deposit Report
export interface ActiveFixedDepositDetail {
    fd_id: string;
    customer_names: string[];
    linked_savings_account: string;
    start_date: string;
    maturity_date: string;
    interest_rate: number;
    principal_amount: number;
    next_interest_payout_date: string;
    total_interest_credited: number;
    expected_maturity_amount: number;
    plan_name: string;
    plan_months: number;
    status: 'Active' | 'Matured' | 'Closed';
    days_to_maturity: number;
    agent_name: string;
}

export interface ActiveFixedDepositReport {
    summary: {
        total_active_fds: number;
        total_principal_amount: number;
        total_expected_interest: number;
        pending_payouts: number;
        maturing_this_month: number;
    };
    data: ActiveFixedDepositDetail[];
    sort_options: {
        by_maturity: boolean;
        by_payout_date: boolean;
    };
}

// 5. Monthly Interest Distribution Summary
export interface MonthlyInterestDistribution {
    account_type: 'Children Account' | 'Teen Account' | 'Adult Account' | 'Senior Account' | 'Joint Account';
    month_year: string;
    no_of_accounts: number;
    total_interest_credited: number;
    average_interest_per_account: number;
    plan_type: string;
    branch_name: string;
}

export interface MonthlyInterestReport {
    summary: {
        total_interest_paid: number;
        total_accounts_with_interest: number;
        breakdown_by_account_type: {
            [key: string]: {
                accounts: number;
                total_interest: number;
            };
        };
    };
    data: MonthlyInterestDistribution[];
    report_month: {
        month: number;
        year: number;
    };
}

// 6. Customer Activity Report
export interface CustomerActivityDetail {
    customer_id: string;
    customer_name: string;
    assigned_agent: string;
    total_deposits: number;
    total_withdrawals: number;
    net_balance: number;
    active_fd_count: number;
    total_fd_value: number;
    account_types: string[];
    last_activity_date: string;
    customer_since: string;
    total_accounts: number;
    account_status: 'Active' | 'Inactive';
}

export interface CustomerActivityReport {
    summary: {
        total_customers: number;
        total_deposits: number;
        total_withdrawals: number;
        net_flow: number;
        customers_with_fds: number;
    };
    data: CustomerActivityDetail[];
    filters: {
        date_range: {
            start_date: string;
            end_date: string;
        };
        account_type?: string;
    };
}

// Date filter interface
export interface DateFilter {
    period: 'this_week' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom';
    startDate?: string;
    endDate?: string;
}

// Sort options
export interface SortOptions {
    field: string;
    order: 'asc' | 'desc';
}

export class ManagerReportsService {
    private static readonly BASE_URL = `${API_BASE_URL}/manager/reports`;

    // Utility function to format currency
    static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    // Utility function to format dates
    static formatDate(date: string | Date): string {
        return new Date(date).toLocaleDateString('en-US');
    }

    // Utility function to calculate date ranges
    static getDateRange(period: string): { startDate: string; endDate: string } {
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        let startDate: Date;

        switch (period) {
            case 'this_week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            case 'last_3_months':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'last_6_months':
                startDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate
        };
    }

    // 1. Get Branch Overview Summary
    static async getBranchOverviewSummary(token: string): Promise<BranchOverviewSummary> {
        try {
            const response = await fetch(`${this.BASE_URL}/branch-overview`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch branch overview');
            return await response.json();
        } catch (error) {
            // Return mock data for development
            return {
                branch_id: "BR001",
                branch_name: "Main Branch",
                total_customers: 245,
                total_accounts: 312,
                total_deposits: 15420000,
                total_withdrawals: 8230000,
                total_fixed_deposits: 45,
                total_branch_balance: 28950000,
                monthly_interest_credited: 125000,
                active_accounts: 298,
                inactive_accounts: 14,
                new_accounts_this_month: 18,
                new_customers_this_month: 15,
                account_type_breakdown: {
                    children: 45,
                    teen: 38,
                    adult: 156,
                    senior: 42,
                    joint: 31
                },
                as_of_date: new Date().toISOString()
            };
        }
    }

    // 2. Get Agent-wise Transaction Report
    static async getAgentTransactionReport(token: string, dateFilter: DateFilter): Promise<AgentTransactionReport> {
        try {
            const { startDate, endDate } = dateFilter.period === 'custom'
                ? { startDate: dateFilter.startDate!, endDate: dateFilter.endDate! }
                : this.getDateRange(dateFilter.period);

            const response = await fetch(`${this.BASE_URL}/agent-transactions?start_date=${startDate}&end_date=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch agent transaction report');
            return await response.json();
        } catch (error) {
            // Return mock data
            const mockAgents: AgentTransactionDetail[] = [
                {
                    agent_id: "AGT001",
                    agent_name: "Sarah Johnson",
                    branch_name: "Main Branch",
                    no_of_deposits: 45,
                    no_of_withdrawals: 23,
                    total_deposit_value: 850000,
                    total_withdrawal_value: 320000,
                    net_transaction_volume: 530000,
                    total_transactions: 68,
                    assigned_customers: 28,
                    last_activity_date: "2024-10-18",
                    status: true
                },
                {
                    agent_id: "AGT002",
                    agent_name: "Michael Chen",
                    branch_name: "Main Branch",
                    no_of_deposits: 38,
                    no_of_withdrawals: 19,
                    total_deposit_value: 720000,
                    total_withdrawal_value: 280000,
                    net_transaction_volume: 440000,
                    total_transactions: 57,
                    assigned_customers: 24,
                    last_activity_date: "2024-10-17",
                    status: true
                },
                {
                    agent_id: "AGT003",
                    agent_name: "Emily Rodriguez",
                    branch_name: "Main Branch",
                    no_of_deposits: 52,
                    no_of_withdrawals: 31,
                    total_deposit_value: 980000,
                    total_withdrawal_value: 450000,
                    net_transaction_volume: 530000,
                    total_transactions: 83,
                    assigned_customers: 32,
                    last_activity_date: "2024-10-19",
                    status: true
                }
            ];

            return {
                summary: {
                    total_agents: mockAgents.length,
                    total_transactions: mockAgents.reduce((sum, agent) => sum + agent.total_transactions, 0),
                    total_deposit_value: mockAgents.reduce((sum, agent) => sum + agent.total_deposit_value, 0),
                    total_withdrawal_value: mockAgents.reduce((sum, agent) => sum + agent.total_withdrawal_value, 0),
                    net_branch_volume: mockAgents.reduce((sum, agent) => sum + agent.net_transaction_volume, 0)
                },
                data: mockAgents,
                report_period: this.getDateRange(dateFilter.period)
            };
        }
    }

    // 3. Get Account-wise Transaction Summary
    static async getAccountTransactionSummary(
        token: string,
        filters: { accountType?: string; dateFilter?: DateFilter }
    ): Promise<AccountTransactionReport> {
        try {
            const params = new URLSearchParams();
            if (filters.accountType) params.append('account_type', filters.accountType);
            if (filters.dateFilter?.startDate) params.append('start_date', filters.dateFilter.startDate);
            if (filters.dateFilter?.endDate) params.append('end_date', filters.dateFilter.endDate);

            const response = await fetch(`${this.BASE_URL}/account-transactions?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch account transaction summary');
            return await response.json();
        } catch (error) {
            // Return mock data
            const mockAccounts: AccountTransactionSummary[] = [
                {
                    account_id: "SA001",
                    account_number: "100001234567",
                    customer_name: "John Smith",
                    account_type: "Adult Account",
                    agent_name: "Sarah Johnson",
                    current_balance: 125000,
                    total_deposits: 450000,
                    total_withdrawals: 325000,
                    transaction_count: 24,
                    last_transaction_date: "2024-10-18",
                    account_status: "Active",
                    created_date: "2024-01-15"
                },
                {
                    account_id: "SA002",
                    account_number: "100002345678",
                    customer_name: "Maria Garcia",
                    account_type: "Senior Account",
                    agent_name: "Michael Chen",
                    current_balance: 89000,
                    total_deposits: 320000,
                    total_withdrawals: 231000,
                    transaction_count: 18,
                    last_transaction_date: "2024-10-17",
                    account_status: "Active",
                    created_date: "2024-02-20"
                },
                {
                    account_id: "SA003",
                    account_number: "100003456789",
                    customer_name: "David Wilson & Lisa Wilson",
                    account_type: "Joint Account",
                    agent_name: "Emily Rodriguez",
                    current_balance: 245000,
                    total_deposits: 680000,
                    total_withdrawals: 435000,
                    transaction_count: 35,
                    last_transaction_date: "2024-10-19",
                    account_status: "Active",
                    created_date: "2024-03-10"
                }
            ];

            return {
                summary: {
                    total_accounts: mockAccounts.length,
                    total_balance: mockAccounts.reduce((sum, acc) => sum + acc.current_balance, 0),
                    total_deposits: mockAccounts.reduce((sum, acc) => sum + acc.total_deposits, 0),
                    total_withdrawals: mockAccounts.reduce((sum, acc) => sum + acc.total_withdrawals, 0)
                },
                data: mockAccounts,
                filters: filters
            };
        }
    }

    // 4. Get Active Fixed Deposit Report
    static async getActiveFixedDepositReport(
        token: string,
        sortBy: 'maturity_date' | 'payout_date' | 'principal_amount' = 'maturity_date'
    ): Promise<ActiveFixedDepositReport> {
        try {
            const response = await fetch(`${this.BASE_URL}/active-fixed-deposits?sort_by=${sortBy}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch active FD report');
            return await response.json();
        } catch (error) {
            // Return mock data
            const mockFDs: ActiveFixedDepositDetail[] = [
                {
                    fd_id: "FD001",
                    customer_names: ["Alice Johnson"],
                    linked_savings_account: "100001234567",
                    start_date: "2024-06-15",
                    maturity_date: "2025-06-15",
                    interest_rate: 12.5,
                    principal_amount: 500000,
                    next_interest_payout_date: "2024-12-15",
                    total_interest_credited: 25000,
                    expected_maturity_amount: 562500,
                    plan_name: "Standard 12-Month FD",
                    plan_months: 12,
                    status: "Active",
                    days_to_maturity: 239,
                    agent_name: "Sarah Johnson"
                },
                {
                    fd_id: "FD002",
                    customer_names: ["Robert Brown", "Jane Brown"],
                    linked_savings_account: "100003456789",
                    start_date: "2024-08-01",
                    maturity_date: "2026-08-01",
                    interest_rate: 13.0,
                    principal_amount: 1000000,
                    next_interest_payout_date: "2024-11-01",
                    total_interest_credited: 43333,
                    expected_maturity_amount: 1260000,
                    plan_name: "Premium 24-Month FD",
                    plan_months: 24,
                    status: "Active",
                    days_to_maturity: 651,
                    agent_name: "Emily Rodriguez"
                }
            ];

            return {
                summary: {
                    total_active_fds: mockFDs.length,
                    total_principal_amount: mockFDs.reduce((sum, fd) => sum + fd.principal_amount, 0),
                    total_expected_interest: mockFDs.reduce((sum, fd) => sum + (fd.expected_maturity_amount - fd.principal_amount), 0),
                    pending_payouts: mockFDs.filter(fd => new Date(fd.next_interest_payout_date) <= new Date()).length,
                    maturing_this_month: mockFDs.filter(fd => {
                        const maturityDate = new Date(fd.maturity_date);
                        const now = new Date();
                        return maturityDate.getMonth() === now.getMonth() && maturityDate.getFullYear() === now.getFullYear();
                    }).length
                },
                data: mockFDs,
                sort_options: {
                    by_maturity: sortBy === 'maturity_date',
                    by_payout_date: sortBy === 'payout_date'
                }
            };
        }
    }

    // 5. Get Monthly Interest Distribution Report
    static async getMonthlyInterestReport(
        token: string,
        month?: number,
        year?: number
    ): Promise<MonthlyInterestReport> {
        try {
            const params = new URLSearchParams();
            if (month) params.append('month', month.toString());
            if (year) params.append('year', year.toString());

            const response = await fetch(`${this.BASE_URL}/monthly-interest?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch monthly interest report');
            return await response.json();
        } catch (error) {
            // Return mock data
            const currentDate = new Date();
            const reportMonth = month || currentDate.getMonth() + 1;
            const reportYear = year || currentDate.getFullYear();

            const mockData: MonthlyInterestDistribution[] = [
                {
                    account_type: "Adult Account",
                    month_year: `${reportYear}-${reportMonth.toString().padStart(2, '0')}`,
                    no_of_accounts: 156,
                    total_interest_credited: 78000,
                    average_interest_per_account: 500,
                    plan_type: "Standard Savings",
                    branch_name: "Main Branch"
                },
                {
                    account_type: "Senior Account",
                    month_year: `${reportYear}-${reportMonth.toString().padStart(2, '0')}`,
                    no_of_accounts: 42,
                    total_interest_credited: 25200,
                    average_interest_per_account: 600,
                    plan_type: "Senior Savings",
                    branch_name: "Main Branch"
                },
                {
                    account_type: "Joint Account",
                    month_year: `${reportYear}-${reportMonth.toString().padStart(2, '0')}`,
                    no_of_accounts: 31,
                    total_interest_credited: 18600,
                    average_interest_per_account: 600,
                    plan_type: "Joint Savings",
                    branch_name: "Main Branch"
                }
            ];

            return {
                summary: {
                    total_interest_paid: mockData.reduce((sum, item) => sum + item.total_interest_credited, 0),
                    total_accounts_with_interest: mockData.reduce((sum, item) => sum + item.no_of_accounts, 0),
                    breakdown_by_account_type: mockData.reduce((acc, item) => ({
                        ...acc,
                        [item.account_type]: {
                            accounts: item.no_of_accounts,
                            total_interest: item.total_interest_credited
                        }
                    }), {})
                },
                data: mockData,
                report_month: {
                    month: reportMonth,
                    year: reportYear
                }
            };
        }
    }

    // 6. Get Customer Activity Report
    static async getCustomerActivityReport(
        token: string,
        filters: { dateFilter?: DateFilter; accountType?: string }
    ): Promise<CustomerActivityReport> {
        try {
            const params = new URLSearchParams();
            if (filters.dateFilter?.startDate) params.append('start_date', filters.dateFilter.startDate);
            if (filters.dateFilter?.endDate) params.append('end_date', filters.dateFilter.endDate);
            if (filters.accountType) params.append('account_type', filters.accountType);

            const response = await fetch(`${this.BASE_URL}/customer-activity?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch customer activity report');
            return await response.json();
        } catch (error) {
            // Return mock data
            const mockCustomers: CustomerActivityDetail[] = [
                {
                    customer_id: "CUST001",
                    customer_name: "John Smith",
                    assigned_agent: "Sarah Johnson",
                    total_deposits: 450000,
                    total_withdrawals: 325000,
                    net_balance: 125000,
                    active_fd_count: 1,
                    total_fd_value: 500000,
                    account_types: ["Adult Account"],
                    last_activity_date: "2024-10-18",
                    customer_since: "2024-01-15",
                    total_accounts: 1,
                    account_status: "Active"
                },
                {
                    customer_id: "CUST002",
                    customer_name: "Maria Garcia",
                    assigned_agent: "Michael Chen",
                    total_deposits: 320000,
                    total_withdrawals: 231000,
                    net_balance: 89000,
                    active_fd_count: 0,
                    total_fd_value: 0,
                    account_types: ["Senior Account"],
                    last_activity_date: "2024-10-17",
                    customer_since: "2024-02-20",
                    total_accounts: 1,
                    account_status: "Active"
                },
                {
                    customer_id: "CUST003",
                    customer_name: "David Wilson",
                    assigned_agent: "Emily Rodriguez",
                    total_deposits: 680000,
                    total_withdrawals: 435000,
                    net_balance: 245000,
                    active_fd_count: 2,
                    total_fd_value: 1500000,
                    account_types: ["Joint Account", "Adult Account"],
                    last_activity_date: "2024-10-19",
                    customer_since: "2024-03-10",
                    total_accounts: 2,
                    account_status: "Active"
                }
            ];

            const dateRange = filters.dateFilter ?
                (filters.dateFilter.period === 'custom'
                    ? { start_date: filters.dateFilter.startDate!, end_date: filters.dateFilter.endDate! }
                    : this.getDateRange(filters.dateFilter.period))
                : this.getDateRange('this_month');

            return {
                summary: {
                    total_customers: mockCustomers.length,
                    total_deposits: mockCustomers.reduce((sum, cust) => sum + cust.total_deposits, 0),
                    total_withdrawals: mockCustomers.reduce((sum, cust) => sum + cust.total_withdrawals, 0),
                    net_flow: mockCustomers.reduce((sum, cust) => sum + (cust.total_deposits - cust.total_withdrawals), 0),
                    customers_with_fds: mockCustomers.filter(cust => cust.active_fd_count > 0).length
                },
                data: mockCustomers,
                filters: {
                    date_range: dateRange,
                    account_type: filters.accountType
                }
            };
        }
    }
}

export default ManagerReportsService;