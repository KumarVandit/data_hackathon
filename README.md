# Project Atlas: Unified Intelligence Platform

## We are not here to build a database. We are here to build a mirror.

A mirror that reflects the living, breathing soul of a nation. The UIDAI datasets are not rows in a table; they are the digital echoes of a billion heartbeats. They are the story of birth, of movement, of change, and of identity itself. To treat this data as anything less is to miss the point entirely.

Our task is not to answer the questions we are asked. It is to reveal the questions that need to be asked. To find the patterns hidden in plain sight, the truths that lie dormant in the numbers. We will not build a tool. We will craft an instrument that allows a skilled analyst to hear the music of society.

This is a Palantir-inspired data intelligence platform built on UIDAI Aadhaar data. This system creates a knowledge graph from Aadhaar enrollment, demographic, and biometric data, enabling pattern detection, anomaly analysis, and interactive visualization. All services run in Docker containers, controlled through a single TUI application.

**For complete technical architecture and ontology specifications, see [architecture.md](architecture.md).**

## Project Structure

```
.
├── data/                          # UIDAI Aadhaar data files (read-only)
│   ├── api_data_aadhar_biometric/     # Biometric update data
│   ├── api_data_aadhar_demographic/   # Demographic update data
│   └── api_data_aadhar_enrolment/     # Enrollment data
├── mcp_server/                    # Graphiti MCP Server (Knowledge Graph Engine)
│   ├── server.py                  # Main MCP server
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Docker image
│   └── .env.example               # Environment variables template
├── atlas-engine/                  # Data Processing & Intelligence Pipeline
│   ├── Dockerfile                 # Docker image
│   ├── requirements.txt           # Python dependencies
│   ├── config.yaml                # Processing configuration
│   ├── main.py                    # Main processing script
│   ├── ontology.py                # Ontology definitions (dataclasses, enums)
│   ├── graphiti_client.py         # Graphiti MCP client
│   └── .env.example               # Environment variables
├── atlas-dashboard/               # Advanced 3D Visualization Dashboard
│   ├── Dockerfile                 # Multi-stage Docker build (frontend + backend)
│   ├── docker-entrypoint.sh       # Dev/prod mode detection & auto-setup
│   ├── package.json               # Frontend dependencies (React, TypeScript)
│   ├── vite.config.ts             # Vite configuration (dev server, proxy)
│   ├── frontend/src/              # React + TypeScript frontend
│   │   ├── components/
│   │   │   ├── anomalies/        # Anomaly-specific components
│   │   │   ├── charts/           # Reusable chart components
│   │   │   ├── clustering/       # Clustering-specific components
│   │   │   ├── common/           # Shared UI components
│   │   │   ├── graph/            # 3D graph visualization components
│   │   │   ├── map/              # 3D map + H3 hexagon layers
│   │   │   ├── patterns/         # Pattern-specific components
│   │   │   ├── semantic/         # Semantic search components
│   │   │   └── threats/          # Threat-specific components
│   │   ├── views/                # Main application views (8 views)
│   │   ├── hooks/                # Custom React hooks (data fetching)
│   │   ├── services/             # API clients
│   │   └── types/                # TypeScript type definitions
│   ├── backend/                  # FastAPI backend
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── api/routes/           # API endpoints (graph, data, h3, anomalies, clusters, patterns, threats, semantic)
│   │   └── services/             # FalkorDB client & data loaders
│   ├── backend/requirements.txt  # Python dependencies
│   └── .env.example              # Environment variables
├── config/                        # Centralized configuration files
│   ├── graph/                     # Graph ontology definitions
│   │   └── ontology.yaml
│   ├── modules/                   # Module-specific configurations
│   │   ├── anomaly_detection.yaml
│   │   ├── feature_engineering.yaml
│   │   └── pattern_detection.yaml
│   └── services/                  # Service-specific configurations
│       ├── falkordb.yaml
│       └── graphiti_mcp.yaml
├── reference/                     # Graphiti MCP reference implementation
│   └── graphiti-mcp-server/       # Reference code for study
├── docker-compose.yml             # Docker Compose orchestration
├── main.go                        # TUI control application (single entry point)
├── go.mod                         # Go dependencies
├── Makefile                       # Build and run commands
└── .cursorrules                   # Cursor IDE rules
```

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- Go 1.21+ (for TUI application)
- macOS (tested, but should work on Linux/Windows too)

