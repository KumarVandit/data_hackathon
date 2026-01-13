import { useQuery } from '@tanstack/react-query'
import { fetchGeographicData, fetchAnomalies } from '../services/api'

export function useGeographicData() {
  const { data: geographic, isLoading: geoLoading } = useQuery({
    queryKey: ['geographic-data'],
    queryFn: () => fetchGeographicData(undefined, undefined, undefined, 5000),
  })

  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => fetchAnomalies(1000, 0),
  })

  return {
    geographicData: geographic?.data || [],
    anomalies: anomalies?.anomalies || [],
    isLoading: geoLoading || anomaliesLoading,
  }
}
