import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Pattern {
  id: string
  signature_type: string
  description: string
  signature_hash?: string
  first_observed: string
  last_observed: string
  occurrence_count: number
  locations_involved: string[]
  confidence_score: number
  temporal_pattern?: {
    day_of_week?: number[]
    hour?: number[]
  }
  magnitude_range?: {
    min: number
    max: number
    mean: number
  }
  affected_age_groups?: string[]
  properties?: Record<string, any>
}

export interface PatternsResponse {
  patterns: Pattern[]
  total: number
  offset: number
  limit: number
}

export function usePatterns(
  offset: number = 0,
  limit: number = 50,
  filters?: {
    signature_type?: string
    min_confidence?: number
    min_occurrences?: number
  }
) {
  return useQuery<PatternsResponse>({
    queryKey: ['patterns', offset, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
      })
      
      if (filters?.signature_type) {
        params.append('signature_type', filters.signature_type)
      }
      if (filters?.min_confidence !== undefined) {
        params.append('min_confidence', filters.min_confidence.toString())
      }
      if (filters?.min_occurrences !== undefined) {
        params.append('min_occurrences', filters.min_occurrences.toString())
      }
      
      const response = await api.get(`/api/patterns?${params.toString()}`)
      return response.data
    },
    staleTime: 30000, // 30 seconds
  })
}

export function usePattern(id: string) {
  return useQuery<Pattern>({
    queryKey: ['pattern', id],
    queryFn: async () => {
      const response = await api.get(`/api/patterns/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function usePatternStats() {
  return useQuery<{
    total_patterns: number
    by_type: Record<string, number>
    avg_confidence: number
    most_frequent: {
      id: string
      occurrence_count: number
      signature_type: string
    }
  }>({
    queryKey: ['pattern-stats'],
    queryFn: async () => {
      const response = await api.get(`/api/patterns/stats/summary`)
      return response.data
    },
    staleTime: 60000, // 1 minute
  })
}
