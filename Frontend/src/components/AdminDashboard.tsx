import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Building, Settings, BarChart3, RefreshCw, Plus, Edit, Trash2, Building2, User, Search, Save, X, Users, UserCheck, DollarSign, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ConnectionTest } from './ConnectionTest';
import { CustomerService, type Customer, handleApiError } from '../services/agentService';
import { SavingsPlansService, type SavingsPlan } from '../services/savingsPlansService';
import {
  BranchService,
  EmployeeService,
  TasksService,
  SystemStatsService,
  type Branch,
  type Employee,
  type TaskStatus,
  type InterestReport,
  handleApiError as handleAdminApiError
} from '../services/adminService';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState('branches');

  // Customer management state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('customer_id');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Backend data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [fdPlans, setFdPlans] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalBranches: 0,
    totalEmployees: 0,
    totalCustomers: 0,
    totalDeposits: 0,
    monthlyInterestPayout: 0,
    activeFDs: 0,
    activeBranches: 0,
    activeEmployees: 0
  });
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);

  // Branch management state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranch, setNewBranch] = useState({
    branch_name: '',
    location: '',
    branch_phone_number: '',
    status: true
  });
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [branchSearchType, setBranchSearchType] = useState('branch_name');

  // Employee management state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    nic: '',
    phone_number: '',
    address: '',
    date_started: new Date().toISOString().split('T')[0],
    type: 'Agent',
    status: true,
    branch_id: ''
  });
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeSearchType, setEmployeeSearchType] = useState('name');

  // Load initial data when component mounts
  useEffect(() => {
    if (user?.token) {
      loadInitialData();
    }
  }, [user?.token]);

  // Load data based on selected tab
  useEffect(() => {
    if (selectedTab === 'customers' && user?.token) {
      loadAllCustomers();
    } else if (selectedTab === 'branches' && user?.token) {
      loadBranches();
    } else if (selectedTab === 'employees' && user?.token) {
      loadEmployees();
    } else if (selectedTab === 'settings' && user?.token) {
      loadSystemSettings();
    } else if (selectedTab === 'interest' && user?.token) {
      loadTaskStatus();
    }
  }, [selectedTab, user?.token]);

  const loadInitialData = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const [statsData, branchesData] = await Promise.all([
        SystemStatsService.getSystemStatistics(user.token),
        BranchService.getAllBranches(user.token)
      ]);

      setSystemStats(prevStats => ({
        ...prevStats,
        ...statsData
      }));
      setBranches(branchesData);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const branchesData = await BranchService.getAllBranches(user.token);
      setBranches(branchesData);

      // Also load employees for branch management
      const employeesData = await EmployeeService.getAllEmployees(user.token);
      setEmployees(employeesData);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const employeesData = await EmployeeService.getAllEmployees(user.token);
      setEmployees(employeesData);

      // Also ensure branches are loaded for employee management
      if (branches.length === 0) {
        const branchesData = await BranchService.getAllBranches(user.token);
        setBranches(branchesData);
      }
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  }; const loadSystemSettings = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const [plansData] = await Promise.all([
        SavingsPlansService.getAllSavingsPlans(user.token),
        // Add FD plans when service is available
      ]);
      setSavingsPlans(plansData);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadTaskStatus = async () => {
    if (!user?.token) return;

    try {
      const status = await TasksService.getTaskStatus(user.token);
      setTaskStatus(status);
    } catch (error) {
      setError(handleAdminApiError(error));
    }
  };

  // Branch management handlers
  const handleToggleBranchStatus = async (branch: Branch) => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await BranchService.changeBranchStatus(branch.branch_id, !branch.status, user.token);
      await loadBranches(); // Reload data
      setSuccess(`Branch ${branch.status ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!user?.token || !editingBranch) return;

    // Validation
    if (!editingBranch.branch_name.trim()) {
      setError('Branch name is required');
      return;
    }
    if (!editingBranch.location.trim()) {
      setError('Branch location is required');
      return;
    }
    if (!editingBranch.branch_phone_number.trim()) {
      setError('Branch phone number is required');
      return;
    }

    try {
      setLoading(true);
      await BranchService.createBranch(editingBranch, user.token);
      await loadBranches(); // Reload branches
      setEditingBranch(null);
      setSuccess('Branch created successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!user?.token || !editingBranch?.branch_id) return;

    // Validation
    if (!editingBranch.branch_name.trim()) {
      setError('Branch name is required');
      return;
    }
    if (!editingBranch.location.trim()) {
      setError('Branch location is required');
      return;
    }
    if (!editingBranch.branch_phone_number.trim()) {
      setError('Branch phone number is required');
      return;
    }

    try {
      setLoading(true);
      await BranchService.updateBranch(editingBranch.branch_id, editingBranch, user.token);
      await loadBranches(); // Reload branches
      setEditingBranch(null);
      setSuccess('Branch updated successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBranches = async () => {
    if (!user?.token || !branchSearchQuery.trim()) {
      await loadBranches(); // Load all if no search query
      return;
    }

    try {
      setLoading(true);
      const searchCriteria = {
        [branchSearchType]: branchSearchQuery.trim()
      };
      const searchResults = await BranchService.searchBranches(searchCriteria, user.token);
      setBranches(searchResults);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Task management handlers
  const handleStartTasks = async () => {
    if (!user?.token) return;

    try {
      await TasksService.startAutomaticTasks(user.token);
      await loadTaskStatus();
      setSuccess('Automatic tasks started successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    }
  };

  const handleStopTasks = async () => {
    if (!user?.token) return;

    try {
      await TasksService.stopAutomaticTasks(user.token);
      await loadTaskStatus();
      setSuccess('Automatic tasks stopped successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    }
  };

  const handleCalculateSavingsInterest = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await TasksService.calculateSavingsAccountInterest(user.token);
      setSuccess('Savings account interest calculated successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateFDInterest = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await TasksService.calculateFixedDepositInterest(user.token);
      setSuccess('Fixed deposit interest calculated successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Employee management handlers
  const handleCreateEmployee = async () => {
    if (!user?.token || !editingEmployee) return;

    // Validation
    if (!editingEmployee.name.trim()) {
      setError('Employee name is required');
      return;
    }
    if (!editingEmployee.nic.trim()) {
      setError('NIC is required');
      return;
    }
    if (!editingEmployee.branch_id.trim()) {
      setError('Please select a branch');
      return;
    }
    if (!editingEmployee.type) {
      setError('Please select employee type');
      return;
    }

    try {
      setLoading(true);
      await EmployeeService.createEmployee(user.token, editingEmployee);
      await loadEmployees(); // Reload employees
      setEditingEmployee(null);
      setNewEmployee({
        name: '',
        nic: '',
        phone_number: '',
        address: '',
        date_started: new Date().toISOString().split('T')[0],
        type: 'Agent',
        status: true,
        branch_id: ''
      });
      setSuccess('Employee created successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  }; const handleUpdateEmployeeContact = async (employeeId: string, contactData: { phone_number?: string; address?: string }) => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await EmployeeService.updateEmployeeContact(user.token, employeeId, contactData);
      await loadEmployees(); // Reload employees
      setEditingEmployee(null);
      setSuccess('Employee contact updated successfully');
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployeeStatus = async (employee: Employee) => {
    if (!user?.token) return;

    try {
      setLoading(true);
      await EmployeeService.changeEmployeeStatus(user.token, employee.employee_id, !employee.status);
      await loadEmployees(); // Reload employees
      setSuccess(`Employee ${employee.status ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmployees = async () => {
    if (!user?.token || !employeeSearchQuery.trim()) {
      await loadEmployees(); // Load all if no search query
      return;
    }

    try {
      setLoading(true);
      const searchCriteria = {
        [employeeSearchType]: employeeSearchQuery.trim()
      };
      const searchResults = await EmployeeService.searchEmployees(user.token, searchCriteria);
      setEmployees(searchResults);
    } catch (error) {
      setError(handleAdminApiError(error));
    } finally {
      setLoading(false);
    }
  };  // Clear messages after 5 seconds
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

  const loadAllCustomers = async () => {
    if (!user?.token) return;

    setLoading(true);
    setError('');

    try {
      const customerList = await CustomerService.getAllCustomers(user.token);
      setCustomers(customerList);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearch = async () => {
    if (!user?.token || !searchQuery.trim()) {
      setError('Please enter a search value');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let searchParams: any = {};

      if (searchType === 'customer_id') {
        searchParams.customer_id = searchQuery.toUpperCase();
      } else if (searchType === 'nic') {
        searchParams.nic = searchQuery;
      } else if (searchType === 'name') {
        searchParams.name = searchQuery;
      } else if (searchType === 'phone_number') {
        searchParams.phone_number = searchQuery;
      }

      const results = await CustomerService.searchCustomers(searchParams, user.token);
      setCustomers(results);
      setSuccess(`Found ${results.length} customer(s)`);
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setSelectedCustomer(customer);
  };

  const handleUpdateCustomer = async () => {
    if (!user?.token || !editingCustomer) return;

    setLoading(true);
    setError('');

    try {
      const { customer_id, employee_id, ...updates } = editingCustomer;
      const updatedCustomer = await CustomerService.updateCustomer(customer_id, updates, user.token);

      // Update the customer in the list
      setCustomers(prev =>
        prev.map(c => c.customer_id === customer_id ? updatedCustomer : c)
      );

      setSuccess('Customer updated successfully');
      setEditingCustomer(null);
      setSelectedCustomer(updatedCustomer);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">System Administration - {user?.username}</p>
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

        {/* System Overview Cards */}
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalBranches}</div>
              <p className="text-xs text-muted-foreground">
                Active: {systemStats.activeBranches}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Active: {systemStats.activeEmployees}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {systemStats.totalDeposits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Fixed Deposits: {systemStats.activeFDs}
              </p>
            </CardContent>
          </Card>
        </div>        <Tabs defaultValue="branches" className="space-y-6" onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="interest">Interest</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
          </TabsList>

          {/* Customer Management */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Customer Management</CardTitle>
                    <CardDescription>Search, view, and update customer information</CardDescription>
                  </div>
                  <Button onClick={loadAllCustomers} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Section */}
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Label>Search Type</Label>
                      <Select value={searchType} onValueChange={setSearchType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer_id">Customer ID</SelectItem>
                          <SelectItem value="nic">NIC Number</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="phone_number">Phone Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-2">
                      <Label>Search Value</Label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder={`Enter ${searchType === 'customer_id' ? 'Customer ID' : searchType === 'nic' ? 'NIC Number' : searchType === 'name' ? 'Customer Name' : 'Phone Number'}`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                        />
                        <Button onClick={handleCustomerSearch} disabled={loading}>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </Button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Customer List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Customer List ({customers.length})</h3>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading customers...</p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No customers found</p>
                      <p className="text-sm text-gray-400">Use search to find specific customers or click Refresh to load all</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customers.map((customer) => (
                        <div key={customer.customer_id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                              <div>
                                <h4 className="font-medium">{customer.name}</h4>
                                <p className="text-sm text-gray-500">ID: {customer.customer_id}</p>
                                <p className="text-sm text-gray-500">NIC: {customer.nic}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Phone: {customer.phone_number || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Email: {customer.email || 'N/A'}</p>
                                <p className="text-sm text-gray-600">DOB: {customer.date_of_birth}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Address: {customer.address || 'N/A'}</p>
                                <p className="text-sm text-gray-600">Employee: {customer.employee_id}</p>
                                <Badge variant={customer.status ? 'default' : 'secondary'}>
                                  {customer.status ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCustomer(customer)}
                                disabled={editingCustomer?.customer_id === customer.customer_id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
          </TabsContent>

          {/* Branch Management */}
          <TabsContent value="branches" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Branch Management</CardTitle>
                    <CardDescription>Manage bank branches and assign managers</CardDescription>
                  </div>
                  <Button onClick={() => setEditingBranch({ branch_id: '', branch_name: '', location: '', branch_phone_number: '', status: true })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search Section */}
                <div className="flex gap-4 mb-6">
                  <Select value={branchSearchType} onValueChange={setBranchSearchType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Search by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch_name">Branch Name</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="branch_id">Branch ID</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={`Search by ${branchSearchType}...`}
                    value={branchSearchQuery}
                    onChange={(e) => setBranchSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchBranches}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setBranchSearchQuery('');
                    loadBranches();
                  }}>
                    Clear
                  </Button>
                </div>

                {loading && <div className="text-center py-4">Loading branches...</div>}

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Branches List */}
                <div className="space-y-4">
                  {branches.map((branch) => (
                    <div key={branch.branch_id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{branch.branch_name}</h4>
                          <p className="text-sm text-gray-500">{branch.location}</p>
                          <p className="text-sm text-gray-600">Phone: {branch.branch_phone_number}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={branch.status ? 'default' : 'secondary'}>
                            {branch.status ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBranch(branch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={branch.status ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleBranchStatus(branch)}
                            disabled={loading}
                          >
                            {branch.status ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Branch ID</p>
                          <p className="font-medium">{branch.branch_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Location</p>
                          <p className="font-medium">{branch.location}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className={`font-medium ${branch.status ? 'text-green-600' : 'text-red-600'}`}>
                            {branch.status ? 'Operational' : 'Inactive'}
                          </p>
                        </div>
                      </div>

                      {/* Employee count for this branch */}
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-600">Employees: </span>
                        <span className="font-medium">
                          {employees.filter(emp => emp.branch_id === branch.branch_id).length}
                        </span>
                        <span className="text-gray-500 ml-2">
                          (Active: {employees.filter(emp => emp.branch_id === branch.branch_id && emp.status).length})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Branch Edit Modal/Panel */}
            {editingBranch && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {editingBranch.branch_id ? 'Edit Branch' : 'Create New Branch'}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setEditingBranch(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch-name">Branch Name *</Label>
                      <Input
                        id="branch-name"
                        value={editingBranch.branch_name}
                        onChange={(e) => setEditingBranch({ ...editingBranch, branch_name: e.target.value })}
                        placeholder="Enter branch name"
                        className={!editingBranch.branch_name.trim() ? "border-red-300" : ""}
                      />
                      {!editingBranch.branch_name.trim() && (
                        <p className="text-sm text-red-600">Branch name is required</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch-location">Location *</Label>
                      <Input
                        id="branch-location"
                        value={editingBranch.location}
                        onChange={(e) => setEditingBranch({ ...editingBranch, location: e.target.value })}
                        placeholder="Enter branch location"
                        className={!editingBranch.location.trim() ? "border-red-300" : ""}
                      />
                      {!editingBranch.location.trim() && (
                        <p className="text-sm text-red-600">Location is required</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch-phone">Phone Number *</Label>
                      <Input
                        id="branch-phone"
                        value={editingBranch.branch_phone_number}
                        onChange={(e) => setEditingBranch({ ...editingBranch, branch_phone_number: e.target.value })}
                        placeholder="Enter phone number"
                        className={!editingBranch.branch_phone_number.trim() ? "border-red-300" : ""}
                      />
                      {!editingBranch.branch_phone_number.trim() && (
                        <p className="text-sm text-red-600">Phone number is required</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch-status">Status</Label>
                      <Select
                        value={editingBranch.status.toString()}
                        onValueChange={(value) => setEditingBranch({ ...editingBranch, status: value === 'true' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setEditingBranch(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={editingBranch.branch_id ? handleUpdateBranch : handleCreateBranch}
                      disabled={loading || !editingBranch.branch_name.trim() || !editingBranch.location.trim() || !editingBranch.branch_phone_number.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingBranch.branch_id ? 'Update Branch' : 'Create Branch'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Employee Management */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription>Manage bank employees and their roles</CardDescription>
                  </div>
                  <Button onClick={() => {
                    // Ensure branches are loaded before creating new employee
                    if (branches.length === 0) {
                      loadBranches();
                    }
                    setEditingEmployee({
                      employee_id: '',
                      name: '',
                      nic: '',
                      phone_number: '',
                      address: '',
                      date_started: new Date().toISOString().split('T')[0],
                      type: 'Agent',
                      status: true,
                      branch_id: '',
                      last_login_time: undefined
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                      <SelectItem value="branch_id">Branch ID</SelectItem>
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
                    loadEmployees();
                  }}>
                    Clear
                  </Button>
                </div>

                {loading && <div className="text-center py-4">Loading employees...</div>}

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Employees List */}
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.employee_id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{employee.name}</h4>
                          <p className="text-sm text-gray-500">ID: {employee.employee_id}</p>
                          <p className="text-sm text-gray-600">NIC: {employee.nic}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={employee.type === 'Admin' ? 'default' : employee.type === 'Manager' ? 'secondary' : 'outline'}>
                            {employee.type}
                          </Badge>
                          <Badge variant={employee.status ? 'default' : 'destructive'}>
                            {employee.status ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-medium">{employee.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Branch ID</p>
                          <p className="font-medium">{employee.branch_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date Started</p>
                          <p className="font-medium">{new Date(employee.date_started).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Last Login</p>
                          <p className="font-medium">
                            {employee.last_login_time
                              ? new Date(employee.last_login_time).toLocaleDateString()
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant={employee.status ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleEmployeeStatus(employee)}
                        >
                          {employee.status ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Employee Edit Modal/Panel */}
            {editingEmployee && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {editingEmployee.employee_id ? 'Edit Employee Details' : 'Create New Employee'}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setEditingEmployee(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show validation message for new employees */}
                  {!editingEmployee.employee_id && (
                    <Alert>
                      <AlertDescription>
                        All fields marked with * are required. Please ensure a valid branch is selected.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Employee Name *</Label>
                      <Input
                        value={editingEmployee.name}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                        disabled={!!editingEmployee.employee_id} // Disable editing for existing employees
                        className={!editingEmployee.employee_id && !editingEmployee.name.trim() ? "border-red-300" : ""}
                      />
                      {!editingEmployee.employee_id && !editingEmployee.name.trim() && (
                        <p className="text-sm text-red-600 mt-1">Employee name is required</p>
                      )}
                    </div>
                    <div>
                      <Label>NIC *</Label>
                      <Input
                        value={editingEmployee.nic}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, nic: e.target.value })}
                        disabled={!!editingEmployee.employee_id}
                        className={!editingEmployee.employee_id && !editingEmployee.nic.trim() ? "border-red-300" : ""}
                      />
                      {!editingEmployee.employee_id && !editingEmployee.nic.trim() && (
                        <p className="text-sm text-red-600 mt-1">NIC is required</p>
                      )}
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={editingEmployee.phone_number}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, phone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input
                        value={editingEmployee.address}
                        onChange={(e) => setEditingEmployee({ ...editingEmployee, address: e.target.value })}
                      />
                    </div>
                    {!editingEmployee.employee_id && (
                      <>
                        <div>
                          <Label>Employee Type *</Label>
                          <Select
                            value={editingEmployee.type}
                            onValueChange={(value) => setEditingEmployee({ ...editingEmployee, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Agent">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Branch ID *</Label>
                          <Select
                            value={editingEmployee.branch_id}
                            onValueChange={(value) => setEditingEmployee({ ...editingEmployee, branch_id: value })}
                          >
                            <SelectTrigger className={!editingEmployee.branch_id ? "border-red-300" : ""}>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.length === 0 ? (
                                <SelectItem value="" disabled>Loading branches...</SelectItem>
                              ) : (
                                branches.map((branch) => (
                                  <SelectItem key={branch.branch_id} value={branch.branch_id}>
                                    {branch.branch_name} ({branch.branch_id})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {!editingEmployee.branch_id && (
                            <p className="text-sm text-red-600 mt-1">Please select a branch</p>
                          )}
                        </div>
                        <div>
                          <Label>Start Date *</Label>
                          <Input
                            type="date"
                            value={editingEmployee.date_started}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, date_started: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                      Cancel
                    </Button>
                    {editingEmployee.employee_id ? (
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
                    ) : (
                      <Button
                        onClick={handleCreateEmployee}
                        disabled={
                          loading ||
                          !editingEmployee.name.trim() ||
                          !editingEmployee.nic.trim() ||
                          !editingEmployee.branch_id.trim() ||
                          !editingEmployee.type
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Employee
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Savings Account Plans */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Savings Account Plans</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading && <div className="text-center py-4">Loading plans...</div>}

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {savingsPlans.map((plan) => (
                      <div key={plan.s_plan_id} className="p-3 border rounded flex justify-between items-center">
                        <div>
                          <p className="font-medium">{plan.plan_name}</p>
                          <p className="text-sm text-gray-500">
                            Min: Rs. {plan.min_balance?.toLocaleString() || 'N/A'} | Rate: {plan.interest_rate}%
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            Active
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fixed Deposit Plans */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Fixed Deposit Plans</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fdPlans.map((plan) => (
                      <div key={plan.id} className="p-3 border rounded flex justify-between items-center">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-500">
                            Duration: {plan.duration} months | Rate: {plan.rate}%
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={plan.status === 'Active' ? 'default' : 'secondary'}>
                            {plan.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interest Processing */}
            <Card>
              <CardHeader>
                <CardTitle>Interest Processing</CardTitle>
                <CardDescription>Manage automated interest calculations</CardDescription>
              </CardHeader>
              <CardContent>
                {taskStatus && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Automatic Tasks Status</h4>
                        <p className="text-sm text-gray-500">
                          Status: <span className={taskStatus.scheduler_running ? 'text-green-600' : 'text-red-600'}>
                            {taskStatus.scheduler_running ? 'Running' : 'Stopped'}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Current time: {new Date(taskStatus.current_time).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Next savings interest: {new Date(taskStatus.next_savings_interest_calculation).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartTasks}
                          disabled={taskStatus.scheduler_running}
                        >
                          Start Tasks
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleStopTasks}
                          disabled={!taskStatus.scheduler_running}
                        >
                          Stop Tasks
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={handleCalculateSavingsInterest}
                        className="p-4 h-auto"
                      >
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                          <div className="font-medium">Calculate Savings Interest</div>
                          <div className="text-sm text-gray-500">Process monthly interest</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleCalculateFDInterest}
                        className="p-4 h-auto"
                      >
                        <div className="text-center">
                          <DollarSign className="h-6 w-6 mx-auto mb-2" />
                          <div className="font-medium">Calculate FD Interest</div>
                          <div className="text-sm text-gray-500">Process FD maturity</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Reports */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Account-wise Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Basic Savings Accounts</span>
                        <span className="text-sm font-medium">245 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Volume</span>
                        <span className="text-sm">$2.1M</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Premium Savings Accounts</span>
                        <span className="text-sm font-medium">189 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Volume</span>
                        <span className="text-sm">$8.3M</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Elite Savings Accounts</span>
                        <span className="text-sm font-medium">67 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Volume</span>
                        <span className="text-sm">$5.5M</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FD Interest Payouts */}
              <Card>
                <CardHeader>
                  <CardTitle>FD Interest Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">6 Month FDs</span>
                        <span className="text-sm font-medium">45 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly Payout</span>
                        <span className="text-sm">$15,500</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">1 Year FDs</span>
                        <span className="text-sm font-medium">98 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly Payout</span>
                        <span className="text-sm">$65,200</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">3 Year FDs</span>
                        <span className="text-sm font-medium">46 accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly Payout</span>
                        <span className="text-sm">$44,300</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Activity Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Customers</span>
                      <span className="font-medium">{systemStats.totalCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">New This Month</span>
                      <span className="font-medium text-green-600">+23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Accounts</span>
                      <span className="font-medium">692</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Balance</span>
                      <span className="font-medium">${(systemStats.totalDeposits / 692 / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branch Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Branch Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {branches.slice(0, 5).map((branch) => (
                      <div key={branch.branch_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{branch.branch_name}</span>
                        <span className="text-sm font-medium">{branch.status ? 'Active' : 'Inactive'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interest Processing */}
          <TabsContent value="interest" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interest Processing</CardTitle>
                <CardDescription>
                  Run monthly interest calculations for Fixed Deposits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Next Interest Run</h4>
                    <p className="text-sm text-gray-600 mb-4">Scheduled for: February 1, 2024</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Eligible FDs</p>
                        <p className="font-medium">{systemStats.activeFDs}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Estimated Payout</p>
                        <p className="font-medium">${systemStats.monthlyInterestPayout.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button className="w-full" size="lg">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Interest Processing
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline">
                        Preview Interest Calculations
                      </Button>
                      <Button variant="outline">
                        Download Processing Log
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Last Processing Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Date</span>
                        <span>January 1, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processed FDs</span>
                        <span>189</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Payout</span>
                        <span>${systemStats.monthlyInterestPayout.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge variant="default">Completed</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection Test */}
          <TabsContent value="connection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backend Connection Test</CardTitle>
                <CardDescription>
                  Test the connection between frontend and backend API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionTest />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}