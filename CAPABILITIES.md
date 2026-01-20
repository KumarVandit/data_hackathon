# Project Atlas: Complete System Capabilities

## 🎯 Overview

Project Atlas is a **Palantir-inspired unified intelligence platform** that transforms raw UIDAI Aadhaar data into a living knowledge graph, enabling advanced pattern detection, anomaly analysis, threat inference, and interactive 3D visualization. The system operates autonomously through a single TUI interface.

---

## 📊 Data Processing Capabilities

### 1. Multi-Source Data Ingestion
- **Processes 3 UIDAI datasets simultaneously:**
  - **Enrollment Data** (~2.4M records): New Aadhaar registrations by age group
  - **Demographic Updates** (~2.0M records): Address, name, DOB, gender, mobile updates
  - **Biometric Updates** (~1.8M records): Fingerprint, iris, face revalidation
- **Geographic Aggregation**: Aggregates data at State → District → Pincode levels
- **Temporal Processing**: Daily record processing with time-series analysis
- **Batch Processing**: Configurable batch sizes (default: 10,000 records)
- **Checkpoint/Resume**: Save and resume processing from any stage

### 2. Advanced Feature Engineering
- **Temporal Features**:
  - Creation/Motion/Persistence velocities (daily rates)
  - Variance calculations (volatility metrics)
  - Coefficient of variation (normalized volatility)
  - Trend analysis (30-day windows)
  - Seasonality detection
- **Ratio Features**:
  - Child/Youth/Adult ratios (demographic composition)
  - Motion intensity (motion/creation ratio)
  - Persistence intensity (persistence/creation ratio)
  - Motion-to-persistence ratio
  - Update-to-enrollment ratios
- **Velocity Features**:
  - Creation velocity (enrollments per day)
  - Motion velocity (updates per day)
  - Persistence velocity (biometric updates per day)
  - Acceleration (rate of change of velocity)
- **Risk Scoring**:
  - Composite anomaly score (0-100)
  - Fraud risk score (identity fraud specific)
  - Trafficking risk score (child safety specific)

### 3. Archetype Classification
Automatically classifies geographic locations into 5 archetypes:
- **NURSERY**: High creation, high children (growing population)
- **CROSSROADS**: High motion (migration hub)
- **BEDROCK**: Low variance (stable, established area)
- **GHOST_FARM**: High creation, zero motion (synthetic identity factory)
- **DORMANT**: Low activity across all dimensions

---

## 🔍 Anomaly Detection Capabilities

### Multi-Method Detection
- **Isolation Forest**: Detects outliers in high-dimensional feature space
  - Configurable contamination rate (default: 1%)
  - 100 estimators for robust detection
- **DBSCAN Clustering**: Geographic outlier detection
  - Euclidean distance clustering
  - Configurable epsilon and min_samples
- **Statistical Methods**: Z-score and IQR analysis
  - 3-sigma rule for extreme outliers
  - Interquartile range detection

### 6 Types of Systemic Tensions Detected
1. **CREATION_WITHOUT_MOTION**: High enrollments but zero updates (ghost identities)
2. **MOTION_WITHOUT_CREATION**: High updates but low historical enrollments (suspicious activity)
3. **PERSISTENCE_WITHOUT_PAST**: Biometric updates for identities with no enrollment record
4. **DEMOGRAPHIC_MISMATCH**: Age distribution wildly different from neighbors
5. **TEMPORAL_SHOCK**: Sudden, massive spikes in any metric (3σ threshold)
6. **COORDINATED_ANOMALY**: Multiple locations showing synchronized anomalies

### Anomaly Analysis
- Severity scoring (0-100 scale)
- Z-score calculation (statistical deviation)
- Deviation magnitude (expected vs observed)
- Contributing factors identification
- Geographic linking (tensions linked to locations)

---

## 🎯 Pattern Detection Capabilities

### 5 Pattern Types Detected
1. **TEMPORAL_SPIKE**: Sudden spikes in activity (2x mean threshold)
2. **COORDINATED_UPDATE**: Synchronized updates across multiple locations (48-hour window)
3. **SEASONAL_MIGRATION**: Recurring seasonal patterns (30-day cycles)
4. **WEEKEND_ANOMALY**: Unusual weekend activity patterns
5. **GHOST_FARM_PATTERN**: High creation with zero motion for 60+ days

