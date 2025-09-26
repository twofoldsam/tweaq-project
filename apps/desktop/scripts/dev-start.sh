#!/bin/bash

# Smart QA Browser Development Startup Script
# This script ensures clean startup and proper shutdown

echo "🚀 Starting Smart QA Browser Development Environment..."

# First, clean up any existing processes
./scripts/dev-cleanup.sh

echo "📦 Starting development servers..."

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    
    # Kill all related processes
    pkill -f "vite.*5173" 2>/dev/null || true
    pkill -f "electron.*Smart QA" 2>/dev/null || true
    pkill -f "concurrently.*desktop" 2>/dev/null || true
    
    # Kill any process using port 5173
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    
    echo "✅ Development environment shut down cleanly!"
    exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Start the development environment
pnpm dev

# If pnpm dev exits naturally, also run cleanup
cleanup
