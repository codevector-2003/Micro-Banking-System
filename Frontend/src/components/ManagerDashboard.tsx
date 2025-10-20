import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Building2, Calendar, DollarSign, Edit, FileText, LogOut, RefreshCw, Search, TrendingDown, TrendingUp, User, UserPlus, Users, X, Save, Filter, Download, Clock, ArrowUpDown, FileDown } from "lucide-react";
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  ManagerEmployeeService,
  ManagerCustomerService,
  ManagerTransactionService,
  ManagerTasksService,
  ManagerStatsService,
  ManagerSavingsAccountService,
  ManagerFixedDepositService,
  type Employee,
  type Customer,
  type TaskStatus,
  type InterestReport,
  type SavingsAccount,
  type FixedDeposit,
  type BranchSavingsStats,
  type BranchFixedDepositStats,
  handleApiError
} from '../services/managerService';
import {
  ViewsService,
  type AgentTransactionReport,
  type AccountTransactionReport,
  type ActiveFixedDepositReport,
  type MonthlyInterestDistributionReport,
  type CustomerActivityReport,
  handleApiError as handleViewsApiError
} from '../services/viewsService';

import {
  ManagerReportsService,
  type BranchOverviewSummary,
  type AgentTransactionReport as ManagerAgentReport,
  type AccountTransactionReport as ManagerAccountReport,
  type ActiveFixedDepositReport as ManagerFDReport,
  type MonthlyInterestReport as ManagerInterestReport,
  type CustomerActivityReport as ManagerCustomerReport,
  type DateFilter,
  type SortOptions
} from '../services/managerReportsService';

// Import the detailed account view components
import { BranchSavingsAccounts } from './BranchSavingsAccounts';
import { BranchFixedDeposits } from './BranchFixedDeposits';
import { CSVExportService } from '../services/csvExportService';

