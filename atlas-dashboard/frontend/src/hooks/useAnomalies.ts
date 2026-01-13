import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Anomaly {
  id: string
  tension_type: string
  description: string
  location_id: string
  detected_at: string
  severity: number
  z_score: number
  is_reviewed: boolean
  analyst_notes?: string
  expected_value: number
  observed_value: number
  deviation_magnitude: number
  contributing_factors?: Record<string, any>
  location_name?: string
  state?: string
  district?: string
  pincode?: string
}

export interface AnomaliesResponse {
  anomalies: Anomaly[]
  total: number
  offset: number
  limit: number
}

export function useAnomalies(
  offset: number = 0,
  limit: number = 100,
  filters?: {
    tension_type?: string
    severity_min?: number
    severity_max?: number
    is_reviewed?: boolean
    state?: string
    district?: string
  }
) {
  return useQuery<AnomaliesResponse>({
    queryKey: ['anomalies', offset, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      })
      
      if (filters?.tension_type) {
        params.append('tension_type', filters.tension_type)
      }
      if (filters?.severity_min !== undefined) {
        params.append('severity_min', filters.severity_min.toString())
      }
      if (filters?.severity_max !== undefined) {
        params.append('severity_max', filters.severity_max.toString())
      }
      if (filters?.is_reviewed !== undefined) {
        params.append('is_reviewed', filters.is_reviewed.toString())
      }
      if (filters?.state) {
        params.append('state', filters.state)
      }
      if (filters?.district) {
        params.append('district', filters.district)
      }
      
      const response = await api.get(`/api/anomalies?${params.toString()}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useAnomaly(id: string) {
  return useQuery<Anomaly>({
    queryKey: ['anomaly', id],
    queryFn: async () => {
      const response = await api.get(`/api/anomalies/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}