## Quick Start

### 1. Install Dependencies

```bash
# Install Go dependencies
make deps
# or
go mod download && go mod tidy
```

### 2. Run TUI Control Panel

```bash
# Run the TUI application
make run
# or
go run main.go
```

### 3. Using the TUI

The TUI provides a **single, autonomous interface** to control all services with intelligent dependency management:

**Navigation:**
- `↑/↓` or `j/k`: Navigate through services and actions
- `Enter`: Execute selected action (automatically starts dependencies)
- `Tab` / `Shift+Tab`: Switch between views (Services, Logs, Stats, Graph, Config, Dashboard)
- `1-6`: Directly switch to a specific view
- `q`: Quit application

**Quick Actions:**
- `s`: Start all core services (FalkorDB, Ollama, Graphiti MCP)
- `x`: Stop all services
- `b`: Build and start services
- `r`: Refresh service status
- `p`: Start processing pipeline (Atlas Engine) - **auto-starts dependencies**
- `d`: Start dashboard (Atlas Dashboard) - **auto-starts dependencies + opens browser**
- `l`: View logs for selected service
- `R`: Restart selected service

**Autonomous Features:**
- **Smart Service Toggle**: Press `Enter` on any service to start/stop - automatically starts dependencies first
- **Dependency Management**: Service list shows dependency information (e.g., "Graphiti MCP → Depends on: FalkorDB, Ollama")
- **Health Check Waiting**: Waits for services to become healthy before starting dependent services (up to 60 seconds)
- **Automatic Browser Opening**: Dashboard automatically opens in your default browser when started
- **Intelligent Orchestration**: 
  - Starting "Atlas Engine" → auto-starts Graphiti MCP + FalkorDB if needed
  - Starting "Atlas Dashboard" → auto-starts Graphiti MCP + FalkorDB if needed
  - Starting "Graphiti MCP" → auto-starts FalkorDB + Ollama if needed

**Service Dependencies:**
- **Graphiti MCP** → Depends on: FalkorDB, Ollama
- **Atlas Engine** → Depends on: Graphiti MCP, FalkorDB
- **Atlas Dashboard** → Depends on: Graphiti MCP, FalkorDB

**Features:**
- Real-time system monitoring (CPU, RAM, Disk) using gopsutil
- Service status indicators (running/stopped, health, uptime)
- Direct service control (start/stop individual services with auto-dependency management)
- Processing pipeline status and progress
- Knowledge graph statistics
- Status messages for all operations
- Live processing feed from Atlas Engine

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    TUI Control Panel (Go)                │
│                  Single Entry Point                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Docker Environment                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ FalkorDB │◄─┤ Graphiti │◄─┤  Ollama  │             │
│  │  Graph   │  │   MCP    │  │   LLM    │             │
│  └────┬─────┘  └────┬─────┘  └──────────┘             │
│       │             │                                   │
│       └─────┬───────┘                                   │
│             │                                           │
│  ┌──────────▼──────────┐  ┌──────────┐                │
│  │   Atlas Engine      │  │  Atlas   │                │
│  │  (Processing)       │  │Dashboard │                │
│  └─────────────────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Services

### Core Services (Always Running)

**FalkorDB** - Graph Database
- **Ports**: 6379 (Redis), 3000 (Web UI)
- **URL**: http://localhost:3000
- **Purpose**: Stores knowledge graph (nodes, edges, relationships)
- **Password**: `falkordb` (default)
- **Container**: `falkordb`
- **Health Check**: Enabled

**Ollama** - Local LLM Provider
- **Port**: 11434
- **URL**: http://localhost:11434
- **Purpose**: Provides local large language models for graph queries
- **Container**: `ollama`
- **Health Check**: Enabled

