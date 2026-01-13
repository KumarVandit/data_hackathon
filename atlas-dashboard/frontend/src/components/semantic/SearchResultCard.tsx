import { Network, MapPin, Activity, Shield, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react'
import { SemanticSearchResult } from '../../hooks/useSemanticSearch'
import { clsx } from 'clsx'

interface SearchResultCardProps {
  result: SemanticSearchResult
  onClick?: () => void
  onExploreNeighbors?: () => void
}

const NODE_TYPE_ICONS: Record<string, any> = {
  GeographicSoul: MapPin,
  IdentityLifecycle: Network,
  SystemicTension: AlertTriangle,
  BehavioralSignature: Activity,
  EmergentThreat: Shield,
}

const NODE_TYPE_COLORS: Record<string, string> = {
  GeographicSoul: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  IdentityLifecycle: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  SystemicTension: 'text-red-400 border-red-500/30 bg-red-500/10',
  BehavioralSignature: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  EmergentThreat: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
}

export default function SearchResultCard({
  result,
  onClick,
  onExploreNeighbors,
}: SearchResultCardProps) {
  const Icon = NODE_TYPE_ICONS[result.type] || Network
  const colorClass = NODE_TYPE_COLORS[result.type] || 'text-slate-400 border-slate-500/30 bg-slate-500/10'

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 cursor-pointer',
        'hover:border-atlas-primary/50 hover:bg-slate-800/70 transition-all',
        'flex flex-col gap-3'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={clsx('p-2 rounded-lg border', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg truncate">{result.id}</h3>
            <p className="text-sm text-slate-400">{result.type}</p>
          </div>
        </div>
        {result.relevance_score !== undefined && (
          <div className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
            {(result.relevance_score * 100).toFixed(0)}% match
          </div>
        )}
      </div>

      {/* Reasoning */}
      {result.reasoning && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded p-3">
          <p className="text-xs text-slate-400 mb-1">Reasoning:</p>
          <p className="text-sm text-slate-300">{result.reasoning}</p>
        </div>
      )}

      {/* Key Properties */}
      {result.properties && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(result.properties)
            .slice(0, 5)
            .map(([key, value]) => (
              <div
                key={key}
                className="px-2 py-1 rounded text-xs bg-slate-700/50 text-slate-300 border border-slate-600/50"
              >
                <span className="text-slate-400">{key}:</span> {String(value).slice(0, 30)}
                {String(value).length > 30 ? '...' : ''}
              </div>
            ))}
        </div>
      )}

      {/* Relationships */}
      {result.relationships && result.relationships.length > 0 && (
        <div className="border-t border-slate-700/50 pt-3">
          <p className="text-xs text-slate-400 mb-2">
            {result.relationships.length} relationship{result.relationships.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.relationships.slice(0, 3).map((rel, idx) => (
              <div
                key={idx}
                className="px-2 py-1 rounded text-xs bg-slate-700/30 text-slate-400 border border-slate-600/30"
              >
                {rel.type} → {rel.target_type}
              </div>
            ))}
            {result.relationships.length > 3 && (
              <div className="px-2 py-1 rounded text-xs bg-slate-700/30 text-slate-500 border border-slate-600/30">
                +{result.relationships.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-slate-700/50">
        {onExploreNeighbors && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExploreNeighbors()
            }}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Network className="w-4 h-4" />
            Explore Neighbors
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          className="px-3 py-2 bg-atlas-primary hover:bg-atlas-primary/80 text-white rounded text-sm transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  )
}
