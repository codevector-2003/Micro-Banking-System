# Micro Banking System

A comprehensive micro-banking system built with **FastAPI** backend and **React + TypeScript** frontend, featuring complete authentication, account management, and banking operations.

## 🏗️ System Architecture

```
Micro-Banking-System/
├── Backend/                 # FastAPI backend (Python)
│   ├── main.py             # Main application entry
│   ├── auth.py             # JWT authentication
│   ├── database.py         # PostgreSQL configuration
│   ├── schemas.py          # Pydantic models
│   ├── customer.py         # Customer management
│   ├── employee.py         # Employee management
│   ├── branch.py           # Branch operations
│   ├── savingAccount.py    # Savings account handling
│   ├── transaction.py      # Transaction processing
│   ├── fixedDeposit.py     # Fixed deposit management
│   ├── jointAccounts.py    # Joint account operations
│   └── requirement.txt     # Python dependencies
└── Frontend/               # React + TypeScript frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── services/       # API service functions
    │   ├── contexts/       # React contexts (Auth)
    │   └── config/         # API configuration
    ├── package.json
    └── vite.config.ts      # Vite configuration
```

## ✨ Key Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with role-based access control
- **Multi-role support**: Admin, Manager, Agent
- **Secure token management** with automatic refresh
- **Protected routes** and API endpoints

### 🏦 Banking Operations
- **Customer Management**: Registration, profile management, KYC
- **Account Operations**: Savings accounts, joint accounts, fixed deposits
- **Transaction Processing**: Deposits, withdrawals, transfers
- **Branch Management**: Multi-branch support with employee assignment
- **Employee Management**: Role-based staff management

### 💻 Modern Tech Stack
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, Pydantic
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Authentication**: JWT tokens, bcrypt password hashing
- **UI Components**: Shadcn/ui component library

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL database**

### 1. Backend Setup

**Windows (Recommended):**
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

**Backend will be available at:**
- 🌐 API: http://localhost:8000
- 📚 Interactive docs: http://localhost:8000/docs
- 📖 ReDoc: http://localhost:8000/redoc

### 2. Frontend Setup

**Windows (Recommended):**
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

**Frontend will be available at:** http://localhost:5173

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the Backend directory:
```env
SECRET_KEY=your_super_secret_jwt_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://username:password@localhost:5432/micro_banking
ALGORITHM=HS256
```

### API Configuration (Frontend)
Update `src/config/api.ts` if needed:
```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

## 🧪 Testing the Integration

1. **Start both servers** (Backend on :8000, Frontend on :5173)
2. **Open the application** at http://localhost:5173
3. **Test authentication**:
   - Try logging in with valid credentials
   - Navigate between different role dashboards
   - Test logout functionality
4. **Test API connectivity**:
   - Go to Admin Dashboard → Connection Test
   - Click "Test Connection" to verify backend communication

## 📊 User Roles & Dashboards

### 👨‍💼 Admin Dashboard
- System-wide management
- User and employee management
- Branch operations oversight
- Connection testing tools

### 🏦 Manager Dashboard
- Branch-specific operations
- Customer account management
- Transaction monitoring
- Employee supervision

### 👥 Agent Dashboard
- Customer service operations
- Account opening and management
- Transaction processing
- Daily operational tasks

## 🛠️ API Endpoints

### Authentication
- `POST /auth/token` - User login
- `GET /auth/users/me` - Get current user
- `POST /auth/user/register` - Register new user
- `GET /auth/protected` - Test protected endpoint

### Core Banking
- `/customers/*` - Customer management
- `/employees/*` - Employee operations
- `/branches/*` - Branch management
- `/saving-accounts/*` - Savings account operations
- `/transactions/*` - Transaction handling
- `/fixed-deposits/*` - Fixed deposit management
- `/joint-accounts/*` - Joint account operations

## 🔍 Database Schema

The system uses PostgreSQL with the following main entities:
- **Users** (Authentication)
- **Customers** (Bank customers)
- **Employees** (Bank staff)
- **Branches** (Bank locations)
- **Accounts** (Savings, Joint, Fixed Deposits)
- **Transactions** (All financial operations)

## 🐛 Troubleshooting

### Common Issues

**Backend Issues:**
- ❌ **Port 8000 in use**: Change port in startup script or kill existing process
- ❌ **Database connection failed**: Verify PostgreSQL is running and credentials are correct
- ❌ **Module not found**: Ensure virtual environment is activated and dependencies installed

**Frontend Issues:**
- ❌ **CORS errors**: Backend has CORS middleware configured for localhost:5173
- ❌ **API connection failed**: Verify backend is running on port 8000
- ❌ **Build errors**: Check Node.js version and clear node_modules if needed

**Authentication Issues:**
- ❌ **Login fails**: Check backend logs for detailed error messages
- ❌ **Token expired**: Logout and login again, check token expiry settings
- ❌ **Unauthorized**: Verify user credentials and role permissions

## 📚 Documentation

- 📖 [Integration Guide](./INTEGRATION_GUIDE.md) - Detailed setup and integration instructions
- 📖 [API Integration](./Frontend/API_INTEGRATION.md) - Frontend API integration details
- 📖 [Database Queries](./Table%20Queries.txt) - SQL schema and queries
- 📖 [Database Views](./Views.txt) - Database view definitions

## 🛡️ Security Features

- **JWT Authentication** with configurable expiry
- **Password Hashing** using bcrypt
- **Role-based Access Control** (RBAC)
- **CORS Protection** for cross-origin requests
- **Input Validation** using Pydantic schemas
- **SQL Injection Protection** via SQLAlchemy ORM

## 🚀 Development

### Tech Stack Details
- **Backend Framework**: FastAPI (async Python web framework)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with Shadcn/ui components
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom service layer

### Project Structure
```
├── Backend/           # Python FastAPI application
├── Frontend/          # React TypeScript application  
├── INTEGRATION_GUIDE.md   # Setup and integration guide
└── README.md         # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent async web framework
- React team for the powerful frontend library
- Shadcn for the beautiful UI components
- The open-source community for amazing tools and libraries

---

**🏦 Ready to revolutionize micro-banking? Get started now!**