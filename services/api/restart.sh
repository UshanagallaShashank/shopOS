#!/bin/bash
# Quick restart script for the API server

echo "Cleaning Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

echo "Installing/updating dependencies..."
pip install -r requirements.txt

echo ""
echo "Restarting API server..."
echo "Press Ctrl+C to stop"
echo ""

# Kill any existing uvicorn processes
pkill -f "uvicorn main:app" 2>/dev/null || true

# Small delay to ensure process is killed
sleep 1

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