### Pattern Discovery
- **Sequence Mining**: Discovers frequent sequential patterns
  - Minimum support: 10%
  - Minimum confidence: 70%
- **Correlation Analysis**: Finds correlated patterns across locations
  - Correlation threshold: 0.7
  - Minimum pairs: 5
- **Pattern Tracking**: Tracks occurrence count, first/last observed dates
- **Confidence Scoring**: Statistical confidence for each pattern (0-1)

---

## 🔗 Identity Lifecycle Tracking

### Cohort Analysis
- **Tracks identity cohorts** by birth date and location
- **Lifecycle Stages**:
  - **NEWBORN**: Recently enrolled (< 30 days)
  - **ACTIVE**: Showing motion or persistence events
  - **DORMANT**: No activity for 90+ days
  - **GHOST**: Large cohort with zero activity (suspicious)
- **Motion Frequency**: Tracks how mobile a cohort is
- **Subsequent Events**: Counts motion and persistence events after enrollment

---

## 🛡️ Threat Inference Engine

### 5 Threat Types Inferred
1. **IDENTITY_FRAUD_RING**: Coordinated synthetic identity creation
2. **HUMAN_TRAFFICKING_NETWORK**: Child-focused suspicious patterns
3. **SLEEPER_CELL_ACTIVATION**: Dormant identities suddenly reactivating
4. **ECONOMIC_SHADOW_NETWORK**: Informal/illicit economy indicators
5. **COORDINATED_ANOMALY**: Multi-location coordinated operations

### Threat Analysis
- **Evidence Chain**: Links tensions and signatures to threats
- **Severity Levels**: 1-5 scale (urgency assessment)
- **Confidence Scoring**: 0-1 scale (certainty of threat)
- **Geographic Spread**: Number of locations involved
- **Temporal Span**: Duration of threat activity
- **Entity Count**: Estimated identities involved
- **Narrative Generation**: Human-readable threat descriptions

---

## 🕸️ Knowledge Graph Construction

### 5 Entity Types Created
1. **GeographicSoul**: Character of places (State/District/Pincode)
2. **IdentityLifecycle**: Journey of identity cohorts
3. **BehavioralSignature**: Recurring behavioral patterns
4. **SystemicTension**: Dissonance between forces
5. **EmergentThreat**: Inferred risk narratives

### 8 Edge Types Created
1. **LOCATED_IN**: Geographic hierarchy (Pincode → District → State)
2. **BORN_IN**: Identity lifecycle to geographic origin
3. **MANIFESTS**: Location exhibits a pattern
4. **EXPERIENCES**: Entity experiences a tension
5. **REVEALS**: Tension reveals a threat
6. **SUGGESTS**: Pattern suggests a threat
7. **ECHOES**: Similar geographic characters
8. **PRECEDES**: Causal pattern relationships

### Graph Population
- **Automatic Population**: Via Graphiti MCP HTTP client
- **Batch Operations**: Efficient bulk entity/edge creation
- **Relationship Tracking**: All relationships stored in FalkorDB
- **Query Support**: Full Cypher query support via FalkorDB

---

## 🎨 Visualization & Dashboard Capabilities

### 8 Complete Dashboard Views

1. **OverviewView**
   - System statistics
   - Recent anomalies, patterns, threats
   - Quick access to all views

2. **Graph3DView**
   - Interactive 3D force-directed graph
   - Node/edge filtering by type
   - Search functionality
   - Node details on click
   - Camera controls (zoom, pan, rotate)

3. **Map3DView**
   - 3D geographic visualization
   - H3 hexagonal aggregation
   - OpenStreetMap tiles
   - Heatmap visualization
   - Resolution control (0-15)
   - Geographic filtering

4. **AnomaliesView**
   - Filter by tension type, severity, location
   - Pagination (100 per page)
   - Detailed anomaly cards
   - Z-score and deviation metrics
   - Geographic linking

5. **ClusteringView**
   - Cluster analysis visualization
   - Cluster statistics
   - Member details
   - Geographic distribution
   - Filtering and search

6. **PatternsView**
   - Pattern type filtering
   - Temporal pattern visualization
   - Confidence scores
   - Occurrence tracking
   - Location mapping

7. **ThreatsView**
   - Threat severity filtering
   - Status tracking (ACTIVE, MONITORING, RESOLVED)
   - Evidence chain visualization
   - Geographic spread mapping
   - Narrative display

