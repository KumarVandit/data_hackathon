#!/usr/bin/env python3
"""
Atlas Engine: Data Processing & Intelligence Pipeline
Transforms UIDAI CSV data into a living knowledge graph
"""

import os
import sys
import yaml
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
from loguru import logger
from dotenv import load_dotenv
import json
from datetime import datetime
import asyncio
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from graphiti_client import GraphitiMCPClient

# Load environment variables
load_dotenv()

# Configuration paths
# Try Docker mount first, then local development
CONFIG_DIR = Path("/app/config")
if not CONFIG_DIR.exists():
    CONFIG_DIR = Path(__file__).parent.parent / "config"

ENGINE_CONFIG = Path(__file__).parent / "config.yaml"
GRAPH_CONFIG = CONFIG_DIR / "graph" / "ontology.yaml"
FEATURE_CONFIG = CONFIG_DIR / "modules" / "feature_engineering.yaml"
ANOMALY_CONFIG = CONFIG_DIR / "modules" / "anomaly_detection.yaml"
PATTERN_CONFIG = CONFIG_DIR / "modules" / "pattern_detection.yaml"

class AtlasEngine:
    """Main engine for processing UIDAI data and building knowledge graph"""
    
    def __init__(self):
        self.load_configs()
        self.setup_logging()
        self.data_path = Path(os.getenv("DATA_PATH", "/app/data"))
        self.processed_path = Path(os.getenv("PROCESSED_PATH", "/app/processed"))
        self.processed_path.mkdir(parents=True, exist_ok=True)
        
        # Data storage
        self.daily_data = None
        self.geographic_data = None
        self.district_data = None
        self.state_data = None
        self.anomalies = []
        self.patterns = []
        self.lifecycles = []
        self.threats = []
        self.pattern_occurrences = {}  # Track pattern occurrences by date for PRECEDES
        
        # Graphiti MCP client
        self.graphiti_client = None
        self.graph_enabled = self.config.get("graph", {}).get("mcp_url") is not None
        
        logger.info("Atlas Engine initialized")
    
    def load_configs(self):
        """Load all configuration files"""
        try:
            with open(ENGINE_CONFIG, 'r') as f:
                self.config = yaml.safe_load(f)
            
            # Load module configs if they exist
            if GRAPH_CONFIG.exists():
                with open(GRAPH_CONFIG, 'r') as f:
                    self.graph_config = yaml.safe_load(f)
            else:
                self.graph_config = {}
                
            if FEATURE_CONFIG.exists():
                with open(FEATURE_CONFIG, 'r') as f:
                    self.feature_config = yaml.safe_load(f)
            else:
                self.feature_config = {}
                
            logger.info("Configuration files loaded")
        except Exception as e:
            logger.error(f"Failed to load configs: {e}")
            raise
    
    def setup_logging(self):
        """Setup logging configuration"""
        log_level = self.config.get("logging", {}).get("level", "INFO")
        log_file = self.config.get("logging", {}).get("file", "/app/processed/atlas_engine.log")
        
        logger.remove()
        logger.add(sys.stderr, level=log_level)
        logger.add(log_file, level=log_level, rotation="10 MB")
    
    def load_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Load and combine all UIDAI datasets"""
        logger.info("Loading UIDAI datasets...")
        
        # Get directory names from config
        enrolment_dir = self.config["data"].get("enrolment_dir", "api_data_aadhar_enrolment")
        demographic_dir = self.config["data"].get("demographic_dir", "api_data_aadhar_demographic")
        biometric_dir = self.config["data"].get("biometric_dir", "api_data_aadhar_biometric")
        
        enrolment_path = self.data_path / enrolment_dir
        demographic_path = self.data_path / demographic_dir
        biometric_path = self.data_path / biometric_dir
        
        # Find all CSV files in each directory
        enrolment_files = list(enrolment_path.glob("*.csv")) if enrolment_path.is_dir() else []
        demographic_files = list(demographic_path.glob("*.csv")) if demographic_path.is_dir() else []
        biometric_files = list(biometric_path.glob("*.csv")) if biometric_path.is_dir() else []
        
        logger.info(f"Found {len(enrolment_files)} enrolment files, {len(demographic_files)} demographic files, {len(biometric_files)} biometric files")
        
        # Load and combine enrolment data
        enrolment_dfs = []
        for file in enrolment_files[:3]:  # Limit to first 3 files for initial testing
            try:
                df = pd.read_csv(file)
                enrolment_dfs.append(df)
                logger.info(f"Loaded {file.name}: {len(df)} rows")
            except Exception as e:
                logger.warning(f"Failed to load {file.name}: {e}")
        
        if not enrolment_dfs:
            raise ValueError("No enrolment data files found")
        
        enrolment_df = pd.concat(enrolment_dfs, ignore_index=True)
        
        # Load demographic data
        demographic_dfs = []
        for file in demographic_files[:3]:
            try:
                df = pd.read_csv(file)
                demographic_dfs.append(df)
            except Exception as e:
                logger.warning(f"Failed to load {file.name}: {e}")
        
        if demographic_dfs:
            demographic_df = pd.concat(demographic_dfs, ignore_index=True)
        else:
            demographic_df = pd.DataFrame()
        
        # Load biometric data
        biometric_dfs = []
        for file in biometric_files[:3]:
            try:
                df = pd.read_csv(file)
                biometric_dfs.append(df)
            except Exception as e:
                logger.warning(f"Failed to load {file.name}: {e}")
        
        if biometric_dfs:
            biometric_df = pd.concat(biometric_dfs, ignore_index=True)
        else:
            biometric_df = pd.DataFrame()
        
        # Merge datasets
        logger.info("Merging datasets...")
        df = enrolment_df.copy()
        
        if not demographic_df.empty:
            df = pd.merge(
                df, 
                demographic_df, 
                on=["date", "state", "district", "pincode"], 
                how="outer",
                suffixes=("", "_demo")
            )
        
        if not biometric_df.empty:
            df = pd.merge(
                df,
                biometric_df,
                on=["date", "state", "district", "pincode"],
                how="outer",
                suffixes=("", "_bio")
            )
        
        # Fill missing values
        df = df.fillna(0)
        
        # Convert date column
        df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
        df = df.dropna(subset=['date'])
        
        logger.info(f"Combined dataset: {len(df)} rows, {len(df.columns)} columns")
        
        return df, self.aggregate_geographic(df)
    
    def aggregate_geographic(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aggregate data at geographic level (pincode, district, state)"""
        logger.info("Aggregating geographic data...")
        
        # Aggregate at pincode level
        agg_dict = {
            'age_0_5': 'sum',
            'age_5_17': 'sum',
            'age_18_greater': 'sum',
        }
        
        # Add demographic columns if they exist
        if 'demo_age_5_17' in df.columns:
            agg_dict['demo_age_5_17'] = 'sum'
        if 'demo_age_17_' in df.columns:
            agg_dict['demo_age_17_'] = 'sum'
        
        # Add biometric columns if they exist
        if 'bio_age_5_17' in df.columns:
            agg_dict['bio_age_5_17'] = 'sum'
        if 'bio_age_17_' in df.columns:
            agg_dict['bio_age_17_'] = 'sum'
        
        pincode_agg = df.groupby(['state', 'district', 'pincode']).agg(agg_dict).reset_index()
        
        # Calculate total metrics
        pincode_agg['total_creation'] = (
            pincode_agg['age_0_5'] + 
            pincode_agg['age_5_17'] + 
            pincode_agg['age_18_greater']
        )
        
        pincode_agg['total_motion'] = (
            pincode_agg.get('demo_age_5_17', pd.Series([0] * len(pincode_agg))) +
            pincode_agg.get('demo_age_17_', pd.Series([0] * len(pincode_agg)))
        )
        
        pincode_agg['total_persistence'] = (
            pincode_agg.get('bio_age_5_17', pd.Series([0] * len(pincode_agg))) +
            pincode_agg.get('bio_age_17_', pd.Series([0] * len(pincode_agg)))
        )
        
        # Calculate days active
        date_counts = df.groupby(['state', 'district', 'pincode'])['date'].nunique().reset_index()
        date_counts.columns = ['state', 'district', 'pincode', 'days_active']
        pincode_agg = pd.merge(pincode_agg, date_counts, on=['state', 'district', 'pincode'])
        
        logger.info(f"Aggregated to {len(pincode_agg)} geographic locations")
        
        # Also aggregate at district and state levels for hierarchy
        district_agg = df.groupby(['state', 'district']).agg(agg_dict).reset_index()
        district_agg['total_creation'] = (
            district_agg['age_0_5'] + 
            district_agg['age_5_17'] + 
            district_agg['age_18_greater']
        )
        district_agg['total_motion'] = (
            district_agg.get('demo_age_5_17', pd.Series([0] * len(district_agg))) +
            district_agg.get('demo_age_17_', pd.Series([0] * len(district_agg)))
        )
        district_agg['total_persistence'] = (
            district_agg.get('bio_age_5_17', pd.Series([0] * len(district_agg))) +
            district_agg.get('bio_age_17_', pd.Series([0] * len(district_agg)))
        )
        date_counts_district = df.groupby(['state', 'district'])['date'].nunique().reset_index()
        date_counts_district.columns = ['state', 'district', 'days_active']
        district_agg = pd.merge(district_agg, date_counts_district, on=['state', 'district'])
        
        state_agg = df.groupby(['state']).agg(agg_dict).reset_index()
        state_agg['total_creation'] = (
            state_agg['age_0_5'] + 
            state_agg['age_5_17'] + 
            state_agg['age_18_greater']
        )
        state_agg['total_motion'] = (
            state_agg.get('demo_age_5_17', pd.Series([0] * len(state_agg))) +
            state_agg.get('demo_age_17_', pd.Series([0] * len(state_agg)))
        )
        state_agg['total_persistence'] = (
            state_agg.get('bio_age_5_17', pd.Series([0] * len(state_agg))) +
            state_agg.get('bio_age_17_', pd.Series([0] * len(state_agg)))
        )
        date_counts_state = df.groupby(['state'])['date'].nunique().reset_index()
        date_counts_state.columns = ['state', 'days_active']
        state_agg = pd.merge(state_agg, date_counts_state, on=['state'])
        
        # Store district and state aggregations
        self.district_data = district_agg
        self.state_data = state_agg
        
        return pincode_agg
    
    def engineer_features(self, geographic_df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for geographic entities"""
        logger.info("Engineering features...")
        
        df = geographic_df.copy()
        
        # Calculate ratios
        df['child_ratio'] = np.where(
            df['total_creation'] > 0,
            df['age_0_5'] / df['total_creation'],
            0.0
        )
        df['youth_ratio'] = np.where(
            df['total_creation'] > 0,
            df['age_5_17'] / df['total_creation'],
            0.0
        )
        df['adult_ratio'] = np.where(
            df['total_creation'] > 0,
            df['age_18_greater'] / df['total_creation'],
            0.0
        )
        
        # Calculate intensities
        df['motion_intensity'] = np.where(
            df['total_creation'] > 0,
            df['total_motion'] / df['total_creation'],
            0.0
        )
        df['persistence_intensity'] = np.where(
            df['total_creation'] > 0,
            df['total_persistence'] / df['total_creation'],
            0.0
        )
        
        # Calculate velocities
        df['creation_velocity'] = np.where(
            df['days_active'] > 0,
            df['total_creation'] / df['days_active'],
            0.0
        )
        df['motion_velocity'] = np.where(
            df['days_active'] > 0,
            df['total_motion'] / df['days_active'],
            0.0
        )
        df['persistence_velocity'] = np.where(
            df['days_active'] > 0,
            df['total_persistence'] / df['days_active'],
            0.0
        )
        
        # Calculate motion to persistence ratio
        df['motion_to_persistence_ratio'] = np.where(
            df['total_persistence'] > 0,
            df['total_motion'] / df['total_persistence'],
            0.0
        )
        
        # Replace infinities and NaNs
        df = df.replace([np.inf, -np.inf], 0)
        df = df.fillna(0)
        
        # Classify archetypes
        mean_creation_velocity = df['creation_velocity'].mean()
        
        def classify_archetype(row):
            if row['motion_intensity'] < 0.1 and row['creation_velocity'] > mean_creation_velocity:
                return 'GHOST_FARM'
            elif row['motion_intensity'] > 2.0:
                return 'CROSSROADS'
            elif row['creation_velocity'] > 2 * mean_creation_velocity and row['child_ratio'] > 0.3:
                return 'NURSERY'
            elif row['creation_velocity'] < 0.2 * mean_creation_velocity:
                return 'DORMANT'
            else:
                return 'BEDROCK'
        
        df['archetype'] = df.apply(classify_archetype, axis=1)
        
        logger.info(f"Feature engineering complete. Archetypes: {df['archetype'].value_counts().to_dict()}")
        
        return df
    
    def detect_anomalies(self, geographic_df: pd.DataFrame) -> List[Dict]:
        """Detect anomalies using configured methods"""
        if not self.config.get("anomaly_detection", {}).get("enabled", True):
            logger.info("Anomaly detection disabled")
            return []
        
        logger.info("Detecting anomalies...")
        
        from sklearn.ensemble import IsolationForest
        from sklearn.preprocessing import StandardScaler
        
        # Select features for anomaly detection
        feature_cols = [
            'motion_intensity', 'persistence_intensity',
            'creation_velocity', 'motion_velocity', 'persistence_velocity',
            'child_ratio', 'youth_ratio', 'adult_ratio'
        ]
        
        # Filter to only columns that exist
        feature_cols = [col for col in feature_cols if col in geographic_df.columns]
        
        if not feature_cols:
            logger.warning("No feature columns available for anomaly detection")
            return []
        
        # Prepare features
        features = geographic_df[feature_cols].fillna(0).replace([np.inf, -np.inf], 0)
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features)
        
        # Isolation Forest
        iso_forest = IsolationForest(
            contamination=self.config["anomaly_detection"].get("contamination", 0.01),
            n_estimators=self.config["anomaly_detection"].get("n_estimators", 100),
            random_state=42
        )
        anomalies = iso_forest.fit_predict(scaled_features)
        
        # Create tension nodes for anomalies
        anomaly_list = []
        for idx, (_, row) in enumerate(geographic_df.iterrows()):
            if anomalies[idx] == -1:  # Anomaly detected
                # Calculate severity
                z_scores = np.abs((features.iloc[idx] - features.mean()) / features.std())
                severity = min(100, z_scores.max() * 10)
                
                # Determine tension type
                if row['creation_velocity'] > features['creation_velocity'].mean() + 2 * features['creation_velocity'].std() and row['motion_velocity'] < 0.1:
                    tension_type = 'CREATION_WITHOUT_MOTION'
                elif row['motion_velocity'] > features['motion_velocity'].mean() + 2 * features['motion_velocity'].std():
                    tension_type = 'MOTION_WITHOUT_CREATION'
                else:
                    tension_type = 'TEMPORAL_SHOCK'
                
                anomaly_list.append({
                    'location_id': f"PINCODE_{row['pincode']}",
                    'tension_type': tension_type,
                    'severity': float(severity),
                    'z_score': float(z_scores.max()),
                    'description': f"Anomaly detected in {row['state']}, {row['district']}, pincode {row['pincode']}",
                    'detected_at': datetime.now().isoformat(),
                    'observed_value': float(row['creation_velocity']),
                    'expected_value': float(features['creation_velocity'].mean())
                })
        
        logger.info(f"Detected {len(anomaly_list)} anomalies via Isolation Forest")
        self.anomalies = anomaly_list
        
        # Add DBSCAN detection if enabled
        methods_config = self.config.get("anomaly_detection", {}).get("methods", {})
        if methods_config.get("dbscan", {}).get("enabled", False) or \
           self.config.get("anomaly_detection", {}).get("method") == "dbscan":
            dbscan_anomalies = self._detect_anomalies_dbscan(geographic_df, features)
            # Merge with existing anomalies
            anomaly_list.extend(dbscan_anomalies)
            logger.info(f"Detected {len(dbscan_anomalies)} additional anomalies via DBSCAN")
        
        self.anomalies = anomaly_list
        return anomaly_list
    
    def _detect_anomalies_dbscan(self, geographic_df: pd.DataFrame, features: pd.DataFrame) -> List[Dict]:
        """Detect anomalies using DBSCAN clustering"""
        from sklearn.preprocessing import StandardScaler
        
        # Prepare features
        feature_cols = [
            'motion_intensity', 'persistence_intensity',
            'creation_velocity', 'motion_velocity', 'persistence_velocity'
        ]
        feature_cols = [col for col in feature_cols if col in features.columns]
        
        if not feature_cols:
            return []
        
        scaled_features = StandardScaler().fit_transform(features[feature_cols])
        
        # DBSCAN parameters from config
        methods_config = self.config.get("anomaly_detection", {}).get("methods", {})
        dbscan_config = methods_config.get("dbscan", {})
        # Fallback to top-level config if methods config not present
        if not dbscan_config:
            eps = self.config.get("anomaly_detection", {}).get("eps", 0.5)
            min_samples = self.config.get("anomaly_detection", {}).get("min_samples", 5)
        else:
            eps = dbscan_config.get("eps", 0.5)
            min_samples = dbscan_config.get("min_samples", 5)
        
        dbscan = DBSCAN(eps=eps, min_samples=min_samples)
        clusters = dbscan.fit_predict(scaled_features)
        
        # Outliers are points with cluster label -1
        anomaly_list = []
        for idx, (_, row) in enumerate(geographic_df.iterrows()):
            if clusters[idx] == -1:  # Outlier detected
                # Calculate severity based on distance from cluster centers
                z_scores = np.abs((features.iloc[idx] - features.mean()) / features.std())
                severity = min(100, z_scores.max() * 10)
                
                anomaly_list.append({
                    'location_id': f"PINCODE_{row['pincode']}",
                    'tension_type': 'TEMPORAL_SHOCK',  # DBSCAN detects general outliers
                    'severity': float(severity),
                    'z_score': float(z_scores.max()),
                    'description': f"Geographic outlier detected via DBSCAN in {row['state']}, {row['district']}, pincode {row['pincode']}",
                    'detected_at': datetime.now().isoformat(),
                    'observed_value': float(row['creation_velocity']),
                    'expected_value': float(features['creation_velocity'].mean()),
                    'detection_method': 'DBSCAN'
                })
        
        return anomaly_list
    
    def detect_patterns(self, geographic_df: pd.DataFrame, daily_df: pd.DataFrame) -> List[Dict]:
        """Detect recurring behavioral patterns"""
        if not self.config.get("pattern_detection", {}).get("enabled", True):
            logger.info("Pattern detection disabled")
            return []
        
        logger.info("Detecting patterns...")
        patterns = []
        
        # 1. Temporal Spike Pattern
        patterns.extend(self._detect_temporal_spikes(geographic_df))
        
        # 2. Ghost Farm Pattern (high creation, low motion)
        patterns.extend(self._detect_ghost_farms(geographic_df))
        
        # 3. Coordinated Update Pattern (synchronized changes across locations)
        if daily_df is not None and not daily_df.empty:
            patterns.extend(self._detect_coordinated_updates(daily_df))
        
        logger.info(f"Detected {len(patterns)} patterns")
        self.patterns = patterns
        
        # Track pattern occurrences by date for PRECEDES analysis
        if daily_df is not None and not daily_df.empty:
            self._track_pattern_occurrences(patterns, daily_df)
        
        return patterns
    
    def _track_pattern_occurrences(self, patterns: List[Dict], daily_df: pd.DataFrame):
        """Track when patterns occur for PRECEDES analysis"""
        self.pattern_occurrences = {}
        
        for pattern in patterns:
            pattern_id = pattern.get('id')
            locations = pattern.get('locations_involved', [])
            
            # Extract dates from daily data for locations involved in this pattern
            occurrences = []
            for loc_id in locations:
                # Extract pincode from loc_id (format: PINCODE_123456)
                pincode = loc_id.replace('PINCODE_', '') if 'PINCODE_' in loc_id else ''
                if pincode:
                    loc_data = daily_df[daily_df['pincode'].astype(str) == pincode]
                    occurrences.extend(loc_data['date'].dt.strftime('%Y-%m-%d').tolist() if not loc_data.empty else [])
            
            # Store unique dates
            self.pattern_occurrences[pattern_id] = sorted(list(set(occurrences)))
    
    def _detect_temporal_spikes(self, geographic_df: pd.DataFrame) -> List[Dict]:
        """Detect temporal spikes in activity"""
        patterns = []
        
        # For each location, check if creation_velocity is significantly higher than mean
        mean_creation = geographic_df['creation_velocity'].mean()
        std_creation = geographic_df['creation_velocity'].std()
        threshold = mean_creation + 2 * std_creation
        
        spike_locations = geographic_df[geographic_df['creation_velocity'] > threshold]
        
        if len(spike_locations) >= self.config.get("pattern_detection", {}).get("min_pattern_occurrences", 5):
            pattern = {
                'id': 'SIGNATURE_TEMPORAL_SPIKE',
                'signature_type': 'TEMPORAL_SPIKE',
                'description': f"Temporal spike pattern: {len(spike_locations)} locations with creation_velocity > {threshold:.2f}",
                'signature_hash': hash(tuple(spike_locations['pincode'].head(10).values)),
                'first_observed': datetime.now().isoformat(),
                'last_observed': datetime.now().isoformat(),
                'occurrence_count': len(spike_locations),
                'locations_involved': [f"PINCODE_{p}" for p in spike_locations['pincode'].head(20).tolist()],
                'confidence_score': min(1.0, len(spike_locations) / 50),
                'magnitude_range': {
                    'min': float(spike_locations['creation_velocity'].min()),
                    'max': float(spike_locations['creation_velocity'].max()),
                    'mean': float(spike_locations['creation_velocity'].mean())
                }
            }
            patterns.append(pattern)
        
        return patterns
    
    def _detect_ghost_farms(self, geographic_df: pd.DataFrame) -> List[Dict]:
        """Detect ghost farm pattern (high creation, zero/low motion)"""
        patterns = []
        
        # Locations with high creation but low motion
        ghost_farms = geographic_df[
            (geographic_df['creation_velocity'] > geographic_df['creation_velocity'].mean()) &
            (geographic_df['motion_velocity'] < 0.1)
        ]
        
        if len(ghost_farms) >= self.config.get("pattern_detection", {}).get("min_pattern_occurrences", 5):
            pattern = {
                'id': 'SIGNATURE_GHOST_FARM',
                'signature_type': 'GHOST_FARM_PATTERN',
                'description': f"Ghost farm pattern: {len(ghost_farms)} locations with high creation but minimal motion",
                'signature_hash': hash(tuple(ghost_farms['pincode'].head(10).values)),
                'first_observed': datetime.now().isoformat(),
                'last_observed': datetime.now().isoformat(),
                'occurrence_count': len(ghost_farms),
                'locations_involved': [f"PINCODE_{p}" for p in ghost_farms['pincode'].head(20).tolist()],
                'confidence_score': min(1.0, len(ghost_farms) / 30),
                'magnitude_range': {
                    'min': float(ghost_farms['creation_velocity'].min()),
                    'max': float(ghost_farms['creation_velocity'].max()),
                    'mean': float(ghost_farms['creation_velocity'].mean())
                }
            }
            patterns.append(pattern)
        
        return patterns
    
    def _detect_coordinated_updates(self, daily_df: pd.DataFrame) -> List[Dict]:
        """Detect coordinated update patterns across locations"""
        patterns = []
        
        # Group by date and check for synchronized activity
        date_groups = daily_df.groupby('date')
        coordination_threshold = self.config.get("pattern_detection", {}).get("correlation_threshold", 0.7)
        
        # Find dates with unusually high activity across multiple locations
        for date, group in date_groups:
            if len(group) > 10:  # Multiple locations active on same date
                # Check if total activity is significantly higher than average
                avg_daily_activity = daily_df.groupby('date').size().mean()
                if len(group) > avg_daily_activity * 1.5:
                    pattern = {
                        'id': f'SIGNATURE_COORDINATED_{date.strftime("%Y%m%d")}',
                        'signature_type': 'COORDINATED_UPDATE',
                        'description': f"Coordinated update on {date}: {len(group)} locations active simultaneously",
                        'signature_hash': hash(date.isoformat()),
                        'first_observed': date.isoformat(),
                        'last_observed': date.isoformat(),
                        'occurrence_count': 1,
                        'locations_involved': [f"PINCODE_{p}" for p in group['pincode'].head(20).tolist()],
                        'confidence_score': min(1.0, len(group) / 50),
                        'temporal_pattern': {
                            'date': date.isoformat()
                        }
                    }
                    patterns.append(pattern)
        
        return patterns
    
    def track_lifecycles(self, daily_df: pd.DataFrame) -> List[Dict]:
        """Track IdentityLifecycle cohorts from daily enrolment data"""
        logger.info("Tracking IdentityLifecycles...")
        
        if daily_df is None or daily_df.empty:
            logger.warning("No daily data available for lifecycle tracking")
            return []
        
        lifecycles = []
        
        # Group by date and location to create cohorts
        cohort_groups = daily_df.groupby(['date', 'state', 'district', 'pincode'])
        
        for (date, state, district, pincode), group in cohort_groups:
            # Calculate cohort metrics
            cohort_size = int(
                group['age_0_5'].sum() + 
                group['age_5_17'].sum() + 
                group['age_18_greater'].sum()
            )
            
            if cohort_size == 0:
                continue
            
            age_distribution = {
                'age_0_5': int(group['age_0_5'].sum()),
                'age_5_17': int(group['age_5_17'].sum()),
                'age_18_greater': int(group['age_18_greater'].sum())
            }
            
            # Calculate days since birth
            current_date = daily_df['date'].max()
            days_since_birth = (current_date - date).days
            
            # Count subsequent motion and persistence events (simplified - would need to track over time)
            # For now, use aggregated data if available
            subsequent_motion = 0
            subsequent_persistence = 0
            
            # Determine lifecycle stage
            if days_since_birth < 30:
                lifecycle_stage = "NEWBORN"
            elif days_since_birth < 90 and cohort_size > 0:
                lifecycle_stage = "ACTIVE"
            elif days_since_birth > 90 and subsequent_motion == 0:
                lifecycle_stage = "DORMANT"
            elif cohort_size > 100 and subsequent_motion == 0 and days_since_birth > 60:
                lifecycle_stage = "GHOST"
            else:
                lifecycle_stage = "ACTIVE"
            
            lifecycle_id = f"LIFECYCLE_{pincode}_{date.strftime('%Y%m%d')}"
            location_id = f"PINCODE_{pincode}"
            
            lifecycle = {
                'id': lifecycle_id,
                'origin_location_id': location_id,
                'birth_date': date.isoformat(),
                'cohort_size': cohort_size,
                'age_group_distribution': age_distribution,
                'subsequent_motion_events': subsequent_motion,
                'subsequent_persistence_events': subsequent_persistence,
                'days_since_birth': days_since_birth,
                'motion_frequency': subsequent_motion / days_since_birth if days_since_birth > 0 else 0,
                'lifecycle_stage': lifecycle_stage,
                'state': state,
                'district': district,
                'pincode': pincode
            }
            
            lifecycles.append(lifecycle)
        
        logger.info(f"Tracked {len(lifecycles)} IdentityLifecycle cohorts")
        self.lifecycles = lifecycles
        return lifecycles
    
    def infer_threats(self, anomalies: List[Dict], patterns: List[Dict]) -> List[Dict]:
        """Infer EmergentThreat nodes from tensions and signatures (Stage 6)"""
        logger.info("Inferring threats from tensions and signatures...")
        
        threats = []
        
        # Group anomalies by location to find clusters
        location_anomalies = {}
        for anomaly in anomalies:
            loc_id = anomaly.get('location_id', '')
            if loc_id not in location_anomalies:
                location_anomalies[loc_id] = []
            location_anomalies[loc_id].append(anomaly)
        
        # 1. Identity Fraud Ring: Multiple locations with CREATION_WITHOUT_MOTION + Ghost Farm Pattern
        ghost_farm_patterns = [p for p in patterns if p.get('signature_type') == 'GHOST_FARM_PATTERN']
        creation_without_motion = [a for a in anomalies if a.get('tension_type') == 'CREATION_WITHOUT_MOTION']
        
        if ghost_farm_patterns and len(creation_without_motion) >= 3:
            # Find locations that match both pattern and tension
            pattern_locations = set()
            for pattern in ghost_farm_patterns:
                pattern_locations.update(pattern.get('locations_involved', []))
            
            tension_locations = set([a.get('location_id') for a in creation_without_motion])
            fraud_locations = pattern_locations.intersection(tension_locations)
            
            if len(fraud_locations) >= 3:
                threat = {
                    'id': f"THREAT_{hash('IDENTITY_FRAUD_RING')}",
                    'threat_type': 'IDENTITY_FRAUD_RING',
                    'title': 'Potential Identity Fraud Ring Detected',
                    'narrative': f"Found {len(fraud_locations)} locations exhibiting high creation velocity with minimal motion, combined with Ghost Farm pattern. This suggests coordinated synthetic identity creation.",
                    'severity_level': 4,
                    'confidence': min(1.0, len(fraud_locations) / 10),
                    'first_detected': datetime.now().isoformat(),
                    'last_updated': datetime.now().isoformat(),
                    'status': 'ACTIVE',
                    'related_tensions': [a.get('location_id', '') + '_TENSION_' + str(hash(a.get('detected_at', ''))) for a in creation_without_motion[:10]],
                    'related_signatures': [p.get('id', '') for p in ghost_farm_patterns],
                    'affected_locations': list(fraud_locations)[:20],
                    'affected_lifecycles': [],
                    'geographic_spread': len(fraud_locations),
                    'temporal_span_days': 30,
                    'estimated_entities_involved': sum([a.get('observed_value', 0) * 100 for a in creation_without_motion[:5]])
                }
                threats.append(threat)
        
        # 2. Coordinated Anomaly: Multiple locations with same anomaly type simultaneously
        temporal_anomalies = [a for a in anomalies if a.get('tension_type') == 'TEMPORAL_SHOCK']
        if len(temporal_anomalies) >= 5:
            # Group by detection time (within 48 hours)
            from collections import defaultdict
            time_groups = defaultdict(list)
            for anomaly in temporal_anomalies:
                detected_time = anomaly.get('detected_at', '')
                # Group by day
                time_key = detected_time[:10] if detected_time else 'unknown'
                time_groups[time_key].append(anomaly)
            
            # Find days with multiple coordinated anomalies
            for time_key, group_anomalies in time_groups.items():
                if len(group_anomalies) >= 5:
                    locations = [a.get('location_id') for a in group_anomalies]
                    threat = {
                        'id': f"THREAT_COORDINATED_{hash(time_key)}",
                        'threat_type': 'COORDINATED_ANOMALY',
                        'title': f'Coordinated Anomaly Detected on {time_key}',
                        'narrative': f"Detected {len(group_anomalies)} simultaneous temporal shocks across multiple locations on {time_key}. This suggests coordinated activity.",
                        'severity_level': 3,
                        'confidence': min(1.0, len(group_anomalies) / 10),
                        'first_detected': group_anomalies[0].get('detected_at', datetime.now().isoformat()),
                        'last_updated': group_anomalies[-1].get('detected_at', datetime.now().isoformat()),
                        'status': 'ACTIVE',
                        'related_tensions': [a.get('location_id', '') + '_TENSION_' + str(hash(a.get('detected_at', ''))) for a in group_anomalies],
                        'related_signatures': [],
                        'affected_locations': locations[:20],
                        'affected_lifecycles': [],
                        'geographic_spread': len(set(locations)),
                        'temporal_span_days': 1,
                        'estimated_entities_involved': len(group_anomalies) * 50
                    }
                    threats.append(threat)
        
        logger.info(f"Inferred {len(threats)} threats")
        self.threats = threats
        return threats
    
    async def populate_graph(self, geographic_df: pd.DataFrame, daily_df: pd.DataFrame = None):
        """Populate the knowledge graph via Graphiti MCP"""
        if not self.graph_enabled:
            logger.warning("Graph population disabled - no Graphiti MCP URL configured")
            return
        
        logger.info("Populating knowledge graph via Graphiti MCP...")
        
        async with GraphitiMCPClient(self.config["graph"]["mcp_url"]) as client:
            self.graphiti_client = client
            
            # Check health
            if not await client.health_check():
                logger.error("Graphiti MCP server is not healthy, skipping graph population")
                return
            
            # 1. Create GeographicSoul nodes (State, District, Pincode hierarchy)
            
            # Create State nodes first
            if self.state_data is not None and not self.state_data.empty:
                logger.info(f"Creating {len(self.state_data)} State GeographicSoul nodes...")
                for idx, row in self.state_data.iterrows():
                    entity_id = f"STATE_{row['state'].replace(' ', '_')}"
                    properties = {
                        "name": str(row.get('state', '')),
                        "type": "STATE",
                        "total_creation": int(row.get('total_creation', 0)),
                        "total_motion": int(row.get('total_motion', 0)),
                        "total_persistence": int(row.get('total_persistence', 0)),
                        "days_active": int(row.get('days_active', 0))
                    }
                    try:
                        await client.add_entity_as_json("GeographicSoul", entity_id, properties)
                    except Exception as e:
                        logger.warning(f"Failed to create state node {entity_id}: {e}")
            
            # Create District nodes
            if self.district_data is not None and not self.district_data.empty:
                logger.info(f"Creating {len(self.district_data)} District GeographicSoul nodes...")
                for idx, row in self.district_data.iterrows():
                    district_key = f"{row['state']}_{row['district']}".replace(' ', '_')
                    entity_id = f"DISTRICT_{district_key}"
                    properties = {
                        "name": str(row.get('district', '')),
                        "type": "DISTRICT",
                        "state": str(row.get('state', '')),
                        "total_creation": int(row.get('total_creation', 0)),
                        "total_motion": int(row.get('total_motion', 0)),
                        "total_persistence": int(row.get('total_persistence', 0)),
                        "days_active": int(row.get('days_active', 0))
                    }
                    try:
                        await client.add_entity_as_json("GeographicSoul", entity_id, properties)
                    except Exception as e:
                        logger.warning(f"Failed to create district node {entity_id}: {e}")
            
            # Create Pincode nodes
            logger.info(f"Creating {len(geographic_df)} Pincode GeographicSoul nodes...")
            for idx, row in geographic_df.iterrows():
                entity_id = f"PINCODE_{row['pincode']}"
                properties = {
                    "name": str(row.get('pincode', '')),
                    "type": "PINCODE",
                    "state": row.get('state', ''),
                    "district": row.get('district', ''),
                    "total_creation": int(row.get('total_creation', 0)),
                    "total_motion": int(row.get('total_motion', 0)),
                    "total_persistence": int(row.get('total_persistence', 0)),
                    "creation_velocity": float(row.get('creation_velocity', 0)),
                    "motion_velocity": float(row.get('motion_velocity', 0)),
                    "persistence_velocity": float(row.get('persistence_velocity', 0)),
                    "motion_intensity": float(row.get('motion_intensity', 0)),
                    "persistence_intensity": float(row.get('persistence_intensity', 0)),
                    "child_ratio": float(row.get('child_ratio', 0)),
                    "youth_ratio": float(row.get('youth_ratio', 0)),
                    "adult_ratio": float(row.get('adult_ratio', 0)),
                    "archetype": row.get('archetype', 'DORMANT')
                }
                
                try:
                    await client.add_entity_as_json("GeographicSoul", entity_id, properties)
                    if (idx + 1) % 100 == 0:
                        logger.info(f"Created {idx + 1}/{len(geographic_df)} pincode nodes...")
                except Exception as e:
                    logger.warning(f"Failed to create node {entity_id}: {e}")
            
            # Create LOCATED_IN edges (hierarchy: Pincode → District → State)
            logger.info("Creating LOCATED_IN edges (geographic hierarchy)...")
            located_in_count = 0
            try:
                # Pincode → District
                for idx, row in geographic_df.iterrows():
                    pincode_id = f"PINCODE_{row['pincode']}"
                    district_key = f"{row['state']}_{row['district']}".replace(' ', '_')
                    district_id = f"DISTRICT_{district_key}"
                    state_key = row['state'].replace(' ', '_')
                    state_id = f"STATE_{state_key}"
                    
                    try:
                        # Pincode → District
                        await client.add_relationship_as_json(
                            "LOCATED_IN",
                            pincode_id,
                            district_id,
                            "GeographicSoul",
                            "GeographicSoul",
                            {}
                        )
                        located_in_count += 1
                        
                        # District → State (only create once per district)
                        if idx == 0 or (idx > 0 and geographic_df.iloc[idx-1]['district'] != row['district']):
                            await client.add_relationship_as_json(
                                "LOCATED_IN",
                                district_id,
                                state_id,
                                "GeographicSoul",
                                "GeographicSoul",
                                {}
                            )
                            located_in_count += 1
                    except Exception as e:
                        logger.debug(f"Failed to create LOCATED_IN edge: {e}")
                
                logger.info(f"Created {located_in_count} LOCATED_IN edges")
            except Exception as e:
                logger.warning(f"Failed to create LOCATED_IN edges: {e}")
            
            # 2. Create SystemicTension nodes from anomalies
            logger.info(f"Creating {len(self.anomalies)} SystemicTension nodes...")
            for anomaly in self.anomalies:
                entity_id = anomaly['location_id'] + f"_TENSION_{hash(anomaly['detected_at'])}"
                properties = {
                    "tension_type": anomaly.get('tension_type', 'TEMPORAL_SHOCK'),
                    "description": anomaly.get('description', ''),
                    "location_id": anomaly.get('location_id', ''),
                    "detected_at": anomaly.get('detected_at', ''),
                    "severity": anomaly.get('severity', 0),
                    "z_score": anomaly.get('z_score', 0),
                    "observed_value": anomaly.get('observed_value', 0),
                    "expected_value": anomaly.get('expected_value', 0)
                }
                
                try:
                    await client.add_entity_as_json("SystemicTension", entity_id, properties)
                    
                    # Create EXPERIENCES edge
                    await client.add_relationship_as_json(
                        "EXPERIENCES",
                        anomaly.get('location_id', ''),
                        entity_id,
                        "GeographicSoul",
                        "SystemicTension",
                        {"detected_at": anomaly.get('detected_at', '')}
                    )
                except Exception as e:
                    logger.warning(f"Failed to create tension node {entity_id}: {e}")
            
            # 3. Create BehavioralSignature nodes from patterns
            logger.info(f"Creating {len(self.patterns)} BehavioralSignature nodes...")
            for pattern in self.patterns:
                entity_id = pattern.get('id', f"SIGNATURE_{hash(pattern.get('description', ''))}")
                properties = {
                    "signature_type": pattern.get('signature_type', ''),
                    "description": pattern.get('description', ''),
                    "signature_hash": str(pattern.get('signature_hash', '')),
                    "first_observed": pattern.get('first_observed', ''),
                    "last_observed": pattern.get('last_observed', ''),
                    "occurrence_count": pattern.get('occurrence_count', 0),
                    "locations_involved": pattern.get('locations_involved', []),
                    "confidence_score": pattern.get('confidence_score', 0)
                }
                
                try:
                    await client.add_entity_as_json("BehavioralSignature", entity_id, properties)
                    
                    # Create MANIFESTS edges to locations
                    for loc_id in pattern.get('locations_involved', [])[:10]:  # Limit to first 10
                        await client.add_relationship_as_json(
                            "MANIFESTS",
                            loc_id,
                            entity_id,
                            "GeographicSoul",
                            "BehavioralSignature",
                            {
                                "first_observed": pattern.get('first_observed', ''),
                                "last_observed": pattern.get('last_observed', ''),
                                "confidence_score": pattern.get('confidence_score', 0)
                            }
                        )
                except Exception as e:
                    logger.warning(f"Failed to create pattern node {entity_id}: {e}")
            
            # 4. Create IdentityLifecycle nodes
            logger.info(f"Creating {len(self.lifecycles)} IdentityLifecycle nodes...")
            for lifecycle in self.lifecycles:
                entity_id = lifecycle.get('id')
                properties = {
                    "origin_location_id": lifecycle.get('origin_location_id', ''),
                    "birth_date": lifecycle.get('birth_date', ''),
                    "cohort_size": lifecycle.get('cohort_size', 0),
                    "age_group_distribution": json.dumps(lifecycle.get('age_group_distribution', {})),
                    "subsequent_motion_events": lifecycle.get('subsequent_motion_events', 0),
                    "subsequent_persistence_events": lifecycle.get('subsequent_persistence_events', 0),
                    "days_since_birth": lifecycle.get('days_since_birth', 0),
                    "motion_frequency": float(lifecycle.get('motion_frequency', 0)),
                    "lifecycle_stage": lifecycle.get('lifecycle_stage', 'NEWBORN')
                }
                
                try:
                    await client.add_entity_as_json("IdentityLifecycle", entity_id, properties)
                    
                    # Create BORN_IN edge
                    await client.add_relationship_as_json(
                        "BORN_IN",
                        entity_id,
                        lifecycle.get('origin_location_id', ''),
                        "IdentityLifecycle",
                        "GeographicSoul",
                        {
                            "birth_date": lifecycle.get('birth_date', ''),
                            "cohort_size": lifecycle.get('cohort_size', 0)
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to create lifecycle node {entity_id}: {e}")
            
            # 5. Create EmergentThreat nodes
            logger.info(f"Creating {len(self.threats)} EmergentThreat nodes...")
            for threat in self.threats:
                entity_id = threat.get('id')
                properties = {
                    "threat_type": threat.get('threat_type', ''),
                    "title": threat.get('title', ''),
                    "narrative": threat.get('narrative', ''),
                    "severity_level": threat.get('severity_level', 1),
                    "confidence": float(threat.get('confidence', 0)),
                    "first_detected": threat.get('first_detected', ''),
                    "last_updated": threat.get('last_updated', ''),
                    "status": threat.get('status', 'ACTIVE'),
                    "related_tensions": threat.get('related_tensions', []),
                    "related_signatures": threat.get('related_signatures', []),
                    "affected_locations": threat.get('affected_locations', []),
                    "affected_lifecycles": threat.get('affected_lifecycles', []),
                    "geographic_spread": threat.get('geographic_spread', 0),
                    "temporal_span_days": threat.get('temporal_span_days', 0),
                    "estimated_entities_involved": threat.get('estimated_entities_involved', 0)
                }
                
                try:
                    await client.add_entity_as_json("EmergentThreat", entity_id, properties)
                    
                    # Create REVEALS edges from tensions
                    for tension_id in threat.get('related_tensions', [])[:10]:  # Limit to first 10
                        try:
                            await client.add_relationship_as_json(
                                "REVEALS",
                                tension_id,
                                entity_id,
                                "SystemicTension",
                                "EmergentThreat",
                                {"contribution_weight": 1.0 / len(threat.get('related_tensions', [1]))}
                            )
                        except Exception as e:
                            logger.debug(f"Failed to create REVEALS edge: {e}")
                    
                    # Create SUGGESTS edges from signatures
                    for signature_id in threat.get('related_signatures', []):
                        try:
                            await client.add_relationship_as_json(
                                "SUGGESTS",
                                signature_id,
                                entity_id,
                                "BehavioralSignature",
                                "EmergentThreat",
                                {"relevance_score": threat.get('confidence', 0)}
                            )
                        except Exception as e:
                            logger.debug(f"Failed to create SUGGESTS edge: {e}")
                except Exception as e:
                    logger.warning(f"Failed to create threat node {entity_id}: {e}")
            
            # 6. Create ECHOES edges (similar geographic profiles)
            logger.info("Creating ECHOES edges (similar geographic profiles)...")
            try:
                # Calculate similarity between geographic entities
                similarity_features = ['creation_velocity', 'motion_velocity', 'persistence_velocity',
                                     'motion_intensity', 'persistence_intensity', 'child_ratio',
                                     'youth_ratio', 'adult_ratio']
                similarity_features = [f for f in similarity_features if f in geographic_df.columns]
                
                if len(similarity_features) > 0:
                    feature_matrix = geographic_df[similarity_features].fillna(0).replace([np.inf, -np.inf], 0)
                    scaler = StandardScaler()
                    scaled_features = scaler.fit_transform(feature_matrix)
                    
                    # Calculate cosine similarity
                    similarity_matrix = cosine_similarity(scaled_features)
                    
                    # Create edges for high similarity (threshold: 0.8)
                    threshold = 0.8
                    echo_count = 0
                    for i in range(min(50, len(geographic_df))):  # Limit to first 50 to prevent too many edges
                        for j in range(i+1, min(50, len(geographic_df))):
                            if similarity_matrix[i][j] >= threshold:
                                loc1_id = f"PINCODE_{geographic_df.iloc[i]['pincode']}"
                                loc2_id = f"PINCODE_{geographic_df.iloc[j]['pincode']}"
                                
                                try:
                                    await client.add_relationship_as_json(
                                        "ECHOES",
                                        loc1_id,
                                        loc2_id,
                                        "GeographicSoul",
                                        "GeographicSoul",
                                        {
                                            "similarity_score": float(similarity_matrix[i][j]),
                                            "similarity_dimensions": similarity_features
                                        }
                                    )
                                    echo_count += 1
                                    if echo_count >= 50:  # Limit total edges
                                        break
                                except Exception as e:
                                    logger.debug(f"Failed to create ECHOES edge: {e}")
                        
                        if echo_count >= 50:
                            break
                    
                    logger.info(f"Created {echo_count} ECHOES edges")
            except Exception as e:
                logger.warning(f"Failed to create ECHOES edges: {e}")
            
            # 7. Create PRECEDES edges (pattern precedence relationships)
            logger.info("Creating PRECEDES edges (pattern precedence)...")
            try:
                precedes_count = 0
                
                # Analyze pattern occurrences to find precedence relationships
                pattern_ids = list(self.pattern_occurrences.keys())
                for i in range(len(pattern_ids)):
                    for j in range(i+1, len(pattern_ids)):
                        pattern1_id = pattern_ids[i]
                        pattern2_id = pattern_ids[j]
                        
                        occurrences1 = self.pattern_occurrences.get(pattern1_id, [])
                        occurrences2 = self.pattern_occurrences.get(pattern2_id, [])
                        
                        if not occurrences1 or not occurrences2:
                            continue
                        
                        # Convert to datetime for comparison
                        try:
                            dates1 = [pd.to_datetime(d) for d in occurrences1 if d]
                            dates2 = [pd.to_datetime(d) for d in occurrences2 if d]
                            
                            if not dates1 or not dates2:
                                continue
                            
                            # Find pairs where pattern1 occurs before pattern2
                            lag_days_list = []
                            for d1 in dates1:
                                for d2 in dates2:
                                    if d2 > d1:  # pattern2 occurs after pattern1
                                        lag_days = (d2 - d1).days
                                        if lag_days <= 30:  # Within 30 days
                                            lag_days_list.append(lag_days)
                            
                            # If we have enough occurrences (at least 2) and consistent precedence
                            if len(lag_days_list) >= 2:
                                avg_lag = sum(lag_days_list) / len(lag_days_list)
                                # Confidence based on consistency
                                confidence = min(1.0, len(lag_days_list) / 5)
                                
                                try:
                                    await client.add_relationship_as_json(
                                        "PRECEDES",
                                        pattern1_id,
                                        pattern2_id,
                                        "BehavioralSignature",
                                        "BehavioralSignature",
                                        {
                                            "lag_days": int(avg_lag),
                                            "confidence": float(confidence)
                                        }
                                    )
                                    precedes_count += 1
                                    if precedes_count >= 20:  # Limit total edges
                                        break
                                except Exception as e:
                                    logger.debug(f"Failed to create PRECEDES edge: {e}")
                        except Exception as e:
                            logger.debug(f"Failed to process pattern dates: {e}")
                    
                    if precedes_count >= 20:
                        break
                
                logger.info(f"Created {precedes_count} PRECEDES edges")
            except Exception as e:
                logger.warning(f"Failed to create PRECEDES edges: {e}")
            
            logger.info("Graph population complete")
    
    def save_results(self):
        """Save processed results"""
        logger.info("Saving results...")
        
        if self.geographic_data is not None:
            output_file = self.processed_path / "geographic_data.parquet"
            self.geographic_data.to_parquet(output_file, index=False)
            logger.info(f"Saved geographic data to {output_file}")
        
        if self.anomalies:
            output_file = self.processed_path / "anomalies.json"
            with open(output_file, 'w') as f:
                json.dump(self.anomalies, f, indent=2)
            logger.info(f"Saved {len(self.anomalies)} anomalies to {output_file}")
        
        if self.patterns:
            output_file = self.processed_path / "patterns.json"
            with open(output_file, 'w') as f:
                json.dump(self.patterns, f, indent=2)
            logger.info(f"Saved {len(self.patterns)} patterns to {output_file}")
        
        if self.lifecycles:
            output_file = self.processed_path / "lifecycles.json"
            with open(output_file, 'w') as f:
                json.dump(self.lifecycles, f, indent=2)
            logger.info(f"Saved {len(self.lifecycles)} lifecycles to {output_file}")
        
        if self.threats:
            output_file = self.processed_path / "threats.json"
            with open(output_file, 'w') as f:
                json.dump(self.threats, f, indent=2)
            logger.info(f"Saved {len(self.threats)} threats to {output_file}")
        
        # Save summary
        summary = {
            'timestamp': datetime.now().isoformat(),
            'geographic_locations': len(self.geographic_data) if self.geographic_data is not None else 0,
            'anomalies_detected': len(self.anomalies),
            'patterns_detected': len(self.patterns),
            'lifecycles_tracked': len(self.lifecycles),
            'threats_inferred': len(self.threats),
        }
        
        summary_file = self.processed_path / "processing_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        logger.info(f"Saved summary to {summary_file}")
    
    def run(self):
        """Main execution pipeline"""
        try:
            logger.info("=" * 60)
            logger.info("Starting Atlas Engine Processing Pipeline")
            logger.info("=" * 60)
            
            # Stage 1: Load data
            self.daily_data, self.geographic_data = self.load_data()
            
            # Stage 2: Engineer features
            self.geographic_data = self.engineer_features(self.geographic_data)
            
            # Stage 3: Detect anomalies
            self.detect_anomalies(self.geographic_data)
            
            # Stage 4: Detect patterns
            self.detect_patterns(self.geographic_data, self.daily_data)
            
            # Stage 5: Track lifecycles
            self.track_lifecycles(self.daily_data)
            
            # Stage 6: Infer threats
            self.infer_threats(self.anomalies, self.patterns)
            
            # Stage 7: Populate knowledge graph
            if self.graph_enabled:
                asyncio.run(self.populate_graph(self.geographic_data, self.daily_data))
            else:
                logger.info("Graph population skipped (not enabled)")
            
            # Stage 6: Save results
            self.save_results()
            
            logger.info("=" * 60)
            logger.info("Atlas Engine Processing Complete")
            logger.info(f"Processed {len(self.geographic_data)} geographic locations")
            logger.info(f"Detected {len(self.anomalies)} anomalies")
            logger.info(f"Detected {len(self.patterns)} patterns")
            logger.info(f"Tracked {len(self.lifecycles)} lifecycles")
            logger.info(f"Inferred {len(self.threats)} threats")
            logger.info("=" * 60)
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            raise


if __name__ == "__main__":
    engine = AtlasEngine()
    engine.run()
