import { buildApiUrl, getAuthHeaders } from '../config/api';

// Type definitions for Agent Reports
export interface MyTransaction {
    transaction_id: string;
    date_time: string;
    customer_name: string;
    account_number: string;
    transaction_type: 'Deposit' | 'Withdrawal' | 'Interest';
    amount: number;
    reference_number: string;
    status: 'Completed' | 'Pending' | 'Failed';
}

export interface MyTransactionSummary {
    total_transactions: number;
    total_deposits: number;
    total_withdrawals: number;
    net_inflow: number;
    transactions: MyTransaction[];
}

export interface MyCustomer {
    customer_id: string;
    customer_name: string;
    phone_number: string;
    email: string;
    registration_date: string;
    linked_accounts: number;
    total_balance: number;
    last_transaction_date?: string;
    status: 'Active' | 'Inactive';
}

export interface AccountDetail {
    account_id: string;
    account_type: string;
    current_balance: number;
    minimum_balance: number;
    open_date: string;
    status: 'Active' | 'Inactive';
    plan_name: string;
    interest_rate: number;
}

export interface AccountTransaction {
    transaction_id: string;
    date_time: string;
    transaction_type: 'Deposit' | 'Withdrawal' | 'Interest';
    amount: number;
    reference_number: string;
    description: string;
    balance_after: number;
}

export interface AccountDetailsWithHistory {
    account: AccountDetail;
    transactions: AccountTransaction[];
    summary: {
        total_transactions: number;
        total_deposits: number;
        total_withdrawals: number;
    };
}

export interface LinkedFixedDeposit {
    fd_id: string;
    customer_names: string[];
    linked_savings_account: string;
    principal_amount: number;
    start_date: string;
    maturity_date: string;
    interest_rate: number;
    next_payout_date: string;
    total_interest_credited: number;
    status: 'Active' | 'Matured';
    plan_months: number;
}

export interface MonthlyInterestSummary {
    month_year: string;
    account_type: string;
    accounts_credited: number;
    total_interest_credited: number;
    credit_batch_date: string;
    average_interest_per_account: number;
}

export interface CustomerActivitySummary {
    customer_id: string;
    customer_name: string;
    total_deposits: number;
    total_withdrawals: number;
    net_balance: number;
    active_fd_count: number;
    fd_total_value: number;
    last_activity_date: string;
    account_types: string[];
}

export interface DateFilter {
    start_date?: string;
    end_date?: string;
    period?: 'this_week' | 'this_month' | 'last_month' | 'custom';
}

