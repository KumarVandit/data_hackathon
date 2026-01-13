"""
H3 Hexagonal Aggregation for Geographic Data
Uses Uber's H3 library for efficient spatial indexing and aggregation
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from loguru import logger

try:
    import h3
except ImportError:
    logger.warning("H3 library not installed. Install with: pip install h3")
    h3 = None


class H3Aggregator:
    """
    Aggregates geographic data using H3 hexagonal grid system.
    
    Benefits:
    - Uniform hexagon sizes (better than irregular polygons)
    - Hierarchical resolutions (0-15, where 0 is coarsest)
    - Fast spatial queries and aggregations
    - Perfect for heatmaps and pattern detection
    """
    
    def __init__(self, resolution: int = 7):
        """
        Initialize H3 aggregator.
        
        Args:
            resolution: H3 resolution (0-15)
                - 0: ~110km hexagons (country level)
                - 5: ~8km hexagons (city level)
                - 7: ~0.5km hexagons (neighborhood level)
                - 10: ~0.1km hexagons (block level)
                - 15: ~0.5m hexagons (building level)
        """
        if h3 is None:
            raise ImportError("H3 library required. Install with: pip install h3")
        
        self.resolution = resolution
        logger.info(f"H3 Aggregator initialized with resolution {resolution}")
    
    def aggregate_geographic_data(
        self,
        df: pd.DataFrame,
        lat_col: str = 'latitude',
        lng_col: str = 'longitude',
        agg_columns: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Aggregate geographic data into H3 hexagons.
        
        Args:
            df: DataFrame with geographic data
            lat_col: Column name for latitude
            lng_col: Column name for longitude
            agg_columns: Columns to aggregate (default: all numeric columns)
        
        Returns:
            DataFrame with H3 hexagon IDs and aggregated values
        """
        if h3 is None:
            logger.error("H3 library not available")
            return df
        
        # Create H3 hexagon IDs
        df['h3_index'] = df.apply(
            lambda row: h3.latlng_to_cell(
                row[lat_col],
                row[lng_col],
                self.resolution
            ) if pd.notna(row[lat_col]) and pd.notna(row[lng_col]) else None,
            axis=1
        )
        
        # Filter out rows without valid H3 index
        df_valid = df[df['h3_index'].notna()].copy()
        
        if len(df_valid) == 0:
            logger.warning("No valid geographic coordinates found")
            return pd.DataFrame()
        
        # Determine columns to aggregate
        if agg_columns is None:
            numeric_cols = df_valid.select_dtypes(include=[np.number]).columns.tolist()
            agg_columns = [col for col in numeric_cols if col not in ['h3_index']]
        
        # Aggregate by H3 hexagon
        agg_dict = {}
        for col in agg_columns:
            if col in df_valid.columns:
                agg_dict[col] = ['sum', 'mean', 'max', 'count']
        
        if not agg_dict:
            # If no numeric columns, just count
            agg_dict = {'h3_index': 'count'}
        
        grouped = df_valid.groupby('h3_index').agg(agg_dict)
        
        # Flatten column names
        grouped.columns = ['_'.join(col).strip() if isinstance(col, tuple) else col 
                          for col in grouped.columns.values]
        
        # Add H3 hexagon center coordinates
        grouped['hex_lat'] = grouped.index.map(lambda h: h3.cell_to_latlng(h)[0])
        grouped['hex_lng'] = grouped.index.map(lambda h: h3.cell_to_latlng(h)[1])
        
        # Add hexagon boundary for visualization
        grouped['hex_boundary'] = grouped.index.map(
            lambda h: h3.cell_to_boundary(h, geo_json=True)
        )
        
        logger.info(f"Aggregated {len(df_valid)} points into {len(grouped)} H3 hexagons")
        
        return grouped.reset_index()
    
    def get_hexagon_neighbors(self, hex_id: str) -> List[str]:
        """Get neighboring hexagons for a given H3 index."""
        if h3 is None:
            return []
        try:
            return list(h3.grid_disk(hex_id, 1))
        except Exception as e:
            logger.warning(f"Failed to get neighbors for {hex_id}: {e}")
            return []
    
    def get_hexagons_in_radius(
        self,
        lat: float,
        lng: float,
        radius_km: float
    ) -> List[str]:
        """Get all H3 hexagons within a radius (in km) of a point."""
        if h3 is None:
            return []
        try:
            center_hex = h3.latlng_to_cell(lat, lng, self.resolution)
            # Approximate radius in hexagon steps
            # Each hexagon at resolution 7 is ~0.5km
            steps = int(radius_km / 0.5) + 1
            return list(h3.grid_disk(center_hex, steps))
        except Exception as e:
            logger.warning(f"Failed to get hexagons in radius: {e}")
            return []


def aggregate_with_h3(
    df: pd.DataFrame,
    resolution: int = 7,
    lat_col: str = 'latitude',
    lng_col: str = 'longitude'
) -> pd.DataFrame:
    """
    Convenience function to aggregate data with H3.
    
    Args:
        df: DataFrame with geographic data
        resolution: H3 resolution (0-15)
        lat_col: Latitude column name
        lng_col: Longitude column name
    
    Returns:
        Aggregated DataFrame with H3 hexagons
    """
    aggregator = H3Aggregator(resolution=resolution)
    return aggregator.aggregate_geographic_data(df, lat_col, lng_col)
