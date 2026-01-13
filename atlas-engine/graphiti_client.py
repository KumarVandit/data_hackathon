#!/usr/bin/env python3
"""
Graphiti MCP Client
HTTP client for interacting with Graphiti MCP Server
"""

import os
import json
import httpx
from typing import Dict, List, Any, Optional
from loguru import logger


class GraphitiMCPClient:
    """Client for interacting with Graphiti MCP Server via HTTP"""
    
    def __init__(self, base_url: str = None, group_id: str = "atlas"):
        self.base_url = base_url or os.getenv("GRAPHITI_MCP_URL", "http://graphiti-mcp:8000")
        self.group_id = group_id
        self.mcp_endpoint = f"{self.base_url}/mcp/"
        self.timeout = 30.0
        self.client = httpx.AsyncClient(timeout=self.timeout)
        logger.info(f"Initialized Graphiti MCP client: {self.base_url}, group_id={self.group_id}")
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def _call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a Graphiti MCP tool via HTTP"""
        try:
            # Graphiti MCP uses FastMCP which exposes tools via POST /mcp/call_tool
            # FastMCP endpoint format: POST /mcp/call_tool with JSON body
            url = f"{self.base_url}/mcp/call_tool"
            payload = {
                "name": tool_name,
                "arguments": arguments
            }
            
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            
            # Handle FastMCP response format
            if "content" in result:
                # Extract content from MCP response
                content = result["content"]
                if isinstance(content, list) and len(content) > 0:
                    if "text" in content[0]:
                        return {"message": content[0]["text"]}
            return result
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling {tool_name}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response body: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error calling {tool_name}: {e}")
            raise
    
    async def add_memory(
        self,
        name: str,
        episode_body: str,
        source: str = "json",
        source_description: str = ""
    ) -> Dict[str, Any]:
        """Add structured data to Graphiti knowledge graph"""
        try:
            result = await self._call_tool("add_memory", {
                "name": name,
                "episode_body": episode_body,
                "group_id": self.group_id,
                "source": source,
                "source_description": source_description
            })
            return result
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")
            raise
    
    async def add_entity_as_json(
        self,
        entity_type: str,
        entity_id: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add an entity by converting it to JSON episode format"""
        entity_data = {
            "type": "entity",
            "entity_type": entity_type,
            "id": entity_id,
            **properties
        }
        
        episode_body = json.dumps(entity_data, default=str)
        name = f"{entity_type}_{entity_id}"
        
        return await self.add_memory(
            name=name,
            episode_body=episode_body,
            source="json",
            source_description=f"Atlas Engine: {entity_type} entity"
        )
    
    async def add_relationship_as_json(
        self,
        edge_type: str,
        from_id: str,
        to_id: str,
        from_type: str,
        to_type: str,
        properties: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Add a relationship by converting it to JSON episode format"""
        if properties is None:
            properties = {}
        
        relationship_data = {
            "type": "relationship",
            "edge_type": edge_type,
            "from": {
                "id": from_id,
                "type": from_type
            },
            "to": {
                "id": to_id,
                "type": to_type
            },
            **properties
        }
        
        episode_body = json.dumps(relationship_data, default=str)
        name = f"{edge_type}_{from_id}_to_{to_id}"
        
        return await self.add_memory(
            name=name,
            episode_body=episode_body,
            source="json",
            source_description=f"Atlas Engine: {edge_type} relationship"
        )
    
    async def search_nodes(
        self,
        query: str,
        max_nodes: int = 10,
        entity_types: List[str] = None
    ) -> Dict[str, Any]:
        """Search for nodes in the knowledge graph"""
        arguments = {
            "query": query,
            "group_ids": [self.group_id],
            "max_nodes": max_nodes
        }
        if entity_types:
            arguments["entity_types"] = entity_types
        
        return await self._call_tool("search_nodes", arguments)
    
    async def health_check(self) -> bool:
        """Check if Graphiti MCP server is healthy"""
        try:
            url = f"{self.base_url}/health"
            response = await self.client.get(url, timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False


# Synchronous wrapper for use in non-async contexts
class SyncGraphitiMCPClient:
    """Synchronous wrapper for Graphiti MCP Client"""
    
    def __init__(self, base_url: str = None, group_id: str = "atlas"):
        self.client = GraphitiMCPClient(base_url, group_id)
        self._loop = None
    
    def _get_loop(self):
        """Get or create event loop"""
        import asyncio
        try:
            return asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop
    
    def add_entity_as_json(self, entity_type: str, entity_id: str, properties: Dict[str, Any]):
        """Synchronous wrapper for add_entity_as_json"""
        loop = self._get_loop()
        return loop.run_until_complete(
            self.client.add_entity_as_json(entity_type, entity_id, properties)
        )
    
    def add_relationship_as_json(
        self,
        edge_type: str,
        from_id: str,
        to_id: str,
        from_type: str,
        to_type: str,
        properties: Dict[str, Any] = None
    ):
        """Synchronous wrapper for add_relationship_as_json"""
        loop = self._get_loop()
        return loop.run_until_complete(
            self.client.add_relationship_as_json(edge_type, from_id, to_id, from_type, to_type, properties)
        )
    
    def health_check(self) -> bool:
        """Synchronous wrapper for health_check"""
        loop = self._get_loop()
        return loop.run_until_complete(self.client.health_check())
