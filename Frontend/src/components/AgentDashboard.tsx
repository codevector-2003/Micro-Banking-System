import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../App';
import { LogOut, Search, Plus, DollarSign, User, Building2, AlertTriangle, CreditCard, Clock, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';

// Updated savings plans based on requirements
const savingsPlans = [
  { id: 'children', name: 'Children', minBalance: 0, interestRate: 12, ageRequirement: 'Under 18' },
  { id: 'teen', name: 'Teen', minBalance: 500, interestRate: 11, ageRequirement: '13-17' },
  { id: 'adult', name: 'Adult', minBalance: 1000, interestRate: 10, ageRequirement: '18+' },
  { id: 'senior', name: 'Senior', minBalance: 1000, interestRate: 13, ageRequirement: '60+' },
  { id: 'joint', name: 'Joint', minBalance: 5000, interestRate: 7, ageRequirement: 'Multiple holders' }
];

const fdPlans = [
  { id: 'fd_6m', name: '6 Months', duration: 6, rate: 5.5 },
  { id: 'fd_1y', name: '1 Year', duration: 12, rate: 6.5 },
  { id: 'fd_3y', name: '3 Years', duration: 36, rate: 7.5 }
];

// Mock data with multiple accounts per customer
const mockCustomers = [
  {
    customerId: 'CUST001',
    name: 'John Smith',
    nic: '199012345678',
    phoneNumber: '+94-71-1234567',
    address: '123 Main Street, Colombo 03',
    dateOfBirth: '1990-05-15',
    email: 'john.smith@email.com',
    status: 'Active',
    savingsAccounts: [
      {
        savingAccountId: 'SA001234567',
        openDate: '2023-01-15',
        balance: 25500,
        sPlanId: 'adult',
        planName: 'Adult',
        interestRate: 10,
        minBalance: 1000,
        status: 'Active'
      },
      {
        savingAccountId: 'SA001234568',
        openDate: '2023-06-20',
        balance: 15000,
        sPlanId: 'senior',
        planName: 'Senior',
        interestRate: 13,
        minBalance: 1000,
        status: 'Active'
      }
    ],
    fixedDeposits: [
      {
        fixedDepositId: 'FD001',
        savingAccountId: 'SA001234567',
        startDate: '2023-06-01',
        endDate: '2024-06-01',
        principalAmount: 50000,
        fPlanId: 'fd_1y',
        planName: '1 Year',
        interestRate: 6.5,
        lastPayoutDate: '2024-01-01',
        status: true
      }
    ],
    transactions: [
      { transactionId: 'TXN001', savingAccountId: 'SA001234567', type: 'Deposit', amount: 5000, timestamp: '2024-01-15 10:30', refNumber: 'REF001', description: 'Cash deposit' },
      { transactionId: 'TXN002', savingAccountId: 'SA001234567', type: 'Withdrawal', amount: -2000, timestamp: '2024-01-10 14:20', refNumber: 'REF002', description: 'ATM withdrawal' },
      { transactionId: 'TXN003', savingAccountId: 'SA001234568', type: 'Deposit', amount: 10000, timestamp: '2024-01-08 11:15', refNumber: 'REF003', description: 'Initial deposit' },
      { transactionId: 'TXN004', savingAccountId: 'SA001234567', type: 'Interest', amount: 275, timestamp: '2024-01-01 00:00', refNumber: 'INT001', description: 'Monthly interest' }
    ]
  },
  {
    customerId: 'CUST002',
    name: 'Mary Johnson',
    nic: '198503456789',
    phoneNumber: '+94-77-9876543',
    address: '456 Oak Avenue, Colombo 05',
    dateOfBirth: '1985-08-22',
    email: 'mary.johnson@email.com',
    status: 'Active',
    savingsAccounts: [
      {
        savingAccountId: 'SA002345678',
        openDate: '2022-11-10',
        balance: 45000,
        sPlanId: 'adult',
        planName: 'Adult',
        interestRate: 10,
        minBalance: 1000,
        status: 'Active'
      },
      {
        savingAccountId: 'SA002345679',
        openDate: '2023-03-15',
        balance: 12000,
        sPlanId: 'joint',
        planName: 'Joint',
        interestRate: 7,
        minBalance: 5000,
        status: 'Active',
        holders: ['CUST002', 'CUST001']
      },
      {
        savingAccountId: 'SA002345680',
        openDate: '2023-08-05',
        balance: 8500,
        sPlanId: 'adult',
        planName: 'Adult',
        interestRate: 10,
        minBalance: 1000,
        status: 'Active'
      }
    ],
    fixedDeposits: [],
    transactions: [
      { transactionId: 'TXN101', savingAccountId: 'SA002345678', type: 'Deposit', amount: 15000, timestamp: '2024-01-12 09:30', refNumber: 'REF101', description: 'Cash deposit' },
      { transactionId: 'TXN102', savingAccountId: 'SA002345679', type: 'Deposit', amount: 5000, timestamp: '2024-01-10 14:20', refNumber: 'REF102', description: 'Joint account deposit' }
    ]
  },
  {
    customerId: 'CUST003',
    name: 'Sarah Williams',
    nic: '199505123456',
    phoneNumber: '+94-76-5551234',
    address: '789 Lake Road, Colombo 07',
    dateOfBirth: '1995-03-10',
    email: 'sarah.williams@email.com',
    status: 'Active',
    savingsAccounts: [],
    fixedDeposits: [],
    transactions: []
  }
];

const mockBranchInfo = {
  branchId: 'BR001',
  name: 'Colombo Main Branch',
  address: '456 Bank Street, Colombo 01',
  managerName: 'Ms. Priya Fernando'
};

const mockAgentTransactions = [
  { id: 'AGT001', customerName: 'John Smith', type: 'Deposit', amount: 5000, timestamp: '2024-01-15 10:30' },
  { id: 'AGT002', customerName: 'Mary Johnson', type: 'Withdrawal', amount: -1500, timestamp: '2024-01-15 09:15' },
  { id: 'AGT003', customerName: 'David Wilson', type: 'FD Opening', amount: 25000, timestamp: '2024-01-14 16:45' },
  { id: 'AGT004', customerName: 'Sarah Davis', type: 'Deposit', amount: 3000, timestamp: '2024-01-14 11:20' },
  { id: 'AGT005', customerName: 'Mike Brown', type: 'Withdrawal', amount: -800, timestamp: '2024-01-13 15:30' }
];

export function AgentDashboard() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'customer' | 'register' | 'create-account' | 'create-joint'>('home');
  const [searchType, setSearchType] = useState('customerId');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fdAmount, setFdAmount] = useState('');
  const [selectedFdPlan, setSelectedFdPlan] = useState('');
  const [fdAccountId, setFdAccountId] = useState('');

  // Customer registration form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    nic: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    email: ''
  });

  // New savings account form state
  const [newAccount, setNewAccount] = useState({
    customerId: '',
    accountType: '',
    initialDeposit: ''
  });

  // Joint account form state
  const [jointAccount, setJointAccount] = useState({
    customerId1: '',
    customerId2: '',
    initialDeposit: ''
  });

  // Helper to change view and clear messages
  const changeView = (view: 'home' | 'search' | 'customer' | 'register' | 'create-account' | 'create-joint') => {
    setError('');
    setSuccess('');
    setCurrentView(view);
  };

  const handleCustomerSearch = () => {
    setError('');
    if (!searchQuery.trim()) {
      setError('Please enter a search value');
      return;
    }

    let customer = null;
    if (searchType === 'customerId') {
      customer = mockCustomers.find(c => c.customerId.includes(searchQuery.toUpperCase()));
    } else if (searchType === 'nic') {
      customer = mockCustomers.find(c => c.nic.includes(searchQuery));
    } else if (searchType === 'savingAccountId') {
      customer = mockCustomers.find(c => 
        c.savingsAccounts.some(acc => acc.savingAccountId.includes(searchQuery.toUpperCase()))
      );
    }

    if (customer) {
      setSelectedCustomer(customer);
      if (customer.savingsAccounts.length > 0) {
        setSelectedAccountId(customer.savingsAccounts[0].savingAccountId);
        setFdAccountId(customer.savingsAccounts[0].savingAccountId);
      }
      setCurrentView('customer');
      setSuccess('Customer found successfully');
    } else {
      setError('Customer not found. Please check your search criteria.');
    }
  };

  const handleTransaction = () => {
    setError('');
    setSuccess('');

    if (!selectedCustomer || !transactionAmount || !transactionType || !selectedAccountId) {
      setError('Please fill in all transaction details and select an account');
      return;
    }

    const amount = parseFloat(transactionAmount);
    const account = selectedCustomer.savingsAccounts.find((acc: any) => acc.savingAccountId === selectedAccountId);

    if (!account) {
      setError('Selected account not found');
      return;
    }

    if (transactionType === 'Withdrawal') {
      const remainingBalance = account.balance - amount;
      if (remainingBalance < account.minBalance) {
        setError(`Withdrawal denied. Minimum balance of LKR ${account.minBalance.toLocaleString()} must be maintained. Available for withdrawal: LKR ${(account.balance - account.minBalance).toLocaleString()}`);
        return;
      }
    }

    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour > 17) {
      setError('Transactions are only allowed during business hours (9 AM - 5 PM)');
      return;
    }

    const newTransaction = {
      transactionId: `TXN${Date.now()}`,
      savingAccountId: selectedAccountId,
      type: transactionType,
      amount: transactionType === 'Withdrawal' ? -amount : amount,
      timestamp: new Date().toLocaleString(),
      refNumber: `REF${Date.now()}`,
      description: `${transactionType} by agent ${user?.username}`
    };

    selectedCustomer.transactions.unshift(newTransaction);
    account.balance += newTransaction.amount;

    setSuccess(`${transactionType} of LKR ${amount.toLocaleString()} processed successfully for account ${selectedAccountId}. New balance: LKR ${account.balance.toLocaleString()}`);
    setTransactionAmount('');
    setTransactionType('');
  };

  const handleFdCreation = () => {
    setError('');
    setSuccess('');

    if (!selectedCustomer || !fdAmount || !selectedFdPlan || !fdAccountId) {
      setError('Please fill in all FD details and select an account');
      return;
    }

    const amount = parseFloat(fdAmount);
    const account = selectedCustomer.savingsAccounts.find((acc: any) => acc.savingAccountId === fdAccountId);

    if (!account) {
      setError('Selected account not found');
      return;
    }

    if (account.balance < amount) {
      setError(`Insufficient balance in account ${fdAccountId}. Current balance: LKR ${account.balance.toLocaleString()}`);
      return;
    }

    const hasActiveFD = selectedCustomer.fixedDeposits.some((fd: any) => fd.savingAccountId === fdAccountId && fd.status === true);
    if (hasActiveFD) {
      setError('This account already has an active Fixed Deposit. Only one FD per account is allowed.');
      return;
    }

    const selectedPlan = fdPlans.find(plan => plan.id === selectedFdPlan);
    if (!selectedPlan) {
      setError('Invalid FD plan selected');
      return;
    }

    const newFD = {
      fixedDepositId: `FD${Date.now()}`,
      savingAccountId: fdAccountId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + selectedPlan.duration * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      principalAmount: amount,
      fPlanId: selectedPlan.id,
      planName: selectedPlan.name,
      interestRate: selectedPlan.rate,
      lastPayoutDate: null,
      status: true
    };

    selectedCustomer.fixedDeposits.push(newFD);
    account.balance -= amount;

    setSuccess(`Fixed Deposit of LKR ${amount.toLocaleString()} created successfully for account ${fdAccountId}. ${selectedPlan.name} plan (${selectedPlan.rate}% p.a.). Maturity: ${newFD.endDate}`);
    setFdAmount('');
    setSelectedFdPlan('');
  };

  const handleRegisterCustomer = () => {
    setError('');
    setSuccess('');
    
    if (!newCustomer.name || !newCustomer.nic || !newCustomer.dateOfBirth) {
      setError('Please fill in all required fields (Name, NIC, Date of Birth)');
      return;
    }

    const existingCustomer = mockCustomers.find(c => c.nic === newCustomer.nic);
    if (existingCustomer) {
      setError('A customer with this NIC already exists');
      return;
    }

    setSuccess(`Customer "${newCustomer.name}" registered successfully! Customer ID: CUST${Date.now().toString().slice(-3)}`);
    setNewCustomer({
      name: '',
      nic: '',
      phoneNumber: '',
      address: '',
      dateOfBirth: '',
      email: ''
    });
  };

  const handleCreateAccount = () => {
    setError('');
    setSuccess('');

    if (!newAccount.customerId || !newAccount.accountType || !newAccount.initialDeposit) {
      setError('Please fill in all required fields');
      return;
    }

    const customer = mockCustomers.find(c => c.customerId === newAccount.customerId);
    if (!customer) {
      setError('Customer not found');
      return;
    }

    const selectedPlan = savingsPlans.find(plan => plan.id === newAccount.accountType && plan.id !== 'joint');
    if (!selectedPlan) {
      setError('Invalid account type selected. Use "Create Joint Account" for joint accounts.');
      return;
    }

    const initialAmount = parseFloat(newAccount.initialDeposit);
    if (initialAmount < selectedPlan.minBalance) {
      setError(`Initial deposit must be at least LKR ${selectedPlan.minBalance.toLocaleString()} for ${selectedPlan.name} account`);
      return;
    }

    setSuccess(`${selectedPlan.name} account created successfully for ${customer.name}! Account ID: SA${Date.now().toString().slice(-9)}`);
    setNewAccount({
      customerId: '',
      accountType: '',
      initialDeposit: ''
    });
  };

  const handleCreateJointAccount = () => {
    setError('');
    setSuccess('');

    if (!jointAccount.customerId1 || !jointAccount.customerId2) {
      setError('Please enter both customer IDs');
      return;
    }

    if (jointAccount.customerId1 === jointAccount.customerId2) {
      setError('Customer IDs must be different');
      return;
    }

    if (!jointAccount.initialDeposit) {
      setError('Please enter initial deposit amount');
      return;
    }

    const customer1 = mockCustomers.find(c => c.customerId === jointAccount.customerId1);
    const customer2 = mockCustomers.find(c => c.customerId === jointAccount.customerId2);

    if (!customer1) {
      setError(`Customer ID ${jointAccount.customerId1} not found`);
      return;
    }

    if (!customer2) {
      setError(`Customer ID ${jointAccount.customerId2} not found`);
      return;
    }

    const jointPlan = savingsPlans.find(plan => plan.id === 'joint');
    const initialAmount = parseFloat(jointAccount.initialDeposit);
    
    if (initialAmount < (jointPlan?.minBalance || 5000)) {
      setError(`Initial deposit must be at least LKR ${jointPlan?.minBalance.toLocaleString()} for joint account`);
      return;
    }

    setSuccess(`Joint account created successfully for: ${customer1.name} and ${customer2.name}. Account ID: SA${Date.now().toString().slice(-9)}`);
    setJointAccount({
      customerId1: '',
      customerId2: '',
      initialDeposit: ''
    });
  };

  const renderHomeScreen = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.username}!</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Branch:</strong> {mockBranchInfo.name}</p>
                <p><strong>Address:</strong> {mockBranchInfo.address}</p>
                <p><strong>Manager:</strong> {mockBranchInfo.managerName}</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Your Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockAgentTransactions.slice(0, 5).map((txn) => (
              <div key={txn.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{txn.customerName}</p>
                  <p className="text-xs text-gray-500">{txn.timestamp}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{txn.type}</p>
                  <p className={`text-sm font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.amount > 0 ? '+' : ''}LKR {Math.abs(txn.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
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
                  <SelectItem value="customerId">Customer ID</SelectItem>
                  <SelectItem value="nic">NIC Number</SelectItem>
                  <SelectItem value="savingAccountId">Savings Account ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Search Value</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder={`Enter ${searchType === 'customerId' ? 'Customer ID' : searchType === 'nic' ? 'NIC Number' : 'Account ID'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCustomerSearch}>
                  <Search className="h-4 w-4 mr-2" />
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
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div>
              <Label>NIC Number *</Label>
              <Input 
                placeholder="Enter NIC number" 
                value={newCustomer.nic}
                onChange={(e) => setNewCustomer({...newCustomer, nic: e.target.value})}
              />
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input 
                type="date" 
                value={newCustomer.dateOfBirth}
                onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input 
                placeholder="Enter phone number" 
                value={newCustomer.phoneNumber}
                onChange={(e) => setNewCustomer({...newCustomer, phoneNumber: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="Enter email" 
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input 
                placeholder="Enter address" 
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
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
            <Select value={newAccount.customerId} onValueChange={(val) => setNewAccount({...newAccount, customerId: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map((customer) => (
                  <SelectItem key={customer.customerId} value={customer.customerId}>
                    {customer.customerId} - {customer.name} ({customer.nic})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Account Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsPlans.filter(plan => plan.id !== 'joint').map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all ${newAccount.accountType === plan.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setNewAccount({...newAccount, accountType: plan.id})}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{plan.name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Interest: {plan.interestRate}%</p>
                      <p>Min Balance: {plan.minBalance === 0 ? 'None' : `LKR ${plan.minBalance.toLocaleString()}`}</p>
                      <p className="text-xs">{plan.ageRequirement}</p>
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
              value={newAccount.initialDeposit}
              onChange={(e) => setNewAccount({...newAccount, initialDeposit: e.target.value})}
            />
            {newAccount.accountType && (
              <p className="text-sm text-gray-500 mt-1">
                Minimum deposit: LKR {savingsPlans.find(p => p.id === newAccount.accountType)?.minBalance.toLocaleString() || '0'}
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
                value={jointAccount.customerId1}
                onChange={(e) => setJointAccount({...jointAccount, customerId1: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <Label>Second Account Holder - Customer ID *</Label>
              <Input 
                placeholder="Enter second customer ID (e.g., CUST002)" 
                value={jointAccount.customerId2}
                onChange={(e) => setJointAccount({...jointAccount, customerId2: e.target.value.toUpperCase()})}
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
              value={jointAccount.initialDeposit}
              onChange={(e) => setJointAccount({...jointAccount, initialDeposit: e.target.value})}
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
            <p className="text-blue-900 font-medium mb-1">Available Customers:</p>
            <div className="text-blue-800 space-y-1">
              {mockCustomers.map((customer) => (
                <p key={customer.customerId}>
                  {customer.customerId} - {customer.name}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{selectedCustomer.name}</h2>
          <p className="text-gray-600">Customer ID: {selectedCustomer.customerId}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Name</Label>
              <p className="font-medium">{selectedCustomer.name}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">NIC</Label>
              <p className="font-medium">{selectedCustomer.nic}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Phone</Label>
              <p className="font-medium">{selectedCustomer.phoneNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="font-medium">{selectedCustomer.email}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Date of Birth</Label>
              <p className="font-medium">{selectedCustomer.dateOfBirth}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Address</Label>
              <p className="font-medium">{selectedCustomer.address}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Status</Label>
              <Badge variant={selectedCustomer.status === 'Active' ? 'default' : 'secondary'}>
                {selectedCustomer.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Savings Accounts ({selectedCustomer.savingsAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCustomer.savingsAccounts.length === 0 ? (
              <p className="text-sm text-gray-500">No savings accounts yet</p>
            ) : (
              selectedCustomer.savingsAccounts.map((account: any) => (
                <div key={account.savingAccountId} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label className="text-xs text-gray-500">Account ID</Label>
                      <p className="font-medium text-sm">{account.savingAccountId}</p>
                    </div>
                    <Badge variant="secondary">{account.planName}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Balance</Label>
                    <p className="text-xl font-semibold text-green-600">
                      LKR {account.balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-xs text-gray-500">Interest</Label>
                      <p className="font-medium">{account.interestRate}%</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Min Balance</Label>
                      <p className="font-medium">LKR {account.minBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Opened: {account.openDate}
                  </div>
                  {account.holders && account.holders.length > 1 && (
                    <div className="mt-2 p-2 bg-purple-50 rounded">
                      <p className="text-xs text-purple-800">
                        <Users className="h-3 w-3 inline mr-1" />
                        Joint Account ({account.holders.length} holders)
                      </p>
                    </div>
                  )}
                  {selectedCustomer.fixedDeposits.some((fd: any) => fd.savingAccountId === account.savingAccountId && fd.status) && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-800">✓ Has Active FD</p>
                    </div>
                  )}
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
            {selectedCustomer.savingsAccounts.length > 0 ? (
              <>
                <div className="space-y-3">
                  <Label>Process Transaction</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomer.savingsAccounts.map((acc: any) => (
                        <SelectItem key={acc.savingAccountId} value={acc.savingAccountId}>
                          {acc.savingAccountId} - {acc.planName} (LKR {acc.balance.toLocaleString()})
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
                      {selectedCustomer.savingsAccounts.map((acc: any) => {
                        const hasActiveFD = selectedCustomer.fixedDeposits.some((fd: any) => 
                          fd.savingAccountId === acc.savingAccountId && fd.status
                        );
                        return (
                          <SelectItem 
                            key={acc.savingAccountId} 
                            value={acc.savingAccountId}
                            disabled={hasActiveFD}
                          >
                            {acc.savingAccountId} {hasActiveFD ? '(Has Active FD)' : `(LKR ${acc.balance.toLocaleString()})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Select value={selectedFdPlan} onValueChange={setSelectedFdPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select FD Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {fdPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.rate}%
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

      {selectedCustomer.fixedDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Fixed Deposits ({selectedCustomer.fixedDeposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCustomer.fixedDeposits.map((fd: any) => (
                <div key={fd.fixedDepositId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">FD #{fd.fixedDepositId}</h4>
                      <p className="text-xs text-gray-500">Account: {fd.savingAccountId}</p>
                    </div>
                    <Badge variant={fd.status ? 'default' : 'secondary'}>
                      {fd.status ? 'Active' : 'Matured'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal:</span>
                      <span className="font-medium">LKR {fd.principalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{fd.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{fd.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{fd.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="font-medium">{fd.endDate}</span>
                    </div>
                    {fd.lastPayoutDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Payout:</span>
                        <span className="font-medium">{fd.lastPayoutDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCustomer.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedCustomer.transactions.map((txn: any) => (
                <div key={txn.transactionId} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{txn.type}</p>
                    <p className="text-sm text-gray-500">{txn.timestamp}</p>
                    <p className="text-xs text-gray-400">{txn.description}</p>
                    <p className="text-xs text-gray-400">Account: {txn.savingAccountId}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.amount > 0 ? '+' : ''}LKR {Math.abs(txn.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{txn.refNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
                <p className="text-sm text-gray-500">{mockBranchInfo.name}</p>
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
      </div>
    </div>
  );
}
