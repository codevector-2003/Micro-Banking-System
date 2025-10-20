#!/bin/bash

# -------------------------------
# Automatic deployment script
# -------------------------------

# Go to project directory
cd /home/vector2003/microbank/Micro-Banking-System || exit

# Log start time
echo "----------------------------"
echo "Deployment started at $(date)"
echo "----------------------------"

# Reset local changes and pull latest main branch
git fetch origin main
git reset --hard origin/main

# Rebuild and restart containers
docker compose down
docker compose up -d --build

# Log completion
echo "Deployment completed at $(date)"
echo "----------------------------"
