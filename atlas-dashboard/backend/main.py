#!/usr/bin/env python3
"""
Atlas Dashboard Backend API
FastAPI server for serving graph data and processed data
"""

import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import json
import redis
from loguru import logger

from services.falkordb import FalkorDBClient
from services.data_loader import DataLoader
from api.routes.h3 import router as h3_router
from api.routes import anomalies as anomalies_router
from api.routes import clusters as clusters_router
from api.routes import patterns as patterns_router
from api.routes import threats as threats_router
from api.routes import semantic as semantic_router

# Load environment variables
PROCESSED_PATH = Path(os.getenv("PROCESSED_PATH", "/app/processed"))
FALKORDB_HOST = os.getenv("FALKORDB_HOST", "falkordb")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", 6379))
FALKORDB_PASSWORD = os.getenv("FALKORDB_PASSWORD", "falkordb")

app = FastAPI(
    title="Atlas Dashboard API",
    description="API for Project Atlas Knowledge Graph Dashboard",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
falkordb_client = FalkorDBClient(FALKORDB_HOST, FALKORDB_PORT, FALKORDB_PASSWORD)
data_loader = DataLoader(PROCESSED_PATH)

# Include routers
app.include_router(h3_router.router)
app.include_router(anomalies_router.router)
app.include_router(clusters_router.router)
app.include_router(patterns_router.router)
app.include_router(threats_router.router)
app.include_router(semantic_router.router)

# Pydantic models
class NodeResponse(BaseModel):
    id: str
    type: str
    properties: Dict[str, Any]
    
class EdgeResponse(BaseModel):
    id: str
    source: str
    target: str
    type: str
    properties: Dict[str, Any]

class GraphResponse(BaseModel):
    nodes: List[NodeResponse]
    edges: List[EdgeResponse]
    stats: Dict[str, Any]

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "atlas-dashboard-api"}

# Graph endpoints
@app.get("/api/graph/nodes", response_model=List[NodeResponse])
async def get_nodes(
    node_type: Optional[str] = Query(None, description="Filter by node type"),
    limit: int = Query(1000, ge=1, le=10000, description="Max number of nodes"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Get graph nodes with optional filtering"""
    try:
        nodes = await falkordb_client.get_nodes(node_type=node_type, limit=limit, offset=offset)
        return nodes
    except Exception as e:
        logger.error(f"Failed to get nodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph/edges", response_model=List[EdgeResponse])
async def get_edges(
    edge_type: Optional[str] = Query(None, description="Filter by edge type"),
    source: Optional[str] = Query(None, description="Filter by source node ID"),
    target: Optional[str] = Query(None, description="Filter by target node ID"),
    limit: int = Query(5000, ge=1, le=50000, description="Max number of edges")
):
    """Get graph edges with optional filtering"""
    try:
        edges = await falkordb_client.get_edges(
            edge_type=edge_type,
            source=source,
            target=target,
            limit=limit
        )
        return edges
    except Exception as e:
        logger.error(f"Failed to get edges: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph/neighbors/{node_id}")
async def get_neighbors(
    node_id: str,
    depth: int = Query(1, ge=1, le=3, description="Depth of neighbor traversal"),
    edge_types: Optional[str] = Query(None, description="Comma-separated edge types")
):
    """Get neighbors of a node"""
    try:
        neighbors = await falkordb_client.get_neighbors(
            node_id=node_id,
            depth=depth,
            edge_types=edge_types.split(",") if edge_types else None
        )
        # Ensure response format matches frontend expectations
        return {
            "node_id": neighbors.get("node_id", node_id),
            "nodes": neighbors.get("nodes", neighbors.get("neighbors", [])),
            "total": neighbors.get("total", len(neighbors.get("nodes", neighbors.get("neighbors", []))))
        }
    except Exception as e:
        logger.error(f"Failed to get neighbors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph/stats")
async def get_graph_stats():
    """Get graph statistics"""
    try:
        stats = await falkordb_client.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Processed data endpoints (legacy - kept for backward compatibility)
@app.get("/api/data/anomalies")
async def get_anomalies_legacy(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    severity_min: Optional[float] = Query(None, ge=0, le=100)
):
    """Get anomalies from processed data (legacy endpoint - use /api/anomalies instead)"""
    try:
        anomalies = data_loader.load_anomalies(limit=limit, offset=offset, severity_min=severity_min)
        return anomalies
    except Exception as e:
        logger.error(f"Failed to get anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/patterns")
async def get_patterns_legacy(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get patterns from processed data (legacy endpoint - use /api/patterns instead)"""
    try:
        patterns = data_loader.load_patterns(limit=limit, offset=offset)
        return patterns
    except Exception as e:
        logger.error(f"Failed to get patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/geographic")
async def get_geographic_data(
    state: Optional[str] = None,
    district: Optional[str] = None,
    pincode: Optional[str] = None,
    limit: int = Query(1000, ge=1, le=10000)
):
    """Get geographic data with optional filtering"""
    try:
        data = data_loader.load_geographic_data(
            state=state,
            district=district,
            pincode=pincode,
            limit=limit
        )
        return data
    except Exception as e:
        logger.error(f"Failed to get geographic data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/threats")
async def get_threats_legacy(
    limit: int = Query(50, ge=1, le=500),
    severity_min: Optional[int] = Query(None, ge=1, le=5)
):
    """Get emergent threats (legacy endpoint - use /api/threats instead)"""
    try:
        threats = data_loader.load_threats(limit=limit, severity_min=severity_min)
        return threats
    except Exception as e:
        logger.error(f"Failed to get threats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Note: Semantic search is now handled by semantic_router at /api/search
# The router is included above, so this endpoint is handled there

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
