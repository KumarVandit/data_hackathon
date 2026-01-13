import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Cluster {
  id: string
  cluster_id: number
  cluster_type: 'geographic' | 'anomaly' | 'pattern' | 'threat'
  name?: string
  description?: string
  size: number
  centroid?: {
    latitude: number
    longitude: number
  }
  members: string[] // IDs of entities in this cluster
  properties?: {
    avg_severity?: number
    avg_anomaly_score?: number
    common_tension_types?: string[]
    geographic_spread?: number
    [key: string]: any
  }
  created_at?: string
}

export interface ClusterStats {
  total_clusters: number
  by_type: Record<string, number>
  avg_cluster_size: number
  largest_cluster: {
    id: string
    size: number
    type: string
  }
}

export interface ClustersResponse {
  clusters: Cluster[]
  total: number
  offset: number
  limit: number
  stats?: ClusterStats
}

export function useClusters(
  offset: number = 0,
  limit: number = 50,
  filters?: {
    cluster_type?: string
    min_size?: number
    max_size?: number
  }
) {
  return useQuery<ClustersResponse>({
    queryKey: ['clusters', offset, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      })
      
      if (filters?.cluster_type) {
        params.append('cluster_type', filters.cluster_type)
      }
      if (filters?.min_size !== undefined) {
        params.append('min_size', filters.min_size.toString())
      }
      if (filters?.max_size !== undefined) {
        params.append('max_size', filters.max_size.toString())
      }
      
      const response = await api.get(`/api/clusters?${params.toString()}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useCluster(id: string) {
  return useQuery<Cluster>({
    queryKey: ['cluster', id],
    queryFn: async () => {
      const response = await api.get(`/api/clusters/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useClusterStats() {
  return useQuery<ClusterStats>({
    queryKey: ['cluster-stats'],
    queryFn: async () => {
      const response = await api.get(`/api/clusters/stats/summary`)
      return response.data
    },
    staleTime: 60000, // 1 minute
  })
}
