import { useState } from 'react'
import { useThreats, useThreatStats, Threat } from '../hooks/useThreats'
import ThreatCard from '../components/threats/ThreatCard'
import ThreatFilters from '../components/threats/ThreatFilters'
import ThreatDetails from '../components/threats/ThreatDetails'
import { Loader2, AlertCircle, Shield, TrendingUp } from 'lucide-react'

export default function ThreatsView() {
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null)
  const [filters, setFilters] = useState<{
    threat_type?: string
    severity_min?: number
    severity_max?: number
    status?: string
    min_confidence?: number
  }>({})

  const { data, isLoading, error } = useThreats(100, filters)
  const { data: stats } = useThreatStats()

  const handleViewInGraph = (threatId: string) => {
    // Navigate to graph view with threat selected
    console.log('View threat in graph:', threatId)
  }

  const handleViewInMap = (threatId: string) => {
    // Navigate to map view with threat selected
    console.log('View threat in map:', threatId)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-atlas-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading threats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Failed to load threats</p>
          <p className="text-slate-400 text-sm mt-2">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!data || data.threats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No threats found</p>
          <p className="text-slate-500 text-sm mt-2">
            {Object.keys(filters).length > 0
              ? 'Try adjusting your filters'
              : 'Threats will appear here after data processing'}
          </p>
        </div>
      </div>
    )
  }

  // Sort threats by severity (highest first)
  const sortedThreats = [...data.threats].sort((a, b) => b.severity_level - a.severity_level)

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Emergent Threats</h1>
            <p className="text-slate-400">
              {data.total} {data.total === 1 ? 'threat' : 'threats'} detected
            </p>
          </div>
          <ThreatFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Total Threats
              </div>
              <div className="text-2xl font-bold text-white">{stats.total_threats}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Avg Severity
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.avg_severity.toFixed(1)}/5</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1">Most Severe</div>
              <div className="text-2xl font-bold text-pink-400">{stats.most_severe.severity_level}/5</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.most_severe.threat_type.replace(/_/g, ' ').toLowerCase()}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1">Avg Confidence</div>
              <div className="text-2xl font-bold text-indigo-400">
                {(stats.avg_confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Status & Type Breakdown */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            {stats.by_status && Object.keys(stats.by_status).length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Threats by Status</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                        {status}
                      </span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.by_type && Object.keys(stats.by_type).length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Threats by Type</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                        {type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Threats Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedThreats.map((threat) => (
            <ThreatCard
              key={threat.id}
              threat={threat}
              onClick={() => setSelectedThreat(threat)}
            />
          ))}
        </div>
      </div>

      {/* Threat Details Modal */}
      {selectedThreat && (
        <ThreatDetails
          threat={selectedThreat}
          onClose={() => setSelectedThreat(null)}
          onViewInGraph={handleViewInGraph}
          onViewInMap={handleViewInMap}
        />
      )}
    </div>
  )
}
