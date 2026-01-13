import { useQuery } from '@tanstack/react-query'
import { fetchGraphData } from '../services/api'
import { GraphData } from '../types/graph'

export function useGraphData(
  nodeFilter: string = 'all',
  edgeFilter: string = 'all',
  searchQuery: string = ''
) {
  return useQuery<GraphData>({
    queryKey: ['graph', nodeFilter, edgeFilter, searchQuery],
    queryFn: () => fetchGraphData(nodeFilter, edgeFilter, searchQuery),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