8. **SemanticView**
   - Natural language search
   - LLM-powered reasoning chains
   - Node type filtering
   - Neighbor exploration (depth 1-3)
   - Similar node discovery

### Advanced Visualization Features
- **H3 Geospatial Indexing**: Uber's hexagonal grid system
  - Efficient geographic aggregation
  - Resolution control (0-15)
  - Spatial queries
  - Hexagonal heatmaps
- **3D Rendering**: High-performance WebGL rendering
  - react-force-graph-3d for graphs
  - Deck.gl for maps
  - Three.js for 3D primitives
- **Real-time Filtering**: Instant filtering and pagination
- **Interactive Exploration**: Click-to-explore relationships
- **Evidence Backtracking**: Trace threat/anomaly origins

---

## 🔎 Semantic Search & Reasoning

### LLM-Powered Search
- **Natural Language Queries**: "Find fraud patterns in Delhi"
- **Node Type Filtering**: Filter by entity type
- **Reasoning Chains**: Step-by-step LLM reasoning displayed
- **Relevance Scoring**: Results ranked by relevance
- **Reasoning Snippets**: Explanation for each result

### Graph Exploration
- **Neighbor Traversal**: Explore connected nodes (depth 1-3)
- **Similar Node Discovery**: Find nodes with similar properties
- **Relationship Visualization**: Visualize connection paths
- **Contextual Information**: Full node properties and relationships

---

## 🎮 TUI Control Panel Capabilities

### Autonomous Service Management
- **Smart Dependency Resolution**: Automatically starts dependencies
- **Health Check Waiting**: Waits for services to be healthy (60s timeout)
- **Visual Dependency Info**: Shows service dependencies in UI
- **Intelligent Orchestration**: Handles complex dependency chains

### Service Control
- **Start/Stop Individual Services**: With auto-dependency management
- **Start All Core Services**: FalkorDB, Ollama, Graphiti MCP
- **Start Processing Pipeline**: Auto-starts dependencies
- **Start Dashboard**: Auto-starts dependencies + opens browser
- **Restart Services**: Individual service restart
- **View Logs**: Real-time log viewing for all services

### System Monitoring
- **Real-time Metrics**: CPU, RAM, Disk usage (updates every 2s)
- **Service Status**: Running/stopped, health, uptime
- **Container Information**: Container IDs and status
- **Processing Progress**: Live feed from Atlas Engine

### Multi-View Interface
- **Services View**: Service management
- **Logs View**: Real-time log viewing
- **Stats View**: System resource monitoring
- **Graph View**: Knowledge graph statistics
- **Config View**: Configuration information
- **Dashboard View**: Dashboard feature overview

---

## 🚀 Advanced Capabilities

### 1. The National Cardiogram
- **Real-time visualization** of the nation's collective heartbeat
- **Daily and weekly pulses** of creation and motion
- **Instant detection** of erratic regional heartbeats
- **Health monitor** for the nation

### 2. The Ghost Farm Detector
- **Finds synthetic identity factories**: Places with massive creation, zero motion
- **Echo detection**: Tracks ghost identities used elsewhere
- **Mass production identification**: Not just single fakes, but factories

### 3. The Sleeper Cell Alarm
- **Dormant identity detection**: Identities with no activity for years
- **Coordinated reactivation**: Sudden synchronized biometric updates
- **Network awakening signals**: High-confidence threat detection
- **Silence before the storm**: Finds absence of activity before coordinated return

### 4. The Economic Shadow Mapper
- **Informal economy detection**: High motion without corresponding economic data
- **Demographic dynamism proxy**: Uses population churn as economic indicator
- **Unreported economy visibility**: Sees economy that isn't being reported

### 5. The Social Fault Line Detector
- **Demographic change gradients**: Measures rate of change in community character
- **Social friction forecasting**: Predicts social instability
- **Pressure mapping**: Identifies tension between demographic archetypes
- **Gradient analysis**: More than counting, measures change rates

### 6. The Oracle Engine
- **Predictive system**: Uses PRECEDES relationships between patterns
- **Causal inference**: Learns which patterns lead to others
- **Proactive planning**: Forecasts future events (e.g., 3-month leading indicators)
- **Causal engine**: Not just statistics, but learned system behavior

