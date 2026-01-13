import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Threat {
  id: string
  threat_type: string
  title: string
  narrative: string
  severity_level: number // 1-5
  confidence: number // 0-1
  first_detected: string
  last_updated: string
  status: 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'FALSE_POSITIVE'
  related_tensions?: string[]
  related_signatures?: string[]
  affected_locations?: string[]
  affected_lifecycles?: string[]
  geographic_spread?: number
  temporal_span_days?: number
  estimated_entities_involved?: number
  properties?: Record<string, any>
}

export interface ThreatsResponse {
  threats: Threat[]
  total: number
}

export function useThreats(
  limit: number = 50,
  filters?: {
    threat_type?: string
    severity_min?: number
    severity_max?: number
    status?: string
    min_confidence?: number
  }
) {
  return useQuery<ThreatsResponse>({
    queryKey: ['threats', limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
      })
      
      if (filters?.threat_type) {
        params.append('threat_type', filters.threat_type)
      }
      if (filters?.severity_min !== undefined) {
        params.append('severity_min', filters.severity_min.toString())
      }
      if (filters?.severity_max !== undefined) {
        params.append('severity_max', filters.severity_max.toString())
      }
      if (filters?.status) {
        params.append('status', filters.status)
      }
      if (filters?.min_confidence !== undefined) {
        params.append('min_confidence', filters.min_confidence.toString())
      }
      
      const response = await api.get(`/api/threats?${params.toString()}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useThreat(id: string) {
  return useQuery<Threat>({
    queryKey: ['threat', id],
    queryFn: async () => {
      const response = await api.get(`/api/threats/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useThreatStats() {
  return useQuery<{
    total_threats: number
    by_type: Record<string, number>
    by_status: Record<string, number>
    avg_severity: number
    avg_confidence: number
    most_severe: {
      id: string
      severity_level: number
      threat_type: string
    }
  }>({
    queryKey: ['threat-stats'],
    queryFn: async () => {
      const response = await api.get(`/api/threats/stats/summary`)
      return response.data
    },
    staleTime: 60000, // 1 minute
  })
}
