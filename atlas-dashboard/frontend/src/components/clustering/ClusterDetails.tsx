import { X, Network, MapPin, Users, TrendingUp, AlertTriangle, ExternalLink, List } from 'lucide-react'
import { Cluster } from '../../hooks/useClusters'
import { clsx } from 'clsx'

interface ClusterDetailsProps {
  cluster: Cluster
  onClose: () => void
  onViewInGraph?: (clusterId: string) => void
  onViewInMap?: (clusterId: string) => void
}

function formatClusterType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function ClusterDetails({
  cluster,
  onClose,
  onViewInGraph,
  onViewInMap,
}: ClusterDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Network className="w-6 h-6 text-atlas-primary" />
              <h2 className="text-2xl font-bold text-white">
                {cluster.name || `Cluster ${cluster.cluster_id}`}
              </h2>
            </div>
            {cluster.description && <p className="text-slate-400">{cluster.description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Cluster Size
              </div>
              <div className="text-3xl font-bold text-white">{cluster.size}</div>
              <div className="text-xs text-slate-500 mt-1">members</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Cluster Type</div>
              <div className="text-2xl font-bold text-white">{formatClusterType(cluster.cluster_type)}</div>
              <div className="text-xs text-slate-500 mt-1">classification</div>
            </div>
          </div>

          {/* Centroid Location */}
          {cluster.centroid && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Centroid Location
              </h3>
              <div className="space-y-2 text-slate-300">
                <div>Latitude: {cluster.centroid.latitude.toFixed(4)}</div>
                <div>Longitude: {cluster.centroid.longitude.toFixed(4)}</div>
              </div>
            </div>
          )}

          {/* Properties */}
          {cluster.properties && Object.keys(cluster.properties).length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cluster Properties
              </h3>
              <div className="space-y-3">
                {cluster.properties.avg_severity !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Average Severity</span>
                    <span className="text-lg font-semibold text-red-400">
                      {cluster.properties.avg_severity.toFixed(2)}
                    </span>
                  </div>
                )}
                {cluster.properties.avg_anomaly_score !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Average Anomaly Score</span>
                    <span className="text-lg font-semibold text-yellow-400">
                      {cluster.properties.avg_anomaly_score.toFixed(2)}
                    </span>
                  </div>
                )}
                {cluster.properties.geographic_spread !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Geographic Spread</span>
                    <span className="text-lg font-semibold text-blue-400">
                      {cluster.properties.geographic_spread} locations
                    </span>
                  </div>
                )}
                {cluster.properties.common_tension_types &&
                  cluster.properties.common_tension_types.length > 0 && (
                    <div>
                      <div className="text-slate-400 mb-2">Common Tension Types</div>
                      <div className="flex flex-wrap gap-2">
                        {cluster.properties.common_tension_types.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          >
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Members */}
          {cluster.members && cluster.members.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <List className="w-5 h-5" />
                Cluster Members ({cluster.members.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {cluster.members.slice(0, 50).map((memberId, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono"
                  >
                    {memberId}
                  </div>
                ))}
                {cluster.members.length > 50 && (
                  <div className="text-sm text-slate-400 text-center py-2">
                    ... and {cluster.members.length - 50} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          {cluster.created_at && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Created</h3>
              <div className="text-slate-300">
                <div>{new Date(cluster.created_at).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {onViewInGraph && (
              <button
                onClick={() => {
                  onViewInGraph(cluster.id)
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-atlas-primary hover:bg-atlas-primary/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View in Graph
              </button>
            )}
            {onViewInMap && cluster.centroid && (
              <button
                onClick={() => {
                  onViewInMap(cluster.id)
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                View in Map
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
