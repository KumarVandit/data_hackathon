import { H3HexagonLayer } from '@deck.gl/geo-layers'
import { h3ToGeoBoundary, latLngToCell } from 'h3-js'
import type { Layer } from '@deck.gl/core'

/**
 * H3 Hexagon Layer for Deck.gl
 * Uses Uber's H3 hexagonal grid for efficient geographic aggregation
 * 
 * Benefits:
 * - Uniform hexagon sizes (better than irregular polygons)
 * - Hierarchical resolutions (zoom in/out)
 * - Fast spatial queries
 * - Perfect for heatmaps and aggregation
 */
export function createH3HexagonLayer(data: any[], resolution: number = 7): H3HexagonLayer {
  // Aggregate data by H3 hexagon
  const hexData = aggregateByH3(data, resolution)
  
  if (hexData.length === 0) {
    // Return empty layer if no data
    return new H3HexagonLayer({
      id: 'h3-hexagons',
      data: [],
      getHexagon: () => '',
    })
  }
  
  return new H3HexagonLayer({
    id: 'h3-hexagons',
    data: hexData,
    getHexagon: (d: any) => d.hexId,
    getFillColor: (d: any) => {
      // Color based on anomaly score or count
      const score = d.anomaly_score || 0
      if (score > 70) return [236, 72, 153, 200] // pink - high
      if (score > 40) return [239, 68, 68, 150] // red - medium
      if (score > 20) return [251, 146, 60, 120] // orange - low
      return [99, 102, 241, 80] // indigo - normal
    },
    getElevation: (d: any) => {
      // Elevation based on data count or severity
      return Math.min((d.count || 0) * 100, 5000) // Scale elevation, cap at 5000m
    },
    elevationScale: 1,
    extruded: true,
    pickable: true,
    opacity: 0.8,
    wireframe: false,
  })
}

/**
 * Aggregate geographic data points into H3 hexagons
 */
function aggregateByH3(data: any[], resolution: number) {
  const hexMap = new Map<string, any>()
  
  for (const point of data) {
    // Convert lat/lng to H3 hexagon
    const lat = point.latitude || point.lat || 0
    const lng = point.longitude || point.lng || 0
    
    if (lat === 0 && lng === 0) continue // Skip invalid coordinates
    
    try {
      const hexId = latLngToCell(lat, lng, resolution)
      
      if (!hexMap.has(hexId)) {
        hexMap.set(hexId, {
          hexId,
          count: 0,
          anomaly_score: 0,
          total_creation: 0,
          locations: [],
        })
      }
      
      const hex = hexMap.get(hexId)!
      hex.count += 1
      hex.anomaly_score = Math.max(hex.anomaly_score, point.anomaly_score || 0)
      hex.total_creation += point.total_creation || 0
      hex.locations.push(point)
    } catch (e) {
      console.warn('Failed to convert to H3:', e)
    }
  }
  
  return Array.from(hexMap.values())
}

/**
 * Get H3 hexagon boundary for visualization
 */
export function getH3Boundary(hexId: string) {
  try {
    const boundary = h3ToGeoBoundary(hexId, true)
    return boundary.map(([lat, lng]) => [lng, lat]) // Convert to [lng, lat] for Deck.gl
  } catch (e) {
    console.warn('Failed to get H3 boundary:', e)
    return []
  }
}
