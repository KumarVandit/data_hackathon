import { useState, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer, HeatmapLayer, BitmapLayer } from '@deck.gl/layers'
import { TileLayer } from '@deck.gl/geo-layers'
import { useGeographicData } from '../hooks/useGeographicData'
import MapControls from '../components/map/MapControls'
import { Loader2 } from 'lucide-react'
import { createH3HexagonLayer } from '../components/map/H3HexagonLayer'

const INITIAL_VIEW_STATE = {
  longitude: 77.2090, // Delhi
  latitude: 28.6139,
  zoom: 5,
  pitch: 45,
  bearing: 0,
}

export default function Map3DView() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [layerType, setLayerType] = useState<'scatter' | 'arc' | 'heatmap' | 'h3'>('h3')
  const [h3Resolution, setH3Resolution] = useState(7) // H3 resolution (0-15, 7 is good for city-level)
  const [showAnomalies, setShowAnomalies] = useState(true)
  const [showPatterns, setShowPatterns] = useState(true)
  const { geographicData, isLoading } = useGeographicData()

  const layers = useMemo(() => {
    const layers_array: any[] = []

    // Geographic points layer
    if (geographicData && geographicData.length > 0) {
      if (layerType === 'h3') {
        // H3 Hexagon Layer - best for aggregation and heatmaps
        layers_array.push(
          createH3HexagonLayer(geographicData, h3Resolution)
        )
      } else if (layerType === 'scatter') {
        layers_array.push(
          new ScatterplotLayer({
            id: 'geographic-points',
            data: geographicData,
            getPosition: (d: any) => {
              // Use pincode coordinates - in real implementation, geocode pincodes
              // For now, using approximate coordinates
              return [d.longitude || 0, d.latitude || 0, 0]
            },
            getRadius: (d: any) => Math.max(100, (d.total_creation || 0) / 100),
            getFillColor: (d: any) => {
              if (d.anomaly_score > 70) return [236, 72, 153, 200] // pink - high anomaly
              if (d.anomaly_score > 40) return [239, 68, 68, 150] // red - medium
              return [99, 102, 241, 100] // indigo - normal
            },
            radiusMinPixels: 3,
            radiusMaxPixels: 50,
            pickable: true,
            opacity: 0.8,
          })
        )
      } else if (layerType === 'heatmap') {
        layers_array.push(
          new HeatmapLayer({
            id: 'geographic-heatmap',
            data: geographicData,
            getPosition: (d: any) => [d.longitude || 0, d.latitude || 0],
            getWeight: (d: any) => d.anomaly_score || 0,
            radiusPixels: 50,
            intensity: 1,
            threshold: 0.5,
          })
        )
      }
    }

    // Anomalies layer (if enabled)
    // Arc layer for connections between related anomalies

    // Add OpenStreetMap tile layer as base map
    // Using TileLayer with BitmapLayer for rendering OSM tiles
    layers_array.unshift(
      new TileLayer({
        id: 'osm-tiles',
        data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: (props: any) => {
          const { bbox, tile } = props
          return new BitmapLayer(props, {
            data: undefined,
            image: tile,
            bounds: bbox,
          })
        },
      })
    )

    return layers_array
  }, [geographicData, layerType, h3Resolution, showAnomalies, showPatterns])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-atlas-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading geographic data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full relative">
      {/* 3D Map */}
      <div className="flex-1 relative">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState }) => setViewState(viewState)}
          controller={true}
          layers={layers}
          getTooltip={({ object }) => {
            if (!object) return null
            if (object.hexId) {
              // H3 hexagon tooltip
              return {
                html: `
                  <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px;">
                    <strong>H3 Hexagon: ${object.hexId}</strong><br/>
                    Count: ${object.count || 0}<br/>
                    Anomaly Score: ${(object.anomaly_score || 0).toFixed(1)}<br/>
                    Total Creation: ${object.total_creation || 0}
                  </div>
                `,
                style: {
                  fontSize: '12px',
                }
              }
            }
            // Regular point tooltip
            return {
              html: `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px;">
                  <strong>Location</strong><br/>
                  Anomaly Score: ${(object.anomaly_score || 0).toFixed(1)}<br/>
                  Total Creation: ${object.total_creation || 0}
                </div>
              `,
              style: {
                fontSize: '12px',
              }
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10">
        <MapControls
          layerType={layerType}
          h3Resolution={h3Resolution}
          showAnomalies={showAnomalies}
          showPatterns={showPatterns}
          onLayerTypeChange={setLayerType}
          onH3ResolutionChange={setH3Resolution}
          onAnomaliesToggle={setShowAnomalies}
          onPatternsToggle={setShowPatterns}
        />
      </div>
    </div>
  )
}
