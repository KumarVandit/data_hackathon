"""
Anomalies API endpoints
Provides access to detected anomalies (SystemicTensions)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from loguru import logger
from services.data_loader import DataLoader
from pathlib import Path
import os

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

# Initialize data loader
PROCESSED_PATH = Path(os.getenv("PROCESSED_PATH", "/app/processed"))
data_loader = DataLoader(PROCESSED_PATH)


@router.get("")
async def get_anomalies(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tension_type: Optional[str] = None,
    severity_min: Optional[int] = Query(None, ge=0, le=100),
    severity_max: Optional[int] = Query(None, ge=0, le=100),
    is_reviewed: Optional[bool] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
):
    """
    Get list of anomalies (SystemicTensions) with filtering and pagination.
    
    Filters:
    - tension_type: Type of tension (CREATION_WITHOUT_MOTION, etc.)
    - severity_min/max: Severity range (0-100)
    - is_reviewed: Filter by review status
    - state/district: Geographic filters
    """
    try:
        result = data_loader.load_anomalies(
            offset=offset,
            limit=limit,
            tension_type=tension_type,
            severity_min=severity_min,
            severity_max=severity_max,
            is_reviewed=is_reviewed,
            state=state,
            district=district,
        )
        return result
    except Exception as e:
        logger.error(f"Failed to load anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{anomaly_id}")
async def get_anomaly(anomaly_id: str):
    """Get details of a specific anomaly by ID."""
    try:
        # Load all anomalies and find the one with matching ID
        result = data_loader.load_anomalies(offset=0, limit=10000)
        anomalies = result.get("anomalies", [])
        
        anomaly = next((a for a in anomalies if a.get("id") == anomaly_id), None)
        
        if not anomaly:
            raise HTTPException(status_code=404, detail="Anomaly not found")
        
        return anomaly
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load anomaly {anomaly_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_anomaly_stats():
    """Get summary statistics about anomalies."""
    try:
        result = data_loader.load_anomalies(offset=0, limit=10000)
        anomalies = result.get("anomalies", [])
        
        if not anomalies:
            return {
                "total": 0,
                "by_tension_type": {},
                "by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
                "reviewed_count": 0,
                "unreviewed_count": 0,
            }
        
        # Count by tension type
        by_tension_type: Dict[str, int] = {}
        by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        reviewed_count = 0
        unreviewed_count = 0
        
        for anomaly in anomalies:
            # Tension type
            tension_type = anomaly.get("tension_type", "UNKNOWN")
            by_tension_type[tension_type] = by_tension_type.get(tension_type, 0) + 1
            
            # Severity
            severity = anomaly.get("severity", 0)
            if severity >= 80:
                by_severity["critical"] += 1
            elif severity >= 60:
                by_severity["high"] += 1
            elif severity >= 40:
                by_severity["medium"] += 1
            else:
                by_severity["low"] += 1
            
            # Review status
            if anomaly.get("is_reviewed", False):
                reviewed_count += 1
            else:
                unreviewed_count += 1
        
        return {
            "total": len(anomalies),
            "by_tension_type": by_tension_type,
            "by_severity": by_severity,
            "reviewed_count": reviewed_count,
            "unreviewed_count": unreviewed_count,
        }
    except Exception as e:
        logger.error(f"Failed to get anomaly stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
