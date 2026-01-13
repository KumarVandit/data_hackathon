import { Layers, Eye, EyeOff } from 'lucide-react'

interface MapControlsProps {
  layerType: 'scatter' | 'arc' | 'heatmap' | 'h3'
  h3Resolution?: number
  showAnomalies: boolean
  showPatterns: boolean
  onLayerTypeChange: (type: 'scatter' | 'arc' | 'heatmap' | 'h3') => void
  onH3ResolutionChange?: (resolution: number) => void
  onAnomaliesToggle: (show: boolean) => void
  onPatternsToggle: (show: boolean) => void
}

export default function MapControls({
  layerType,
  h3Resolution = 7,
  showAnomalies,
  showPatterns,
  onLayerTypeChange,
  onH3ResolutionChange,
  onAnomaliesToggle,
  onPatternsToggle,
}: MapControlsProps) {
  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-4 space-y-4 min-w-[240px]">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Layers className="w-4 h-4" />
        Map Layers
      </h3>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Layer Type
        </label>
        <div className="space-y-2">
          {(['h3', 'scatter', 'arc', 'heatmap'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onLayerTypeChange(type)}
              className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                layerType === type
                  ? 'bg-atlas-primary text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type === 'h3' ? 'H3 Hexagons' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* H3 Resolution Control */}
      {layerType === 'h3' && onH3ResolutionChange && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            H3 Resolution: {h3Resolution} 
            <span className="text-slate-500 ml-1">
              ({h3Resolution === 0 ? '~110km' : h3Resolution === 7 ? '~0.5km' : h3Resolution === 15 ? '~0.5m' : 'varies'})
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="15"
            value={h3Resolution}
            onChange={(e) => onH3ResolutionChange(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Coarse</span>
            <span>Fine</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => onAnomaliesToggle(!showAnomalies)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 transition-colors"
        >
          <span>Show Anomalies</span>
          {showAnomalies ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onPatternsToggle(!showPatterns)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 transition-colors"
        >
          <span>Show Patterns</span>
          {showPatterns ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
