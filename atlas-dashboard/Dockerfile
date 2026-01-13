# Multi-stage build for React frontend + FastAPI backend

# Stage 1: Frontend build
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Install dependencies (autonomous)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy frontend source and config files
COPY frontend/ ./frontend/
COPY vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js index.html ./

# Build frontend (autonomous)
RUN npm run build

# Stage 2: Backend + serve frontend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies + Node.js for dev mode
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend (for production)
COPY --from=frontend-builder /app/dist ./static

# Copy entrypoint script
COPY docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 5173 8001

CMD ["/app/entrypoint.sh"]
