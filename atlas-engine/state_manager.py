"""
State Manager for Atlas Engine
Handles checkpoint/resume functionality for pipeline stages
"""

import json
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
from loguru import logger


class StateManager:
    """Manages checkpoint state for the processing pipeline"""
    
    STAGE_NAMES = {
        1: "data_loading",
        2: "feature_engineering",
        3: "anomaly_detection",
        4: "pattern_detection",
        5: "lifecycle_tracking",
        6: "threat_inference",
        7: "graph_population",
        8: "save_results"
    }
    
    def __init__(self, processed_path: Path):
        self.processed_path = Path(processed_path)
        self.processed_path.mkdir(parents=True, exist_ok=True)
        self.checkpoint_dir = self.processed_path / "checkpoints"
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = self.processed_path / "pipeline_state.json"
    
    def save_checkpoint(self, stage: int, data: Dict, metadata: Optional[Dict] = None) -> Path:
        """Save a checkpoint for a specific stage"""
        checkpoint_file = self.checkpoint_dir / f"stage_{stage}_{self.STAGE_NAMES[stage]}.json"
        
        checkpoint_data = {
            "stage": stage,
            "stage_name": self.STAGE_NAMES[stage],
            "timestamp": datetime.now().isoformat(),
            "data": data,
            "metadata": metadata or {}
        }
        
        try:
            with open(checkpoint_file, 'w') as f:
                json.dump(checkpoint_data, f, indent=2, default=str)
            logger.info(f"Checkpoint saved: Stage {stage} ({self.STAGE_NAMES[stage]})")
            return checkpoint_file
        except Exception as e:
            logger.error(f"Failed to save checkpoint for stage {stage}: {e}")
            raise
    
    def load_checkpoint(self, stage: int) -> Optional[Dict]:
        """Load a checkpoint for a specific stage"""
        checkpoint_file = self.checkpoint_dir / f"stage_{stage}_{self.STAGE_NAMES[stage]}.json"
        
        if not checkpoint_file.exists():
            return None
        
        try:
            with open(checkpoint_file, 'r') as f:
                checkpoint_data = json.load(f)
            logger.info(f"Checkpoint loaded: Stage {stage} ({self.STAGE_NAMES[stage]})")
            return checkpoint_data
        except Exception as e:
            logger.error(f"Failed to load checkpoint for stage {stage}: {e}")
            return None
    
    def get_latest_checkpoint(self) -> Optional[int]:
        """Get the latest completed stage"""
        latest_stage = 0
        for stage in sorted(self.STAGE_NAMES.keys(), reverse=True):
            checkpoint_file = self.checkpoint_dir / f"stage_{stage}_{self.STAGE_NAMES[stage]}.json"
            if checkpoint_file.exists():
                latest_stage = stage
                break
        return latest_stage if latest_stage > 0 else None
    
    def list_checkpoints(self) -> List[Dict]:
        """List all available checkpoints"""
        checkpoints = []
        for stage in sorted(self.STAGE_NAMES.keys()):
            checkpoint_file = self.checkpoint_dir / f"stage_{stage}_{self.STAGE_NAMES[stage]}.json"
            if checkpoint_file.exists():
                try:
                    with open(checkpoint_file, 'r') as f:
                        checkpoint_data = json.load(f)
                    checkpoints.append({
                        "stage": stage,
                        "stage_name": self.STAGE_NAMES[stage],
                        "timestamp": checkpoint_data.get("timestamp"),
                        "file": str(checkpoint_file)
                    })
                except Exception:
                    pass
        return checkpoints
    
    def clear_checkpoints(self, from_stage: Optional[int] = None):
        """Clear checkpoints, optionally from a specific stage onwards"""
        if from_stage is None:
            # Clear all
            for checkpoint_file in self.checkpoint_dir.glob("stage_*.json"):
                checkpoint_file.unlink()
            logger.info("All checkpoints cleared")
        else:
            # Clear from stage onwards
            for stage in range(from_stage, len(self.STAGE_NAMES) + 1):
                checkpoint_file = self.checkpoint_dir / f"stage_{stage}_{self.STAGE_NAMES[stage]}.json"
                if checkpoint_file.exists():
                    checkpoint_file.unlink()
            logger.info(f"Checkpoints cleared from stage {from_stage} onwards")
    
    def save_pipeline_state(self, current_stage: int, status: str, metadata: Optional[Dict] = None):
        """Save overall pipeline state"""
        state = {
            "current_stage": current_stage,
            "status": status,  # "running", "completed", "failed", "paused"
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save pipeline state: {e}")
    
    def load_pipeline_state(self) -> Optional[Dict]:
        """Load overall pipeline state"""
        if not self.state_file.exists():
            return None
        
        try:
            with open(self.state_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load pipeline state: {e}")
            return None
    
    def checkpoint_exists(self, stage: int) -> bool:
        """Check if a checkpoint exists for a stage"""
        checkpoint_file = self.checkpoint_dir / f"stage_{stage}_{self.STAGE_NAMES[stage]}.json"
        return checkpoint_file.exists()
