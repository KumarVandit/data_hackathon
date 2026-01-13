import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface SemanticSearchResult {
  id: string
  type: string
  properties: Record<string, any>
  relevance_score?: number
  reasoning?: string
  relationships?: {
    type: string
    target: string
    target_type: string
    properties?: Record<string, any>
  }[]
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[]
  total: number
  query: string
  reasoning_chain?: string[]
}

export function useSemanticSearch(
  query: string,
  nodeTypes?: string[],
  enabled: boolean = true
) {
  return useQuery<SemanticSearchResponse>({
    queryKey: ['semantic-search', query, nodeTypes],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query })
      if (nodeTypes && nodeTypes.length > 0) {
        params.append('node_types', nodeTypes.join(','))
      }
      const response = await api.get(`/api/search?${params.toString()}`)
      return response.data
    },
    enabled: enabled && query.length > 0,
    staleTime: 30000,
  })
}

export function useNodeNeighbors(nodeId: string, depth: number = 1) {
  return useQuery({
    queryKey: ['node-neighbors', nodeId, depth],
    queryFn: async () => {
      const response = await api.get(`/api/graph/neighbors/${nodeId}`, {
        params: { depth },
      })
      return response.data
    },
    enabled: !!nodeId,
    staleTime: 30000,
  })
}

export function useSimilarNodes(nodeId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['similar-nodes', nodeId, limit],
    queryFn: async () => {
      const response = await api.get(`/api/graph/similar/${nodeId}`, {
        params: { limit },
      })
      return response.data
    },
    enabled: !!nodeId,
    staleTime: 60000,
  })
}
