import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, Search, Download, Calendar, AlertTriangle } from "lucide-react";
import { Input } from './ui/input';
import {
    ManagerFixedDepositService,
    type FixedDeposit,
    type BranchFixedDepositStats,
    handleApiError
} from '../services/managerService';

interface BranchFixedDepositsProps {
    token: string;
    onError?: (error: string) => void;
}

export function BranchFixedDeposits({ token, onError }: BranchFixedDepositsProps) {
    const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
    const [filteredDeposits, setFilteredDeposits] = useState<FixedDeposit[]>([]);
    const [fixedDepositStats, setFixedDepositStats] = useState<BranchFixedDepositStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            loadFixedDeposits();
        }
    }, [token]);

    // Filter deposits based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredDeposits(fixedDeposits);
        } else {
            const filtered = fixedDeposits.filter(deposit =>
                deposit.fixed_deposit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                deposit.saving_account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                deposit.f_plan_id.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredDeposits(filtered);
        }
    }, [searchTerm, fixedDeposits]);

    const loadFixedDeposits = async () => {
        try {
            setLoading(true);
            setError('');

            const [deposits, stats] = await Promise.all([
                ManagerFixedDepositService.getBranchFixedDeposits(token),
                ManagerFixedDepositService.getBranchFixedDepositStats(token)
            ]);

            setFixedDeposits(deposits);
            setFixedDepositStats(stats);
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
        if (filteredDeposits.length === 0) return;

        const headers = ['FD ID', 'Savings Account', 'Principal Amount', 'Start Date', 'End Date', 'Status', 'Maturity Status', 'Interest Type', 'Plan ID', 'Days to Maturity'];
        const csvData = filteredDeposits.map(deposit => {
            const isMatured = new Date(deposit.end_date) <= new Date();
            const daysToMaturity = Math.ceil((new Date(deposit.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return [
                deposit.fixed_deposit_id,
                deposit.saving_account_id,
                deposit.principal_amount,
                new Date(deposit.start_date).toLocaleDateString(),
                new Date(deposit.end_date).toLocaleDateString(),
                deposit.status ? 'Active' : 'Inactive',
                isMatured ? 'Matured' : 'Active',
                deposit.interest_payment_type,
                deposit.f_plan_id,
                deposit.status && !isMatured ? daysToMaturity : 'N/A'
            ];
        });

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `branch_fixed_deposits_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getMaturityDeposits = () => {
        return filteredDeposits.filter(deposit => {
            const isMatured = new Date(deposit.end_date) <= new Date();
            const daysToMaturity = Math.ceil((new Date(deposit.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return deposit.status && (isMatured || daysToMaturity <= 30);
        });
    };

    const maturityDeposits = getMaturityDeposits();

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Maturity Alert */}
            {maturityDeposits.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>{maturityDeposits.length} fixed deposits</strong> are maturing within 30 days or have already matured.
                        Review these accounts for processing.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Branch Fixed Deposits</CardTitle>
                            <CardDescription>
                                All fixed deposits in your branch with maturity tracking
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={exportToCSV} variant="outline" size="sm" disabled={filteredDeposits.length === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button onClick={loadFixedDeposits} disabled={loading}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Statistics Cards */}
                    {fixedDepositStats && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{fixedDepositStats.total_fixed_deposits}</div>
                                    <p className="text-xs text-muted-foreground">Total FDs</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">{fixedDepositStats.active_fixed_deposits}</div>
                                    <p className="text-xs text-muted-foreground">Active FDs</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">Rs. {fixedDepositStats.total_principal_amount.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total Principal</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-blue-600">{fixedDepositStats.new_fds_this_month}</div>
                                    <p className="text-xs text-muted-foreground">New This Month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-orange-600">{fixedDepositStats.matured_fds}</div>
                                    <p className="text-xs text-muted-foreground">Matured FDs</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by FD ID, Savings Account ID, or Plan ID..."
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

                    {loading && <div className="text-center py-4">Loading fixed deposits...</div>}

                    {/* Results Count */}
                    {!loading && (
                        <div className="mb-4 text-sm text-gray-600">
                            Showing {filteredDeposits.length} of {fixedDeposits.length} fixed deposits
                            {searchTerm && ` matching "${searchTerm}"`}
                        </div>
                    )}

                    {/* Fixed Deposits Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 px-4 py-2 text-left">FD ID</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Savings Account</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right">Principal Amount</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Start Date</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">End Date</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Interest Type</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Plan ID</th>
                                    <th className="border border-gray-300 px-4 py-2 text-center">Maturity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeposits.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                            {searchTerm ? `No fixed deposits found matching "${searchTerm}"` : 'No fixed deposits found in your branch'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDeposits.map((deposit) => {
                                        const isMatured = new Date(deposit.end_date) <= new Date();
                                        const daysToMaturity = Math.ceil((new Date(deposit.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        const isNearMaturity = daysToMaturity <= 30 && daysToMaturity > 0;

                                        return (
                                            <tr
                                                key={deposit.fixed_deposit_id}
                                                className={`hover:bg-gray-50 ${isMatured ? 'bg-orange-50' : isNearMaturity ? 'bg-yellow-50' : ''}`}
                                            >
                                                <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                                    {deposit.fixed_deposit_id}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                                    {deposit.saving_account_id}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                                                    Rs. {deposit.principal_amount.toLocaleString()}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    {new Date(deposit.start_date).toLocaleDateString()}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    {new Date(deposit.end_date).toLocaleDateString()}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 text-center">
                                                    <div className="flex flex-col items-center space-y-1">
                                                        <Badge variant={deposit.status ? 'default' : 'secondary'}>
                                                            {deposit.status ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 capitalize">
                                                    {deposit.interest_payment_type ?
                                                        String(deposit.interest_payment_type).replace('_', ' ') :
                                                        'N/A'
                                                    }
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                                                    {deposit.f_plan_id}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 text-center">
                                                    {deposit.status ? (
                                                        <div className="flex flex-col items-center space-y-1">
                                                            {isMatured ? (
                                                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    Matured
                                                                </Badge>
                                                            ) : isNearMaturity ? (
                                                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    {daysToMaturity} days
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-sm text-gray-600">
                                                                    {daysToMaturity} days
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    {filteredDeposits.length > 0 && fixedDepositStats && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Average Principal:</span>
                                    <div className="text-lg font-semibold text-green-600">
                                        Rs. {fixedDepositStats.average_principal_amount.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Filtered Total:</span>
                                    <div className="text-lg font-semibold text-green-600">
                                        Rs. {filteredDeposits.reduce((sum, dep) => sum + dep.principal_amount, 0).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Maturing Soon:</span>
                                    <div className="text-lg font-semibold text-orange-600">
                                        {maturityDeposits.length} deposits
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Branch ID:</span>
                                    <div className="text-lg font-semibold text-green-600">
                                        {fixedDepositStats.branch_id}
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