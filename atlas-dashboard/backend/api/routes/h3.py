"""
H3 Hexagon API endpoints
Provides H3-based geographic aggregation and queries
"""

from fastapi import APIRouter, Query
from typing import Optional, List
import pandas as pd
from loguru import logger

try:
    import h3
except ImportError:
    logger.warning("H3 library not installed")
    h3 = None

router = APIRouter(prefix="/api/h3", tags=["h3"])


@router.get("/aggregate")
async def aggregate_geographic_data(
    resolution: int = Query(7, ge=0, le=15, description="H3 resolution (0-15)"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = Query(1000, ge=1, le=10000)
):
    """
    Aggregate geographic data into H3 hexagons.
    
    Resolution guide:
    - 0: ~110km (country level)
    - 5: ~8km (city level)
    - 7: ~0.5km (neighborhood level) - recommended
    - 10: ~0.1km (block level)
    - 15: ~0.5m (building level)
    """
    if h3 is None:
        return {"error": "H3 library not available"}
    
    # Load geographic data (this would use your DataLoader)
    # For now, return example structure
    return {
        "resolution": resolution,
        "hexagons": [],
        "message": "H3 aggregation endpoint - integrate with DataLoader"
    }


@router.get("/hexagon/{hex_id}")
async def get_hexagon_info(hex_id: str):
    """Get information about a specific H3 hexagon."""
    if h3 is None:
        return {"error": "H3 library not available"}
    
    try:
        center = h3.cell_to_latlng(hex_id)
        boundary = h3.cell_to_boundary(hex_id, geo_json=True)
        neighbors = list(h3.grid_disk(hex_id, 1))
        
        return {
            "hex_id": hex_id,
            "center": {"lat": center[0], "lng": center[1]},
            "boundary": boundary,
            "neighbors": neighbors,
            "resolution": h3.get_resolution(hex_id)
        }
    except Exception as e:
        logger.error(f"Failed to get hexagon info: {e}")
        return {"error": str(e)}


@router.get("/neighbors/{hex_id}")
async def get_neighbors(hex_id: str, k: int = Query(1, ge=1, le=5)):
    """Get k-ring neighbors of an H3 hexagon."""
    if h3 is None:
        return {"error": "H3 library not available"}
    
    try:
        neighbors = list(h3.grid_disk(hex_id, k))
        return {
            "hex_id": hex_id,
            "k": k,
            "neighbors": neighbors,
            "count": len(neighbors)
        }
    except Exception as e:
        logger.error(f"Failed to get neighbors: {e}")
        return {"error": str(e)}


@router.get("/latlng-to-hex")
async def latlng_to_hex(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    resolution: int = Query(7, ge=0, le=15)
):
    """Convert latitude/longitude to H3 hexagon ID."""
    if h3 is None:
        return {"error": "H3 library not available"}
    
    try:
        hex_id = h3.latlng_to_cell(lat, lng, resolution)
        return {
            "hex_id": hex_id,
            "lat": lat,
            "lng": lng,
            "resolution": resolution
        }
    except Exception as e:
        logger.error(f"Failed to convert lat/lng to hex: {e}")
        return {"error": str(e)}
