@echo off
REM Startup script for the Micro Banking System Frontend (Windows)

echo 🖥️ Starting Micro Banking System Frontend...
echo.

cd Frontend

echo 📦 Installing frontend dependencies...
npm install

echo.
echo 🚀 Starting frontend development server...
echo    Application will be available at: http://localhost:5173
echo.

REM Start the frontend server
npm run dev