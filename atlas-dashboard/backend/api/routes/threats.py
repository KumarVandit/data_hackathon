"""
Threats API endpoints
Provides access to detected emergent threats (EmergentThreat entities)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from loguru import logger
from services.data_loader import DataLoader
from pathlib import Path
import os

router = APIRouter(prefix="/api/threats", tags=["threats"])

# Initialize data loader
PROCESSED_PATH = Path(os.getenv("PROCESSED_PATH", "/app/processed"))
data_loader = DataLoader(PROCESSED_PATH)


@router.get("")
async def get_threats(
    limit: int = Query(50, ge=1, le=1000),
    threat_type: Optional[str] = Query(None, description="Filter by threat type"),
    severity_min: Optional[int] = Query(None, ge=1, le=5, description="Minimum severity level (1-5)"),
    severity_max: Optional[int] = Query(None, ge=1, le=5, description="Maximum severity level (1-5)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    min_confidence: Optional[float] = Query(None, ge=0, le=1, description="Minimum confidence score"),
):
    """
    Get list of threats (EmergentThreats) with filtering.
    
    Filters:
    - threat_type: Type of threat (IDENTITY_FRAUD_RING, etc.)
    - severity_min/max: Severity range (1-5)
    - status: Threat status (ACTIVE, MONITORING, RESOLVED, FALSE_POSITIVE)
    - min_confidence: Minimum confidence score (0-1)
    """
    try:
        result = data_loader.load_threats(
            limit=limit,
            threat_type=threat_type,
            severity_min=severity_min,
            severity_max=severity_max,
            status=status,
            min_confidence=min_confidence,
        )
        return result
    except Exception as e:
        logger.error(f"Failed to load threats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{threat_id}")
async def get_threat(threat_id: str):
    """Get details of a specific threat by ID."""
    try:
        # Load all threats and find the one with matching ID
        result = data_loader.load_threats(limit=10000)
        threats = result.get("threats", [])
        
        threat = next((t for t in threats if t.get("id") == threat_id), None)
        
        if not threat:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        return threat
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load threat {threat_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_threat_stats():
    """Get summary statistics about threats."""
    try:
        result = data_loader.load_threats(limit=10000)
        threats = result.get("threats", [])
        
        if not threats:
            return {
                "total_threats": 0,
                "by_type": {},
                "by_status": {},
                "avg_severity": 0,
                "avg_confidence": 0,
                "most_severe": {"id": "", "severity_level": 0, "threat_type": ""},
            }
        
        # Count by type and status
        by_type: Dict[str, int] = {}
        by_status: Dict[str, int] = {}
        total_severity = 0
        total_confidence = 0
        most_severe = {"id": "", "severity_level": 0, "threat_type": ""}
        
        for threat in threats:
            # Type
            threat_type = threat.get("threat_type", "UNKNOWN")
            by_type[threat_type] = by_type.get(threat_type, 0) + 1
            
            # Status
            status = threat.get("status", "UNKNOWN")
            by_status[status] = by_status.get(status, 0) + 1
            
            # Severity
            severity = threat.get("severity_level", 0)
            total_severity += severity
            
            # Confidence
            confidence = threat.get("confidence", 0)
            total_confidence += confidence
            
            # Most severe
            if severity > most_severe["severity_level"]:
                most_severe = {
                    "id": threat.get("id", ""),
                    "severity_level": severity,
                    "threat_type": threat_type,
                }
        
        avg_severity = total_severity / len(threats) if threats else 0
        avg_confidence = total_confidence / len(threats) if threats else 0
        
        return {
            "total_threats": len(threats),
            "by_type": by_type,
            "by_status": by_status,
            "avg_severity": avg_severity,
            "avg_confidence": avg_confidence,
            "most_severe": most_severe,
        }
    except Exception as e:
        logger.error(f"Failed to get threat stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
