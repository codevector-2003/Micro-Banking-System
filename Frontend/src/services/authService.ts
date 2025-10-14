import { API_ENDPOINTS, buildApiUrl, defaultHeaders } from '../config/api';

// Types for API requests and responses
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    username: string;
    type: 'Admin' | 'Branch Manager' | 'Agent';
    employee_id: string | null;
}

export interface ApiError {
    detail: string;
}

// Auth API service
export class AuthService {
    static async login(credentials: LoginRequest): Promise<LoginResponse> {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error: ApiError = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        return response.json();
    }

    static async getCurrentUser(token: string): Promise<UserResponse> {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.ME), {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error: ApiError = await response.json();
            throw new Error(error.detail || 'Failed to get user info');
        }

        return response.json();
    }

    static async testProtectedRoute(token: string): Promise<any> {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.PROTECTED), {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error: ApiError = await response.json();
            throw new Error(error.detail || 'Protected route failed');
        }

        return response.json();
    }
}

// Generic API error handler
export const handleApiError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};