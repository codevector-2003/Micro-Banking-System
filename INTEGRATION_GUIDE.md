# Micro Banking System - Backend & Frontend Integration

This guide explains how to set up and run the complete Micro Banking System with backend and frontend integration.

## 🏗️ Project Structure

```
Micro-Banking-System/
├── Backend/                 # FastAPI backend
│   ├── main.py             # Main application entry
│   ├── auth.py             # Authentication routes
│   ├── database.py         # Database configuration
│   ├── schemas.py          # Pydantic models
│   ├── requirement.txt     # Python dependencies
│   └── start-backend.bat   # Windows startup script
├── Frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── config/
│   │   │   └── api.ts      # API configuration
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Authentication context
│   │   ├── services/
│   │   │   └── authService.ts   # API service functions
│   │   └── components/     # React components
│   ├── package.json
│   └── start-frontend.bat  # Windows startup script
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL database

### 1. Start the Backend

**Windows:**
```bash
cd Backend
start-backend.bat
```

**Manual Setup:**
```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/macOS
pip install -r requirement.txt
uvicorn main:app --reload --port 8000
```

The backend will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs

### 2. Start the Frontend

**Windows:**
```bash
cd Frontend
start-frontend.bat
```

**Manual Setup:**
```bash
cd Frontend
npm install
npm run dev
```

The frontend will be available at: http://localhost:5173

## 🔐 Authentication Integration

### API Configuration (`src/config/api.ts`)

```typescript
export const API_BASE_URL = 'http://localhost:8000';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/token',
    REGISTER: '/auth/user/register',
    ME: '/auth/users/me',
    PROTECTED: '/auth/protected'
  },
  // ... other endpoints
};
```

### Authentication Flow

1. **Login**: User enters credentials → API validates → Returns JWT token
2. **Token Storage**: JWT stored in localStorage for persistence
3. **Auto-Login**: App checks for valid token on startup
4. **Protected Routes**: Token included in Authorization header

### Authentication Context (`src/contexts/AuthContext.tsx`)

```typescript
const { user, login, logout, loading, error } = useAuth();

// Login
await login(username, password);

// Logout
logout();

// Get current user
console.log(user?.username, user?.role);
```

### API Service (`src/services/authService.ts`)

```typescript
// Login
const response = await AuthService.login({ username, password });

// Get current user
const user = await AuthService.getCurrentUser(token);

// Test protected route
const data = await AuthService.testProtectedRoute(token);
```

## 🔧 Component Updates

### Login Page (`src/components/LoginPage.tsx`)
- ✅ Removed role selection (determined by backend)
- ✅ Real API authentication
- ✅ Error handling
- ✅ Loading states

### Dashboard Components
- ✅ Updated to use new AuthContext
- ✅ Logout functionality
- ✅ User info display

### New Components
- ✅ `ConnectionTest.tsx` - Test backend connectivity
- ✅ Added to Admin Dashboard for testing

## 🧪 Testing the Integration

1. **Start Both Servers**: Backend (port 8000) and Frontend (port 5173)

2. **Test Connection**: 
   - Login to Admin Dashboard
   - Go to "Connection Test" tab
   - Click "Test Connection" button

3. **Verify Authentication**:
   - Try logging in with valid credentials
   - Check that user info displays correctly
   - Test logout functionality

## 🔍 API Endpoints

### Authentication
- `POST /auth/token` - Login with username/password
- `GET /auth/users/me` - Get current user information
- `GET /auth/protected` - Test protected endpoint
- `POST /auth/user/register` - Register new user

### Business Logic (Available but not yet integrated)
- `/customers` - Customer management
- `/employees` - Employee management
- `/branches` - Branch management
- `/saving-accounts` - Savings account operations
- `/transactions` - Transaction handling
- `/fixed-deposits` - Fixed deposit management
- `/joint-accounts` - Joint account management

## 🐛 Troubleshooting

### Backend Issues
- **Port 8000 in use**: Change port in startup script
- **Database connection**: Check PostgreSQL is running
- **Module not found**: Ensure virtual environment is activated

### Frontend Issues
- **CORS errors**: Backend has CORS middleware configured
- **API connection failed**: Verify backend is running on port 8000
- **TypeScript errors**: Check all imports are correct

### Common Issues
1. **Login fails**: Check backend logs for authentication errors
2. **Token expired**: Logout and login again
3. **Network errors**: Verify both servers are running

## 📝 Environment Variables

### Backend (.env file)
```
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://user:password@localhost/micro_banking
```

### Frontend
API configuration is in `src/config/api.ts`. Update `API_BASE_URL` if backend runs on different port.

## 🔜 Next Steps

1. **Complete API Integration**: Connect remaining dashboard features to backend APIs
2. **Error Handling**: Improve error messages and recovery
3. **Loading States**: Add loading indicators for all API calls
4. **Data Validation**: Add frontend validation matching backend schemas
5. **Real User Management**: Replace mock data with real API calls

## 📚 Additional Resources

- FastAPI docs: https://fastapi.tiangolo.com/
- React + TypeScript: https://react-typescript-cheatsheet.netlify.app/
- JWT Authentication: https://jwt.io/
- VS Code Rest Client: Use for testing API endpoints