export function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [savingsStats, setSavingsStats] = useState<BranchSavingsStats | null>(null);
  const [fixedDepositStats, setFixedDepositStats] = useState<BranchFixedDepositStats | null>(null);
  const [branchStats, setBranchStats] = useState({
    totalEmployees: 0,
    activeAgents: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    newAccountsThisMonth: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    netGrowth: 0
  });
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [savingsInterestReport, setSavingsInterestReport] = useState<InterestReport | null>(null);
  const [fdInterestReport, setFdInterestReport] = useState<InterestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Employee management state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeSearchType, setEmployeeSearchType] = useState('name');

  // Reports state (Original ViewsService reports)
  const [agentTransactionReport, setAgentTransactionReport] = useState<AgentTransactionReport | null>(null);
  const [accountTransactionReport, setAccountTransactionReport] = useState<AccountTransactionReport | null>(null);
  const [activeFDReport, setActiveFDReport] = useState<ActiveFixedDepositReport | null>(null);
  const [monthlyInterestReport, setMonthlyInterestReport] = useState<MonthlyInterestDistributionReport | null>(null);
  const [customerActivityReport, setCustomerActivityReport] = useState<CustomerActivityReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReportYear, setSelectedReportYear] = useState<number>(new Date().getFullYear());
  const [selectedReportMonth, setSelectedReportMonth] = useState<number | undefined>(undefined);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Enhanced Manager Reports state
  const [branchOverview, setBranchOverview] = useState<BranchOverviewSummary | null>(null);
  const [managerAgentReport, setManagerAgentReport] = useState<ManagerAgentReport | null>(null);
  const [managerAccountReport, setManagerAccountReport] = useState<ManagerAccountReport | null>(null);
  const [managerFDReport, setManagerFDReport] = useState<ManagerFDReport | null>(null);
  const [managerInterestReport, setManagerInterestReport] = useState<ManagerInterestReport | null>(null);
  const [managerCustomerReport, setManagerCustomerReport] = useState<ManagerCustomerReport | null>(null);

  // Enhanced report filters and controls
  const [activeReportTab, setActiveReportTab] = useState('overview');
  const [reportDateFilter, setReportDateFilter] = useState<DateFilter>({ period: 'this_month' });
  const [customReportDateRange, setCustomReportDateRange] = useState({ start: '', end: '' });
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('');
  const [fdSortBy, setFdSortBy] = useState<'maturity_date' | 'payout_date' | 'principal_amount'>('maturity_date');
  const [reportSortOptions, setReportSortOptions] = useState<SortOptions>({ field: 'name', order: 'asc' });
  const [enhancedReportsLoading, setEnhancedReportsLoading] = useState(false);

  // Load initial data when component mounts
  useEffect(() => {
    if (user?.token) {
      loadBranchData();
      // No need to call these methods here as they're now handled by the respective components
      // loadSavingsAccounts();
      // loadFixedDeposits();
    }
  }, [user?.token]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadBranchData = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const stats = await ManagerStatsService.getBranchStatistics(user.token);
      setBranchStats({
        ...branchStats,
        totalEmployees: stats.totalEmployees,
        activeAgents: stats.activeAgents,
        totalCustomers: stats.totalCustomers,
        activeCustomers: stats.activeCustomers,
        newAccountsThisMonth: Math.floor(stats.totalCustomers * 0.15), // Estimate
        totalDeposits: stats.totalCustomers * 18500, // Estimate
        totalWithdrawals: stats.totalCustomers * 8200, // Estimate
        netGrowth: stats.totalCustomers * 10300 // Estimate
      });
      setEmployees(stats.employees);
      setCustomers(stats.customers);
      setSavingsStats(stats.savingsStats);
      setFixedDepositStats(stats.fixedDepositStats);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadSavingsAccounts = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const accounts = await ManagerSavingsAccountService.getBranchSavingsAccounts(user.token);
      const stats = await ManagerSavingsAccountService.getBranchSavingsStats(user.token);
      setSavingsAccounts(accounts);
      setSavingsStats(stats);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadFixedDeposits = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const deposits = await ManagerFixedDepositService.getBranchFixedDeposits(user.token);
      const stats = await ManagerFixedDepositService.getBranchFixedDepositStats(user.token);
      setFixedDeposits(deposits);
      setFixedDepositStats(stats);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadTaskStatus = async () => {
    if (!user?.token) return;

    try {
      const status = await ManagerTasksService.getTaskStatus(user.token);
      setTaskStatus(status);
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  const loadInterestReports = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const [savingsReport, fdReport] = await Promise.all([
        ManagerTasksService.getSavingsAccountInterestReport(user.token),
        ManagerTasksService.getFixedDepositInterestReport(user.token)
      ]);
      setSavingsInterestReport(savingsReport);
      setFdInterestReport(fdReport);
      setSuccess('Interest reports loaded successfully');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Load all reports
  const loadAllReports = async () => {
    if (!user?.token) return;

    try {
      setReportLoading(true);
      setError('');

      const [agentReport, accountReport, fdReport, interestReport, activityReport] = await Promise.all([
        ViewsService.getAgentTransactionReport(user.token),
        ViewsService.getAccountTransactionReport(user.token),
        ViewsService.getActiveFixedDeposits(user.token),
        ViewsService.getMonthlyInterestDistribution(user.token, selectedReportYear, selectedReportMonth),
        ViewsService.getCustomerActivityReport(user.token)
      ]);

      setAgentTransactionReport(agentReport);
      setAccountTransactionReport(accountReport);
      setActiveFDReport(fdReport);
      setMonthlyInterestReport(interestReport);
      setCustomerActivityReport(activityReport);
      setSuccess('Reports loaded successfully');
    } catch (error) {
      setError(handleViewsApiError(error));
    } finally {
      setReportLoading(false);
    }
  };

  // Refresh materialized views
  const handleRefreshViews = async () => {
    if (!user?.token) return;

    try {
      setReportLoading(true);
      setError('');

      await ViewsService.refreshMaterializedViews(user.token);
      setLastRefreshTime(new Date());
      setSuccess('Materialized views refreshed successfully');

      // Reload reports after refresh
      await loadAllReports();
    } catch (error) {
      setError(handleViewsApiError(error));
    } finally {
      setReportLoading(false);
    }
  };

  // Global Reports state for real-time data
  const [globalReportsData, setGlobalReportsData] = useState<{
    branchSummary: {
      total_customers: number;
      total_accounts: number;
      total_balance: number;
      new_accounts_this_month: number;
      account_types: { type: string; count: number; balance: number }[];
    };
    fdOverview: {
      total_fds: number;
      total_principal: number;
      total_expected_interest: number;
      pending_payouts: number;
      maturing_this_month: number;
      by_duration: { months: number; count: number; principal: number; avg_rate: number }[];
    };
    agentPerformance: {
      total_agents: number;
      total_transactions: number;
      total_transaction_value: number;
      agents: { name: string; transactions: number; value: number; customers: number }[];
    };
    monthlyTrends: {
      total_deposits: number;
      total_withdrawals: number;
      net_flow: number;
      transaction_count: number;
    };
  } | null>(null);
  const [globalReportsLoading, setGlobalReportsLoading] = useState(false);

  // Enhanced Report Loading Functions
  const loadBranchOverview = async () => {
    if (!user?.token) return;
    try {
      const overview = await ManagerReportsService.getBranchOverviewSummary(user.token);
      setBranchOverview(overview);
    } catch (error) {
      console.error('Error loading branch overview:', error);
    }
  };

  const loadEnhancedAgentReport = async () => {
    if (!user?.token) return;
    try {
      const report = await ManagerReportsService.getAgentTransactionReport(user.token, reportDateFilter);
      setManagerAgentReport(report);
    } catch (error) {
      console.error('Error loading agent report:', error);
    }
  };

  const loadEnhancedAccountReport = async () => {
    if (!user?.token) return;
    try {
      const report = await ManagerReportsService.getAccountTransactionSummary(
        user.token,
        {
          accountType: accountTypeFilter || undefined,
          dateFilter: reportDateFilter
        }
      );
      setManagerAccountReport(report);
    } catch (error) {
      console.error('Error loading account report:', error);
    }
  };

  const loadEnhancedFDReport = async () => {
    if (!user?.token) return;
    try {
      const report = await ManagerReportsService.getActiveFixedDepositReport(user.token, fdSortBy);
      setManagerFDReport(report);
    } catch (error) {
      console.error('Error loading FD report:', error);
    }
  };

  const loadEnhancedInterestReport = async () => {
    if (!user?.token) return;
    try {
      const report = await ManagerReportsService.getMonthlyInterestReport(
        user.token,
        selectedReportMonth,
        selectedReportYear
      );
      setManagerInterestReport(report);
    } catch (error) {
      console.error('Error loading interest report:', error);
    }
  };

  const loadEnhancedCustomerReport = async () => {
    if (!user?.token) return;
    try {
      const report = await ManagerReportsService.getCustomerActivityReport(
        user.token,
        {
          dateFilter: reportDateFilter,
          accountType: accountTypeFilter || undefined
        }
      );
      setManagerCustomerReport(report);
    } catch (error) {
      console.error('Error loading customer report:', error);
    }
  };

  // Load Global Reports Data
  const loadGlobalReportsData = async () => {
    if (!user?.token) return;

    try {
      setGlobalReportsLoading(true);
      setError('');

      // Fetch all reports in parallel
      const [accountReport, fdReport, agentReport, customerReport] = await Promise.all([
        ViewsService.getAccountTransactionReport(user.token),
        ViewsService.getActiveFixedDeposits(user.token),
        ViewsService.getAgentTransactionReport(user.token),
        ViewsService.getCustomerActivityReport(user.token)
      ]);

      // Process Account Summary by Type (using plan_name)
      const accountTypesMap = new Map<string, { count: number; balance: number }>();
      accountReport.data.forEach(account => {
        const type = account.plan_name || 'Unknown Plan';
        const existing = accountTypesMap.get(type) || { count: 0, balance: 0 };
        accountTypesMap.set(type, {
          count: existing.count + 1,
          balance: existing.balance + (account.current_balance || 0)
        });
      });

      const accountTypes = Array.from(accountTypesMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        balance: data.balance
      })).sort((a, b) => b.balance - a.balance);

      // Process FD Overview by Duration
      const fdByDurationMap = new Map<number, { count: number; principal: number; totalInterestRate: number }>();
      fdReport.data.forEach(fd => {
        const months = fd.plan_months || 0;
        const existing = fdByDurationMap.get(months) || { count: 0, principal: 0, totalInterestRate: 0 };
        fdByDurationMap.set(months, {
          count: existing.count + 1,
          principal: existing.principal + (fd.principal_amount || 0),
          totalInterestRate: existing.totalInterestRate + (fd.interest_rate || 0)
        });
      });

      const fdByDuration = Array.from(fdByDurationMap.entries()).map(([months, data]) => ({
        months,
        count: data.count,
        principal: data.principal,
        avg_rate: data.count > 0 ? data.totalInterestRate / data.count : 0
      })).sort((a, b) => a.months - b.months);

      // Process Agent Performance (top 5 by transaction value)
      const agentsList = agentReport.data
        .map(agent => ({
          name: agent.employee_name || 'Unknown',
          transactions: agent.total_transactions || 0,
          value: agent.total_value || 0,
          customers: 0 // Will be calculated if needed
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Process Monthly Trends
      const totalDeposits = customerReport.summary?.total_deposits || 0;
      const totalWithdrawals = customerReport.summary?.total_withdrawals || 0;
      const netFlow = customerReport.summary?.net_flow || 0;

      // Calculate new accounts this month
      const now = new Date();
      const newAccountsThisMonth = accountReport.data.filter(acc => {
        if (!acc.open_date) return false;
        const openDate = new Date(acc.open_date);
        return openDate.getMonth() === now.getMonth() && openDate.getFullYear() === now.getFullYear();
      }).length;

      // Calculate maturing FDs this month
      const maturingThisMonth = fdReport.data.filter(fd => {
        if (!fd.end_date) return false;
        const endDate = new Date(fd.end_date);
        return endDate.getMonth() === now.getMonth() && endDate.getFullYear() === now.getFullYear();
      }).length;

      setGlobalReportsData({
        branchSummary: {
          total_customers: customerReport.summary?.total_customers || 0,
          total_accounts: accountReport.summary?.total_accounts || 0,
          total_balance: accountReport.summary?.total_balance || 0,
          new_accounts_this_month: newAccountsThisMonth,
          account_types: accountTypes
        },
        fdOverview: {
          total_fds: fdReport.summary?.total_fds || 0,
          total_principal: fdReport.summary?.total_principal_amount || 0,
          total_expected_interest: fdReport.summary?.total_expected_interest || 0,
          pending_payouts: fdReport.summary?.pending_payouts || 0,
          maturing_this_month: maturingThisMonth,
          by_duration: fdByDuration
        },
        agentPerformance: {
          total_agents: agentReport.summary?.total_agents || 0,
          total_transactions: agentReport.summary?.total_transactions || 0,
          total_transaction_value: agentReport.summary?.total_value || 0,
          agents: agentsList
        },
        monthlyTrends: {
          total_deposits: totalDeposits,
          total_withdrawals: totalWithdrawals,
          net_flow: netFlow,
          transaction_count: accountReport.data.reduce((sum, acc) => sum + (acc.total_transactions || 0), 0)
        }
      });

      setSuccess('Global reports loaded successfully');
    } catch (error) {
      console.error('Error loading global reports:', error);
      setError('Failed to load global reports');
    } finally {
      setGlobalReportsLoading(false);
    }
  };

  const loadAllEnhancedReports = async () => {
    if (!user?.token) return;

    try {
      setEnhancedReportsLoading(true);
      setError('');

      await Promise.all([
        loadBranchOverview(),
        loadEnhancedAgentReport(),
        loadEnhancedAccountReport(),
        loadEnhancedFDReport(),
        loadEnhancedInterestReport(),
        loadEnhancedCustomerReport()
      ]);

      setSuccess('Enhanced reports loaded successfully');
    } catch (error) {
      setError('Failed to load enhanced reports');
    } finally {
      setEnhancedReportsLoading(false);
    }
  };

  const handleReportDateFilterChange = (period: string) => {
    setReportDateFilter({ period: period as DateFilter['period'] });
    if (period !== 'custom') {
      // Auto-reload reports for non-custom periods
      if (activeReportTab === 'agent-transactions') loadEnhancedAgentReport();
      if (activeReportTab === 'customer-activity') loadEnhancedCustomerReport();
    }
  };

  const applyCustomReportDateFilter = () => {
    if (customReportDateRange.start && customReportDateRange.end) {
      setReportDateFilter({
        period: 'custom',
        startDate: customReportDateRange.start,
        endDate: customReportDateRange.end
      });
      // Reload relevant reports
      if (activeReportTab === 'agent-transactions') loadEnhancedAgentReport();
      if (activeReportTab === 'customer-activity') loadEnhancedCustomerReport();
    }
  };

  const handleSearchEmployees = async () => {
    if (!user?.token || !employeeSearchQuery.trim()) {
      await loadBranchData(); // Load all if no search query
      return;
    }

    try {
      setLoading(true);
      const searchCriteria = {
        [employeeSearchType]: employeeSearchQuery.trim()
      };
      const searchResults = await ManagerEmployeeService.searchEmployees(user.token, searchCriteria);
      setEmployees(searchResults);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployeeContact = async (employeeId: string, contactData: {
    phone_number?: string;
    address?: string
  }) => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await ManagerEmployeeService.updateEmployeeContact(user.token, employeeId, contactData);
      await loadBranchData(); // Reload data
      setEditingEmployee(null);
      setSuccess('Employee contact updated successfully');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployeeStatus = async (employee: Employee) => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await ManagerEmployeeService.changeEmployeeStatus(user.token, employee.employee_id, !employee.status);
      await loadBranchData(); // Reload data
      setSuccess(`Employee ${employee.status ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl text-gray-900">Branch Manager Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.username} - Employee ID: {user?.employeeId || 'N/A'}</p>
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
        {/* Error and Success Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-semibold">{branchStats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Deposits</p>
                  <p className="text-2xl font-semibold">
                    Rs. {((savingsStats?.total_balance || 0) + (fixedDepositStats?.total_principal_amount || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">New Accounts</p>
                  <p className="text-2xl font-semibold">
                    {(savingsStats?.new_accounts_this_month || 0) + (fixedDepositStats?.new_fds_this_month || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-semibold">
                    {(savingsStats?.total_accounts || 0) + (fixedDepositStats?.total_fixed_deposits || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="agents">Monitor Agents</TabsTrigger>
            <TabsTrigger value="savings">Savings Accounts</TabsTrigger>
            <TabsTrigger value="deposits">Fixed Deposits</TabsTrigger>
            <TabsTrigger value="transactions">Branch Analytics</TabsTrigger>
            <TabsTrigger value="manage">Manage Agents</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Monitor Agents */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Agent Performance</CardTitle>
                    <CardDescription>
                      Performance metrics for agents in your branch
                    </CardDescription>
                  </div>
                  <Button onClick={loadBranchData} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading && <div className="text-center py-4">Loading agents...</div>}

                <div className="space-y-4">
                  {employees.filter(emp => emp.type === 'Agent').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No agents found in your branch
                    </div>
                  ) : (
                    employees
                      .filter(emp => emp.type === 'Agent')
                      .map((agent) => {
                        // Calculate customers assigned to this agent
                        const agentCustomers = customers.filter(cust => cust.employee_id === agent.employee_id);
                        const performanceScore = Math.min((agentCustomers.length / 20) * 100, 100); // Max 100%

                        return (
                          <div key={agent.employee_id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">{agent.name}</h4>
                                <p className="text-sm text-gray-500">ID: {agent.employee_id}</p>
                              </div>
                              <Badge variant={agent.status ? 'default' : 'secondary'}>
                                {agent.status ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Customers</p>
                                <p className="font-medium">{agentCustomers.length}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Phone</p>
                                <p className="font-medium">{agent.phone_number || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Last Login</p>
                                <p className="font-medium">
                                  {agent.last_login_time
                                    ? new Date(agent.last_login_time).toLocaleDateString()
                                    : 'Never'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex justify-between text-sm">
                                <span>Performance Score</span>
                                <span>{Math.round(performanceScore)}%</span>
                              </div>
                              <Progress value={performanceScore} className="mt-2" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Savings Accounts */}
          <TabsContent value="savings" className="space-y-6">
            {/* Using the enhanced BranchSavingsAccounts component */}
            <BranchSavingsAccounts
              token={user?.token || ''}
              onError={(msg) => setError(msg)}
            />
          </TabsContent>

          {/* Fixed Deposits */}
          <TabsContent value="deposits" className="space-y-6">
            {/* Using the enhanced BranchFixedDeposits component */}
            <BranchFixedDeposits
              token={user?.token || ''}
              onError={(msg) => setError(msg)}
            />
          </TabsContent>

          {/* Branch Analytics */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Global Reports Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Branch Performance Overview</CardTitle>
                    <CardDescription>Real-time analytics and insights for your branch</CardDescription>
                  </div>
                  <Button
                    onClick={loadGlobalReportsData}
                    disabled={globalReportsLoading}
                    size="sm"
                    variant="outline"
                  >
                    {globalReportsLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Reports
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {globalReportsLoading && (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Loading branch reports...</p>
                  </div>
                )}

                {!globalReportsLoading && !globalReportsData && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No reports loaded yet</p>
                    <Button onClick={loadGlobalReportsData}>Load Branch Reports</Button>
                  </div>
                )}

                {!globalReportsLoading && globalReportsData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Branch Summary Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Users className="h-5 w-5 mr-2 text-blue-600" />
                          Branch Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Customers</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {globalReportsData.branchSummary.total_customers}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Accounts</p>
                            <p className="text-2xl font-bold text-green-600">
                              {globalReportsData.branchSummary.total_accounts}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Balance</p>
                            <p className="text-lg font-bold text-purple-600">
                              Rs. {globalReportsData.branchSummary.total_balance.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">New This Month</p>
                            <p className="text-lg font-bold text-orange-600">
                              {globalReportsData.branchSummary.new_accounts_this_month}
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm font-medium mb-3">Account Distribution</p>
                          <div className="space-y-2">
                            {globalReportsData.branchSummary.account_types.map((type, idx) => {
                              const maxBalance = Math.max(...globalReportsData.branchSummary.account_types.map(t => t.balance));
                              const percentage = maxBalance > 0 ? (type.balance / maxBalance) * 100 : 0;
                              return (
                                <div key={idx}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium">{type.type}</span>
                                    <span className="text-gray-600">
                                      {type.count} accounts - Rs. {type.balance.toLocaleString()}
                                    </span>
                                  </div>
                                  <Progress value={percentage} className="h-2" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* FD Overview Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                          Fixed Deposits Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Active FDs</p>
                            <p className="text-2xl font-bold text-green-600">
                              {globalReportsData.fdOverview.total_fds}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Principal</p>
                            <p className="text-lg font-bold text-blue-600">
                              Rs. {globalReportsData.fdOverview.total_principal.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Expected Interest</p>
                            <p className="text-lg font-bold text-purple-600">
                              Rs. {globalReportsData.fdOverview.total_expected_interest.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Maturing This Month</p>
                            <p className="text-lg font-bold text-orange-600">
                              {globalReportsData.fdOverview.maturing_this_month}
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm font-medium mb-3">FDs by Duration</p>
                          <div className="space-y-2">
                            {globalReportsData.fdOverview.by_duration.map((fd, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{fd.months} months</Badge>
                                  <span className="text-gray-600">{fd.count} FDs</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">Rs. {fd.principal.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">Avg: {fd.avg_rate.toFixed(2)}%</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {globalReportsData.fdOverview.pending_payouts > 0 && (
                            <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                              <span className="text-yellow-800 font-medium">
                                ⚠ {globalReportsData.fdOverview.pending_payouts} pending payouts
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Agent Performance Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                          Agent Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Active Agents</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {globalReportsData.agentPerformance.total_agents}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Transactions</p>
                            <p className="text-xl font-bold text-blue-600">
                              {globalReportsData.agentPerformance.total_transactions}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="text-lg font-bold text-green-600">
                              Rs. {(globalReportsData.agentPerformance.total_transaction_value / 1000).toFixed(0)}K
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm font-medium mb-3">Top Performing Agents</p>
                          <div className="space-y-3">
                            {globalReportsData.agentPerformance.agents.map((agent, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className={idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-blue-500'}>
                                    #{idx + 1}
                                  </Badge>
                                  <span className="font-medium text-sm">{agent.name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">Rs. {agent.value.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">{agent.transactions} txns</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Trends Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <TrendingDown className="h-5 w-5 mr-2 text-orange-600" />
                          Monthly Financial Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 rounded">
                            <p className="text-sm text-green-700 font-medium">Total Deposits</p>
                            <p className="text-xl font-bold text-green-600">
                              Rs. {globalReportsData.monthlyTrends.total_deposits.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-red-50 rounded">
                            <p className="text-sm text-red-700 font-medium">Total Withdrawals</p>
                            <p className="text-xl font-bold text-red-600">
                              Rs. {globalReportsData.monthlyTrends.total_withdrawals.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Net Cash Flow</span>
                            <span className={`text-lg font-bold ${globalReportsData.monthlyTrends.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {globalReportsData.monthlyTrends.net_flow >= 0 ? '+' : ''}
                              Rs. {globalReportsData.monthlyTrends.net_flow.toLocaleString()}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, Math.abs(globalReportsData.monthlyTrends.net_flow / globalReportsData.monthlyTrends.total_deposits * 100))}
                            className={`h-3 ${globalReportsData.monthlyTrends.net_flow >= 0 ? 'bg-green-200' : 'bg-red-200'}`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-sm text-gray-600">Total Transactions</p>
                            <p className="text-xl font-bold text-blue-600">
                              {globalReportsData.monthlyTrends.transaction_count.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg Transaction Size</p>
                            <p className="text-xl font-bold text-purple-600">
                              Rs. {globalReportsData.monthlyTrends.transaction_count > 0
                                ? Math.round((globalReportsData.monthlyTrends.total_deposits + globalReportsData.monthlyTrends.total_withdrawals) / globalReportsData.monthlyTrends.transaction_count).toLocaleString()
                                : 0
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status and Interest Reports */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>System Status & Interest Reports</CardTitle>
                    <CardDescription>
                      System information and interest calculations
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={loadTaskStatus} variant="outline" size="sm">
                      Task Status
                    </Button>
                    <Button onClick={loadInterestReports} variant="outline" size="sm">
                      Interest Reports
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Branch Statistics */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Branch Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Employees</span>
                        <span>{branchStats.totalEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Agents</span>
                        <span>{branchStats.activeAgents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Customers</span>
                        <span>{branchStats.totalCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Customers</span>
                        <span>{branchStats.activeCustomers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Status */}
                  {taskStatus && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-3 text-blue-900">System Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Scheduler</span>
                          <Badge variant={taskStatus.scheduler_running ? 'default' : 'secondary'}>
                            {taskStatus.scheduler_running ? 'Running' : 'Stopped'}
                          </Badge>
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          <p>Next Savings Interest: {new Date(taskStatus.next_savings_interest_calculation).toLocaleString()}</p>
                          <p>Next FD Interest: {new Date(taskStatus.next_fd_interest_calculation).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interest Reports Summary */}
                  {(savingsInterestReport || fdInterestReport) && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium mb-3 text-green-900">Interest Reports</h4>
                      <div className="space-y-2 text-sm">
                        {savingsInterestReport && (
                          <div className="flex justify-between">
                            <span className="text-green-700">Savings Interest Due</span>
                            <span className="font-medium text-green-900">
                              Rs. {savingsInterestReport.total_potential_interest?.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {fdInterestReport && (
                          <div className="flex justify-between">
                            <span className="text-green-700">FD Interest Due</span>
                            <span className="font-medium text-green-900">
                              Rs. {fdInterestReport.total_potential_interest?.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Agents */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Agent Management</CardTitle>
                    <CardDescription>
                      Manage contact information and status of agents in your branch
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Section */}
                  <div className="flex gap-4 mb-6">
                    <Select value={employeeSearchType} onValueChange={setEmployeeSearchType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="employee_id">Employee ID</SelectItem>
                        <SelectItem value="nic">NIC</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`Search by ${employeeSearchType}...`}
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSearchEmployees}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEmployeeSearchQuery('');
                      loadBranchData();
                    }}>
                      Clear
                    </Button>
                  </div>

                  {loading && <div className="text-center py-4">Loading agents...</div>}

                  <div className="space-y-3">
                    {employees.filter(emp => emp.type === 'Agent').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No agents found in your branch
                      </div>
                    ) : (
                      employees
                        .filter(emp => emp.type === 'Agent')
                        .map((agent) => (
                          <div key={agent.employee_id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-gray-500">ID: {agent.employee_id}</p>
                              <p className="text-sm text-gray-500">Phone: {agent.phone_number || 'N/A'}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={agent.status ? 'default' : 'secondary'}>
                                {agent.status ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingEmployee({ ...agent })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleEmployeeStatus(agent)}
                                disabled={loading}
                              >
                                {agent.status ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Edit Modal */}
            {editingEmployee && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Edit Agent Contact</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setEditingEmployee(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name (Read-only)</Label>
                      <Input value={editingEmployee.name} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Employee ID (Read-only)</Label>
                      <Input value={editingEmployee.employee_id} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={editingEmployee.phone_number}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, phone_number: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={editingEmployee.address}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateEmployeeContact(
                          editingEmployee.employee_id,
                          {
                            phone_number: editingEmployee.phone_number,
                            address: editingEmployee.address
                          }
                        )}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Update Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Branch Reports</CardTitle>
                <CardDescription>
                  Detailed analytics and reports for your branch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Control Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={loadAllReports}
                        disabled={reportLoading}
                        size="sm"
                      >
                        {reportLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load Reports
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleRefreshViews}
                        disabled={reportLoading}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                    </div>
                    {lastRefreshTime && (
                      <span className="text-sm text-gray-500">
                        Last refreshed: {lastRefreshTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Summary Cards */}
                  {agentTransactionReport && accountTransactionReport && activeFDReport && customerActivityReport && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm text-gray-600">Active Agents</p>
                              <p className="text-xl font-semibold">{agentTransactionReport.summary?.total_agents || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm text-gray-600">Total Balance</p>
                              <p className="text-xl font-semibold">Rs. {(accountTransactionReport.summary?.total_balance || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <FileText className="h-8 w-8 text-purple-600" />
                            <div className="ml-3">
                              <p className="text-sm text-gray-600">Active FDs</p>
                              <p className="text-xl font-semibold">{activeFDReport.summary?.total_fds || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-orange-600" />
                            <div className="ml-3">
                              <p className="text-sm text-gray-600">Total Customers</p>
                              <p className="text-xl font-semibold">{customerActivityReport.summary?.total_customers || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Agent Performance Report */}
                  {agentTransactionReport && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Agent Transaction Summary</CardTitle>
                            <CardDescription>
                              Total transactions: {(agentTransactionReport.summary?.total_transactions || 0).toLocaleString()} |
                              Total value: Rs. {(agentTransactionReport.summary?.total_value || 0).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => CSVExportService.exportAgentTransactionReport(agentTransactionReport.data)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Agent ID</th>
                                <th className="text-left p-2">Name</th>
                                <th className="text-left p-2">Branch</th>
                                <th className="text-right p-2">Transactions</th>
                                <th className="text-right p-2">Total Value</th>
                                <th className="text-center p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agentTransactionReport.data?.map((agent) => (
                                <tr key={agent.employee_id} className="border-b hover:bg-gray-50">
                                  <td className="p-2">{agent.employee_id || 'N/A'}</td>
                                  <td className="p-2">{agent.employee_name || 'Unknown'}</td>
                                  <td className="p-2">{agent.branch_name || 'N/A'}</td>
                                  <td className="p-2 text-right">{(agent.total_transactions || 0).toLocaleString()}</td>
                                  <td className="p-2 text-right">Rs. {(agent.total_value || 0).toLocaleString()}</td>
                                  <td className="p-2 text-center">
                                    <Badge variant={agent.employee_status ? "default" : "secondary"}>
                                      {agent.employee_status ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Customer Activity Report */}
                  {customerActivityReport && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Customer Activity Report</CardTitle>
                            <CardDescription>
                              Net flow: Rs. {(customerActivityReport.summary?.net_flow || 0).toLocaleString()} |
                              Total deposits: Rs. {(customerActivityReport.summary?.total_deposits || 0).toLocaleString()} |
                              Total withdrawals: Rs. {(customerActivityReport.summary?.total_withdrawals || 0).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => CSVExportService.exportCustomerActivityReport(customerActivityReport.data)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Customer ID</th>
                                <th className="text-left p-2">Name</th>
                                <th className="text-center p-2">Accounts</th>
                                <th className="text-right p-2">Deposits</th>
                                <th className="text-right p-2">Withdrawals</th>
                                <th className="text-right p-2">Net Change</th>
                                <th className="text-right p-2">Current Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerActivityReport.data?.slice(0, 10).map((customer) => (
                                <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                                  <td className="p-2">{customer.customer_id || 'N/A'}</td>
                                  <td className="p-2">{customer.customer_name || 'Unknown'}</td>
                                  <td className="p-2 text-center">{customer.total_accounts || 0}</td>
                                  <td className="p-2 text-right text-green-600">Rs. {(customer.total_deposits || 0).toLocaleString()}</td>
                                  <td className="p-2 text-right text-red-600">Rs. {(customer.total_withdrawals || 0).toLocaleString()}</td>
                                  <td className={`p-2 text-right ${(customer.net_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Rs. {(customer.net_change || 0).toLocaleString()}
                                  </td>
                                  <td className="p-2 text-right font-medium">Rs. {(customer.current_total_balance || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(customerActivityReport.data?.length || 0) > 10 && (
                          <p className="text-sm text-gray-500 mt-2">Showing top 10 of {customerActivityReport.data?.length || 0} customers</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Active Fixed Deposits */}
                  {activeFDReport && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Active Fixed Deposits</CardTitle>
                            <CardDescription>
                              Total principal: Rs. {(activeFDReport.summary?.total_principal_amount || 0).toLocaleString()} |
                              Expected interest: Rs. {(activeFDReport.summary?.total_expected_interest || 0).toLocaleString()} |
                              Pending payouts: {activeFDReport.summary?.pending_payouts || 0}
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => CSVExportService.exportActiveFixedDepositsReport(activeFDReport.data)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">FD ID</th>
                                <th className="text-left p-2">Customer</th>
                                <th className="text-right p-2">Principal</th>
                                <th className="text-center p-2">Rate</th>
                                <th className="text-center p-2">Months</th>
                                <th className="text-left p-2">Next Payout</th>
                                <th className="text-center p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeFDReport.data?.slice(0, 10).map((fd) => (
                                <tr key={fd.fixed_deposit_id} className="border-b hover:bg-gray-50">
                                  <td className="p-2">{fd.fixed_deposit_id || 'N/A'}</td>
                                  <td className="p-2">{fd.customer_name || 'Unknown'}</td>
                                  <td className="p-2 text-right">Rs. {(fd.principal_amount || 0).toLocaleString()}</td>
                                  <td className="p-2 text-center">{fd.interest_rate || 0}%</td>
                                  <td className="p-2 text-center">{fd.plan_months || 0}</td>
                                  <td className="p-2">{fd.next_payout_date ? new Date(fd.next_payout_date).toLocaleDateString() : 'N/A'}</td>
                                  <td className="p-2 text-center">
                                    <Badge variant={fd.fd_status === 'Payout Pending' ? "destructive" : "default"}>
                                      {fd.fd_status || 'Unknown'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(activeFDReport.data?.length || 0) > 10 && (
                          <p className="text-sm text-gray-500 mt-2">Showing 10 of {activeFDReport.data?.length || 0} fixed deposits</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Monthly Interest Distribution */}
                  {monthlyInterestReport && monthlyInterestReport.data.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Monthly Interest Distribution</CardTitle>
                            <CardDescription>
                              Total interest paid: Rs. {(monthlyInterestReport.summary?.total_interest_paid || 0).toLocaleString()} |
                              Accounts with interest: {monthlyInterestReport.summary?.total_accounts_with_interest || 0}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Select value={selectedReportYear.toString()} onValueChange={(val) => setSelectedReportYear(parseInt(val))}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[2024, 2025, 2026].map(year => (
                                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={selectedReportMonth?.toString() || "all"} onValueChange={(val) => setSelectedReportMonth(val === "all" ? undefined : parseInt(val))}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="All months" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                  <SelectItem key={month} value={month.toString()}>
                                    {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => CSVExportService.exportMonthlyInterestReport(monthlyInterestReport.data)}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              CSV
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Plan Type</th>
                                <th className="text-left p-2">Month</th>
                                <th className="text-left p-2">Branch</th>
                                <th className="text-center p-2">Accounts</th>
                                <th className="text-right p-2">Total Interest</th>
                                <th className="text-right p-2">Average</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyInterestReport.data?.slice(0, 10).map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="p-2">{item.plan_name || 'N/A'}</td>
                                  <td className="p-2">{item.month ? new Date(item.month).toLocaleDateString('default', { year: 'numeric', month: 'short' }) : 'N/A'}</td>
                                  <td className="p-2">{item.branch_name || 'N/A'}</td>
                                  <td className="p-2 text-center">{item.account_count || 0}</td>
                                  <td className="p-2 text-right">Rs. {(item.total_interest_paid || 0).toLocaleString()}</td>
                                  <td className="p-2 text-right">Rs. {(item.average_interest_per_account || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty State */}
                  {!reportLoading && !agentTransactionReport && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No reports loaded yet</p>
                        <Button onClick={loadAllReports}>Load Reports</Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}