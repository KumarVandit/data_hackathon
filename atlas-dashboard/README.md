# Atlas Dashboard - Advanced 3D Visualization Platform

Modern, high-performance dashboard for Project Atlas knowledge graph visualization.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **3D Graph**: react-force-graph-3d (Three.js based)
- **3D Maps**: Deck.gl + Mapbox GL
- **State**: React Query (data fetching) + Zustand (global state)
- **Routing**: React Router

### Backend (FastAPI)
- **Framework**: FastAPI (Python, async)
- **Purpose**: Serve graph data from FalkorDB and processed files
- **Port**: 8001

## Features

### 3D Knowledge Graph Visualization
- Interactive 3D force-directed graph
- Node type filtering (GeographicSoul, IdentityLifecycle, etc.)
- Edge type filtering (LOCATED_IN, BORN_IN, etc.)
- Semantic search
- Node details on click
- Reasoning chain backtracking

### 3D Geographic Map
- WebGL-based 3D map visualization
- Scatterplot, Heatmap, and Arc layers
- Anomaly highlighting
- Pattern visualization
- Interactive filtering

### Performance Optimizations
- Data virtualization for large datasets
- Progressive loading
- WebWorkers for heavy computations
- Efficient React Query caching
- Lazy loading components

### Advanced Features
- Clustering visualization
- Semantic relationship exploration
- Pattern analysis
- Threat detection visualization
- Real-time updates

## Development

### Prerequisites
- Docker & Docker Compose (everything runs in containers)

### Autonomous Setup

**No manual installation needed!** The system handles everything automatically:

1. **Start via TUI**: Press `d` in the TUI to start the dashboard
2. **Or via Docker**: `docker-compose --profile dashboard up -d atlas-dashboard`

The system will:
- Automatically install npm dependencies on first build
- Run in development mode with hot reload
- Serve frontend at http://localhost:5173
- Serve backend API at http://localhost:8001

### Manual Development (Optional)

If you want to develop outside Docker:

```bash
# Install frontend dependencies
cd atlas-dashboard
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run development servers
npm run dev  # Frontend
python main.py  # Backend
```

## Environment Variables

Environment variables are set in `docker-compose.yml`. For local development, create `.env`:

```bash
# Frontend
VITE_API_URL=http://localhost:8001
# No map token needed - using OpenStreetMap

# Backend
FALKORDB_HOST=falkordb
FALKORDB_PORT=6379
FALKORDB_PASSWORD=falkordb
PROCESSED_PATH=/app/processed
```

## Docker

The dashboard runs in Docker via docker-compose:

```bash
# Start dashboard
docker-compose --profile dashboard up -d atlas-dashboard

# Access
# Frontend: http://localhost:5173
# API: http://localhost:8001
```

## Tech Stack Details

### 3D Visualization Libraries
- **react-force-graph-3d**: 3D force-directed graph
- **Deck.gl**: WebGL-based 3D layers for maps
- **react-map-gl + OpenStreetMap**: Free map tiles (no token required)
- **Three.js**: Custom 3D visualizations

### Data Visualization
- **D3.js**: Custom charts and layouts
- **Recharts**: React chart components
- **vis-network**: Alternative graph visualization

### State & Data Management
- **React Query**: Server state and caching
- **Zustand**: Lightweight global state
- **Axios**: HTTP client

## Project Structure

```
atlas-dashboard/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── graph/      # 3D graph components
│       │   ├── map/        # 3D map components
│       │   ├── charts/     # 2D visualizations
│       │   └── common/     # Shared components
│       ├── views/          # Page components
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API clients
│       └── types/          # TypeScript types
├── backend/
│   ├── main.py            # FastAPI application
│   └── services/
│       ├── falkordb.py    # FalkorDB client
│       └── data_loader.py # File data loader
└── package.json
```
