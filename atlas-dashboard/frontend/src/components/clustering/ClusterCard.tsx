import { Network, MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { Cluster } from '../../hooks/useClusters'
import { clsx } from 'clsx'

interface ClusterCardProps {
  cluster: Cluster
  onClick?: () => void
}

const CLUSTER_TYPE_COLORS: Record<string, string> = {
  geographic: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  anomaly: 'bg-red-500/20 text-red-300 border-red-500/30',
  pattern: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  threat: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

const SIZE_COLORS: Record<string, string> = {
  large: 'bg-purple-500/20 text-purple-300 border-purple-500',
  medium: 'bg-indigo-500/20 text-indigo-300 border-indigo-500',
  small: 'bg-slate-500/20 text-slate-300 border-slate-500',
}

function getSizeCategory(size: number): string {
  if (size >= 50) return 'large'
  if (size >= 10) return 'medium'
  return 'small'
}

function formatClusterType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function ClusterCard({ cluster, onClick }: ClusterCardProps) {
  const typeColor = CLUSTER_TYPE_COLORS[cluster.cluster_type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  const sizeCategory = getSizeCategory(cluster.size)
  const sizeColor = SIZE_COLORS[sizeCategory]

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
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-5 h-5 text-atlas-primary" />
            <h3 className="font-semibold text-white text-lg">
              {cluster.name || `Cluster ${cluster.cluster_id}`}
            </h3>
          </div>
          {cluster.description && (
            <p className="text-slate-400 text-sm line-clamp-2">{cluster.description}</p>
          )}
        </div>
        <div className={clsx('px-3 py-1 rounded-full text-xs font-medium border', sizeColor)}>
          {sizeCategory.toUpperCase()}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{cluster.size} members</span>
        </div>
        {cluster.centroid && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>
              {cluster.centroid.latitude.toFixed(2)}, {cluster.centroid.longitude.toFixed(2)}
            </span>
          </div>
        )}
        {cluster.properties?.avg_severity !== undefined && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Avg Severity: {cluster.properties.avg_severity.toFixed(1)}</span>
          </div>
        )}
        {cluster.properties?.geographic_spread !== undefined && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Spread: {cluster.properties.geographic_spread} locations</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {cluster.properties && Object.keys(cluster.properties).length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
          {cluster.properties.avg_anomaly_score !== undefined && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Avg Anomaly Score</div>
              <div className="text-lg font-semibold text-white">
                {cluster.properties.avg_anomaly_score.toFixed(1)}
              </div>
            </div>
          )}
          {cluster.properties.common_tension_types && cluster.properties.common_tension_types.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Common Types</div>
              <div className="text-lg font-semibold text-slate-300">
                {cluster.properties.common_tension_types.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx('px-2 py-1 rounded text-xs border', typeColor)}>
          {formatClusterType(cluster.cluster_type)}
        </span>
        {cluster.centroid && (
          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/30">
            Has Location
          </span>
        )}
      </div>
    </div>
  )
}
