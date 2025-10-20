#!/bin/bash

# -------------------------------
# Automatic deployment script
# -------------------------------

# Set PATH to ensure docker-compose is found
export PATH=$PATH:/usr/bin:/usr/local/bin

# Go to project directory
cd /home/vector/microbank/Micro-Banking-System || exit

# Log start time
echo "----------------------------"
echo "Deployment started at $(date)"
echo "----------------------------"

# Reset local changes and pull latest main branch
git fetch origin main
git reset --hard origin/main

# Rebuild and restart containers using docker-compose
docker-compose down
docker-compose up -d --build

# Log completion
echo "Deployment completed at $(date)"
echo "----------------------------"
echo "All services are up and running."
echo "----------------------------"