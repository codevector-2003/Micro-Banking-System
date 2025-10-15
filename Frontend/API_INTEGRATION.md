# Backend-Frontend Integration

This document describes how the frontend connects to the backend API.

## API Configuration

The API configuration is stored in `src/config/api.ts`:

- **Base URL**: `http://localhost:8000`
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`

## Authentication Flow

1. **Login**: User submits username/password → Backend validates → Returns JWT token
2. **Token Storage**: JWT token is stored in localStorage
3. **Protected Requests**: Token is included in Authorization header
4. **Auto-login**: On app startup, check for stored token and validate with backend

## API Endpoints

### Authentication
- `POST /auth/token` - Login (returns JWT token)
- `GET /auth/users/me` - Get current user info
- `GET /auth/protected` - Test protected route

### Other Endpoints
- `/customers` - Customer management
- `/employees` - Employee management  
- `/branches` - Branch management
- `/saving-accounts` - Savings account operations
- `/transactions` - Transaction handling
- `/fixed-deposits` - Fixed deposit management
- `/joint-accounts` - Joint account management

## Usage

### Login Process
```typescript
const { login } = useAuth();
await login(username, password);
```

### Making Authenticated Requests
```typescript
const { user } = useAuth();
const response = await fetch(buildApiUrl('/some-endpoint'), {
  headers: getAuthHeaders(user?.token)
});
```

## Error Handling

- Network errors are caught and displayed to user
- Invalid credentials show appropriate error message
- Token expiration automatically logs user out

## Running the Application

1. **Start Backend**: 
   ```bash
   cd Backend
   ./venv/Scripts/Activate  # Windows
   uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Access Application**: http://localhost:5173

## Demo Credentials

The backend should have demo users set up. Check with your backend team for valid credentials, or create test users through the authentication system.