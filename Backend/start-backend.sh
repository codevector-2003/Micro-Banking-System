#!/bin/bash

# Startup script for the Micro Banking System

echo "🏦 Starting Micro Banking System..."
echo ""

# Check if backend dependencies are installed
echo "📋 Checking backend dependencies..."
cd Backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Linux/macOS
    source venv/bin/activate
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
pip install -r requirement.txt

echo ""
echo "🚀 Starting backend server..."
echo "   API will be available at: http://localhost:8000"
echo "   API docs will be available at: http://localhost:8000/docs"
echo ""

# Start the backend server
uvicorn main:app --reload --port 8000