**Graphiti MCP** - Knowledge Graph Engine
- **Port**: 8000
- **URL**: http://localhost:8000
- **Purpose**: MCP server managing graph construction, querying, and LLM interaction
- **Container**: `graphiti-mcp`
- **Depends on**: FalkorDB, Ollama
- **Health Check**: Enabled

### Processing Services (On-Demand)

**Atlas Engine** - Data Processing & Intelligence Pipeline
- **Purpose**: Processes UIDAI data, engineers features, populates knowledge graph
- **Container**: `atlas-engine`
- **Profile**: `processing` (runs on demand via TUI)
- **Features**:
  - Data ingestion from CSV files
  - Feature engineering (temporal, ratios, velocities)
  - Anomaly detection (Isolation Forest, DBSCAN)
  - Pattern detection and correlation
  - Graph population via Graphiti MCP

**Atlas Dashboard** - Advanced 3D Visualization & Analytics Platform
- **Ports**: 5173 (Frontend), 8001 (Backend API)
- **URL**: http://localhost:5173 (Frontend), http://localhost:8001 (API)
- **Purpose**: Modern React/TypeScript dashboard with 3D visualizations
- **Container**: `atlas-dashboard`
- **Profile**: `dashboard` (runs on demand via TUI)
- **Architecture**:
  - **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
  - **Backend**: FastAPI (Python, async)
  - **3D Graph**: react-force-graph-3d (Three.js based)
  - **3D Maps**: Deck.gl + OpenStreetMap + H3 Geospatial Indexing
