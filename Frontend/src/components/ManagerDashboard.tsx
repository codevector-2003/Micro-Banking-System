import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Building2, Calendar, DollarSign, Edit, FileText, LogOut, RefreshCw, Search, TrendingDown, TrendingUp, User, UserPlus, Users, X, Save } from "lucide-react";
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

// Import the detailed account view components
import { BranchSavingsAccounts } from './BranchSavingsAccounts';
import { BranchFixedDeposits } from './BranchFixedDeposits';

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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Branch Analytics</CardTitle>
                    <CardDescription>
                      Analytics and insights for your branch
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

                  {/* Estimated Financial Summary */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium mb-3 text-purple-900">Financial Estimates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Est. Total Deposits</span>
                        <span className="font-medium text-purple-900">Rs. {branchStats.totalDeposits.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Est. Total Withdrawals</span>
                        <span className="font-medium text-purple-900">Rs. {branchStats.totalWithdrawals.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-purple-700">Net Growth</span>
                        <span className="text-purple-900">Rs. {branchStats.netGrowth.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agent Performance Report */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Agent Performance</h4>
                    <div className="space-y-2">
                      {employees.filter(emp => emp.type === 'Agent').length === 0 ? (
                        <div className="text-sm text-gray-500">No agents found</div>
                      ) : (
                        employees
                          .filter(emp => emp.type === 'Agent')
                          .map((agent) => (
                            <div key={agent.employee_id} className="flex justify-between text-sm">
                              <span>{agent.name}</span>
                              <span className={agent.status ? 'text-green-600' : 'text-gray-400'}>
                                {agent.status ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Customer Activity */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Customer Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Customers</span>
                        <span>{branchStats.totalCustomers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Accounts This Month</span>
                        <span>{branchStats.newAccountsThisMonth || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Deposits</span>
                        <span>${(branchStats.totalDeposits || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Trends */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Monthly Trends</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Deposit Growth</span>
                        <span className="text-green-600">+12.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Growth</span>
                        <span className="text-green-600">+8.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Volume</span>
                        <span className="text-green-600">+15.2%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Export Monthly Report
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        Generate Agent Summary
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        Download Transaction Log
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}