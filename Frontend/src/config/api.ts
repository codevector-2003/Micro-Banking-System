// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/token',
        REGISTER: '/auth/user/register',
        ME: '/auth/users/me',
        PROTECTED: '/auth/protected'
    },
    CUSTOMERS: '/customers',
    EMPLOYEES: '/employees',
    BRANCHES: '/branches',
    SAVING_ACCOUNTS: '/saving-accounts',
    TRANSACTIONS: '/transactions',
    FIXED_DEPOSITS: '/fixed-deposits',
    JOINT_ACCOUNTS: '/joint-accounts',
    TASKS: '/tasks'
} as const;

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
    return `${API_BASE_URL}${endpoint}`;
};

// HTTP client configuration
export const defaultHeaders = {
    'Content-Type': 'application/json',
};

// Auth headers helper
export const getAuthHeaders = (token?: string) => ({
    ...defaultHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
});