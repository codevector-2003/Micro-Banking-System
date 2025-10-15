@echo off
REM Startup script for the Micro Banking System Backend (Windows)

echo 🏦 Starting Micro Banking System Backend...
echo.

echo 📋 Checking backend dependencies...
cd Backend

REM Check if virtual environment exists
if not exist "venv\" (
    echo ❌ Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing backend dependencies...
pip install -r requirement.txt

echo.
echo 🚀 Starting backend server...
echo    API will be available at: http://localhost:8000
echo    API docs will be available at: http://localhost:8000/docs
echo.

REM Start the backend server
uvicorn main:app --reload --port 8000