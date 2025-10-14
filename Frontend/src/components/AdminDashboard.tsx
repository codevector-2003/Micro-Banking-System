import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAuth } from '../App';
import { LogOut, Building, Settings, BarChart3, RefreshCw, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Mock data for admin dashboard
const mockBranches = [
  {
    id: 'branch_001',
    name: 'Downtown Branch',
    address: '123 Main St, City Center',
    manager: 'John Manager',
    employees: 8,
    customers: 245,
    totalDeposits: 5200000,
    status: 'Active'
  },
  {
    id: 'branch_002',
    name: 'Westside Branch',
    address: '456 West Ave, Westside',
    manager: 'Jane Smith',
    employees: 6,
    customers: 189,
    totalDeposits: 3800000,
    status: 'Active'
  },
  {
    id: 'branch_003',
    name: 'Northgate Branch',
    address: '789 North Rd, Northgate',
    manager: 'Mike Johnson',
    employees: 10,
    customers: 312,
    totalDeposits: 6900000,
    status: 'Active'
  }
];

const mockSavingsPlans = [
  { id: 'plan_001', name: 'Basic Savings', minBalance: 500, interestRate: 3.5, status: 'Active' },
  { id: 'plan_002', name: 'Premium Savings', minBalance: 10000, interestRate: 4.5, status: 'Active' },
  { id: 'plan_003', name: 'Elite Savings', minBalance: 50000, interestRate: 5.5, status: 'Active' }
];

const mockFDPlans = [
  { id: 'fd_001', name: '6 Months', duration: 6, rate: 5.5, status: 'Active' },
  { id: 'fd_002', name: '1 Year', duration: 12, rate: 6.5, status: 'Active' },
  { id: 'fd_003', name: '3 Years', duration: 36, rate: 7.5, status: 'Active' }
];

const systemStats = {
  totalBranches: 3,
  totalEmployees: 24,
  totalCustomers: 746,
  totalDeposits: 15900000,
  monthlyInterestPayout: 125000,
  activeFDs: 189
};

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState('branches');

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
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Branches</p>
                  <p className="text-2xl font-semibold">{systemStats.totalBranches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Deposits</p>
                  <p className="text-2xl font-semibold">${(systemStats.totalDeposits / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Monthly Interest</p>
                  <p className="text-2xl font-semibold">${(systemStats.monthlyInterestPayout / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active FDs</p>
                  <p className="text-2xl font-semibold">{systemStats.activeFDs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="branches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branches">Branch Management</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="reports">Global Reports</TabsTrigger>
            <TabsTrigger value="interest">Interest Processing</TabsTrigger>
          </TabsList>

          {/* Branch Management */}
          <TabsContent value="branches" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Branch Management</CardTitle>
                    <CardDescription>Manage bank branches and assign managers</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBranches.map((branch) => (
                    <div key={branch.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{branch.name}</h4>
                          <p className="text-sm text-gray-500">{branch.address}</p>
                          <p className="text-sm text-gray-600">Manager: {branch.manager}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={branch.status === 'Active' ? 'default' : 'secondary'}>
                            {branch.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Employees</p>
                          <p className="font-medium">{branch.employees}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Customers</p>
                          <p className="font-medium">{branch.customers}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Deposits</p>
                          <p className="font-medium">${(branch.totalDeposits / 1000000).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Performance</p>
                          <p className="font-medium text-green-600">Excellent</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                  <div className="space-y-3">
                    {mockSavingsPlans.map((plan) => (
                      <div key={plan.id} className="p-3 border rounded flex justify-between items-center">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-500">
                            Min: ${plan.minBalance.toLocaleString()} | Rate: {plan.interestRate}%
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
                    {mockFDPlans.map((plan) => (
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
                    {mockBranches.map((branch) => (
                      <div key={branch.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{branch.name}</span>
                        <span className="text-sm font-medium">${(branch.totalDeposits / 1000000).toFixed(1)}M</span>
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
        </Tabs>
      </div>
    </div>
  );
}