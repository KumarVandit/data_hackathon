"""
Project Atlas Ontology Definition
Defines all entity types, enums, and relationship types for the knowledge graph
Provides type safety and structured definitions for Atlas Engine
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum


# Enums for controlled vocabularies
class GeographicType(Enum):
    """Geographic entity hierarchy levels"""
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    PINCODE = "PINCODE"


class Archetype(Enum):
    """Behavioral archetypes for geographic locations"""
    NURSERY = "NURSERY"  # High creation, high children
    CROSSROADS = "CROSSROADS"  # High motion
    BEDROCK = "BEDROCK"  # Stable, low variance
    GHOST_FARM = "GHOST_FARM"  # High creation, no motion
    DORMANT = "DORMANT"  # Low activity


class TensionType(Enum):
    """Types of systemic tensions (anomalies)"""
    CREATION_WITHOUT_MOTION = "CREATION_WITHOUT_MOTION"
    MOTION_WITHOUT_CREATION = "MOTION_WITHOUT_CREATION"
    PERSISTENCE_WITHOUT_PAST = "PERSISTENCE_WITHOUT_PAST"
    DEMOGRAPHIC_MISMATCH = "DEMOGRAPHIC_MISMATCH"
    TEMPORAL_SHOCK = "TEMPORAL_SHOCK"
    COORDINATED_ANOMALY = "COORDINATED_ANOMALY"


class ThreatType(Enum):
    """Types of emergent threats"""
    IDENTITY_FRAUD_RING = "IDENTITY_FRAUD_RING"
    HUMAN_TRAFFICKING_NETWORK = "HUMAN_TRAFFICKING_NETWORK"
    SLEEPER_CELL_ACTIVATION = "SLEEPER_CELL_ACTIVATION"
    ECONOMIC_SHADOW_NETWORK = "ECONOMIC_SHADOW_NETWORK"
    COORDINATED_ANOMALY = "COORDINATED_ANOMALY"


class SignatureType(Enum):
    """Types of behavioral signatures (patterns)"""
    TEMPORAL_SPIKE = "TEMPORAL_SPIKE"
    COORDINATED_UPDATE = "COORDINATED_UPDATE"
    SEASONAL_MIGRATION = "SEASONAL_MIGRATION"
    WEEKEND_ANOMALY = "WEEKEND_ANOMALY"
    GHOST_FARM_PATTERN = "GHOST_FARM_PATTERN"


class LifecycleStage(Enum):
    """Stages in identity lifecycle"""
    NEWBORN = "NEWBORN"
    ACTIVE = "ACTIVE"
    DORMANT = "DORMANT"
    GHOST = "GHOST"


class ThreatStatus(Enum):
    """Status of threat entities"""
    ACTIVE = "ACTIVE"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


# Relationship Types (for reference)
RELATIONSHIP_TYPES = {
    "LOCATED_IN": "Hierarchical geographic containment (Pincode → District → State)",
    "BORN_IN": "IdentityLifecycle originated in GeographicSoul location",
    "MANIFESTS": "GeographicSoul exhibits BehavioralSignature",
    "EXPERIENCES": "Entity experiencing SystemicTension",
    "REVEALS": "SystemicTension is evidence for EmergentThreat",
    "ECHOES": "GeographicSoul locations with similar characteristics",
    "PRECEDES": "BehavioralSignature consistently occurs before another",
    "SUGGESTS": "BehavioralSignature indicates EmergentThreat"
}


# Entity Schemas (optional dataclasses for type hints and validation)
# Note: These are for reference and type safety. The actual graph population
# uses dictionaries for flexibility with Graphiti MCP.

@dataclass
class GeographicSoulEntity:
    """A geographic entity with behavioral characteristics"""
    id: str
    name: str
    type: GeographicType
    parent_id: Optional[str] = None
    
    # Core metrics
    total_creation: int = 0
    total_motion: int = 0
    total_persistence: int = 0
    
    # Demographic composition
    child_creation_count: int = 0
    youth_creation_count: int = 0
    adult_creation_count: int = 0
    
    # Derived ratios
    child_ratio: float = 0.0
    youth_ratio: float = 0.0
    adult_ratio: float = 0.0
    motion_intensity: float = 0.0
    persistence_intensity: float = 0.0
    motion_to_persistence_ratio: float = 0.0
    
    # Temporal characteristics
    creation_velocity: float = 0.0
    motion_velocity: float = 0.0
    persistence_velocity: float = 0.0
    creation_variance: float = 0.0
    motion_variance: float = 0.0
    persistence_variance: float = 0.0
    
    # Classification
    archetype: Archetype = Archetype.DORMANT
    
    # Risk scoring
    anomaly_score: float = 0.0
    fraud_risk_score: float = 0.0
    trafficking_risk_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for graph population"""
        return {
            "name": self.name,
            "type": self.type.value,
            "parent_id": self.parent_id or "",
            "total_creation": self.total_creation,
            "total_motion": self.total_motion,
            "total_persistence": self.total_persistence,
            "child_ratio": self.child_ratio,
            "youth_ratio": self.youth_ratio,
            "adult_ratio": self.adult_ratio,
            "motion_intensity": self.motion_intensity,
            "persistence_intensity": self.persistence_intensity,
            "creation_velocity": self.creation_velocity,
            "motion_velocity": self.motion_velocity,
            "persistence_velocity": self.persistence_velocity,
            "archetype": self.archetype.value
        }


