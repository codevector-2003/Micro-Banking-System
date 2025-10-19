@echo off
REM Stop dev stack
setlocal
cd /d %~dp0
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev down
endlocal
