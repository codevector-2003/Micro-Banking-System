import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';
import { API_BASE_URL } from '../config/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ConnectionTest() {
    const { user } = useAuth();
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testResults, setTestResults] = useState<string[]>([]);

    const testConnection = async () => {
        setConnectionStatus('testing');
        setTestResults([]);
        const results: string[] = [];

        try {
            // Test 1: Basic connectivity
            results.push('Testing basic connectivity...');
            const response = await fetch(`${API_BASE_URL}/`);
            if (response.ok) {
                const data = await response.json();
                results.push(`✅ Backend connected: ${data.message}`);
            } else {
                results.push(`❌ Backend connection failed: ${response.status}`);
            }

            // Test 2: Protected route (if logged in)
            if (user?.token) {
                results.push('Testing protected route...');
                try {
                    const protectedData = await AuthService.testProtectedRoute(user.token);
                    results.push(`✅ Protected route: ${protectedData.message}`);
                } catch (error) {
                    results.push(`❌ Protected route failed: ${error}`);
                }
            }

            setConnectionStatus('success');
        } catch (error) {
            results.push(`❌ Connection test failed: ${error}`);
            setConnectionStatus('error');
        }

        setTestResults(results);
    };

    return (
        <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {connectionStatus === 'testing' && <Loader2 className="h-5 w-5 animate-spin" />}
                    {connectionStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {connectionStatus === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                    Backend Connection Test
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                    <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
                    <p><strong>User Status:</strong> {user ? `Logged in as ${user.username}` : 'Not logged in'}</p>
                </div>

                <Button
                    onClick={testConnection}
                    disabled={connectionStatus === 'testing'}
                    className="w-full"
                >
                    {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>

                {testResults.length > 0 && (
                    <div className="text-sm space-y-1 p-3 bg-gray-50 rounded">
                        <p className="font-medium">Test Results:</p>
                        {testResults.map((result, index) => (
                            <p key={index} className="text-xs">{result}</p>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}