---

## 📡 API Capabilities

### REST API Endpoints (FastAPI Backend)

**Graph Endpoints:**
- `/api/graph/nodes` - Get nodes with filtering
- `/api/graph/edges` - Get edges with filtering
- `/api/graph/neighbors/{node_id}` - Get neighbors (depth 1-3)
- `/api/graph/stats` - Graph statistics

**Data Endpoints:**
- `/api/anomalies` - Anomaly data with filtering
- `/api/clusters` - Cluster data
- `/api/patterns` - Pattern data
- `/api/threats` - Threat data
- `/api/data/geographic` - Geographic data

**Semantic Search:**
- `/api/search` - Natural language search
- `/api/search/similar/{node_id}` - Find similar nodes

**H3 Geospatial:**
- `/api/h3/aggregate` - Aggregate by H3 hexagons
- `/api/h3/resolution` - Get resolution info
- `/api/h3/hexagons` - Get hexagon data

---

## 🔧 Technical Capabilities

### Processing Pipeline
- **7-Stage Pipeline**: From raw CSV to knowledge graph
- **Checkpoint/Resume**: Save and resume from any stage
- **Batch Processing**: Configurable batch sizes
- **Error Handling**: Robust error handling and logging
- **Progress Tracking**: Real-time progress updates

### Data Management
- **Read-only Data Mounts**: Prevents accidental data modification
- **Persistent Volumes**: Data persists across container restarts
- **Processed Data Storage**: Organized output in `/app/processed`
- **Logging**: Comprehensive logging to files

### Docker Orchestration
- **Health Checks**: All services have health checks
- **Dependency Management**: Docker Compose handles dependencies
- **Profiles**: On-demand service execution (processing, dashboard)
- **Network Isolation**: Services communicate via Docker network
- **Volume Persistence**: Data persists in Docker volumes

---

## 🎯 Use Cases Enabled

1. **Identity Fraud Detection**: Find synthetic identity factories
2. **Human Trafficking Detection**: Identify child-focused suspicious patterns
3. **Sleeper Cell Detection**: Find dormant networks reactivating
4. **Economic Intelligence**: Map informal/illicit economies
5. **Social Stability Monitoring**: Forecast social friction
6. **Predictive Analytics**: Forecast future events using pattern precedence
7. **Geographic Intelligence**: Understand character of places
8. **Pattern Discovery**: Find recurring behavioral patterns
9. **Anomaly Investigation**: Investigate systemic tensions
10. **Threat Assessment**: Assess and prioritize emergent threats

---

## 📈 Performance Characteristics

- **Data Processing**: Handles ~4.9M records across 3 datasets
- **Geographic Coverage**: 36 states, 700+ districts, 5000+ pincodes
- **Temporal Coverage**: ~30 days of daily data
- **Graph Scale**: Supports millions of nodes and edges
- **Real-time Updates**: Dashboard updates in real-time
- **3D Rendering**: High-performance WebGL rendering (60fps)
- **API Response**: FastAPI async endpoints (< 100ms typical)

---

## 🔐 Security & Privacy

- **Local Processing**: All processing happens locally (no cloud)
- **Docker Isolation**: Services isolated in containers
- **Read-only Data**: Source data mounted read-only
- **No External Dependencies**: LLM runs locally via Ollama
- **Graph Database**: FalkorDB runs locally
- **Network Isolation**: Services communicate via Docker network

---

## 🎓 Learning & Adaptation

- **Pattern Learning**: Discovers new patterns over time
- **Confidence Scoring**: Statistical confidence for all detections
- **Analyst Feedback**: Supports analyst notes and review flags
- **False Positive Tracking**: Status tracking for resolved threats
- **Continuous Improvement**: System learns from analyst feedback

---

## 🚀 Future Capabilities (Architecture Ready)

- **Real-time Streaming**: Process streaming data
- **Multi-model LLM Support**: Support multiple LLM providers
- **Advanced ML Models**: Custom ML models for threat detection
- **Collaborative Analysis**: Multi-user collaboration features
- **Export Capabilities**: Export graphs, reports, visualizations
- **API Extensions**: Custom API endpoints for specific use cases

---

**This is a complete, production-ready intelligence platform capable of transforming raw data into actionable insights through advanced knowledge graph construction, pattern detection, and threat inference.**
