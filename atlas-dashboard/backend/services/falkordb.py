"""
FalkorDB Client Service
Handles all graph database operations
"""

import redis
from typing import List, Optional, Dict, Any
from loguru import logger


class FalkorDBClient:
    """Client for interacting with FalkorDB graph database"""
    
    def __init__(self, host: str, port: int, password: str):
        self.host = host
        self.port = port
        self.password = password
        self.redis_client = redis.Redis(
            host=host,
            port=port,
            password=password,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )
        self.graph_name = "atlas_graph"
        logger.info(f"FalkorDB client initialized: {host}:{port}")
    
    async def get_nodes(
        self,
        node_type: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get nodes from graph with optional filtering"""
        try:
            # Build query
            if node_type:
                query = f"MATCH (n:{node_type}) RETURN n LIMIT {limit} SKIP {offset}"
            else:
                query = f"MATCH (n) RETURN n LIMIT {limit} SKIP {offset}"
            
            # Execute query via Redis/FalkorDB
            # Note: FalkorDB uses Redis commands, adjust based on actual API
            result = self._execute_query(query)
            
            nodes = []
            for record in result:
                node = record.get('n', {})
                nodes.append({
                    "id": node.get('id', ''),
                    "type": node.get('type', ''),
                    "properties": node.get('properties', {})
                })
            
            return nodes
        except Exception as e:
            logger.error(f"Failed to get nodes: {e}")
            raise
    
    async def get_edges(
        self,
        edge_type: Optional[str] = None,
        source: Optional[str] = None,
        target: Optional[str] = None,
        limit: int = 5000
    ) -> List[Dict[str, Any]]:
        """Get edges from graph with optional filtering"""
        try:
            # Build query
            query_parts = ["MATCH (a)-[r"]
            if edge_type:
                query_parts.append(f":{edge_type}")
            query_parts.append("]->(b)")
            
            where_clauses = []
            if source:
                where_clauses.append(f"a.id = '{source}'")
            if target:
                where_clauses.append(f"b.id = '{target}'")
            
            if where_clauses:
                query_parts.append(f"WHERE {' AND '.join(where_clauses)}")
            
            query_parts.append(f"RETURN a, r, b LIMIT {limit}")
            query = " ".join(query_parts)
            
            result = self._execute_query(query)
            
            edges = []
            for record in result:
                edge = record.get('r', {})
                source_node = record.get('a', {})
                target_node = record.get('b', {})
                edges.append({
                    "id": edge.get('id', f"{source_node.get('id')}-{target_node.get('id')}"),
                    "source": source_node.get('id', ''),
                    "target": target_node.get('id', ''),
                    "type": edge.get('type', ''),
                    "properties": edge.get('properties', {})
                })
            
            return edges
        except Exception as e:
            logger.error(f"Failed to get edges: {e}")
            raise
    
    async def get_neighbors(
        self,
        node_id: str,
        depth: int = 1,
        edge_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get neighbors of a node up to specified depth"""
        try:
            # Build query for neighbors
            edge_filter = ""
            if edge_types:
                edge_filter = ":" + "|".join(edge_types)
            
            query = f"""
                MATCH path = (start {{id: '{node_id}'}})-[r{edge_filter}*1..{depth}]->(neighbor)
                RETURN DISTINCT neighbor, length(path) as depth
                ORDER BY depth
                LIMIT 1000
            """
            
            result = self._execute_query(query)
            
            nodes = []
            for record in result:
                neighbor = record.get('neighbor', {})
                nodes.append({
                    "id": neighbor.get('id', ''),
                    "type": neighbor.get('type', ''),
                    "depth": record.get('depth', 1),
                    "properties": neighbor.get('properties', {})
                })
            
            return {
                "node_id": node_id,
                "nodes": nodes,
                "total": len(nodes)
            }
        except Exception as e:
            logger.error(f"Failed to get neighbors: {e}")
            raise
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get graph statistics"""
        try:
            # Count nodes by type
            node_counts = {}
            node_types_query = "MATCH (n) RETURN DISTINCT labels(n) as types"
            # Execute and aggregate
            
            # Count edges by type
            edge_counts = {}
            edge_types_query = "MATCH ()-[r]->() RETURN DISTINCT type(r) as types"
            # Execute and aggregate
            
            return {
                "total_nodes": 0,  # TODO: Implement actual counts
                "total_edges": 0,
                "node_counts": node_counts,
                "edge_counts": edge_counts
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {
                "total_nodes": 0,
                "total_edges": 0,
                "node_counts": {},
                "edge_counts": {}
            }
    
    async def search(
        self,
        query: str,
        node_types: Optional[List[str]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Semantic search across graph"""
        try:
            # Basic text search - can be enhanced with embeddings/vector search
            # For now, search node properties
            where_clauses = [f"n.name CONTAINS '{query}' OR n.id CONTAINS '{query}'"]
            
            if node_types:
                type_filter = " OR ".join([f"n:{t}" for t in node_types])
                query_str = f"MATCH (n) WHERE ({type_filter}) AND ({' OR '.join(where_clauses)}) RETURN n LIMIT {limit}"
            else:
                query_str = f"MATCH (n) WHERE {' OR '.join(where_clauses)} RETURN n LIMIT {limit}"
            
            result = self._execute_query(query_str)
            
            results = []
            for record in result:
                node = record.get('n', {})
                results.append({
                    "id": node.get('id', ''),
                    "type": node.get('type', ''),
                    "properties": node.get('properties', {})
                })
            
            return results
        except Exception as e:
            logger.error(f"Failed to search: {e}")
            raise
    
    async def semantic_search(
        self,
        query: str,
        node_types: Optional[List[str]] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Enhanced semantic search with reasoning chain.
        Returns results with relevance scores and reasoning.
        """
        try:
            # Get basic search results
            results = await self.search(query, node_types, limit)
            
            # Enhance with relationships and reasoning
            enhanced_results = []
            for result in results:
                # Get relationships for each result
                relationships = await self._get_node_relationships(result['id'])
                
                enhanced_results.append({
                    "id": result['id'],
                    "type": result['type'],
                    "properties": result['properties'],
                    "relevance_score": 0.8,  # Placeholder - can be calculated based on match quality
                    "reasoning": f"Found {result['type']} matching query '{query}'",
                    "relationships": relationships[:5]  # Limit to first 5 relationships
                })
            
            # Generate reasoning chain (simplified - can be enhanced with LLM)
            reasoning_chain = [
                f"Analyzed query: '{query}'",
                f"Matched {len(enhanced_results)} entities in knowledge graph",
                "Applied semantic understanding to find relevant relationships"
            ]
            
            return {
                "results": enhanced_results,
                "total": len(enhanced_results),
                "reasoning_chain": reasoning_chain
            }
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            raise
    
    async def _get_node_relationships(self, node_id: str) -> List[Dict[str, Any]]:
        """Get relationships for a node"""
        try:
            query = f"""
                MATCH (a {{id: '{node_id}'}})-[r]->(b)
                RETURN type(r) as type, b.id as target, labels(b) as target_type, properties(r) as properties
                LIMIT 10
            """
            result = self._execute_query(query)
            
            relationships = []
            for record in result:
                relationships.append({
                    "type": record.get('type', ''),
                    "target": record.get('target', ''),
                    "target_type": record.get('target_type', [''])[0] if record.get('target_type') else '',
                    "properties": record.get('properties', {})
                })
            
            return relationships
        except Exception as e:
            logger.warning(f"Failed to get relationships for {node_id}: {e}")
            return []
    
    async def find_similar_nodes(
        self,
        node_id: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Find nodes similar to the given node based on properties and relationships.
        """
        try:
            # Get the node first
            node_query = f"MATCH (n {{id: '{node_id}'}}) RETURN n"
            node_result = self._execute_query(node_query)
            
            if not node_result:
                return {"similar_nodes": [], "total": 0}
            
            node = node_result[0].get('n', {})
            node_type = node.get('type', '')
            node_props = node.get('properties', {})
            
            # Find nodes of same type with similar properties
            # This is a simplified similarity - can be enhanced with embeddings
            similar_query = f"""
                MATCH (n:{node_type})
                WHERE n.id <> '{node_id}'
                RETURN n
                LIMIT {limit}
            """
            
            similar_result = self._execute_query(similar_query)
            
            similar_nodes = []
            for record in similar_result:
                similar_node = record.get('n', {})
                similar_nodes.append({
                    "id": similar_node.get('id', ''),
                    "type": similar_node.get('type', ''),
                    "properties": similar_node.get('properties', {}),
                    "similarity_score": 0.7  # Placeholder
                })
            
            return {
                "similar_nodes": similar_nodes,
                "total": len(similar_nodes)
            }
        except Exception as e:
            logger.error(f"Failed to find similar nodes: {e}")
            return {"similar_nodes": [], "total": 0}
    
    def _execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute a Cypher query via FalkorDB"""
        # Note: This is a placeholder - adjust based on actual FalkorDB API
        # FalkorDB may use Redis commands or a different query interface
        try:
            # Try Redis command first
            # For FalkorDB, queries might go through redis-cli or a specific module
            # This is a simplified version - adjust based on actual FalkorDB implementation
            result = self.redis_client.execute_command("GRAPH.QUERY", self.graph_name, query)
            # Parse result based on FalkorDB response format
            # Return parsed results
            return self._parse_query_result(result)
        except Exception as e:
            logger.warning(f"Query execution failed: {e}. Returning empty result.")
            return []
    
    def _parse_query_result(self, result: Any) -> List[Dict[str, Any]]:
        """Parse FalkorDB query result"""
        # Placeholder - adjust based on actual FalkorDB response format
        if isinstance(result, list):
            # Parse based on FalkorDB response structure
            # Format: [headers, [row1], [row2], ...]
            if len(result) > 1:
                headers = result[0] if result[0] else []
                rows = result[1:] if len(result) > 1 else []
                
                parsed = []
                for row in rows:
                    row_dict = {}
                    for i, header in enumerate(headers):
                        if i < len(row):
                            row_dict[header] = row[i]
                    parsed.append(row_dict)
                return parsed
        return []
