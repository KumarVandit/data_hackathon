import { X, Shield, AlertTriangle, MapPin, Clock, Users, Activity, ExternalLink, FileText } from 'lucide-react'
import { Threat } from '../../hooks/useThreats'
import { clsx } from 'clsx'

interface ThreatDetailsProps {
  threat: Threat
  onClose: () => void
  onViewInGraph?: (threatId: string) => void
  onViewInMap?: (threatId: string) => void
}

function formatThreatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

const SEVERITY_LABELS: Record<number, string> = {
  5: 'Critical',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Minimal',
}

export default function ThreatDetails({
  threat,
  onClose,
  onViewInGraph,
  onViewInMap,
}: ThreatDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-pink-500" />
              <h2 className="text-2xl font-bold text-white">{threat.title}</h2>
            </div>
            <p className="text-slate-400">{threat.narrative}</p>
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
                <AlertTriangle className="w-4 h-4" />
                Severity Level
              </div>
              <div className="text-3xl font-bold text-white">{threat.severity_level}/5</div>
              <div className="text-xs text-slate-500 mt-1">{SEVERITY_LABELS[threat.severity_level] || 'Unknown'}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Confidence</div>
              <div className="text-3xl font-bold text-white">{(threat.confidence * 100).toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">statistical confidence</div>
            </div>
          </div>

          {/* Status & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Status</div>
              <div className="text-xl font-semibold text-white">{threat.status}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Threat Type</div>
              <div className="text-xl font-semibold text-white">{formatThreatType(threat.threat_type)}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>First Detected:</span>
                <span className="font-mono">{new Date(threat.first_detected).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-mono">{new Date(threat.last_updated).toLocaleString()}</span>
              </div>
              {threat.temporal_span_days !== undefined && (
                <div className="flex justify-between">
                  <span>Temporal Span:</span>
                  <span>{threat.temporal_span_days} days</span>
                </div>
              )}
            </div>
          </div>

          {/* Scope */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Threat Scope
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {threat.geographic_spread !== undefined && (
                <div>
                  <div className="text-slate-400 mb-1">Geographic Spread</div>
                  <div className="text-2xl font-bold text-blue-400">{threat.geographic_spread} locations</div>
                </div>
              )}
              {threat.estimated_entities_involved !== undefined && (
                <div>
                  <div className="text-slate-400 mb-1">Estimated Entities</div>
                  <div className="text-2xl font-bold text-purple-400">{threat.estimated_entities_involved}</div>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Chain */}
          {(threat.related_tensions && threat.related_tensions.length > 0) ||
          (threat.related_signatures && threat.related_signatures.length > 0) ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evidence Chain
              </h3>
              <div className="space-y-4">
                {threat.related_tensions && threat.related_tensions.length > 0 && (
                  <div>
                    <div className="text-slate-400 mb-2">Related Tensions ({threat.related_tensions.length})</div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {threat.related_tensions.slice(0, 20).map((tensionId, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono"
                        >
                          {tensionId}
                        </div>
                      ))}
                      {threat.related_tensions.length > 20 && (
                        <div className="text-sm text-slate-400 text-center py-2">
                          ... and {threat.related_tensions.length - 20} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {threat.related_signatures && threat.related_signatures.length > 0 && (
                  <div>
                    <div className="text-slate-400 mb-2">Related Patterns ({threat.related_signatures.length})</div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {threat.related_signatures.slice(0, 20).map((signatureId, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono"
                        >
                          {signatureId}
                        </div>
                      ))}
                      {threat.related_signatures.length > 20 && (
                        <div className="text-sm text-slate-400 text-center py-2">
                          ... and {threat.related_signatures.length - 20} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Affected Locations */}
          {threat.affected_locations && threat.affected_locations.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Affected Locations ({threat.affected_locations.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {threat.affected_locations.slice(0, 50).map((locationId, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono"
                  >
                    {locationId}
                  </div>
                ))}
                {threat.affected_locations.length > 50 && (
                  <div className="text-sm text-slate-400 text-center py-2">
                    ... and {threat.affected_locations.length - 50} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Affected Lifecycles */}
          {threat.affected_lifecycles && threat.affected_lifecycles.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Affected Lifecycles ({threat.affected_lifecycles.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {threat.affected_lifecycles.slice(0, 50).map((lifecycleId, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 font-mono"
                  >
                    {lifecycleId}
                  </div>
                ))}
                {threat.affected_lifecycles.length > 50 && (
                  <div className="text-sm text-slate-400 text-center py-2">
                    ... and {threat.affected_lifecycles.length - 50} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {onViewInGraph && (
              <button
                onClick={() => {
                  onViewInGraph(threat.id)
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-atlas-primary hover:bg-atlas-primary/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View in Graph
              </button>
            )}
            {onViewInMap && threat.affected_locations && threat.affected_locations.length > 0 && (
              <button
                onClick={() => {
                  onViewInMap(threat.id)
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
