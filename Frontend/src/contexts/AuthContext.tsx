import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService, handleApiError } from '../services/authService';
import type { UserResponse } from '../services/authService';

interface User {
    username: string;
    role: 'Admin' | 'Branch Manager' | 'Agent';
    employeeId: string | null;
    token: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

const TOKEN_KEY = 'auth_token';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const savedToken = localStorage.getItem(TOKEN_KEY);
                if (savedToken) {
                    const userInfo = await AuthService.getCurrentUser(savedToken);
                    setUser({
                        username: userInfo.username,
                        role: userInfo.type,
                        employeeId: userInfo.employee_id,
                        token: savedToken,
                    });
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                localStorage.removeItem(TOKEN_KEY);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setError(null);
            setLoading(true);

            const loginResponse = await AuthService.login({ username, password });
            const userInfo = await AuthService.getCurrentUser(loginResponse.access_token);

            const user: User = {
                username: userInfo.username,
                role: userInfo.type,
                employeeId: userInfo.employee_id,
                token: loginResponse.access_token,
            };

            setUser(user);
            localStorage.setItem(TOKEN_KEY, loginResponse.access_token);
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setError(null);
        localStorage.removeItem(TOKEN_KEY);
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};