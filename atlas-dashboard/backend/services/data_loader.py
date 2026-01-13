"""
Data Loader Service
Loads processed data from parquet and JSON files
"""

import json
from pathlib import Path
from typing import List, Optional, Dict, Any
import pandas as pd
from loguru import logger


class DataLoader:
    """Service for loading processed data files"""
    
    def __init__(self, processed_path: Path):
        self.processed_path = Path(processed_path)
        self.processed_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"DataLoader initialized: {processed_path}")
    
    def load_anomalies(
        self,
        limit: int = 100,
        offset: int = 0,
        severity_min: Optional[float] = None,
        severity_max: Optional[float] = None,
        tension_type: Optional[str] = None,
        is_reviewed: Optional[bool] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Load anomalies from JSON file with filtering.
        
        Returns anomalies with location information enriched from geographic data.
        """
        try:
            anomalies_file = self.processed_path / "anomalies.json"
            if not anomalies_file.exists():
                return {"anomalies": [], "total": 0, "offset": offset, "limit": limit}
            
            with open(anomalies_file, 'r') as f:
                anomalies = json.load(f)
            
            # Apply filters
            filtered = anomalies
            if tension_type:
                filtered = [a for a in filtered if a.get("tension_type") == tension_type]
            if severity_min is not None:
                filtered = [a for a in filtered if a.get("severity", 0) >= severity_min]
            if severity_max is not None:
                filtered = [a for a in filtered if a.get("severity", 0) <= severity_max]
            if is_reviewed is not None:
                filtered = [a for a in filtered if a.get("is_reviewed", False) == is_reviewed]
            
            # Enrich with location data
            geo_file = self.processed_path / "geographic_data.parquet"
            location_map = {}
            if geo_file.exists():
                try:
                    geo_df = pd.read_parquet(geo_file)
                    # Create a map of location_id to location info
                    for _, row in geo_df.iterrows():
                        loc_id = f"PINCODE_{row.get('pincode', '')}"
                        location_map[loc_id] = {
                            "location_name": f"{row.get('district', '')}, {row.get('state', '')}",
                            "state": row.get("state"),
                            "district": row.get("district"),
                            "pincode": str(row.get("pincode", "")),
                        }
                except Exception as e:
                    logger.warning(f"Failed to load location data: {e}")
            
            # Enrich anomalies with location info
            for anomaly in filtered:
                location_id = anomaly.get("location_id", "")
                if location_id in location_map:
                    anomaly.update(location_map[location_id])
            
            # Apply geographic filters after enrichment
            if state:
                filtered = [a for a in filtered if a.get("state") == state]
            if district:
                filtered = [a for a in filtered if a.get("district") == district]
            
            total = len(filtered)
            
            # Paginate
            paginated = filtered[offset:offset + limit]
            
            return {
                "anomalies": paginated,
                "total": total,
                "offset": offset,
                "limit": limit
            }
        except Exception as e:
            logger.error(f"Failed to load anomalies: {e}")
            return {"anomalies": [], "total": 0, "offset": offset, "limit": limit}
    
    def load_patterns(
        self,
        limit: int = 100,
        offset: int = 0,
        signature_type: Optional[str] = None,
        min_confidence: Optional[float] = None,
        min_occurrences: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Load patterns (BehavioralSignatures) from JSON file with filtering.
        """
        try:
            patterns_file = self.processed_path / "patterns.json"
            if not patterns_file.exists():
                return {"patterns": [], "total": 0, "offset": offset, "limit": limit}
            
            with open(patterns_file, 'r') as f:
                patterns = json.load(f)
            
            # Apply filters
            filtered = patterns
            if signature_type:
                filtered = [p for p in filtered if p.get("signature_type") == signature_type]
            if min_confidence is not None:
                filtered = [p for p in filtered if p.get("confidence_score", 0) >= min_confidence]
            if min_occurrences is not None:
                filtered = [p for p in filtered if p.get("occurrence_count", 0) >= min_occurrences]
            
            total = len(filtered)
            
            # Paginate
            paginated = filtered[offset:offset + limit]
            
            return {
                "patterns": paginated,
                "total": total,
                "offset": offset,
                "limit": limit
            }
        except Exception as e:
            logger.error(f"Failed to load patterns: {e}")
            return {"patterns": [], "total": 0, "offset": offset, "limit": limit}
    
    def load_geographic_data(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        pincode: Optional[str] = None,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """Load geographic data from parquet file"""
        try:
            geo_file = self.processed_path / "geographic_data.parquet"
            if not geo_file.exists():
                return {"data": [], "total": 0}
            
            df = pd.read_parquet(geo_file)
            
            # Apply filters
            if state:
                df = df[df['state'] == state]
            if district:
                df = df[df['district'] == district]
            if pincode:
                df = df[df['pincode'].astype(str) == str(pincode)]
            
            # Limit results
            df = df.head(limit)
            
            # Convert to dict
            data = df.to_dict(orient='records')
            
            return {
                "data": data,
                "total": len(data)
            }
        except Exception as e:
            logger.error(f"Failed to load geographic data: {e}")
            return {"data": [], "total": 0}
    
    def load_threats(
        self,
        limit: int = 50,
        severity_min: Optional[int] = None,
        severity_max: Optional[int] = None,
        threat_type: Optional[str] = None,
        status: Optional[str] = None,
        min_confidence: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Load emergent threats from JSON file with filtering.
        """
        try:
            threats_file = self.processed_path / "threats.json"
            if not threats_file.exists():
                return {"threats": [], "total": 0}
            
            with open(threats_file, 'r') as f:
                threats = json.load(f)
            
            # Apply filters
            filtered = threats
            if threat_type:
                filtered = [t for t in filtered if t.get("threat_type") == threat_type]
            if severity_min is not None:
                filtered = [t for t in filtered if t.get("severity_level", 0) >= severity_min]
            if severity_max is not None:
                filtered = [t for t in filtered if t.get("severity_level", 0) <= severity_max]
            if status:
                filtered = [t for t in filtered if t.get("status") == status]
            if min_confidence is not None:
                filtered = [t for t in filtered if t.get("confidence", 0) >= min_confidence]
            
            # Sort by severity (highest first)
            filtered = sorted(filtered, key=lambda x: x.get('severity_level', 0), reverse=True)
            
            limited = filtered[:limit]
            
            return {
                "threats": limited,
                "total": len(filtered)
            }
        except Exception as e:
            logger.error(f"Failed to load threats: {e}")
            return {"threats": [], "total": 0}
    
    def load_lifecycles(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Load identity lifecycles from JSON file"""
        try:
            lifecycles_file = self.processed_path / "lifecycles.json"
            if not lifecycles_file.exists():
                return {"lifecycles": [], "total": 0, "offset": offset, "limit": limit}
            
            with open(lifecycles_file, 'r') as f:
                lifecycles = json.load(f)
            
            total = len(lifecycles)
            paginated = lifecycles[offset:offset + limit]
            
            return {
                "lifecycles": paginated,
                "total": total,
                "offset": offset,
                "limit": limit
            }
        except Exception as e:
            logger.error(f"Failed to load lifecycles: {e}")
            return {"lifecycles": [], "total": 0, "offset": offset, "limit": limit}
    
    def load_clusters(
        self,
        offset: int = 0,
        limit: int = 50,
        cluster_type: Optional[str] = None,
        min_size: Optional[int] = None,
        max_size: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Load clusters from JSON file with filtering.
        
        Clusters can be from DBSCAN, geographic similarity (ECHOES), or pattern clustering.
        """
        try:
            clusters_file = self.processed_path / "clusters.json"
            if not clusters_file.exists():
                # Try to generate clusters from anomalies if clusters file doesn't exist
                # This is a fallback - in production, clusters should be generated by atlas-engine
                return self._generate_clusters_from_anomalies(offset, limit, cluster_type, min_size, max_size)
            
            with open(clusters_file, 'r') as f:
                clusters = json.load(f)
            
            # Apply filters
            filtered = clusters
            if cluster_type:
                filtered = [c for c in filtered if c.get("cluster_type") == cluster_type]
            if min_size is not None:
                filtered = [c for c in filtered if c.get("size", 0) >= min_size]
            if max_size is not None:
                filtered = [c for c in filtered if c.get("size", 0) <= max_size]
            
            total = len(filtered)
            
            # Paginate
            paginated = filtered[offset:offset + limit]
            
            return {
                "clusters": paginated,
                "total": total,
                "offset": offset,
                "limit": limit
            }
        except Exception as e:
            logger.error(f"Failed to load clusters: {e}")
            return {"clusters": [], "total": 0, "offset": offset, "limit": limit}
    
    def _generate_clusters_from_anomalies(
        self,
        offset: int,
        limit: int,
        cluster_type: Optional[str],
        min_size: Optional[int],
        max_size: Optional[int],
    ) -> Dict[str, Any]:
        """
        Fallback: Generate clusters from anomalies by grouping similar anomalies.
        This is a simple implementation - in production, clusters should come from atlas-engine.
        """
        try:
            anomalies_file = self.processed_path / "anomalies.json"
            if not anomalies_file.exists():
                return {"clusters": [], "total": 0, "offset": offset, "limit": limit}
            
            with open(anomalies_file, 'r') as f:
                anomalies = json.load(f)
            
            # Simple clustering: group by tension_type and location proximity
            clusters_map: Dict[str, Dict[str, Any]] = {}
            
            for anomaly in anomalies:
                tension_type = anomaly.get("tension_type", "UNKNOWN")
                location_id = anomaly.get("location_id", "")
                
                # Create cluster key
                cluster_key = f"{tension_type}_{location_id[:10]}"  # Use first 10 chars of location
                
                if cluster_key not in clusters_map:
                    clusters_map[cluster_key] = {
                        "id": f"cluster_{len(clusters_map)}",
                        "cluster_id": len(clusters_map),
                        "cluster_type": "anomaly",
                        "name": f"{tension_type.replace('_', ' ')} Cluster",
                        "description": f"Cluster of {tension_type.replace('_', ' ').lower()} anomalies",
                        "size": 0,
                        "members": [],
                        "properties": {
                            "common_tension_types": [tension_type],
                            "avg_severity": 0,
                            "avg_anomaly_score": 0,
                        },
                    }
                
                cluster = clusters_map[cluster_key]
                cluster["size"] += 1
                cluster["members"].append(anomaly.get("id", ""))
                
                # Update averages
                severity = anomaly.get("severity", 0)
                anomaly_score = anomaly.get("z_score", 0)  # Use z_score as proxy
                cluster["properties"]["avg_severity"] = (
                    (cluster["properties"]["avg_severity"] * (cluster["size"] - 1) + severity) / cluster["size"]
                )
                cluster["properties"]["avg_anomaly_score"] = (
                    (cluster["properties"]["avg_anomaly_score"] * (cluster["size"] - 1) + anomaly_score) / cluster["size"]
                )
            
            clusters = list(clusters_map.values())
            
            # Apply filters
            filtered = clusters
            if cluster_type:
                filtered = [c for c in filtered if c.get("cluster_type") == cluster_type]
            if min_size is not None:
                filtered = [c for c in filtered if c.get("size", 0) >= min_size]
            if max_size is not None:
                filtered = [c for c in filtered if c.get("size", 0) <= max_size]
            
            total = len(filtered)
            paginated = filtered[offset:offset + limit]
            
            return {
                "clusters": paginated,
                "total": total,
                "offset": offset,
                "limit": limit
            }
        except Exception as e:
            logger.warning(f"Failed to generate clusters from anomalies: {e}")
            return {"clusters": [], "total": 0, "offset": offset, "limit": limit}
