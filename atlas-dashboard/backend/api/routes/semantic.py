"""
Semantic Search API endpoints
Provides semantic search and reasoning capabilities
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from loguru import logger
from services.falkordb import FalkorDBClient
import os

router = APIRouter(prefix="/api/search", tags=["semantic"])

# Initialize FalkorDB client
FALKORDB_HOST = os.getenv("FALKORDB_HOST", "falkordb")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", 6379))
FALKORDB_PASSWORD = os.getenv("FALKORDB_PASSWORD", "falkordb")
falkordb_client = FalkorDBClient(FALKORDB_HOST, FALKORDB_PORT, FALKORDB_PASSWORD)


@router.get("")
async def semantic_search(
    q: str = Query(..., description="Search query"),
    node_types: Optional[str] = Query(None, description="Comma-separated list of node types to filter"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
):
    """
    Perform semantic search on the knowledge graph.
    Uses LLM reasoning to find relevant entities based on meaning.
    """
    try:
        # Parse node types filter
        node_type_list = None
        if node_types:
            node_type_list = [t.strip() for t in node_types.split(',') if t.strip()]

        # Perform semantic search via FalkorDB
        results = await falkordb_client.semantic_search(
            query=q,
            node_types=node_type_list,
            limit=limit
        )

        return {
            "results": results.get("results", []),
            "total": results.get("total", 0),
            "query": q,
            "reasoning_chain": results.get("reasoning_chain", []),
        }
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{node_id}")
async def find_similar_nodes(
    node_id: str,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Find nodes similar to the given node based on properties and relationships.
    """
    try:
        results = await falkordb_client.find_similar_nodes(node_id, limit=limit)
        return {
            "similar_nodes": results.get("similar_nodes", []),
            "total": results.get("total", 0),
        }
    except Exception as e:
        logger.error(f"Failed to find similar nodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
