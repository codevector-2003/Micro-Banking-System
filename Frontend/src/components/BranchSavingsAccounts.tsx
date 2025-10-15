import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, Search, Download } from "lucide-react";
import { Input } from './ui/input';
import {
    ManagerSavingsAccountService,
    type SavingsAccount,
    type BranchSavingsStats,
    handleApiError
} from '../services/managerService';

interface BranchSavingsAccountsProps {
    token: string;
    onError?: (error: string) => void;
}

export function BranchSavingsAccounts({ token, onError }: BranchSavingsAccountsProps) {
    const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
    const [filteredAccounts, setFilteredAccounts] = useState<SavingsAccount[]>([]);
    const [savingsStats, setSavingsStats] = useState<BranchSavingsStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            loadSavingsAccounts();
        }
    }, [token]);

    // Filter accounts based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredAccounts(savingsAccounts);
        } else {
            const filtered = savingsAccounts.filter(account =>
                account.saving_account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (account.customer_name && account.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (account.customer_nic && account.customer_nic.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredAccounts(filtered);
        }
    }, [searchTerm, savingsAccounts]);

    const loadSavingsAccounts = async () => {
        try {
            setLoading(true);
            setError('');

            const [accounts, stats] = await Promise.all([
                ManagerSavingsAccountService.getBranchSavingsAccounts(token),
                ManagerSavingsAccountService.getBranchSavingsStats(token)
            ]);

            setSavingsAccounts(accounts);
            setSavingsStats(stats);
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (filteredAccounts.length === 0) return;

        const headers = ['Account ID', 'Customer Name', 'Customer NIC', 'Balance', 'Open Date', 'Status', 'Plan ID', 'Branch ID'];
        const csvData = filteredAccounts.map(account => [
            account.saving_account_id,
            account.customer_name || 'Unknown',
            account.customer_nic || 'N/A',
            account.balance,
            new Date(account.open_date).toLocaleDateString(),
            account.status ? 'Active' : 'Inactive',
            account.s_plan_id,
            account.branch_id
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `branch_savings_accounts_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Branch Savings Accounts</CardTitle>
                            <CardDescription>
                                All savings accounts in your branch with comprehensive details
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={exportToCSV} variant="outline" size="sm" disabled={filteredAccounts.length === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button onClick={loadSavingsAccounts} disabled={loading}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Statistics Cards */}
                    {savingsStats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{savingsStats.total_accounts}</div>
                                    <p className="text-xs text-muted-foreground">Total Accounts</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">{savingsStats.active_accounts}</div>
                                    <p className="text-xs text-muted-foreground">Active Accounts</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">Rs. {savingsStats.total_balance.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total Balance</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-blue-600">{savingsStats.new_accounts_this_month}</div>
                                    <p className="text-xs text-muted-foreground">New This Month</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by Account ID, Customer Name, or NIC..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {searchTerm && (
                            <Button variant="outline" onClick={() => setSearchTerm('')}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {loading && <div className="text-center py-4">Loading savings accounts...</div>}

                    {/* Results Count */}
                    {!loading && (
                        <div className="mb-4 text-sm text-gray-600">
                            Showing {filteredAccounts.length} of {savingsAccounts.length} accounts
                            {searchTerm && ` matching "${searchTerm}"`}
                        </div>
                    )}

                    {/* Savings Accounts Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 px-4 py-2 text-left">Account ID</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Customer Name</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Customer NIC</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right">Balance</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Open Date</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Plan ID</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Employee ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                            {searchTerm ? `No accounts found matching "${searchTerm}"` : 'No savings accounts found in your branch'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((account) => (
                                        <tr key={account.saving_account_id} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                                {account.saving_account_id}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {account.customer_name || 'Unknown'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 font-mono">
                                                {account.customer_nic || 'N/A'}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                                                Rs. {account.balance.toLocaleString()}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {new Date(account.open_date).toLocaleDateString()}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-center">
                                                <Badge variant={account.status ? 'default' : 'secondary'}>
                                                    {account.status ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                                {account.s_plan_id}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                                {account.employee_id}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    {filteredAccounts.length > 0 && savingsStats && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Average Balance:</span>
                                    <div className="text-lg font-semibold text-blue-600">
                                        Rs. {savingsStats.average_balance.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Branch ID:</span>
                                    <div className="text-lg font-semibold text-blue-600">
                                        {savingsStats.branch_id}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Filtered Total:</span>
                                    <div className="text-lg font-semibold text-blue-600">
                                        Rs. {filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Active Rate:</span>
                                    <div className="text-lg font-semibold text-green-600">
                                        {savingsStats.total_accounts > 0
                                            ? ((savingsStats.active_accounts / savingsStats.total_accounts) * 100).toFixed(1)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}