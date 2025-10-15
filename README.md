# Micro Banking System

A comprehensive micro-banking system built with **FastAPI** backend and **React + TypeScript** frontend, featuring complete authentication, account management, and banking operations.

## 🔑 Quick Start - Default Login Credentials

After running `docker-compose up --build`, login with these credentials:

| **Role** | **Username** | **Password** | **Access Level** |
|----------|--------------|--------------|------------------|
| 🔴 **Admin** | `admin` | `password123` | Full system control |
| 🟡 **Manager** | `manager1` | `password123` | Branch management |
| 🟢 **Agent** | `agent1` | `password123` | Customer operations |

**🌐 Application URL**: http://localhost:5173

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
│   ├── Dockerfile          # Backend containerization
│   └── requirement.txt     # Python dependencies
├── Frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service functions
│   │   ├── contexts/       # React contexts (Auth)
│   │   └── config/         # API configuration
│   ├── Dockerfile          # Frontend containerization
│   ├── package.json
│   └── vite.config.ts      # Vite configuration
├── init-scripts/           # Database initialization
│   └── 01-init-database.sql # Complete database setup
├── docker-compose.yml      # Docker services configuration
└── README.md              # This file
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

## � Docker Implementation

### Prerequisites for Docker
- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)

### 🚀 One-Command Docker Setup

**Run the entire application with Docker:**
```bash
docker-compose up --build
```

This will:
- Build and start PostgreSQL database
- **Automatically initialize database schema** with all tables, triggers, and views
- **Insert sample data** for immediate testing
- Build and start FastAPI backend
- Build and start React frontend
- Set up networking between all services

**Services will be available at:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
- 🗄️ PostgreSQL: localhost:5432

### 🔐 Default Login Credentials

The database is automatically initialized with these test accounts:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| **Admin** | `admin` | `password123` | Full system access, user management |
| **Manager** | `manager1` | `password123` | Branch operations, customer management |
| **Manager** | `manager2` | `password123` | Branch operations, customer management |
| **Agent** | `agent1` | `password123` | Customer service, account operations |
| **Agent** | `agent2` | `password123` | Customer service, account operations |

**🚀 Quick Login Test:**
1. Go to http://localhost:5173
2. Use **Username**: `admin` and **Password**: `password123`
3. Access the Admin Dashboard with full privileges

### 📁 Docker Configuration Files

The project includes these Docker files:

#### `docker-compose.yml` (Root)
```yaml
version: "3.9"

services:
  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=B_trust
      - DB_USER=postgres
      - DB_PASSWORD=1234

  frontend:
    build: ./Frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 1234
      POSTGRES_DB: B_trust
    volumes:
      - ./init-scripts:/docker-entrypoint-initdb.d/
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  db-data:
```

#### `Backend/Dockerfile`
- Multi-stage build for optimized image size
- Uses Python 3.11 slim base image
- Runs with Gunicorn + Uvicorn workers for production
- Includes health checks and security best practices

#### `Frontend/Dockerfile`
- Uses Node.js for building React app
- Serves with Nginx for production
- Optimized for static file serving

#### `Backend/.dockerignore`
```
__pycache__/
*.pyc
*.pyo
*.log
.env
venv/
.git
```

#### `init-scripts/01-init-database.sql`
Complete database initialization script that automatically creates:
- **11 Tables**: All banking entities with proper relationships
- **Custom Types**: Employee types, account types, transaction types
- **Auto-ID Triggers**: Automatic ID generation for all entities
- **Views & Materialized Views**: Pre-built queries for reporting
- **Sample Data**: Ready-to-use test accounts and users

**🔑 Includes Pre-configured Login Accounts:**
- **Admin**: `admin` / `password123` (Full system access)
- **Manager**: `manager1` / `password123` (Branch management)
- **Manager**: `manager2` / `password123` (Branch management)
- **Agent**: `agent1` / `password123` (Customer service)
- **Agent**: `agent2` / `password123` (Customer service)

### 🔧 Docker Commands

**Build and start all services:**
```bash
docker-compose up --build
```

**Start services in background:**
```bash
docker-compose up -d
```

**Stop all services:**
```bash
docker-compose down
```

**View logs:**
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

**Rebuild specific service:**
```bash
docker-compose build backend
docker-compose build frontend
```

**Access service containers:**
```bash
# Backend container
docker-compose exec backend bash

# Database container
docker-compose exec db psql -U postgres -d B_trust
```

### 🔧 Environment Configuration for Docker

#### `Backend/.env` (for Docker)
```env
# Database configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=B_trust
DB_USER=postgres
DB_PASSWORD=1234
DB_SSLMODE=disable

# JWT configuration
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### `Frontend/src/config/api.ts` (for Docker)
```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

### 🐛 Docker Troubleshooting

**Common Docker Issues:**

**Port conflicts:**
```bash
# Check what's using ports
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Stop conflicting processes or change ports in docker-compose.yml
```

**Database connection issues:**
```bash
# Check if database is ready
docker-compose exec db pg_isready -U postgres

# View database logs
docker-compose logs db
```

**Build failures:**
```bash
# Clean build (no cache)
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

**Container not starting:**
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs --follow backend
```

**Volume issues:**
```bash
# Remove volumes and restart
docker-compose down -v
docker-compose up --build
```

### 🚀 Production Docker Deployment

For production deployment, consider:

1. **Use environment files:**
```bash
docker-compose --env-file .env.prod up -d
```

2. **Set production environment variables:**
```env
JWT_SECRET=super_secure_production_secret
DB_PASSWORD=strong_production_password
```

3. **Use Docker secrets for sensitive data**
4. **Set up proper logging and monitoring**
5. **Configure reverse proxy (Nginx) for HTTPS**

### 📊 Docker Service Dependencies

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│  Frontend   │───▶│   Backend    │───▶│   PostgreSQL   │
│  (React)    │    │  (FastAPI)   │    │   Database     │
│  Port: 5173 │    │  Port: 8000  │    │   Port: 5432   │
└─────────────┘    └──────────────┘    └────────────────┘
```

**Service startup order:**
1. PostgreSQL Database starts first
2. Backend waits for database to be ready
3. Frontend starts after backend is available

## �🔧 Configuration

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
3. **Test authentication** with default credentials:
   - **Admin Login**: Username `admin`, Password `password123`
   - **Manager Login**: Username `manager1`, Password `password123`
   - **Agent Login**: Username `agent1`, Password `password123`
4. **Navigate between different role dashboards**
5. **Test logout functionality**
6. **Test API connectivity**:
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