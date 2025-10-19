@echo off
REM Start dev stack with hot reload for backend and Vite HMR for frontend
setlocal

REM Ensure we're in the repo root
cd /d %~dp0

echo Starting Docker dev stack (backend: uvicorn --reload, frontend: vite)...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up --build -d
if errorlevel 1 (
  echo Failed to start dev stack.
  exit /b 1
)

echo Tail logs (Ctrl+C to stop viewing, stack keeps running)...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f --tail=200

endlocal
