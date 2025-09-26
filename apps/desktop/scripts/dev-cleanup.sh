#!/bin/bash

# Development cleanup script for Smart QA Browser
# This script ensures clean startup by killing any existing processes

echo "🧹 Cleaning up existing processes..."

# Kill any existing processes
pkill -f "vite.*5173" 2>/dev/null || true
pkill -f "electron.*Smart QA" 2>/dev/null || true
pkill -f "concurrently.*desktop" 2>/dev/null || true

# Kill any process using port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

echo "✅ Cleanup complete! Port 5173 and related processes cleared."