// Agent Reports Service with hardcoded data for development
export class AgentReportsService {
    /**
     * Get agent's transaction summary from the customer activity report
     */
    static async getMyTransactionSummary(
        token: string,
        filters?: DateFilter
    ): Promise<MyTransactionSummary> {
        try {
            // Use the customer activity report to get transaction summary
            const response = await fetch(buildApiUrl('/views/report/customer-activity'), {
                method: 'GET',
                headers: getAuthHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch transaction summary: ${response.statusText}`);
            }

            const report = await response.json();

            // Calculate totals from customer activity data
            let totalDeposits = 0;
            let totalWithdrawals = 0;
            const transactions: MyTransaction[] = [];

            if (report.data) {
                report.data.forEach((customer: any) => {
                    totalDeposits += customer.total_deposits || 0;
                    totalWithdrawals += customer.total_withdrawals || 0;
                });
            }

            return {
                total_transactions: (report.summary?.total_deposits || 0) + (report.summary?.total_withdrawals || 0),
                total_deposits: report.summary?.total_deposits || 0,
                total_withdrawals: report.summary?.total_withdrawals || 0,
                net_inflow: report.summary?.net_flow || 0,
                transactions: transactions, // Empty for now - would need separate endpoint
            };
        } catch (error) {
            console.error('Error fetching transaction summary:', error);
            // Return default values on error
            return {
                total_transactions: 0,
                total_deposits: 0,
                total_withdrawals: 0,
                net_inflow: 0,
                transactions: [],
            };
        }
    }

    /**
     * Get agent's transaction summary (old hardcoded version)
     */
    static async getMyTransactionSummaryHardcoded(
        token: string,
        filters?: DateFilter
    ): Promise<MyTransactionSummary> {
        // Simulated API call - replace with actual API when backend is ready
        return new Promise((resolve) => {
            setTimeout(() => {
                const transactions: MyTransaction[] = [
                    {
                        transaction_id: 'TXN001',
                        date_time: '2024-10-19 10:30:00',
                        customer_name: 'John Doe',
                        account_number: 'SA001',
                        transaction_type: 'Deposit',
                        amount: 25000,
                        reference_number: 'REF001',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN002',
                        date_time: '2024-10-19 11:15:00',
                        customer_name: 'Jane Smith',
                        account_number: 'SA002',
                        transaction_type: 'Withdrawal',
                        amount: 15000,
                        reference_number: 'REF002',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN003',
                        date_time: '2024-10-19 14:20:00',
                        customer_name: 'Michael Johnson',
                        account_number: 'SA003',
                        transaction_type: 'Deposit',
                        amount: 50000,
                        reference_number: 'REF003',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN004',
                        date_time: '2024-10-18 16:45:00',
                        customer_name: 'Sarah Williams',
                        account_number: 'SA004',
                        transaction_type: 'Withdrawal',
                        amount: 8000,
                        reference_number: 'REF004',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN005',
                        date_time: '2024-10-18 09:30:00',
                        customer_name: 'David Brown',
                        account_number: 'SA005',
                        transaction_type: 'Deposit',
                        amount: 75000,
                        reference_number: 'REF005',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN006',
                        date_time: '2024-10-17 13:10:00',
                        customer_name: 'Emma Davis',
                        account_number: 'SA006',
                        transaction_type: 'Interest',
                        amount: 1250,
                        reference_number: 'REF006',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN007',
                        date_time: '2024-10-17 15:30:00',
                        customer_name: 'Robert Wilson',
                        account_number: 'SA007',
                        transaction_type: 'Deposit',
                        amount: 35000,
                        reference_number: 'REF007',
                        status: 'Completed'
                    },
                    {
                        transaction_id: 'TXN008',
                        date_time: '2024-10-16 11:45:00',
                        customer_name: 'Lisa Garcia',
                        account_number: 'SA008',
                        transaction_type: 'Withdrawal',
                        amount: 22000,
                        reference_number: 'REF008',
                        status: 'Completed'
                    }
                ];

                const deposits = transactions.filter(t => t.transaction_type === 'Deposit');
                const withdrawals = transactions.filter(t => t.transaction_type === 'Withdrawal');
                const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
                const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);

                resolve({
                    total_transactions: transactions.length,
                    total_deposits: totalDeposits,
                    total_withdrawals: totalWithdrawals,
                    net_inflow: totalDeposits - totalWithdrawals,
                    transactions
                });
            }, 500);
        });
    }

    /**
     * Get list of agent's customers with their account information
     */
    static async getMyCustomers(token: string): Promise<MyCustomer[]> {
        try {
            // Get all customers for the logged-in agent
            const response = await fetch(buildApiUrl('/customers/'), {
                method: 'GET',
                headers: getAuthHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch customers: ${response.statusText}`);
            }

            const customers = await response.json();

            // Transform the data to match MyCustomer interface
            const myCustomers: MyCustomer[] = await Promise.all(
                customers.map(async (customer: any) => {
                    // Get account statistics for each customer
                    let linkedAccounts = 0;
                    let totalBalance = 0;
                    let lastTransactionDate: string | undefined;

                    try {
                        // Search for accounts by customer
                        const accountResponse = await fetch(
                            buildApiUrl(`/saving-account/search`),
                            {
                                method: 'POST',
                                headers: getAuthHeaders(token),
                                body: JSON.stringify({ customer_id: customer.customer_id }),
                            }
                        );

                        if (accountResponse.ok) {
                            const accounts = await accountResponse.json();
                            linkedAccounts = accounts.length;
                            totalBalance = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0);

                            // Get last transaction date
                            for (const account of accounts) {
                                try {
                                    const txResponse = await fetch(
                                        buildApiUrl(`/transaction/search`),
                                        {
                                            method: 'POST',
                                            headers: getAuthHeaders(token),
                                            body: JSON.stringify({ saving_account_id: account.saving_account_id }),
                                        }
                                    );

                                    if (txResponse.ok) {
                                        const transactions = await txResponse.json();
                                        if (transactions.length > 0) {
                                            const latestTx = transactions[0];
                                            if (!lastTransactionDate || new Date(latestTx.timestamp) > new Date(lastTransactionDate)) {
                                                lastTransactionDate = latestTx.timestamp;
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error(`Error fetching transactions for account ${account.saving_account_id}:`, error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching accounts for customer ${customer.customer_id}:`, error);
                    }

                    return {
                        customer_id: customer.customer_id,
                        customer_name: customer.name,
                        phone_number: customer.phone_number,
                        email: customer.email,
                        registration_date: customer.date_of_birth, // Using date_of_birth as placeholder
                        linked_accounts: linkedAccounts,
                        total_balance: totalBalance,
                        last_transaction_date: lastTransactionDate,
                        status: customer.status ? 'Active' : 'Inactive',
                    };
                })
            );

            return myCustomers;
        } catch (error) {
            console.error('Error fetching my customers:', error);
            // Return empty array on error
            return [];
        }
    }

    /**
     * Get list of agent's customers (simplified version - faster)
     */
    static async getMyCustomersSimple(token: string): Promise<MyCustomer[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        customer_id: 'CUST001',
                        customer_name: 'John Doe',
                        phone_number: '+94711234567',
                        email: 'john.doe@email.com',
                        registration_date: '2024-01-15',
                        linked_accounts: 2,
                        total_balance: 125000,
                        last_transaction_date: '2024-10-19',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST002',
                        customer_name: 'Jane Smith',
                        phone_number: '+94722345678',
                        email: 'jane.smith@email.com',
                        registration_date: '2024-02-20',
                        linked_accounts: 1,
                        total_balance: 85000,
                        last_transaction_date: '2024-10-19',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST003',
                        customer_name: 'Michael Johnson',
                        phone_number: '+94733456789',
                        email: 'michael.johnson@email.com',
                        registration_date: '2024-03-10',
                        linked_accounts: 3,
                        total_balance: 250000,
                        last_transaction_date: '2024-10-19',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST004',
                        customer_name: 'Sarah Williams',
                        phone_number: '+94744567890',
                        email: 'sarah.williams@email.com',
                        registration_date: '2024-04-05',
                        linked_accounts: 1,
                        total_balance: 67000,
                        last_transaction_date: '2024-10-18',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST005',
                        customer_name: 'David Brown',
                        phone_number: '+94755678901',
                        email: 'david.brown@email.com',
                        registration_date: '2024-05-12',
                        linked_accounts: 2,
                        total_balance: 340000,
                        last_transaction_date: '2024-10-18',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST006',
                        customer_name: 'Emma Davis',
                        phone_number: '+94766789012',
                        email: 'emma.davis@email.com',
                        registration_date: '2024-06-18',
                        linked_accounts: 1,
                        total_balance: 92000,
                        last_transaction_date: '2024-10-17',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST007',
                        customer_name: 'Robert Wilson',
                        phone_number: '+94777890123',
                        email: 'robert.wilson@email.com',
                        registration_date: '2024-07-22',
                        linked_accounts: 1,
                        total_balance: 156000,
                        last_transaction_date: '2024-10-17',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST008',
                        customer_name: 'Lisa Garcia',
                        phone_number: '+94788901234',
                        email: 'lisa.garcia@email.com',
                        registration_date: '2024-08-30',
                        linked_accounts: 2,
                        total_balance: 78000,
                        last_transaction_date: '2024-10-16',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST009',
                        customer_name: 'Mark Thompson',
                        phone_number: '+94799012345',
                        email: 'mark.thompson@email.com',
                        registration_date: '2024-09-15',
                        linked_accounts: 1,
                        total_balance: 45000,
                        last_transaction_date: '2024-10-15',
                        status: 'Active'
                    },
                    {
                        customer_id: 'CUST010',
                        customer_name: 'Alice Johnson',
                        phone_number: '+94700123456',
                        email: 'alice.johnson@email.com',
                        registration_date: '2024-10-01',
                        linked_accounts: 1,
                        total_balance: 30000,
                        last_transaction_date: '2024-10-14',
                        status: 'Active'
                    }
                ]);
            }, 300);
        });
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
            // Get account summary from views
            const summaryResponse = await fetch(
                buildApiUrl(`/views/report/account-transactions?account_number=${accountId}`),
                {
                    method: 'GET',
                    headers: getAuthHeaders(token),
                }
            );

            if (!summaryResponse.ok) {
                throw new Error(`Failed to fetch account details: ${summaryResponse.statusText}`);
            }

            const summaryReport = await summaryResponse.json();
            const accountData = summaryReport.data?.[0];

            if (!accountData) {
                throw new Error('Account not found');
            }

            // Get transaction history
            const transactionsResponse = await fetch(
                buildApiUrl(`/transaction/search?account_id=${accountId}`),
                {
                    method: 'GET',
                    headers: getAuthHeaders(token),
                }
            );

            const transactionsData = transactionsResponse.ok
                ? await transactionsResponse.json()
                : { transactions: [] };

            // Get account details
            const accountDetailsResponse = await fetch(
                buildApiUrl(`/saving-account/${accountId}`),
                {
                    method: 'GET',
                    headers: getAuthHeaders(token),
                }
            );

            const accountDetails = accountDetailsResponse.ok
                ? await accountDetailsResponse.json()
                : null;

            const account: AccountDetail = {
                account_id: accountId,
                account_type: accountData.account_type || 'savings',
                current_balance: accountData.current_balance || 0,
                minimum_balance: accountDetails?.minimum_balance || 0,
                open_date: accountDetails?.open_date || '',
                status: accountDetails?.status || 'Active',
                plan_name: accountDetails?.plan_name || 'Standard',
                interest_rate: accountDetails?.interest_rate || 0,
            };

            const transactions: AccountTransaction[] = (transactionsData.transactions || []).map((t: any) => ({
                transaction_id: t.transaction_id?.toString() || '',
                date_time: t.transaction_datetime || '',
                transaction_type: t.transaction_type || 'unknown',
                amount: t.amount || 0,
                reference_number: t.reference_number || '',
                description: t.description || '',
                balance_after: t.balance || accountData.current_balance,
            }));

            const deposits = transactions.filter(t => t.transaction_type.toLowerCase() === 'deposit');
            const withdrawals = transactions.filter(t => t.transaction_type.toLowerCase() === 'withdrawal');

            return {
                account,
                transactions,
                summary: {
                    total_transactions: transactions.length,
                    total_deposits: deposits.reduce((sum, t) => sum + t.amount, 0),
                    total_withdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0),
                },
            };
        } catch (error) {
            console.error('Error fetching account details:', error);
            throw error;
        }
    }

    /**
     * Get account details with transaction history (old hardcoded version)
     */
    static async getAccountDetailsWithHistoryHardcoded(
        accountId: string,
        token: string,
        filters?: DateFilter
    ): Promise<AccountDetailsWithHistory> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const account: AccountDetail = {
                    account_id: accountId,
                    account_type: 'Premium Savings Account',
                    current_balance: 125000,
                    minimum_balance: 25000,
                    open_date: '2024-01-15',
                    status: 'Active',
                    plan_name: 'Premium Savings Plan',
                    interest_rate: 6.5
                };

                const transactions: AccountTransaction[] = [
                    {
                        transaction_id: 'TXN001',
                        date_time: '2024-10-19 10:30:00',
                        transaction_type: 'Deposit',
                        amount: 25000,
                        reference_number: 'REF001',
                        description: 'Cash deposit',
                        balance_after: 125000
                    },
                    {
                        transaction_id: 'TXN015',
                        date_time: '2024-10-15 14:20:00',
                        transaction_type: 'Withdrawal',
                        amount: 15000,
                        reference_number: 'REF015',
                        description: 'ATM withdrawal',
                        balance_after: 100000
                    },
                    {
                        transaction_id: 'TXN020',
                        date_time: '2024-10-10 09:15:00',
                        transaction_type: 'Interest',
                        amount: 650,
                        reference_number: 'REF020',
                        description: 'Monthly interest credit',
                        balance_after: 115000
                    },
                    {
                        transaction_id: 'TXN025',
                        date_time: '2024-10-05 16:45:00',
                        transaction_type: 'Deposit',
                        amount: 50000,
                        reference_number: 'REF025',
                        description: 'Salary deposit',
                        balance_after: 114350
                    },
                    {
                        transaction_id: 'TXN030',
                        date_time: '2024-09-28 11:30:00',
                        transaction_type: 'Withdrawal',
                        amount: 8000,
                        reference_number: 'REF030',
                        description: 'Online transfer',
                        balance_after: 64350
                    }
                ];

                const deposits = transactions.filter(t => t.transaction_type === 'Deposit');
                const withdrawals = transactions.filter(t => t.transaction_type === 'Withdrawal');

                resolve({
                    account,
                    transactions,
                    summary: {
                        total_transactions: transactions.length,
                        total_deposits: deposits.reduce((sum, t) => sum + t.amount, 0),
                        total_withdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0)
                    }
                });
            }, 400);
        });
    }

    /**
     * Get linked fixed deposits for agent's customers
     */
    static async getLinkedFixedDeposits(token: string): Promise<LinkedFixedDeposit[]> {
        try {
            const response = await fetch(buildApiUrl('/views/report/active-fixed-deposits'), {
                method: 'GET',
                headers: getAuthHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch fixed deposits: ${response.statusText}`);
            }

            const report = await response.json();

            return (report.data || []).map((fd: any) => ({
                fd_id: fd.fd_id?.toString() || '',
                customer_names: fd.customer_names ? fd.customer_names.split(', ') : [],
                linked_savings_account: fd.savings_account_id?.toString() || '',
                principal_amount: fd.principal_amount || 0,
                start_date: fd.start_date || '',
                maturity_date: fd.maturity_date || '',
                interest_rate: fd.interest_rate || 0,
                next_payout_date: fd.next_interest_date || '',
                total_interest_credited: fd.interest_paid || 0,
                status: fd.status || 'Active',
                plan_months: fd.plan_duration || 0,
            }));
        } catch (error) {
            console.error('Error fetching fixed deposits:', error);
            return [];
        }
    }

    /**
     * Get linked fixed deposits for agent's customers (old hardcoded version)
     */
    static async getLinkedFixedDepositsHardcoded(token: string): Promise<LinkedFixedDeposit[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        fd_id: 'FD001',
                        customer_names: ['John Doe'],
                        linked_savings_account: 'SA001',
                        principal_amount: 500000,
                        start_date: '2024-06-01',
                        maturity_date: '2025-06-01',
                        interest_rate: 8.5,
                        next_payout_date: '2024-11-01',
                        total_interest_credited: 17000,
                        status: 'Active',
                        plan_months: 12
                    },
                    {
                        fd_id: 'FD002',
                        customer_names: ['Jane Smith', 'Michael Johnson'],
                        linked_savings_account: 'SA002',
                        principal_amount: 1000000,
                        start_date: '2024-03-15',
                        maturity_date: '2027-03-15',
                        interest_rate: 9.0,
                        next_payout_date: '2024-12-15',
                        total_interest_credited: 67500,
                        status: 'Active',
                        plan_months: 36
                    },
                    {
                        fd_id: 'FD003',
                        customer_names: ['Sarah Williams'],
                        linked_savings_account: 'SA004',
                        principal_amount: 250000,
                        start_date: '2024-08-10',
                        maturity_date: '2025-02-10',
                        interest_rate: 7.5,
                        next_payout_date: '2024-11-10',
                        total_interest_credited: 3750,
                        status: 'Active',
                        plan_months: 6
                    },
                    {
                        fd_id: 'FD004',
                        customer_names: ['David Brown'],
                        linked_savings_account: 'SA005',
                        principal_amount: 750000,
                        start_date: '2024-04-20',
                        maturity_date: '2026-04-20',
                        interest_rate: 8.75,
                        next_payout_date: '2024-10-20',
                        total_interest_credited: 32500,
                        status: 'Active',
                        plan_months: 24
                    },
                    {
                        fd_id: 'FD005',
                        customer_names: ['Robert Wilson'],
                        linked_savings_account: 'SA007',
                        principal_amount: 300000,
                        start_date: '2024-07-01',
                        maturity_date: '2024-10-01',
                        interest_rate: 7.0,
                        next_payout_date: null,
                        total_interest_credited: 5250,
                        status: 'Matured',
                        plan_months: 3
                    }
                ]);
            }, 600);
        });
    }

    /**
     * Get monthly interest distribution summary
     */
    static async getMonthlyInterestSummary(
        token: string,
        month?: string
    ): Promise<MonthlyInterestSummary[]> {
        try {
            const url = month
                ? buildApiUrl(`/views/report/monthly-interest-distribution?month_year=${month}`)
                : buildApiUrl('/views/report/monthly-interest-distribution');

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch interest summary: ${response.statusText}`);
            }

            const report = await response.json();

            return (report.data || []).map((item: any) => ({
                month_year: item.month_year || '',
                account_type: item.account_type || '',
                accounts_credited: item.accounts_credited || 0,
                total_interest_credited: item.total_interest_credited || 0,
                credit_batch_date: item.credit_batch_date || '',
                average_interest_per_account: item.average_interest_per_account || 0,
            }));
        } catch (error) {
            console.error('Error fetching monthly interest summary:', error);
            return [];
        }
    }

    /**
     * Get monthly interest distribution summary (old hardcoded version)
     */
    static async getMonthlyInterestSummaryHardcoded(
        token: string,
        month?: string
    ): Promise<MonthlyInterestSummary[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        month_year: '2024-10',
                        account_type: 'Basic Savings',
                        accounts_credited: 5,
                        total_interest_credited: 2250,
                        credit_batch_date: '2024-10-01',
                        average_interest_per_account: 450
                    },
                    {
                        month_year: '2024-10',
                        account_type: 'Premium Savings',
                        accounts_credited: 3,
                        total_interest_credited: 3900,
                        credit_batch_date: '2024-10-01',
                        average_interest_per_account: 1300
                    },
                    {
                        month_year: '2024-10',
                        account_type: 'Elite Savings',
                        accounts_credited: 2,
                        total_interest_credited: 2800,
                        credit_batch_date: '2024-10-01',
                        average_interest_per_account: 1400
                    },
                    {
                        month_year: '2024-09',
                        account_type: 'Basic Savings',
                        accounts_credited: 5,
                        total_interest_credited: 2150,
                        credit_batch_date: '2024-09-01',
                        average_interest_per_account: 430
                    },
                    {
                        month_year: '2024-09',
                        account_type: 'Premium Savings',
                        accounts_credited: 3,
                        total_interest_credited: 3750,
                        credit_batch_date: '2024-09-01',
                        average_interest_per_account: 1250
                    },
                    {
                        month_year: '2024-09',
                        account_type: 'Elite Savings',
                        accounts_credited: 2,
                        total_interest_credited: 2650,
                        credit_batch_date: '2024-09-01',
                        average_interest_per_account: 1325
                    },
                    {
                        month_year: '2024-08',
                        account_type: 'Basic Savings',
                        accounts_credited: 4,
                        total_interest_credited: 1800,
                        credit_batch_date: '2024-08-01',
                        average_interest_per_account: 450
                    },
                    {
                        month_year: '2024-08',
                        account_type: 'Premium Savings',
                        accounts_credited: 3,
                        total_interest_credited: 3600,
                        credit_batch_date: '2024-08-01',
                        average_interest_per_account: 1200
                    }
                ]);
            }, 400);
        });
    }

    /**
     * Get customer activity summary
     */
    static async getCustomerActivitySummary(
        token: string,
        filters?: DateFilter
    ): Promise<CustomerActivitySummary[]> {
        try {
            const response = await fetch(buildApiUrl('/views/report/customer-activity'), {
                method: 'GET',
                headers: getAuthHeaders(token),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch customer activity: ${response.statusText}`);
            }

            const report = await response.json();

            return (report.data || []).map((customer: any) => ({
                customer_id: customer.customer_id?.toString() || '',
                customer_name: customer.customer_name || '',
                total_deposits: customer.total_deposits || 0,
                total_withdrawals: customer.total_withdrawals || 0,
                net_balance: customer.net_flow || 0,
                active_fd_count: customer.active_fd_count || 0,
                fd_total_value: customer.fd_total_value || 0,
                last_activity_date: customer.last_activity_date || '',
                account_types: customer.account_types ? customer.account_types.split(', ') : [],
            }));
        } catch (error) {
            console.error('Error fetching customer activity summary:', error);
            return [];
        }
    }

    /**
     * Get customer activity summary (old hardcoded version)
     */
    static async getCustomerActivitySummaryHardcoded(
        token: string,
        filters?: DateFilter
    ): Promise<CustomerActivitySummary[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        customer_id: 'CUST001',
                        customer_name: 'John Doe',
                        total_deposits: 150000,
                        total_withdrawals: 45000,
                        net_balance: 105000,
                        active_fd_count: 1,
                        fd_total_value: 500000,
                        last_activity_date: '2024-10-19',
                        account_types: ['Premium Savings', 'Fixed Deposit']
                    },
                    {
                        customer_id: 'CUST002',
                        customer_name: 'Jane Smith',
                        total_deposits: 120000,
                        total_withdrawals: 35000,
                        net_balance: 85000,
                        active_fd_count: 1,
                        fd_total_value: 1000000,
                        last_activity_date: '2024-10-19',
                        account_types: ['Basic Savings', 'Fixed Deposit']
                    },
                    {
                        customer_id: 'CUST003',
                        customer_name: 'Michael Johnson',
                        total_deposits: 300000,
                        total_withdrawals: 80000,
                        net_balance: 220000,
                        active_fd_count: 1,
                        fd_total_value: 1000000,
                        last_activity_date: '2024-10-19',
                        account_types: ['Elite Savings', 'Premium Savings', 'Fixed Deposit']
                    },
                    {
                        customer_id: 'CUST004',
                        customer_name: 'Sarah Williams',
                        total_deposits: 95000,
                        total_withdrawals: 28000,
                        net_balance: 67000,
                        active_fd_count: 1,
                        fd_total_value: 250000,
                        last_activity_date: '2024-10-18',
                        account_types: ['Basic Savings', 'Fixed Deposit']
                    },
                    {
                        customer_id: 'CUST005',
                        customer_name: 'David Brown',
                        total_deposits: 425000,
                        total_withdrawals: 85000,
                        net_balance: 340000,
                        active_fd_count: 1,
                        fd_total_value: 750000,
                        last_activity_date: '2024-10-18',
                        account_types: ['Premium Savings', 'Elite Savings', 'Fixed Deposit']
                    },
                    {
                        customer_id: 'CUST006',
                        customer_name: 'Emma Davis',
                        total_deposits: 115000,
                        total_withdrawals: 23000,
                        net_balance: 92000,
                        active_fd_count: 0,
                        fd_total_value: 0,
                        last_activity_date: '2024-10-17',
                        account_types: ['Premium Savings']
                    },
                    {
                        customer_id: 'CUST007',
                        customer_name: 'Robert Wilson',
                        total_deposits: 180000,
                        total_withdrawals: 24000,
                        net_balance: 156000,
                        active_fd_count: 0,
                        fd_total_value: 300000,
                        last_activity_date: '2024-10-17',
                        account_types: ['Elite Savings']
                    },
                    {
                        customer_id: 'CUST008',
                        customer_name: 'Lisa Garcia',
                        total_deposits: 125000,
                        total_withdrawals: 47000,
                        net_balance: 78000,
                        active_fd_count: 0,
                        fd_total_value: 0,
                        last_activity_date: '2024-10-16',
                        account_types: ['Basic Savings', 'Premium Savings']
                    }
                ]);
            }, 500);
        });
    }

    /**
     * Utility function to generate date filter options
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
     * Utility function to format currency
     */
    static formatCurrency(amount: number): string {
        return `LKR ${amount.toLocaleString()}`;
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
                return {
                    start_date: startOfWeek.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                };

            case 'this_month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    start_date: startOfMonth.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                };

            case 'last_month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                return {
                    start_date: lastMonth.toISOString().split('T')[0],
                    end_date: endOfLastMonth.toISOString().split('T')[0]
                };

            default:
                return {
                    start_date: today.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                };
        }
    }
}

// Error handling utility
export const handleAgentReportsError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred while loading reports';
};