@dataclass
class SystemicTensionEntity:
    """A dissonance between fundamental forces"""
    id: str
    tension_type: TensionType
    description: str
    location_id: str
    detected_at: str
    severity: float
    z_score: float
    is_reviewed: bool = False
    
    expected_value: Optional[float] = None
    observed_value: Optional[float] = None
    deviation_magnitude: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for graph population"""
        return {
            "tension_type": self.tension_type.value,
            "description": self.description,
            "location_id": self.location_id,
            "detected_at": self.detected_at,
            "severity": self.severity,
            "z_score": self.z_score,
            "is_reviewed": self.is_reviewed,
            "expected_value": self.expected_value or 0.0,
            "observed_value": self.observed_value or 0.0,
            "deviation_magnitude": self.deviation_magnitude
        }


@dataclass
class BehavioralSignatureEntity:
    """A recurring, recognizable pattern"""
    id: str
    signature_type: SignatureType
    description: str
    signature_hash: str
    first_observed: str
    last_observed: str
    occurrence_count: int
    locations_involved: List[str] = field(default_factory=list)
    confidence_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for graph population"""
        return {
            "signature_type": self.signature_type.value,
            "description": self.description,
            "signature_hash": self.signature_hash,
            "first_observed": self.first_observed,
            "last_observed": self.last_observed,
            "occurrence_count": self.occurrence_count,
            "locations_involved": self.locations_involved,
            "confidence_score": self.confidence_score
        }


@dataclass
class EmergentThreatEntity:
    """An inferred narrative of risk"""
    id: str
    threat_type: ThreatType
    title: str
    narrative: str
    severity_level: int  # 1-5
    confidence: float  # 0-1
    first_detected: str
    last_updated: str
    status: ThreatStatus = ThreatStatus.ACTIVE
    
    # Evidence chain
    related_tensions: List[str] = field(default_factory=list)
    related_signatures: List[str] = field(default_factory=list)
    affected_locations: List[str] = field(default_factory=list)
    affected_lifecycles: List[str] = field(default_factory=list)
    
    # Threat indicators
    geographic_spread: int = 0
    temporal_span_days: int = 0
    estimated_entities_involved: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for graph population"""
        return {
            "threat_type": self.threat_type.value,
            "title": self.title,
            "narrative": self.narrative,
            "severity_level": self.severity_level,
            "confidence": self.confidence,
            "first_detected": self.first_detected,
            "last_updated": self.last_updated,
            "status": self.status.value,
            "related_tensions": self.related_tensions,
            "related_signatures": self.related_signatures,
            "affected_locations": self.affected_locations,
            "affected_lifecycles": self.affected_lifecycles,
            "geographic_spread": self.geographic_spread,
            "temporal_span_days": self.temporal_span_days,
            "estimated_entities_involved": self.estimated_entities_involved
        }


# Helper functions for enum conversion
def get_archetype_from_string(value: str) -> Archetype:
    """Convert string to Archetype enum"""
    try:
        return Archetype(value.upper())
    except ValueError:
        return Archetype.DORMANT


def get_tension_type_from_string(value: str) -> TensionType:
    """Convert string to TensionType enum"""
    try:
        return TensionType(value.upper())
    except ValueError:
        return TensionType.TEMPORAL_SHOCK


def get_threat_type_from_string(value: str) -> ThreatType:
    """Convert string to ThreatType enum"""
    try:
        return ThreatType(value.upper())
    except ValueError:
        return ThreatType.COORDINATED_ANOMALY
