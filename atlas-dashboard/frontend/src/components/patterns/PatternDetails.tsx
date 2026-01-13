import { X, Activity, MapPin, Calendar, TrendingUp, Clock, Users, BarChart3 } from 'lucide-react'
import { Pattern } from '../../hooks/usePatterns'
import { clsx } from 'clsx'

interface PatternDetailsProps {
  pattern: Pattern
  onClose: () => void
  onViewInGraph?: (patternId: string) => void
  onViewInMap?: (patternId: string) => void
}

function formatSignatureType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export default function PatternDetails({
  pattern,
  onClose,
  onViewInGraph,
  onViewInMap,
}: PatternDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-white">{formatSignatureType(pattern.signature_type)}</h2>
            </div>
            <p className="text-slate-400">{pattern.description}</p>
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
                <TrendingUp className="w-4 h-4" />
                Occurrences
              </div>
              <div className="text-3xl font-bold text-white">{pattern.occurrence_count}</div>
              <div className="text-xs text-slate-500 mt-1">total occurrences</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Confidence</div>
              <div className="text-3xl font-bold text-white">{(pattern.confidence_score * 100).toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">statistical confidence</div>
            </div>
          </div>

          {/* Temporal Information */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Temporal Information
            </h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>First Observed:</span>
                <span className="font-mono">{new Date(pattern.first_observed).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Observed:</span>
                <span className="font-mono">{new Date(pattern.last_observed).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>
                  {Math.floor(
                    (new Date(pattern.last_observed).getTime() - new Date(pattern.first_observed).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </span>
              </div>
            </div>
          </div>

          {/* Temporal Pattern */}
          {pattern.temporal_pattern && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Temporal Pattern
              </h3>
              <div className="space-y-3">
                {pattern.temporal_pattern.day_of_week && (
                  <div>
                    <div className="text-slate-400 mb-2">Days of Week</div>
                    <div className="flex gap-2 flex-wrap">
                      {pattern.temporal_pattern.day_of_week.map((day, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        >
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {pattern.temporal_pattern.hour && (
                  <div>
                    <div className="text-slate-400 mb-2">Hours</div>
                    <div className="flex gap-2 flex-wrap">
                      {pattern.temporal_pattern.hour.map((hour, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        >
                          {hour}:00
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Magnitude Range */}
          {pattern.magnitude_range && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Magnitude Range
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Minimum</span>
                  <span className="text-lg font-semibold text-slate-300">
                    {pattern.magnitude_range.min.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Maximum</span>
                  <span className="text-lg font-semibold text-red-400">
                    {pattern.magnitude_range.max.toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-slate-700 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mean</span>
                  <span className="text-lg font-semibold text-yellow-400">
                    {pattern.magnitude_range.mean.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Affected Age Groups */}
          {pattern.affected_age_groups && pattern.affected_age_groups.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Affected Age Groups
              </h3>
              <div className="flex flex-wrap gap-2">
                {pattern.affected_age_groups.map((group, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Locations Involved */}
          {pattern.locations_involved && pattern.locations_involved.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Locations Involved ({pattern.locations_involved.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {pattern.locations_involved.slice(0, 50).map((locationId, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono"
                  >
                    {locationId}
                  </div>
                ))}
                {pattern.locations_involved.length > 50 && (
                  <div className="text-sm text-slate-400 text-center py-2">
                    ... and {pattern.locations_involved.length - 50} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signature Hash */}
          {pattern.signature_hash && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Signature Hash</h3>
              <div className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono break-all">
                {pattern.signature_hash}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {onViewInGraph && (
              <button
                onClick={() => {
                  onViewInGraph(pattern.id)
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-atlas-primary hover:bg-atlas-primary/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                View in Graph
              </button>
            )}
            {onViewInMap && pattern.locations_involved && pattern.locations_involved.length > 0 && (
              <button
                onClick={() => {
                  onViewInMap(pattern.id)
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
