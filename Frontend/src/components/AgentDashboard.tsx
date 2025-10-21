import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Search, Plus, DollarSign, User, Building2, AlertTriangle, CreditCard, Clock, Users, Loader2, Edit, Save, X, BarChart3, FileText, TrendingUp, Calendar, Filter, Eye, Download, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import {
  CustomerService,
  SavingsAccountService,
  TransactionService,
  FixedDepositService,
  JointAccountService,
  EmployeeService,
  BranchService,
  handleApiError,
  type Customer,
  type SavingsAccount,
  type Transaction,
  type FixedDeposit,
  type FixedDepositPlan,
  type EmployeeInfo,
  type BranchInfo,
  type MyEmployeeInfo
} from '../services/agentService';
import { SavingsPlansService, type SavingsPlan } from '../services/savingsPlansService';
import {
  AgentReportsService,
  type MyTransaction,
  type MyTransactionSummary,
  type MyCustomer,
  type AccountDetailsWithHistory,
  type LinkedFixedDeposit,
  type MonthlyInterestSummary,
  type CustomerActivitySummary,
  type DateFilter
} from '../services/agentReportsService';
import { ReportsService, type MonthlyInterestDistribution, type CustomerActivity } from '../services/reportsService';

export function AgentDashboard() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'customer' | 'register' | 'create-account' | 'create-joint' | 'reports'>('home');
  const [searchType, setSearchType] = useState('customer_id');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerAccounts, setSelectedCustomerAccounts] = useState<SavingsAccount[]>([]);
  const [selectedCustomerTransactions, setSelectedCustomerTransactions] = useState<any[]>([]);
  const [selectedCustomerFixedDeposits, setSelectedCustomerFixedDeposits] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fdAmount, setFdAmount] = useState('');
  const [selectedFdPlan, setSelectedFdPlan] = useState('');
  const [fdAccountId, setFdAccountId] = useState('');

  // Reports state
  const [reportsLoading, setReportsLoading] = useState(false);
  const [myTransactionSummary, setMyTransactionSummary] = useState<MyTransactionSummary | null>(null);
  const [agentPerformanceData, setAgentPerformanceData] = useState<MyTransaction[]>([]);
  const [myCustomers, setMyCustomers] = useState<MyCustomer[]>([]);
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<AccountDetailsWithHistory | null>(null);
  const [linkedFDs, setLinkedFDs] = useState<LinkedFixedDeposit[]>([]);
  const [monthlyInterest, setMonthlyInterest] = useState<MonthlyInterestDistribution[]>([]);
  const [customerActivity, setCustomerActivity] = useState<CustomerActivity[]>([]);
  const [selectedReportTab, setSelectedReportTab] = useState('transaction-summary');
  const [dateFilter, setDateFilter] = useState<DateFilter>({ period: 'this_month' });
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-10');

  // Customer editing state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Data from APIs
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [fdPlans, setFdPlans] = useState<FixedDepositPlan[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [customerFixedDeposits, setCustomerFixedDeposits] = useState<FixedDeposit[]>([]);

  // Employee and Branch information state
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [branchManager, setBranchManager] = useState<EmployeeInfo | null>(null);

  // Customer registration form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    nic: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
    email: ''
  });

  // New savings account form state
  const [newAccount, setNewAccount] = useState({
    customer_id: '',
    s_plan_id: '',
    initial_balance: ''
  });

  // Joint account form state
  const [jointAccount, setJointAccount] = useState({
    primary_customer_id: '',
    secondary_customer_id: '',
    initial_balance: ''
  });

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
    loadEmployeeBranchInfo();
  }, []);

  const loadInitialData = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const [plansData, fdPlansData] = await Promise.all([
        SavingsPlansService.getAllSavingsPlans(user.token),
        FixedDepositService.getFixedDepositPlans(user.token)
      ]);
      setSavingsPlans(plansData);
      setFdPlans(fdPlansData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeBranchInfo = async () => {
    if (!user?.token) return;

    try {
      // Use the new dedicated endpoint to get all info at once
      const myInfo = await EmployeeService.getMyInfo(user.token);
      setEmployeeInfo(myInfo.employee);
      setBranchInfo(myInfo.branch);
      setBranchManager(myInfo.manager ? {
        employee_id: myInfo.manager.employee_id || '',
        name: myInfo.manager.name,
        nic: '',
        phone_number: '',
        address: '',
        date_started: '',
        type: 'Branch Manager',
        status: true,
        branch_id: myInfo.employee.branch_id
      } : null);
    } catch (error) {
      console.error('Failed to load employee/branch info:', error);
      // Don't set error state here as this is non-critical information
    }
  };

  // Helper to change view and clear messages
  const changeView = (view: 'home' | 'search' | 'customer' | 'register' | 'create-account' | 'create-joint' | 'reports') => {
    setError('');
    setSuccess('');

    // Clear customer data when navigating away from customer view
    if (view !== 'customer') {
      setSelectedCustomer(null);
      setSelectedCustomerAccounts([]);
      setSelectedCustomerTransactions([]);
      setSelectedCustomerFixedDeposits([]);
      setSelectedAccountId('');
      setFdAccountId('');
      setTransactionAmount('');
      setTransactionType('');
      setEditingCustomer(null);
    }

    // Load reports data when navigating to reports
    if (view === 'reports') {
      loadInitialReportsData();
    }

    setCurrentView(view);
  };

  // Reports data loading functions
  const loadInitialReportsData = async () => {
    // Check if user is properly authenticated before loading reports
    if (!user?.token) {
      setError('Please ensure you are logged in to access reports');
      return;
    }

    setReportsLoading(true);
    try {
      // Load initial data for the first tab (transaction summary)
      await loadMyTransactionSummary();
    } catch (error) {
      console.error('Failed to load initial reports data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load reports data');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadMyTransactionSummary = async () => {
    if (!user?.token) {
      setError('Authentication required for reports access');
      return;
    }

    try {
      setReportsLoading(true);
      // Load both transaction summary and customers to get accurate customer count
      const [result, customers] = await Promise.all([
        AgentReportsService.getMyTransactionSummary(user.token, dateFilter),
        AgentReportsService.getMyCustomers(user.token)
      ]);

      setMyTransactionSummary(result.summary);
      setAgentPerformanceData(result.agents);
      setMyCustomers(customers);
    } catch (error) {
      console.error('Failed to load transaction summary:', error);
      setError(error instanceof Error ? error.message : 'Failed to load performance data');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadMyCustomers = async () => {
    if (!user?.token) {
      setError('Authentication required for reports access');
      return;
    }

    try {
      setReportsLoading(true);
      const customers = await AgentReportsService.getMyCustomers(user.token);
      setMyCustomers(customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load customer data');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadAccountDetails = async (accountId: string) => {
    if (!user?.token || !accountId) {
      setError('Authentication required for reports access');
      return;
    }

    try {
      setReportsLoading(true);
      const details = await AgentReportsService.getAccountDetailsWithHistory(accountId, user.token, dateFilter);
      setSelectedAccountDetails(details);
    } catch (error) {
      console.error('Failed to load account details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load account details');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadLinkedFixedDeposits = async () => {
    if (!user?.token) {
      setError('Authentication required for reports access');
      return;
    }

    try {
      setReportsLoading(true);
      const fds = await AgentReportsService.getLinkedFixedDeposits(user.token);
      setLinkedFDs(fds);
    } catch (error) {
      console.error('Failed to load fixed deposits:', error);
      setError(error instanceof Error ? error.message : 'Failed to load fixed deposits data');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadMonthlyInterest = async () => {
    if (!user?.token) {
      setError('Authentication required for reports access');
      return;
    }

    try {
      setReportsLoading(true);
      const interest = await AgentReportsService.getMonthlyInterestSummary(user.token, selectedMonth);
      setMonthlyInterest(interest);
    } catch (error) {
      console.error('Failed to load monthly interest:', error);
      setError(error instanceof Error ? error.message : 'Failed to load monthly interest data');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadCustomerActivity = async () => {
    if (!user?.token) {
      setError('Authentication required for reports access');
      return;
    }

    try {
      setReportsLoading(true);
      const activity = await AgentReportsService.getCustomerActivitySummary(user.token, dateFilter);
      setCustomerActivity(activity);
    } catch (error) {
      console.error('Failed to load customer activity:', error);
      setError(error instanceof Error ? error.message : 'Failed to load customer activity data');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleReportTabChange = async (tabValue: string) => {
    setSelectedReportTab(tabValue);

    // Load data based on selected tab
    switch (tabValue) {
      case 'transaction-summary':
        await loadMyTransactionSummary();
        break;
      case 'my-customers':
        await loadMyCustomers();
        break;
      case 'linked-fds':
        await loadLinkedFixedDeposits();
        break;
      case 'monthly-interest':
        await loadMonthlyInterest();
        break;
      case 'customer-activity':
        await loadCustomerActivity();
        break;
    }
  };

  const handleDateFilterChange = async (period: string) => {
    if (period === 'custom') {
      setDateFilter({ period: 'custom' });
    } else {
      const dateRange = AgentReportsService.getDateRange(period);
      setDateFilter({ period: period as 'this_week' | 'this_month' | 'last_month' | 'custom', ...dateRange });

      // Reload current report with new filter
      if (selectedReportTab === 'transaction-summary') {
        await loadMyTransactionSummary();
      } else if (selectedReportTab === 'customer-activity') {
        await loadCustomerActivity();
      }
    }
  };

  const applyCustomDateFilter = async () => {
    if (customDateRange.start && customDateRange.end) {
      setDateFilter({
        period: 'custom',
        start_date: customDateRange.start,
        end_date: customDateRange.end
      });

      // Reload current report with custom date range
      if (selectedReportTab === 'transaction-summary') {
        await loadMyTransactionSummary();
      } else if (selectedReportTab === 'customer-activity') {
        await loadCustomerActivity();
      }
    }
  };

  const handleRefreshViews = async () => {
    if (!user?.token) {
      setError('Authentication required for data refresh');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await ReportsService.refreshMaterializedViews();
      setSuccess(`Data refreshed successfully! Updated ${result.refreshed_views.length} views.`);

      // Reload current report data after refresh
      if (selectedReportTab === 'transaction-summary') {
        await loadMyTransactionSummary();
      } else if (selectedReportTab === 'my-customers') {
        await loadMyCustomers();
      } else if (selectedReportTab === 'linked-fds') {
        await loadLinkedFixedDeposits();
      } else if (selectedReportTab === 'monthly-interest') {
        await loadMonthlyInterest();
      } else if (selectedReportTab === 'customer-activity') {
        await loadCustomerActivity();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearch = async () => {
    if (!user?.token) return;

    setError('');
    setLoading(true);

    if (!searchQuery.trim()) {
      setError('Please enter a search value');
      setLoading(false);
      return;
    }

    try {
      let searchParams: any = {};

      if (searchType === 'customer_id') {
        searchParams.customer_id = searchQuery.toUpperCase();
      } else if (searchType === 'nic') {
        searchParams.nic = searchQuery;
      } else if (searchType === 'saving_account_id') {
        // First search for accounts, then get customer
        const accounts = await SavingsAccountService.searchSavingsAccounts({
          saving_account_id: searchQuery.toUpperCase()
        }, user.token);

        if (accounts.length > 0) {
          searchParams.customer_id = accounts[0].customer_id;
        } else {
          setError('Account not found');
          return;
        }
      }

      const customers = await CustomerService.searchCustomers(searchParams, user.token);

      if (customers.length > 0) {
        const customer = customers[0];
        setSelectedCustomer(customer);

        // Clear previous customer data first
        setSelectedCustomerTransactions([]);
        setSelectedCustomerFixedDeposits([]);

        // Load customer's accounts
        const accounts = await SavingsAccountService.searchSavingsAccounts({
          customer_id: customer.customer_id
        }, user.token);
        setSelectedCustomerAccounts(accounts);

        if (accounts.length > 0) {
          setSelectedAccountId(accounts[0].saving_account_id);
          setFdAccountId(accounts[0].saving_account_id);

          // Load transactions and FDs for all accounts of this customer
          await loadAllCustomerData(accounts);
        } else {
          // No accounts found - ensure the transaction lists are empty
          setSelectedCustomerTransactions([]);
          setSelectedCustomerFixedDeposits([]);
        }

        setCurrentView('customer');
        setSuccess('Customer found successfully');
      } else {
        setError('Customer not found. Please check your search criteria.');
      }
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async (savingAccountId: string) => {
    if (!user?.token) return;

    try {
      const [transactions, fixedDeposits] = await Promise.all([
        TransactionService.getTransactionHistory(savingAccountId, user.token),
        FixedDepositService.searchFixedDeposits(savingAccountId, user.token)
      ]);

      setSelectedCustomerTransactions(transactions);
      setSelectedCustomerFixedDeposits(fixedDeposits);
    } catch (error) {
      console.error('Failed to load customer data:', error);
    }
  };

  const handleAccountChange = async (accountId: string) => {
    setSelectedAccountId(accountId);
    setFdAccountId(accountId);

    // Reload transaction history for the selected account
    if (accountId && user?.token) {
      try {
        const transactions = await TransactionService.getTransactionHistory(accountId, user.token);
        setSelectedCustomerTransactions(transactions);
      } catch (error) {
        console.error('Failed to load transactions for account:', error);
      }
    }
  };

  const loadAllCustomerData = async (accounts: SavingsAccount[]) => {
    if (!user?.token || accounts.length === 0) return;

    try {
      // Load transactions and fixed deposits for all accounts
      const allTransactions: Transaction[] = [];
      const allFixedDeposits: FixedDeposit[] = [];

      for (const account of accounts) {
        try {
          const [transactions, fixedDeposits] = await Promise.all([
            TransactionService.getTransactionHistory(account.saving_account_id, user.token),
            FixedDepositService.searchFixedDeposits(account.saving_account_id, user.token)
          ]);

          allTransactions.push(...transactions);
          allFixedDeposits.push(...fixedDeposits);
        } catch (error) {
          console.error(`Failed to load data for account ${account.saving_account_id}:`, error);
          // Continue with other accounts even if one fails
        }
      }

      // Sort transactions by timestamp (newest first)
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setSelectedCustomerTransactions(allTransactions);
      setSelectedCustomerFixedDeposits(allFixedDeposits);
    } catch (error) {
      console.error('Failed to load all customer data:', error);
    }
  };

  const handleTransaction = async () => {
    if (!user?.token || !selectedCustomer || !transactionAmount || !transactionType || !selectedAccountId) {
      setError('Please fill in all transaction details and select an account');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const amount = parseFloat(transactionAmount);
      const selectedAccount = selectedCustomerAccounts.find(acc => acc.saving_account_id === selectedAccountId);

      if (!selectedAccount) {
        setError('Selected account not found');
        return;
      }

      // Find holder_id - we'll need to get this from the account holder relationship
      // For now, we'll use the account ID as holder ID (this might need adjustment based on your backend)
      const holderId = selectedAccount.saving_account_id; // This may need to be adjusted

      const transactionData = {
        saving_account_id: selectedAccountId,
        type: transactionType as 'Deposit' | 'Withdrawal' | 'Interest',
        amount: amount,
        description: `${transactionType} by agent ${user.username}`
      };

      const newTransaction = await TransactionService.createTransaction(transactionData, user.token);

      // Update local state
      setSelectedCustomerTransactions(prev => [newTransaction, ...prev]);

      // Update account balance locally (the backend will have updated it)
      const updatedAccounts = selectedCustomerAccounts.map(acc =>
        acc.saving_account_id === selectedAccountId
          ? { ...acc, balance: transactionType === 'Withdrawal' ? Number(acc.balance) - amount : Number(acc.balance) + amount }
          : acc
      );
      setSelectedCustomerAccounts(updatedAccounts);

      setSuccess(`${transactionType} of LKR ${amount.toLocaleString()} processed successfully for account ${selectedAccountId}`);
      setTransactionAmount('');
      setTransactionType('');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFdCreation = async () => {
    if (!user?.token || !selectedCustomer || !fdAmount || !selectedFdPlan || !fdAccountId) {
      setError('Please fill in all FD details and select an account');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const amount = parseFloat(fdAmount);
      const selectedAccount = selectedCustomerAccounts.find(acc => acc.saving_account_id === fdAccountId);

      if (!selectedAccount) {
        setError('Selected account not found');
        return;
      }

      if (Number(selectedAccount.balance) < amount) {
        setError(`Insufficient balance in account ${fdAccountId}. Current balance: LKR ${Number(selectedAccount.balance).toLocaleString()}`);
        return;
      }

      const selectedPlan = fdPlans.find(plan => plan.f_plan_id === selectedFdPlan);
      if (!selectedPlan) {
        setError('Invalid FD plan selected');
        return;
      }

      const fdData = {
        saving_account_id: fdAccountId,
        f_plan_id: selectedFdPlan,
        principal_amount: amount,
        interest_payment_type: true // Default to monthly interest
      };

      const newFD = await FixedDepositService.createFixedDeposit(fdData, user.token);

      // Update local state
      setSelectedCustomerFixedDeposits(prev => [...prev, newFD]);

      // Update account balance
      const updatedAccounts = selectedCustomerAccounts.map(acc =>
        acc.saving_account_id === fdAccountId
          ? { ...acc, balance: Number(acc.balance) - amount }
          : acc
      );
      setSelectedCustomerAccounts(updatedAccounts);

      setSuccess(`Fixed Deposit of LKR ${amount.toLocaleString()} created successfully for account ${fdAccountId}. ${selectedPlan.months} months plan (${selectedPlan.interest_rate}% p.a.)`);
      setFdAmount('');
      setSelectedFdPlan('');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCustomer = async () => {
    if (!user?.token) return;

    setError('');
    setSuccess('');
    setLoading(true);

    if (!newCustomer.name || !newCustomer.nic || !newCustomer.date_of_birth) {
      setError('Please fill in all required fields (Name, NIC, Date of Birth)');
      setLoading(false);
      return;
    }

    try {
      const customerData = {
        ...newCustomer,
        status: true
      };

      const createdCustomer = await CustomerService.createCustomer(customerData, user.token);

      setSuccess(`Customer "${createdCustomer.name}" registered successfully! Customer ID: ${createdCustomer.customer_id}`);
      setNewCustomer({
        name: '',
        nic: '',
        phone_number: '',
        address: '',
        date_of_birth: '',
        email: ''
      });
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!user?.token) return;

    setError('');
    setSuccess('');
    setLoading(true);

    if (!newAccount.customer_id || !newAccount.s_plan_id || !newAccount.initial_balance) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const selectedPlan = savingsPlans.find(plan => plan.s_plan_id === newAccount.s_plan_id);
      if (!selectedPlan) {
        setError('Invalid account type selected');
        return;
      }

      const initialAmount = parseFloat(newAccount.initial_balance);
      if (initialAmount < selectedPlan.min_balance) {
        setError(`Initial deposit must be at least LKR ${selectedPlan.min_balance.toLocaleString()} for ${selectedPlan.plan_name} account`);
        return;
      }

      const accountData = {
        open_date: new Date().toISOString(),
        balance: initialAmount,
        s_plan_id: newAccount.s_plan_id,
        status: true
      };

      const createdAccount = await SavingsAccountService.createSavingsAccount(accountData, newAccount.customer_id, user.token);

      setSuccess(`${selectedPlan.plan_name} account created successfully! Account ID: ${createdAccount.saving_account_id}`);
      setNewAccount({
        customer_id: '',
        s_plan_id: '',
        initial_balance: ''
      });
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJointAccount = async () => {
    if (!user?.token) return;

    setError('');
    setSuccess('');
    setLoading(true);

    if (!jointAccount.primary_customer_id || !jointAccount.secondary_customer_id || !jointAccount.initial_balance) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (jointAccount.primary_customer_id === jointAccount.secondary_customer_id) {
      setError('Customer IDs must be different');
      setLoading(false);
      return;
    }

    try {
      const jointPlan = savingsPlans.find(plan => plan.s_plan_id === 'JO001');
      const initialAmount = parseFloat(jointAccount.initial_balance);

      if (initialAmount < (jointPlan?.min_balance || 5000)) {
        setError(`Initial deposit must be at least LKR ${(jointPlan?.min_balance || 5000).toLocaleString()} for joint account`);
        return;
      }

      const jointAccountData = {
        primary_customer_id: jointAccount.primary_customer_id,
        secondary_customer_id: jointAccount.secondary_customer_id,
        initial_balance: initialAmount,
        s_plan_id: 'JO001'  // Use the correct joint plan ID
      };

      const createdJointAccount = await JointAccountService.createJointAccount(jointAccountData, user.token);

      setSuccess(`Joint account created successfully for customers ${jointAccount.primary_customer_id} and ${jointAccount.secondary_customer_id}. Account ID: ${createdJointAccount.saving_account_id}`);
      setJointAccount({
        primary_customer_id: '',
        secondary_customer_id: '',
        initial_balance: ''
      });
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({ ...customer });
  };

  const handleUpdateCustomer = async () => {
    if (!user?.token || !editingCustomer) return;

    setLoading(true);
    setError('');

    try {
      const { customer_id, employee_id, ...updates } = editingCustomer;
      const updatedCustomer = await CustomerService.updateCustomer(customer_id, updates, user.token);

      // Update the selected customer with new data
      setSelectedCustomer(updatedCustomer);

      setSuccess('Customer updated successfully');
      setEditingCustomer(null);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setError('');
  };

  const renderHomeScreen = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.username}!</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Branch:</strong> {branchInfo?.branch_name || 'Loading...'}</p>
                <p><strong>Address:</strong> {branchInfo?.location || 'Loading...'}</p>
                <p><strong>Manager:</strong> {branchManager?.name || 'Loading...'}</p>
                {branchInfo && (
                  <p><strong>Phone:</strong> {branchInfo.branch_phone_number}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Date</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => changeView('search')}>
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">Search Customer</h3>
            <p className="text-gray-600">Access existing customer accounts and perform transactions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => changeView('register')}>
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Register Customer</h3>
            <p className="text-gray-600">Register new customer with personal details</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => changeView('create-account')}>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-xl font-semibold mb-2">Open Savings Account</h3>
            <p className="text-gray-600">Create savings account for existing customer</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => changeView('create-joint')}>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="text-xl font-semibold mb-2">Create Joint Account</h3>
            <p className="text-gray-600">Open joint account for multiple customers</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => changeView('reports')}>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
            <h3 className="text-xl font-semibold mb-2">Reports</h3>
            <p className="text-gray-600">View transaction summaries, customer reports, and analytics</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Quick Customer Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter NIC or Account Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCustomerSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerSearch = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Search Existing Customer</h2>
        <Button variant="outline" onClick={() => changeView('home')}>
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Search</CardTitle>
          <CardDescription>Search by Customer ID, NIC, or Savings Account ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_id">Customer ID</SelectItem>
                  <SelectItem value="nic">NIC Number</SelectItem>
                  <SelectItem value="saving_account_id">Savings Account ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Search Value</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder={`Enter ${searchType === 'customer_id' ? 'Customer ID' : searchType === 'nic' ? 'NIC Number' : 'Account ID'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={handleCustomerSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Search
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderRegisterCustomer = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Register New Customer</h2>
        <Button variant="outline" onClick={() => changeView('home')}>
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Register a new customer (account creation comes after registration)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                placeholder="Enter full name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div>
              <Label>NIC Number *</Label>
              <Input
                placeholder="Enter NIC number"
                value={newCustomer.nic}
                onChange={(e) => setNewCustomer({ ...newCustomer, nic: e.target.value })}
              />
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={newCustomer.date_of_birth}
                onChange={(e) => setNewCustomer({ ...newCustomer, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="Enter phone number"
                value={newCustomer.phone_number}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                placeholder="Enter address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleRegisterCustomer} className="w-full">
            <User className="h-4 w-4 mr-2" />
            Register Customer
          </Button>

          <div className="p-4 bg-blue-50 rounded-lg text-sm">
            <p className="text-blue-900 font-medium mb-1">Note:</p>
            <p className="text-blue-800">After registering the customer, you can create savings accounts for them using the "Open Savings Account" option from the home screen.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateAccount = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Open Savings Account</h2>
        <Button variant="outline" onClick={() => changeView('home')}>
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Savings Account</CardTitle>
          <CardDescription>Open a new savings account for an existing customer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Customer ID *</Label>
            <Input
              placeholder="Enter Customer ID"
              value={newAccount.customer_id}
              onChange={(e) => setNewAccount({ ...newAccount, customer_id: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <Label>Account Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsPlans.filter(plan => plan.s_plan_id !== 'JO001').map((plan) => (
                <Card
                  key={plan.s_plan_id}
                  className={`cursor-pointer transition-all ${newAccount.s_plan_id === plan.s_plan_id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setNewAccount({ ...newAccount, s_plan_id: plan.s_plan_id })}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{plan.plan_name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Interest: {plan.interest_rate}%</p>
                      <p>Min Balance: {plan.min_balance === 0 ? 'None' : `LKR ${plan.min_balance.toLocaleString()}`}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label>Initial Deposit *</Label>
            <Input
              type="number"
              placeholder="Enter initial deposit amount"
              value={newAccount.initial_balance}
              onChange={(e) => setNewAccount({ ...newAccount, initial_balance: e.target.value })}
            />
            {newAccount.s_plan_id && (
              <p className="text-sm text-gray-500 mt-1">
                Minimum deposit: LKR {savingsPlans.find(p => p.s_plan_id === newAccount.s_plan_id)?.min_balance.toLocaleString() || '0'}
              </p>
            )}
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleCreateAccount} className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Create Savings Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateJointAccount = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Create Joint Account</h2>
        <Button variant="outline" onClick={() => changeView('home')}>
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Joint Savings Account</CardTitle>
          <CardDescription>Create a joint account for two existing customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>First Account Holder - Customer ID *</Label>
              <Input
                placeholder="Enter first customer ID (e.g., CUST001)"
                value={jointAccount.primary_customer_id}
                onChange={(e) => setJointAccount({ ...jointAccount, primary_customer_id: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <Label>Second Account Holder - Customer ID *</Label>
              <Input
                placeholder="Enter second customer ID (e.g., CUST002)"
                value={jointAccount.secondary_customer_id}
                onChange={(e) => setJointAccount({ ...jointAccount, secondary_customer_id: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium mb-2">Joint Account Plan</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Interest Rate: 7%</p>
              <p>Minimum Balance: LKR 5,000</p>
              <p>All holders have equal rights to the account</p>
            </div>
          </div>

          <div>
            <Label>Initial Deposit *</Label>
            <Input
              type="number"
              placeholder="Enter initial deposit amount (min LKR 5,000)"
              value={jointAccount.initial_balance}
              onChange={(e) => setJointAccount({ ...jointAccount, initial_balance: e.target.value })}
            />
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleCreateJointAccount} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Create Joint Account
          </Button>

          <div className="p-4 bg-blue-50 rounded-lg text-sm">
            <p className="text-blue-900 font-medium mb-1">Note:</p>
            <p className="text-blue-800">
              Both customers must already be registered in the system.
              Use the exact Customer IDs as shown in their customer records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{selectedCustomer?.name}</h2>
          <p className="text-gray-600">Customer ID: {selectedCustomer?.customer_id}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => changeView('search')}>
            Back to Search
          </Button>
          <Button variant="outline" onClick={() => changeView('home')}>
            Home
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Customer Edit Modal/Panel */}
      {editingCustomer && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Edit Customer Details</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer Name *</Label>
                <Input
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={editingCustomer.phone_number || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone_number: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingCustomer.status ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditingCustomer({ ...editingCustomer, status: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCustomer} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditCustomer(selectedCustomer!)}
                disabled={editingCustomer !== null}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Name</Label>
              <p className="font-medium">{selectedCustomer?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">NIC</Label>
              <p className="font-medium">{selectedCustomer?.nic}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Phone</Label>
              <p className="font-medium">{selectedCustomer?.phone_number}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="font-medium">{selectedCustomer?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Date of Birth</Label>
              <p className="font-medium">{selectedCustomer?.date_of_birth}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Address</Label>
              <p className="font-medium">{selectedCustomer?.address}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Status</Label>
              <Badge variant={selectedCustomer?.status ? 'default' : 'secondary'}>
                {selectedCustomer?.status ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Savings Accounts ({selectedCustomerAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCustomerAccounts.length === 0 ? (
              <p className="text-sm text-gray-500">No savings accounts yet</p>
            ) : (
              selectedCustomerAccounts.map((account: any) => (
                <div key={account.saving_account_id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label className="text-xs text-gray-500">Account ID</Label>
                      <p className="font-medium text-sm">{account.saving_account_id}</p>
                    </div>
                    <Badge variant={account.status ? 'default' : 'secondary'}>
                      {account.status ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Balance</Label>
                    <p className="text-xl font-semibold text-green-600">
                      LKR {account.balance?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-xs text-gray-500">Plan ID</Label>
                      <p className="font-medium">{account.s_plan_id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date Opened</Label>
                      <p className="font-medium">{account.open_date || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCustomerAccounts.length > 0 ? (
              <>
                <div className="space-y-3">
                  <Label>Process Transaction</Label>
                  <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomerAccounts.map((acc: any) => (
                        <SelectItem key={acc.saving_account_id} value={acc.saving_account_id}>
                          {acc.saving_account_id} - {acc.account_type || 'Savings'} (LKR {acc.balance?.toLocaleString() || '0'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={transactionType} onValueChange={setTransactionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deposit">Deposit</SelectItem>
                        <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleTransaction} className="w-full" size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Process Transaction
                  </Button>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label>Open Fixed Deposit</Label>
                  <Select value={fdAccountId} onValueChange={setFdAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account for FD" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomerAccounts.map((acc: any) => (
                        <SelectItem
                          key={acc.saving_account_id}
                          value={acc.saving_account_id}
                          disabled={!acc.status}
                        >
                          {acc.saving_account_id} - Savings (LKR {Number(acc.balance || 0).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Select value={selectedFdPlan} onValueChange={setSelectedFdPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select FD Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {fdPlans.map((plan) => (
                          <SelectItem key={plan.f_plan_id} value={plan.f_plan_id.toString()}>
                            {plan.months} months - {plan.interest_rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="FD Amount"
                      value={fdAmount}
                      onChange={(e) => setFdAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleFdCreation}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create FD
                  </Button>
                  <p className="text-xs text-gray-500">
                    Note: Each account can have only one active FD
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">
                <p>No savings accounts found for this customer.</p>
                <p className="mt-2">Use "Open Savings Account" from home to create one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCustomerFixedDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Fixed Deposits ({selectedCustomerFixedDeposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCustomerFixedDeposits.map((fd: any) => (
                <div key={fd.fixed_deposit_id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">FD #{fd.fixed_deposit_id}</h4>
                      <p className="text-xs text-gray-500">Account: {fd.saving_account_id}</p>
                    </div>
                    <Badge variant={fd.status ? 'default' : 'secondary'}>
                      {fd.status ? 'Active' : 'Matured'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal:</span>
                      <span className="font-medium">LKR {(fd.principal_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{fd.f_plan_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{fd.start_date ? new Date(fd.start_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="font-medium">{fd.maturity_date ? new Date(fd.maturity_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {fd.last_payout_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Payout:</span>
                        <span className="font-medium">{fd.last_payout_date ? new Date(fd.last_payout_date).toLocaleDateString() : 'Never'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCustomerAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedCustomerTransactions.length > 0 ? (
                selectedCustomerTransactions.map((txn: any) => (
                  <div key={txn.transaction_id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{txn.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(txn.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-400">{txn.description || 'No description'}</p>
                      <p className="text-xs text-gray-400">Account: {txn.saving_account_id || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${txn.type === 'Deposit' || txn.type === 'Interest' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.type === 'Deposit' || txn.type === 'Interest' ? '+' : '-'}LKR {Number(txn.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Ref: {txn.ref_number || 'N/A'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p className="text-sm">Transactions will appear here once you process deposits or withdrawals</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reports Dashboard</h2>
          <p className="text-gray-600">Comprehensive reports for your assigned customers and transactions</p>
        </div>
        <div className="flex gap-2">
          {/* Refresh Views button - only for branch managers and admins */}
          {(user?.role === 'Branch Manager' || user?.role === 'Admin') && (
            <Button
              variant="outline"
              onClick={handleRefreshViews}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Refresh Data
            </Button>
          )}
          <Button variant="outline" onClick={() => changeView('home')}>
            Back to Home
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedReportTab} onValueChange={handleReportTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="transaction-summary">My Transactions</TabsTrigger>
          <TabsTrigger value="my-customers">My Customers</TabsTrigger>
          <TabsTrigger value="account-details">Account Details</TabsTrigger>
          <TabsTrigger value="linked-fds">Linked FDs</TabsTrigger>
          <TabsTrigger value="monthly-interest">Monthly Interest</TabsTrigger>
          <TabsTrigger value="customer-activity">Customer Activity</TabsTrigger>
        </TabsList>

        {/* My Transaction Summary */}
        <TabsContent value="transaction-summary" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    My Transaction Summary
                  </CardTitle>
                  <CardDescription>All transactions handled by you</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={dateFilter.period || 'this_month'} onValueChange={handleDateFilterChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadMyTransactionSummary} variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dateFilter.period === 'custom' && (
                <div className="mb-4 flex gap-2 items-end">
                  <div>
                    <Label className="text-sm">Start Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">End Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <Button onClick={applyCustomDateFilter} size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
              )}

              {reportsLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading transaction summary...</p>
                </div>
              )}

              {myTransactionSummary && !reportsLoading && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Customers</p>
                            <p className="text-2xl font-bold">{myCustomers.length}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Transactions</p>
                            <p className="text-2xl font-bold">{myTransactionSummary.total_transactions}</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Transaction Value</p>
                            <p className="text-2xl font-bold text-green-600">
                              {AgentReportsService.formatCurrency(myTransactionSummary.total_value)}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Agent Performance Table */}
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-medium">Agent Performance</h3>
                    </div>
                    <div className="divide-y">
                      {agentPerformanceData.slice(0, 10).map((agent) => (
                        <div key={agent.employee_id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="font-medium">{agent.agent_name}</p>
                                  <p className="text-sm text-gray-500">Branch: {agent.branch_name}</p>
                                </div>
                                <Badge variant="default">
                                  {agent.total_transactions} Transactions
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">
                                {AgentReportsService.formatCurrency(agent.total_value)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Avg: {AgentReportsService.formatCurrency(agent.avg_transaction_value)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Customers List */}
        <TabsContent value="my-customers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    My Customers List
                  </CardTitle>
                  <CardDescription>All customers assigned to you</CardDescription>
                </div>
                <Button onClick={loadMyCustomers} variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportsLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading customers...</p>
                </div>
              )}

              {myCustomers.length > 0 && !reportsLoading && (
                <div className="space-y-4">
                  {myCustomers.map((customer) => (
                    <div key={customer.customer_id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium">{customer.customer_name}</h4>
                            <p className="text-sm text-gray-500">ID: {customer.customer_id}</p>
                            <Badge variant="default">
                              Active
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Agent: {customer.agent_name}</p>
                            <p className="text-sm text-gray-600">Branch: {customer.branch_name}</p>
                            <p className="text-sm text-gray-600">Registered: {customer.registration_date ? new Date(customer.registration_date).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Accounts: {customer.total_accounts}</p>
                            <p className="text-sm text-gray-600">Total Balance: {AgentReportsService.formatCurrency(customer.current_total_balance)}</p>
                            <p className="text-sm text-gray-600">
                              Last Transaction: {customer.last_transaction_date ? new Date(customer.last_transaction_date).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                setSearchQuery(customer.customer_id);
                                setSearchType('customer_id');
                                setLoading(true);

                                // Search for the customer to get complete details
                                const searchResults = await CustomerService.searchCustomers({ customer_id: customer.customer_id }, user!.token);
                                if (searchResults.length > 0) {
                                  const foundCustomer = searchResults[0];
                                  setSelectedCustomer(foundCustomer);

                                  // Load customer accounts and transactions
                                  const accounts = await SavingsAccountService.searchSavingsAccounts({ customer_id: foundCustomer.customer_id }, user!.token);

                                  // Get transactions for all customer accounts
                                  let allTransactions: Transaction[] = [];
                                  for (const account of accounts) {
                                    try {
                                      const transactions = await TransactionService.getTransactionHistory(account.saving_account_id, user!.token);
                                      allTransactions.push(...transactions);
                                    } catch (error) {
                                      console.error(`Failed to load transactions for account ${account.saving_account_id}:`, error);
                                    }
                                  }

                                  setSelectedCustomerAccounts(accounts);
                                  setSelectedCustomerTransactions(allTransactions);
                                  changeView('customer');
                                }
                              } catch (error) {
                                console.error('Error loading customer details:', error);
                                setError(handleApiError(error));
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Accounts
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                setSearchQuery(customer.customer_id);
                                setSearchType('customer_id');
                                setLoading(true);

                                // Search for the customer to get complete details
                                const searchResults = await CustomerService.searchCustomers({ customer_id: customer.customer_id }, user!.token);
                                if (searchResults.length > 0) {
                                  const foundCustomer = searchResults[0];
                                  setSelectedCustomer(foundCustomer);

                                  // Load customer accounts and transactions
                                  const accounts = await SavingsAccountService.searchSavingsAccounts({ customer_id: foundCustomer.customer_id }, user!.token);

                                  // Get transactions for all customer accounts
                                  let allTransactions: Transaction[] = [];
                                  for (const account of accounts) {
                                    try {
                                      const transactions = await TransactionService.getTransactionHistory(account.saving_account_id, user!.token);
                                      allTransactions.push(...transactions);
                                    } catch (error) {
                                      console.error(`Failed to load transactions for account ${account.saving_account_id}:`, error);
                                    }
                                  }

                                  setSelectedCustomerAccounts(accounts);
                                  setSelectedCustomerTransactions(allTransactions);
                                  changeView('customer');

                                  // Focus on the transaction tab after navigation
                                  setTimeout(() => {
                                    setSelectedReportTab('transaction-summary');
                                  }, 100);
                                }
                              } catch (error) {
                                console.error('Error loading customer for transaction:', error);
                                setError(handleApiError(error));
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            New Transaction
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Details & Transaction History */}
        <TabsContent value="account-details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Account Details & Transaction History
              </CardTitle>
              <CardDescription>Detailed view of account information and transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="Enter Account ID (e.g., SA001)"
                  className="max-w-xs"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const accountId = (e.target as HTMLInputElement).value;
                      if (accountId) {
                        loadAccountDetails(accountId);
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Account ID"]') as HTMLInputElement;
                    if (input?.value) {
                      loadAccountDetails(input.value);
                    }
                  }}
                  size="sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {reportsLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading account details...</p>
                </div>
              )}

              {selectedAccountDetails && !reportsLoading && (
                <div className="space-y-6">
                  {/* Account Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Account Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account ID:</span>
                          <span className="font-medium">{selectedAccountDetails.account.account_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Type:</span>
                          <span className="font-medium">{selectedAccountDetails.account.account_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Balance:</span>
                          <span className="font-medium text-green-600">
                            {AgentReportsService.formatCurrency(selectedAccountDetails.account.current_balance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Minimum Balance:</span>
                          <span className="font-medium">
                            {AgentReportsService.formatCurrency(selectedAccountDetails.account.minimum_balance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest Rate:</span>
                          <span className="font-medium">{selectedAccountDetails.account.interest_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={selectedAccountDetails.account.status === 'Active' ? 'default' : 'secondary'}>
                            {selectedAccountDetails.account.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Account Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Accounts:</span>
                          <span className="font-medium">{selectedAccountDetails.summary.total_accounts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Balance:</span>
                          <span className="font-medium text-green-600">
                            {AgentReportsService.formatCurrency(selectedAccountDetails.summary.total_balance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average Balance:</span>
                          <span className="font-medium text-blue-600">
                            {AgentReportsService.formatCurrency(selectedAccountDetails.summary.average_balance)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Account List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {selectedAccountDetails.transactions.map((account) => (
                          <div key={account.saving_account_id} className="py-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="default">
                                    {account.plan_name}
                                  </Badge>
                                  <span className="font-medium">{account.customer_name}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Account: {account.saving_account_id} • Opened: {account.open_date ? new Date(account.open_date).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-green-600">
                                  {AgentReportsService.formatCurrency(account.current_balance)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {account.transaction_count} transactions
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linked Fixed Deposits */}
        <TabsContent value="linked-fds" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Linked Fixed Deposits
                  </CardTitle>
                  <CardDescription>All FDs linked to your customers' accounts</CardDescription>
                </div>
                <Button onClick={loadLinkedFixedDeposits} variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportsLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading fixed deposits...</p>
                </div>
              )}

              {linkedFDs.length > 0 && !reportsLoading && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{linkedFDs.length}</p>
                          <p className="text-sm text-gray-500">Total FDs</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {linkedFDs.filter(fd => fd.status === 'Active' || fd.fd_status === 'Active').length}
                          </p>
                          <p className="text-sm text-gray-500">Active FDs</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {AgentReportsService.formatCurrency(
                              linkedFDs.reduce((sum, fd) => sum + fd.principal_amount, 0)
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Total Principal</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {AgentReportsService.formatCurrency(
                              linkedFDs.reduce((sum, fd) => sum + (fd.total_interest_credited || fd.total_interest || 0), 0)
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Interest To Be Credited</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* FDs Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {linkedFDs.map((fd) => (
                      <Card key={fd.fd_id} className={`${fd.status === 'Matured' ? 'bg-gray-50 border-gray-300' : 'hover:shadow-md transition-shadow'}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">FD #{fd.fd_id}</CardTitle>
                              <CardDescription>
                                {fd.customer_names && Array.isArray(fd.customer_names)
                                  ? fd.customer_names.join(' & ')
                                  : 'Customer Information Not Available'}
                              </CardDescription>
                            </div>
                            <Badge variant={fd.status === 'Active' ? 'default' : 'secondary'}>
                              {fd.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Linked Account:</p>
                              <p className="font-medium">{fd.linked_savings_account}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Principal Amount:</p>
                              <p className="font-medium text-green-600">
                                {AgentReportsService.formatCurrency(fd.principal_amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Interest Rate:</p>
                              <p className="font-medium">{fd.interest_rate}% p.a.</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Plan Duration:</p>
                              <p className="font-medium">{fd.plan_months} months</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Start Date:</p>
                              <p className="font-medium">{fd.start_date ? new Date(fd.start_date).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Maturity Date:</p>
                              <p className="font-medium">
                                {fd.maturity_date
                                  ? new Date(fd.maturity_date).toLocaleDateString()
                                  : 'Date not available'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Next Payout:</p>
                                <p className={`font-medium ${fd.next_payout_date ? 'text-blue-600' : 'text-gray-500'}`}>
                                  {fd.next_payout_date ? new Date(fd.next_payout_date).toLocaleDateString() : 'Matured'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total Interest:</p>
                                <p className="font-medium text-green-600">
                                  {AgentReportsService.formatCurrency(fd.total_interest_credited || fd.total_interest || 0)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {fd.status === 'Active' && fd.next_payout_date && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Next payout in {Math.ceil((new Date(fd.next_payout_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {linkedFDs.length === 0 && !reportsLoading && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Fixed Deposits Found</h3>
                  <p className="text-gray-500">Your customers haven't opened any fixed deposits yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Interest Distribution */}
        <TabsContent value="monthly-interest" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Monthly Interest Distribution Summary
                  </CardTitle>
                  <CardDescription>Interest credited to your customers' accounts by month</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                  <Button onClick={loadMonthlyInterest} variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportsLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading interest summary...</p>
                </div>
              )}

              {monthlyInterest.length > 0 && !reportsLoading && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {monthlyInterest.reduce((sum, item) => sum + item.account_count, 0)}
                          </p>
                          <p className="text-sm text-gray-500">Accounts Credited</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {AgentReportsService.formatCurrency(
                              monthlyInterest.reduce((sum, item) => sum + item.total_interest_paid, 0)
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Total Interest</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {AgentReportsService.formatCurrency(
                              monthlyInterest.length > 0
                                ? monthlyInterest.reduce((sum, item) => sum + item.average_interest_per_account, 0) / monthlyInterest.length
                                : 0
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Avg per Account</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {new Set(monthlyInterest.map(item => item.plan_name)).size}
                          </p>
                          <p className="text-sm text-gray-500">Account Types</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Interest Details by Account Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from(new Set(monthlyInterest.map(item => item.plan_name))).map((planName) => {
                      const typeData = monthlyInterest.filter(item => item.plan_name === planName);
                      const totalInterest = typeData.reduce((sum, item) => sum + item.total_interest_paid, 0);
                      const totalAccounts = typeData.reduce((sum, item) => sum + item.account_count, 0);

                      return (
                        <Card key={planName}>
                          <CardHeader>
                            <CardTitle className="text-lg">{planName}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Accounts:</span>
                              <span className="font-medium">{totalAccounts}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Interest:</span>
                              <span className="font-medium text-green-600">
                                {AgentReportsService.formatCurrency(totalInterest)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Average:</span>
                              <span className="font-medium">
                                {AgentReportsService.formatCurrency(totalAccounts > 0 ? totalInterest / totalAccounts : 0)}
                              </span>
                            </div>
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500">
                                Last Credit: {typeData[0]?.month ? `${typeData[0].month} ${typeData[0].year}` : 'N/A'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Detailed Monthly Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Interest Distribution Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {monthlyInterest.map((item, index) => (
                          <div key={index} className="py-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <div>
                                <p className="font-medium text-gray-900">{item.plan_name}</p>
                                <p className="text-sm text-gray-500">{item.month} {item.year}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Accounts</p>
                                <p className="font-medium text-lg">{item.account_count}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Total Interest</p>
                                <p className="font-medium text-lg text-green-600">
                                  {AgentReportsService.formatCurrency(item.total_interest_paid)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Average</p>
                                <p className="font-medium text-lg">
                                  {AgentReportsService.formatCurrency(item.average_interest_per_account)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Period</p>
                                <p className="font-medium">{item.month} {item.year}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {monthlyInterest.length === 0 && !reportsLoading && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Interest Data Found</h3>
                  <p className="text-gray-500 mb-4">No interest payments found for the selected month.</p>
                  <p className="text-sm text-gray-400">Try selecting a different month or check if interest has been processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Activity Summary */}
        <TabsContent value="customer-activity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Customer Activity Summary
                  </CardTitle>
                  <CardDescription>Overview of customer deposits, withdrawals, and FD status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={dateFilter.period || 'this_month'} onValueChange={handleDateFilterChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadCustomerActivity} variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dateFilter.period === 'custom' && (
                <div className="mb-4 flex gap-2 items-end">
                  <div>
                    <Label className="text-sm">Start Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">End Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <Button onClick={applyCustomDateFilter} size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
              )}

              {reportsLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading customer activity...</p>
                </div>
              )}

              {customerActivity.length > 0 && !reportsLoading && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{customerActivity.length}</p>
                          <p className="text-sm text-gray-500">Total Customers</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {AgentReportsService.formatCurrency(
                              customerActivity.reduce((sum, cust) => sum + cust.total_deposits, 0)
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Total Deposits</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {AgentReportsService.formatCurrency(
                              customerActivity.reduce((sum, cust) => sum + cust.total_withdrawals, 0)
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Total Withdrawals</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {customerActivity.reduce((sum, cust) => sum + cust.active_fd_count, 0)}
                          </p>
                          <p className="text-sm text-gray-500">Active FDs</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">
                            {AgentReportsService.formatCurrency(
                              customerActivity.reduce((sum, cust) => sum + cust.current_total_balance, 0)
                            )}
                          </p>
                          <p className="text-sm text-gray-500">Total Balance</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Customer Activity Details */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Customer Activity Details</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {customerActivity.map((customer) => (
                          <div key={customer.customer_id} className="py-4 hover:bg-gray-50 rounded px-2">
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                              <div>
                                <p className="font-medium text-gray-900">{customer.customer_name}</p>
                                <p className="text-sm text-gray-500">{customer.customer_id}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Deposits</p>
                                <p className="font-medium text-green-600">
                                  {AgentReportsService.formatCurrency(customer.total_deposits)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Withdrawals</p>
                                <p className="font-medium text-red-600">
                                  {AgentReportsService.formatCurrency(customer.total_withdrawals)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Net Change</p>
                                <p className={`font-medium ${customer.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {AgentReportsService.formatCurrency(customer.net_change)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Active FDs</p>
                                <p className="font-medium text-purple-600">{customer.active_fd_count}</p>
                                <p className="text-xs text-gray-500">Fixed Deposits</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Account Count</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {customer.total_accounts} Account{customer.total_accounts !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {customerActivity.length === 0 && !reportsLoading && (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Activity Found</h3>
                  <p className="text-gray-500 mb-4">No customer activity data available for the selected period.</p>
                  <p className="text-sm text-gray-400">Try selecting a different date range or check if transactions have been processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl text-gray-900">Agent Dashboard</h1>
                <p className="text-sm text-gray-500">{branchInfo?.branch_name || 'Loading Branch...'}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && renderHomeScreen()}
        {currentView === 'search' && renderCustomerSearch()}
        {currentView === 'customer' && renderCustomerView()}
        {currentView === 'register' && renderRegisterCustomer()}
        {currentView === 'create-account' && renderCreateAccount()}
        {currentView === 'create-joint' && renderCreateJointAccount()}
        {currentView === 'reports' && renderReports()}
      </div>
    </div>
  );
}
