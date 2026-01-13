#!/bin/bash
set -e

# Check if we're in development mode (source code mounted) or production (built)
if [ -d "/app/frontend/src" ]; then
    # Development mode: install deps and run dev server
    echo "🚀 Development mode detected - installing dependencies..."
    cd /app/frontend
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps || true
    fi
    
    echo "Starting development servers..."
    # Start backend
    cd /app/backend
    python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
    BACKEND_PID=$!
    
    # Start frontend dev server
    cd /app/frontend
    npm run dev -- --host 0.0.0.0 --port 5173 &
    FRONTEND_PID=$!
else
    # Production mode: serve built files
    echo "📦 Production mode - serving built files..."
    # Start FastAPI backend
    cd /app
    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 &
    BACKEND_PID=$!
    
    # Start frontend server
    cd /app/static
    python -m http.server 5173 &
    FRONTEND_PID=$!
fi

echo ""
echo "✅ Dashboard started:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8001"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
