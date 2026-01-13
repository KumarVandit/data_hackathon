"""
Clusters API endpoints
Provides access to detected clusters (DBSCAN, geographic, pattern clusters)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from loguru import logger
from services.data_loader import DataLoader
from pathlib import Path
import os

router = APIRouter(prefix="/api/clusters", tags=["clusters"])

# Initialize data loader
PROCESSED_PATH = Path(os.getenv("PROCESSED_PATH", "/app/processed"))
data_loader = DataLoader(PROCESSED_PATH)


@router.get("")
async def get_clusters(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    cluster_type: Optional[str] = Query(None, description="Filter by cluster type"),
    min_size: Optional[int] = Query(None, ge=1, description="Minimum cluster size"),
    max_size: Optional[int] = Query(None, ge=1, description="Maximum cluster size"),
):
    """
    Get list of clusters with filtering and pagination.
    
    Filters:
    - cluster_type: Type of cluster (geographic, anomaly, pattern, threat)
    - min_size/max_size: Cluster size range
    """
    try:
        result = data_loader.load_clusters(
            offset=offset,
            limit=limit,
            cluster_type=cluster_type,
            min_size=min_size,
            max_size=max_size,
        )
        return result
    except Exception as e:
        logger.error(f"Failed to load clusters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cluster_id}")
async def get_cluster(cluster_id: str):
    """Get details of a specific cluster by ID."""
    try:
        # Load all clusters and find the one with matching ID
        result = data_loader.load_clusters(offset=0, limit=10000)
        clusters = result.get("clusters", [])
        
        cluster = next((c for c in clusters if c.get("id") == cluster_id), None)
        
        if not cluster:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        return cluster
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load cluster {cluster_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_cluster_stats():
    """Get summary statistics about clusters."""
    try:
        result = data_loader.load_clusters(offset=0, limit=10000)
        clusters = result.get("clusters", [])
        
        if not clusters:
            return {
                "total_clusters": 0,
                "by_type": {},
                "avg_cluster_size": 0,
                "largest_cluster": {"id": "", "size": 0, "type": ""},
            }
        
        # Count by type
        by_type: Dict[str, int] = {}
        total_size = 0
        largest_cluster = {"id": "", "size": 0, "type": ""}
        
        for cluster in clusters:
            # Type
            cluster_type = cluster.get("cluster_type", "unknown")
            by_type[cluster_type] = by_type.get(cluster_type, 0) + 1
            
            # Size
            size = cluster.get("size", 0)
            total_size += size
            
            # Largest
            if size > largest_cluster["size"]:
                largest_cluster = {
                    "id": cluster.get("id", ""),
                    "size": size,
                    "type": cluster_type,
                }
        
        avg_size = total_size / len(clusters) if clusters else 0
        
        return {
            "total_clusters": len(clusters),
            "by_type": by_type,
            "avg_cluster_size": avg_size,
            "largest_cluster": largest_cluster,
        }
    except Exception as e:
        logger.error(f"Failed to get cluster stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
