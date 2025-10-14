import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, TrendingUp, UserPlus, FileText, Building2 } from 'lucide-react';
import { Progress } from './ui/progress';

// Mock data for manager dashboard
const mockAgents = [
  {
    id: 'agent_001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@bank.com',
    customersCount: 25,
    monthlyTransactions: 145,
    totalVolume: 245000,
    status: 'Active'
  },
  {
    id: 'agent_002',
    name: 'Mike Chen',
    email: 'mike.chen@bank.com',
    customersCount: 32,
    monthlyTransactions: 189,
    totalVolume: 312000,
    status: 'Active'
  },
  {
    id: 'agent_003',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@bank.com',
    customersCount: 18,
    monthlyTransactions: 98,
    totalVolume: 178000,
    status: 'Active'
  }
];

const branchTransactions = [
  { type: 'Deposits', count: 432, amount: 1250000, percentage: 65 },
  { type: 'Withdrawals', count: 278, amount: 580000, percentage: 30 },
  { type: 'Interest Payments', count: 89, amount: 95000, percentage: 5 }
];

const monthlyStats = {
  totalCustomers: 75,
  activeAccounts: 68,
  newAccountsThisMonth: 12,
  totalDeposits: 1250000,
  totalWithdrawals: 580000,
  netGrowth: 670000
};

export function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

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
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-semibold">{monthlyStats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Net Growth</p>
                  <p className="text-2xl font-semibold">${(monthlyStats.netGrowth / 1000).toFixed(0)}K</p>
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
                  <p className="text-2xl font-semibold">{monthlyStats.newAccountsThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-2xl font-semibold">{mockAgents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents">Monitor Agents</TabsTrigger>
            <TabsTrigger value="transactions">Branch Transactions</TabsTrigger>
            <TabsTrigger value="manage">Manage Agents</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Monitor Agents */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>
                  Performance metrics for agents in your branch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAgents.map((agent) => (
                    <div key={agent.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>
                        <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customers</p>
                          <p className="font-medium">{agent.customersCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Monthly Transactions</p>
                          <p className="font-medium">{agent.monthlyTransactions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Volume</p>
                          <p className="font-medium">${(agent.totalVolume / 1000).toFixed(0)}K</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm">
                          <span>Performance Score</span>
                          <span>{Math.round((agent.monthlyTransactions / 200) * 100)}%</span>
                        </div>
                        <Progress value={(agent.monthlyTransactions / 200) * 100} className="mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branch Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Branch Transaction Summary</CardTitle>
                <CardDescription>
                  Transaction breakdown for your branch this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchTransactions.map((transaction, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{transaction.type}</h4>
                        <Badge variant="outline">{transaction.count} transactions</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-2xl font-semibold">${transaction.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{transaction.percentage}% of total</p>
                      </div>
                      <Progress value={transaction.percentage} className="mt-2" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Total Deposits</p>
                      <p className="font-medium text-blue-900">${monthlyStats.totalDeposits.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Total Withdrawals</p>
                      <p className="font-medium text-blue-900">${monthlyStats.totalWithdrawals.toLocaleString()}</p>
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
                <CardTitle>Agent Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage agents in your branch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Agent
                  </Button>

                  <div className="space-y-3">
                    {mockAgents.map((agent) => (
                      <div key={agent.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Deactivate</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      {mockAgents.map((agent) => (
                        <div key={agent.id} className="flex justify-between text-sm">
                          <span>{agent.name}</span>
                          <span>${(agent.totalVolume / 1000).toFixed(0)}K</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Activity */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Customer Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Active Customers</span>
                        <span>{monthlyStats.activeAccounts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New This Month</span>
                        <span>{monthlyStats.newAccountsThisMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Balance</span>
                        <span>${(monthlyStats.totalDeposits / monthlyStats.activeAccounts / 1000).toFixed(1)}K</span>
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