- **Features**:
  - **8 Complete Views**:
    1. **OverviewView** - Dashboard overview with stats and recent items
    2. **Graph3DView** - Interactive 3D knowledge graph visualization
    3. **Map3DView** - 3D geographic map with H3 hexagons
    4. **AnomaliesView** - Anomaly detection and analysis with filtering
    5. **ClusteringView** - Cluster analysis and exploration
    6. **PatternsView** - Behavioral pattern detection and analysis
    7. **ThreatsView** - Emergent threat analysis and evidence chains
    8. **SemanticView** - Semantic search with LLM reasoning
  - **Advanced Features**:
    - H3 hexagonal geospatial indexing (Uber's H3)
    - Semantic search with reasoning chains
    - Graph neighbor exploration (depth 1-3)
    - Similar node discovery
    - Real-time filtering and pagination
    - Interactive 3D visualizations
    - Relationship backtracking
    - Evidence chain visualization

## Configuration

### Environment Variables

Copy the example environment file and modify as needed:

```bash
cp mcp_server/.env.example mcp_server/.env
```

Key variables:
- `OLLAMA_HOST`: Ollama service host (default: `ollama`)
- `OLLAMA_PORT`: Ollama service port (default: `11434`)
- `FALKORDB_HOST`: FalkorDB service host (default: `falkordb`)
- `FALKORDB_PORT`: FalkorDB service port (default: `6379`)
- `FALKORDB_PASSWORD`: FalkorDB password (default: `falkordb`)

## Using Ollama

### Pull a Model

```bash
docker exec ollama ollama pull llama2
# or
docker exec ollama ollama pull mistral
```

### List Available Models

```bash
docker exec ollama ollama list
```

### Test a Model

```bash
docker exec ollama ollama run llama2 "Hello, how are you?"
```

## Using FalkorDB

Access the web UI at http://localhost:3000 to:
- View graph visualizations
- Execute Cypher queries
- Manage graph data

## MCP Server Tools

The MCP server provides the following tools:

1. **query_ollama**: Query a local LLM using Ollama
   - Parameters: `model` (string), `prompt` (string)

2. **falkordb_query**: Execute a query on FalkorDB
   - Parameters: `query` (string)

3. **falkordb_set**: Set a key-value pair in FalkorDB
   - Parameters: `key` (string), `value` (string)

## Data Structure

### UIDAI Aadhaar Data Files

All data files are stored in the `data/` directory (read-only mounts):

**Enrollment Data** (`api_data_aadhar_enrolment/`)
- Columns: `date`, `state`, `district`, `pincode`, `age_0_5`, `age_5_17`, `age_18_greater`
- Records: ~2.4M rows across multiple CSV files
- Purpose: New Aadhaar enrollments by age group

**Demographic Data** (`api_data_aadhar_demographic/`)
- Columns: `date`, `state`, `district`, `pincode`, `demo_age_5_17`, `demo_age_17_`
- Records: ~2.0M rows across multiple CSV files
- Purpose: Demographic information updates

**Biometric Data** (`api_data_aadhar_biometric/`)
- Columns: `date`, `state`, `district`, `pincode`, `bio_age_5_17`, `bio_age_17_`
- Records: ~1.8M rows across multiple CSV files
- Purpose: Biometric information updates

### Knowledge Graph Ontology

The system creates a knowledge graph based on **three fundamental forces**:

1. **Creation (Enrolment):** The digital birth of an identity
2. **Motion (Demographic Update):** The pulse of a life in progress
3. **Persistence (Biometric Update):** The act of anchoring the digital to the physical

**The most profound insights lie in the dissonance and harmony between these three forces.**

**Core Entity Types (Nodes):**
- `GeographicSoul`: The character and personality of a place (STATE, DISTRICT, PINCODE levels; archetypes: NURSERY, CROSSROADS, BEDROCK, GHOST_FARM, DORMANT)
- `IdentityLifecycle`: The archetypal journey of a cohort of identities (stages: NEWBORN, ACTIVE, DORMANT, GHOST)
- `BehavioralSignature`: Recurring, recognizable patterns of behavior (TEMPORAL_SPIKE, COORDINATED_UPDATE, SEASONAL_MIGRATION, WEEKEND_ANOMALY, GHOST_FARM_PATTERN)
- `SystemicTension`: The dissonance between forces (CREATION_WITHOUT_MOTION, MOTION_WITHOUT_CREATION, PERSISTENCE_WITHOUT_PAST, DEMOGRAPHIC_MISMATCH, TEMPORAL_SHOCK, COORDINATED_ANOMALY)
- `EmergentThreat`: Inferred narratives of risk (IDENTITY_FRAUD_RING, HUMAN_TRAFFICKING_NETWORK, SLEEPER_CELL_ACTIVATION, ECONOMIC_SHADOW_NETWORK, COORDINATED_ANOMALY)

**Core Edge Types (Relationships):**
- `LOCATED_IN`: Geographic hierarchy
- `BORN_IN`: Identity lifecycle to geographic origin
- `MANIFESTS`: Geographic area exhibits a behavioral signature
- `EXPERIENCES`: Entity experiences systemic tension
- `REVEALS`: Tension reveals an emergent threat
- `ECHOES`: Similar geographic characters
- `PRECEDES`: Causal pattern relationships
- `SUGGESTS`: Pattern suggests a threat

**For complete ontology specifications with all properties and calculations, see [architecture.md](architecture.md).**

## Implementation Status

### ✅ Completed Components

- **Docker Infrastructure**: All services configured with health checks
- **Data Loading**: Reads all three UIDAI datasets, merges correctly
- **Feature Engineering**: Calculates ratios, velocities, intensities, archetypes
- **Anomaly Detection**: Isolation Forest and DBSCAN implementation with tension node creation
- **Pattern Detection**: Temporal spikes, ghost farms, coordinated updates
- **Threat Inference**: Reasoning engine connecting tensions and signatures
- **Graph Population**: Complete knowledge graph with all entity and edge types
- **Dashboard**: Complete React/TypeScript platform with 8 views
- **TUI Control Panel**: Full service control and monitoring

### ✅ Implementation Status

**Completed:**
1. ✅ **Graph Population via Graphiti MCP**: FULLY IMPLEMENTED
   - Graphiti MCP HTTP client (`graphiti_client.py`)
   - `populate_graph()` function writes entities/edges to FalkorDB
   - ✅ Creates all 5 entity types: GeographicSoul (State, District, Pincode), IdentityLifecycle, SystemicTension, BehavioralSignature, EmergentThreat
   - ✅ Creates ALL 8/8 edge types: LOCATED_IN, BORN_IN, EXPERIENCES, MANIFESTS, REVEALS, SUGGESTS, ECHOES, PRECEDES
   - ✅ Geographic hierarchy: State → District → Pincode (LOCATED_IN)
   - ✅ Pattern precedence: Temporal sequence analysis (PRECEDES)

2. ✅ **Pattern Detection**: Fully implemented
   - Temporal spike detection
   - Ghost farm pattern detection (aligned with "Ghost Farm Detector" capability)
   - Coordinated update detection
   - Behavioral signature creation

3. ✅ **DBSCAN Anomaly Detection**: Implemented alongside Isolation Forest
   - DBSCAN clustering for geographic outliers
   - Combined with Isolation Forest for comprehensive detection
   - Configurable via `config.yaml`

4. ✅ **Threat Inference (Stage 6)**: FULLY IMPLEMENTED
   - EmergentThreat node creation implemented
   - REVEALS and SUGGESTS edge creation implemented
   - Reasoning engine connects tensions and signatures
   - Detects Identity Fraud Rings and Coordinated Anomalies

5. ✅ **Atlas Dashboard**: FULLY IMPLEMENTED
   - **8 Complete Views**: Overview, Graph3D, Map3D, Anomalies, Clustering, Patterns, Threats, Semantic
   - **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
   - **Backend**: FastAPI with comprehensive REST API
   - **3D Visualizations**: react-force-graph-3d (graph), Deck.gl (maps)
   - **H3 Integration**: Hexagonal geospatial indexing for geographic data
   - **Semantic Search**: LLM-powered search with reasoning chains
   - **Autonomous Setup**: Automatic dependency installation and hot-reloading
   - **Advanced Features**: Filtering, pagination, stats dashboards, detailed modals

**Alignment with Specifications:**

**From "The Soul of the System":**
- ✅ Three Fundamental Forces (Creation, Motion, Persistence) - Fully handled
- ✅ Core Entity Types defined - All 5 types in ontology.yaml
- ✅ Entity Creation - All 5/5 types created (GeographicSoul at State/District/Pincode levels, IdentityLifecycle, SystemicTension, BehavioralSignature, EmergentThreat)
- ✅ Edge Types - ALL 8/8 types created (LOCATED_IN, BORN_IN, EXPERIENCES, MANIFESTS, REVEALS, SUGGESTS, ECHOES, PRECEDES)
- ✅ Ghost Farm Detector - Pattern detection includes this
- ✅ Geographic Hierarchy - Full State → District → Pincode structure
- ✅ Pattern Precedence - Temporal sequence analysis implemented

**From "Complete Technical Specification":**
- ✅ Pipeline Stages 1-7: ALL IMPLEMENTED
- ✅ Pipeline Stage 6: Threat Inference - FULLY IMPLEMENTED
- ✅ Pipeline Stage 7: Graph Population - FULLY COMPLETE (5/5 entity types, 8/8 edge types)

**Note:** Our entity types (`GeographicSoul`, `IdentityLifecycle`, etc.) align with `architecture.md` (Complete Technical Specification). The ontology is fully defined and implementation is **100% complete**.

**System Status:**
- ✅ All entity types implemented
- ✅ All edge types implemented
- ✅ All pipeline stages implemented
- ✅ Full geographic hierarchy (State → District → Pincode)
- ✅ Pattern precedence tracking
- ✅ Complete knowledge graph population
- ✅ Complete dashboard platform (8/8 views)
- ✅ Semantic search with reasoning
- ✅ H3 geospatial indexing

## Development

### Build TUI Application

```bash
make build
# Creates: mcp-control binary
```

### Run TUI Application

```bash
make run
# or
go run main.go
```

### View Docker Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mcp_server
docker-compose logs -f ollama
docker-compose logs -f falkordb
```

### Rebuild Services

Use the TUI (`b` key) or manually:

```bash
docker-compose up --build -d
```

### Access Container Shell

```bash
# MCP Server
docker exec -it graphiti-mcp /bin/bash

# Atlas Dashboard (backend)
docker exec -it atlas-dashboard /bin/bash

# Atlas Engine
docker exec -it atlas-engine /bin/bash

# FalkorDB
docker exec -it falkordb /bin/sh
```

## System Monitoring

The TUI uses [gopsutil](https://github.com/shirou/gopsutil) to monitor:
- **CPU Usage**: Real-time CPU percentage
- **Memory Usage**: RAM utilization
- **Disk Usage**: Root filesystem usage

Stats update every 2 seconds automatically.

## Troubleshooting

### Services won't start
- Ensure Docker Desktop is running
- Check if ports 11434, 6379, 3000, and 8000 are available
- Use TUI to check service status or view logs: `docker-compose logs -f`

### Ollama model not found
- Pull a model: `docker exec ollama ollama pull llama2`
- List models: `docker exec ollama ollama list`

### FalkorDB connection issues
- Check if FalkorDB is running (use TUI or `docker ps | grep falkordb`)
- Verify password in `.env` file matches Docker Compose config

### MCP Server errors
- Check logs: `docker-compose logs mcp_server`
- Verify environment variables in `.env` file
- Ensure Ollama and FalkorDB are running first (use TUI to verify)

### TUI not working
- Ensure Go 1.21+ is installed: `go version`
- Install dependencies: `make deps`
- Check Docker is running: `docker ps`

## Technologies

- **TUI Framework**: [Bubble Tea](https://github.com/charmbracelet/bubbletea) and [Lip Gloss](https://github.com/charmbracelet/lipgloss)
- **System Monitoring**: [gopsutil](https://github.com/shirou/gopsutil)
- **Knowledge Graph**: [Graphiti MCP](https://github.com/getzep/graphiti) - Graph construction and querying
- **Graph Database**: [FalkorDB](https://www.falkordb.com/) - High-performance graph database
- **LLM**: [Ollama](https://ollama.ai/) - Local large language models
- **Data Processing**: Python (pandas, numpy, scikit-learn, h3)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **3D Visualization**: 
  - react-force-graph-3d (3D graph visualization)
  - Deck.gl (3D maps with WebGL)
  - H3 (Uber's hexagonal geospatial indexing system)
  - OpenStreetMap (open-source map tiles)
- **State Management**: React Query (data fetching) + Zustand (global state)
- **Backend API**: FastAPI (Python, async) with comprehensive REST endpoints
- **Orchestration**: Docker Compose with health checks, profiles, and autonomous dependency management

## Configuration Files

### Service Configurations

**Atlas Engine** (`atlas-engine/config.yaml`)
- Data paths and batch processing settings
- Feature engineering parameters
- Anomaly detection configuration (Isolation Forest, DBSCAN)
- Pattern detection settings
- Graph connection settings

**Graph Ontology** (`config/graph/ontology.yaml`)
- Complete entity type definitions with all properties
- Edge type specifications
- Enum value definitions
- Property schemas and validation rules

**Python Ontology** (`atlas-engine/ontology.py`)
- Dataclasses for type-safe entity definitions
- Enum classes for controlled vocabularies
- Helper functions for enum conversion
- Structured ontology definitions matching YAML schema

**Atlas Dashboard**
- **Frontend**: React + TypeScript + Vite
  - No config.yaml needed, uses environment variables
  - Autonomous dependency installation via Docker entrypoint
  - Hot Module Replacement (HMR) in development mode
  - Production builds with static file serving
  - Multi-stage Docker build (frontend builder + backend runtime)
  - Dev/prod mode auto-detection
- **Backend**: FastAPI with environment variables in `docker-compose.yml`
  - Comprehensive API routes for all data types
  - Semantic search endpoints with LLM reasoning
  - Graph query endpoints
  - H3 geospatial endpoints
  - Neighbor exploration endpoints
- **Docker Configuration**:
  - `Dockerfile`: Multi-stage build (frontend builder + backend runtime)
  - `docker-entrypoint.sh`: Dev/prod mode detection and auto-setup
  - `vite.config.ts`: Dev server proxy configuration
  - Volume mounts for hot reload in development
- **H3 Integration**: 
  - Geographic data aggregation by H3 hexagons
  - Resolution control (0-15)
  - Efficient spatial queries
  - Hexagonal heatmap visualization

### Environment Variables

Each service has a `.env.example` file. Copy and customize as needed:
- `mcp_server/.env.example` - Graphiti MCP configuration
- `atlas-engine/.env.example` - Processing pipeline configuration
- `atlas-dashboard/.env.example` - Dashboard configuration

## Implementation Workflow

### Initial Setup

1. **Start Core Services**: Use TUI to start FalkorDB, Ollama, and Graphiti MCP
2. **Pull LLM Model**: `docker exec ollama ollama pull llama3:8b` (or preferred model)
3. **Verify Services**: Check all core services are healthy via TUI

### Data Processing Pipeline

The Atlas Engine transforms raw CSV data into a living knowledge graph through seven stages:

1. **Ingestion & Aggregation**: Raw CSVs → Daily records per pincode → Aggregated metrics
2. **Feature Engineering**: Calculate derived ratios, velocities, variances
3. **Archetype Classification**: Assign archetypes (NURSERY, CROSSROADS, BEDROCK, GHOST_FARM, DORMANT)
4. **Anomaly Detection**: Run DBSCAN, Isolation Forest, Z-score analysis → Create SystemicTension nodes
5. **Pattern Discovery**: Sequence mining, clustering → Create BehavioralSignature nodes
6. **Threat Inference**: Reasoning engine → Create EmergentThreat nodes from tensions and signatures
7. **Graph Population**: Write all entities and relationships to FalkorDB via Graphiti MCP

**Run Processing**: Use TUI to start Atlas Engine (`p` key) for data processing and graph population

### Analysis & Visualization

4. **View Dashboard**: Use TUI to start Atlas Dashboard (`d` key)
   - Browser automatically opens to http://localhost:5173
   - Frontend runs with hot-reloading in development mode
   - Backend API available at http://localhost:8001
5. **Explore Dashboard Views**:
   - **Overview**: System stats and recent items
   - **Graph 3D**: Interactive 3D knowledge graph
   - **Map 3D**: Geographic visualization with H3 hexagons
   - **Anomalies**: Filter and analyze detected anomalies
   - **Clustering**: Explore geographic and pattern clusters
   - **Patterns**: Behavioral pattern analysis
   - **Threats**: Emergent threat investigation
   - **Semantic**: Semantic search with reasoning chains
6. **Explore Graph**: Use FalkorDB Web UI (port 3000) or dashboard for graph exploration

### Capabilities Enabled

With this ontology, the system can craft:

- **The National Cardiogram**: Real-time visualization of the nation's collective heartbeat
- **The Ghost Farm Detector**: Finds factories where synthetic identities are mass-produced
- **The Sleeper Cell Alarm**: Detects suspicious absence of activity followed by coordinated return
- **The Economic Shadow Mapper**: Identifies informal/illicit economies through demographic dynamism
- **The Social Fault Line Detector**: Forecasts social friction by measuring demographic change gradients
- **The Oracle Engine**: Predictive system using causal pattern relationships

**For detailed implementation guide and technical specifications, see [architecture.md](architecture.md).**

## Notes

- All services run in Docker containers for portability
- Data persists in Docker volumes (falkordb_data, ollama_data, graphiti_data, atlas_engine_data)
- Configuration is YAML and environment-based for easy deployment
- Single TUI entry point for all operations
- System monitoring integrated via gopsutil
- Processing and dashboard services use Docker profiles for on-demand execution
- Data files are mounted read-only to prevent accidental modification
- Designed to work on different Mac systems
- Knowledge graph can be rebuilt multiple times by re-running Atlas Engine

## License

This project is for hackathon purposes.
