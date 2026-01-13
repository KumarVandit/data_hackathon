import axios from 'axios'
import { GraphData, GraphNode, GraphEdge } from '../types/graph'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function fetchGraphData(
  nodeType?: string,
  edgeType?: string,
  search?: string
): Promise<GraphData> {
  try {
    const [nodesRes, edgesRes] = await Promise.all([
      api.get('/api/graph/nodes', {
        params: {
          node_type: nodeType !== 'all' ? nodeType : undefined,
          limit: 5000,
        },
      }),
      api.get('/api/graph/edges', {
        params: {
          edge_type: edgeType !== 'all' ? edgeType : undefined,
          limit: 10000,
        },
      }),
    ])

    let nodes: GraphNode[] = nodesRes.data || []
    let edges: GraphEdge[] = edgesRes.data || []

    // Apply search filter if provided
    if (search) {
      const lowerSearch = search.toLowerCase()
      nodes = nodes.filter(
        (node) =>
          node.id.toLowerCase().includes(lowerSearch) ||
          node.type.toLowerCase().includes(lowerSearch) ||
          JSON.stringify(node.properties).toLowerCase().includes(lowerSearch)
      )
      const nodeIds = new Set(nodes.map((n) => n.id))
      edges = edges.filter(
        (edge) =>
          (typeof edge.source === 'string' ? nodeIds.has(edge.source) : nodeIds.has(edge.source.id)) ||
          (typeof edge.target === 'string' ? nodeIds.has(edge.target) : nodeIds.has(edge.target.id))
      )
    }

    return { nodes, edges }
  } catch (error) {
    console.error('Failed to fetch graph data:', error)
    throw error
  }
}

export async function fetchNodeNeighbors(nodeId: string, depth: number = 1) {
  const response = await api.get(`/api/graph/neighbors/${nodeId}`, {
    params: { depth },
  })
  return response.data
}

export async function fetchGraphStats() {
  const response = await api.get('/api/graph/stats')
  return response.data
}

export async function searchGraph(query: string, nodeTypes?: string[]) {
  const response = await api.get('/api/search', {
    params: {
      q: query,
      node_types: nodeTypes?.join(','),
    },
  })
  return response.data
}

// Export api instance for use in hooks
export { api }

export async function fetchAnomalies(limit: number = 100, offset: number = 0) {
  const response = await api.get('/api/data/anomalies', {
    params: { limit, offset },
  })
  return response.data
}

export async function fetchPatterns(limit: number = 100, offset: number = 0) {
  const response = await api.get('/api/data/patterns', {
    params: { limit, offset },
  })
  return response.data
}

export async function fetchThreats(limit: number = 50) {
  const response = await api.get('/api/data/threats', {
    params: { limit },
  })
  return response.data
}

export async function fetchGeographicData(
  state?: string,
  district?: string,
  pincode?: string,
  limit: number = 1000
) {
  const response = await api.get('/api/data/geographic', {
    params: { state, district, pincode, limit },
  })
  return response.data
}
