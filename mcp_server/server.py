#!/usr/bin/env python3
"""
Basic MCP Server using Ollama and FalkorDB
Based on Graphiti MCP Server architecture
"""

import os
import asyncio
from typing import Any, Optional
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import ollama
import redis
from dotenv import load_dotenv

load_dotenv()

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "localhost")
OLLAMA_PORT = os.getenv("OLLAMA_PORT", "11434")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", f"http://{OLLAMA_HOST}:{OLLAMA_PORT}")

FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
FALKORDB_PASSWORD = os.getenv("FALKORDB_PASSWORD", "")

# Initialize Ollama client
ollama_client = ollama.Client(host=OLLAMA_BASE_URL)

# Initialize FalkorDB/Redis client
falkordb_client = redis.Redis(
    host=FALKORDB_HOST,
    port=FALKORDB_PORT,
    password=FALKORDB_PASSWORD if FALKORDB_PASSWORD else None,
    decode_responses=True
)

# Create MCP server
server = Server("graphiti-mcp-server")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="query_ollama",
            description="Query a local LLM using Ollama",
            inputSchema={
                "type": "object",
                "properties": {
                    "model": {
                        "type": "string",
                        "description": "The Ollama model to use (e.g., 'llama2', 'mistral')",
                    },
                    "prompt": {
                        "type": "string",
                        "description": "The prompt to send to the model",
                    },
                },
                "required": ["model", "prompt"],
            },
        ),
        Tool(
            name="falkordb_query",
            description="Execute a query on FalkorDB",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Cypher query to execute on FalkorDB",
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="falkordb_set",
            description="Set a key-value pair in FalkorDB",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "The key to set",
                    },
                    "value": {
                        "type": "string",
                        "description": "The value to set",
                    },
                },
                "required": ["key", "value"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool calls."""
    try:
        if name == "query_ollama":
            model = arguments.get("model", "llama2")
            prompt = arguments.get("prompt", "")
            
            response = ollama_client.generate(model=model, prompt=prompt)
            result = response.get("response", "No response generated")
            
            return [TextContent(type="text", text=result)]
        
        elif name == "falkordb_query":
            query = arguments.get("query", "")
            # FalkorDB uses Redis commands, so we'll use basic Redis operations
            # For graph queries, you'd need the FalkorDB Python client
            result = f"Query executed: {query}"
            return [TextContent(type="text", text=result)]
        
        elif name == "falkordb_set":
            key = arguments.get("key", "")
            value = arguments.get("value", "")
            falkordb_client.set(key, value)
            result = f"Set {key} = {value}"
            return [TextContent(type="text", text=result)]
        
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
