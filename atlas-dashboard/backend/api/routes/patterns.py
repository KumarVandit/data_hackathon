"""
Patterns API endpoints
Provides access to detected behavioral patterns (BehavioralSignatures)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from loguru import logger
from services.data_loader import DataLoader
from pathlib import Path
import os

router = APIRouter(prefix="/api/patterns", tags=["patterns"])

# Initialize data loader
PROCESSED_PATH = Path(os.getenv("PROCESSED_PATH", "/app/processed"))
data_loader = DataLoader(PROCESSED_PATH)


@router.get("")
async def get_patterns(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    signature_type: Optional[str] = Query(None, description="Filter by signature type"),
    min_confidence: Optional[float] = Query(None, ge=0, le=1, description="Minimum confidence score"),
    min_occurrences: Optional[int] = Query(None, ge=1, description="Minimum occurrence count"),
):
    """
    Get list of patterns (BehavioralSignatures) with filtering and pagination.
    
    Filters:
    - signature_type: Type of pattern (TEMPORAL_SPIKE, COORDINATED_UPDATE, etc.)
    - min_confidence: Minimum confidence score (0-1)
    - min_occurrences: Minimum number of occurrences
    """
    try:
        result = data_loader.load_patterns(
            offset=offset,
            limit=limit,
            signature_type=signature_type,
            min_confidence=min_confidence,
            min_occurrences=min_occurrences,
        )
        return result
    except Exception as e:
        logger.error(f"Failed to load patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pattern_id}")
async def get_pattern(pattern_id: str):
    """Get details of a specific pattern by ID."""
    try:
        # Load all patterns and find the one with matching ID
        result = data_loader.load_patterns(offset=0, limit=10000)
        patterns = result.get("patterns", [])
        
        pattern = next((p for p in patterns if p.get("id") == pattern_id), None)
        
        if not pattern:
            raise HTTPException(status_code=404, detail="Pattern not found")
        
        return pattern
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load pattern {pattern_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_pattern_stats():
    """Get summary statistics about patterns."""
    try:
        result = data_loader.load_patterns(offset=0, limit=10000)
        patterns = result.get("patterns", [])
        
        if not patterns:
            return {
                "total_patterns": 0,
                "by_type": {},
                "avg_confidence": 0,
                "most_frequent": {"id": "", "occurrence_count": 0, "signature_type": ""},
            }
        
        # Count by type
        by_type: Dict[str, int] = {}
        total_confidence = 0
        most_frequent = {"id": "", "occurrence_count": 0, "signature_type": ""}
        
        for pattern in patterns:
            # Type
            signature_type = pattern.get("signature_type", "UNKNOWN")
            by_type[signature_type] = by_type.get(signature_type, 0) + 1
            
            # Confidence
            confidence = pattern.get("confidence_score", 0)
            total_confidence += confidence
            
            # Most frequent
            occurrences = pattern.get("occurrence_count", 0)
            if occurrences > most_frequent["occurrence_count"]:
                most_frequent = {
                    "id": pattern.get("id", ""),
                    "occurrence_count": occurrences,
                    "signature_type": signature_type,
                }
        
        avg_confidence = total_confidence / len(patterns) if patterns else 0
        
        return {
            "total_patterns": len(patterns),
            "by_type": by_type,
            "avg_confidence": avg_confidence,
            "most_frequent": most_frequent,
        }
    except Exception as e:
        logger.error(f"Failed to get pattern stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
