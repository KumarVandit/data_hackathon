import { X, MapPin, Clock, TrendingUp, AlertTriangle, FileText, ExternalLink } from 'lucide-react'
import { Anomaly } from '../../hooks/useAnomalies'
import { clsx } from 'clsx'

interface AnomalyDetailsProps {
  anomaly: Anomaly
  onClose: () => void
  onViewInGraph?: (anomalyId: string) => void
}

function formatTensionType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export default function AnomalyDetails({ anomaly, onClose, onViewInGraph }: AnomalyDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">{formatTensionType(anomaly.tension_type)}</h2>
            </div>
            <p className="text-slate-400">{anomaly.description}</p>
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
              <div className="text-sm text-slate-400 mb-1">Severity</div>
              <div className="text-3xl font-bold text-white">{anomaly.severity.toFixed(0)}</div>
              <div className="text-xs text-slate-500 mt-1">Out of 100</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Z-Score</div>
              <div className="text-3xl font-bold text-white">{anomaly.z_score.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Standard deviations</div>
            </div>
          </div>

          {/* Values Comparison */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Value Comparison</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Expected Value</span>
                <span className="text-lg font-semibold text-slate-300">{anomaly.expected_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Observed Value</span>
                <span className="text-lg font-semibold text-red-400">{anomaly.observed_value.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Deviation</span>
                <span className="text-lg font-semibold text-yellow-400">
                  {anomaly.deviation_magnitude.toFixed(2)} ({((anomaly.deviation_magnitude / anomaly.expected_value) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h3>
            <div className="space-y-2 text-slate-300">
              {anomaly.location_name && <div>Name: {anomaly.location_name}</div>}
              {anomaly.state && <div>State: {anomaly.state}</div>}
              {anomaly.district && <div>District: {anomaly.district}</div>}
              {anomaly.pincode && <div>Pincode: {anomaly.pincode}</div>}
              <div className="text-sm text-slate-400">ID: {anomaly.location_id}</div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Detection Time
            </h3>
            <div className="text-slate-300">
              <div>{new Date(anomaly.detected_at).toLocaleString()}</div>
              <div className="text-sm text-slate-400 mt-1">
                {Math.floor((Date.now() - new Date(anomaly.detected_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </div>
            </div>
          </div>

          {/* Contributing Factors */}
          {anomaly.contributing_factors && Object.keys(anomaly.contributing_factors).length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Contributing Factors
              </h3>
              <div className="space-y-2">
                {Object.entries(anomaly.contributing_factors).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-slate-300">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Notes */}
          {anomaly.analyst_notes && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Analyst Notes
              </h3>
              <p className="text-slate-300 whitespace-pre-wrap">{anomaly.analyst_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {onViewInGraph && (
              <button
                onClick={() => {
                  onViewInGraph(anomaly.id)
                  onClose()
                }}
                className="flex-1 px-4 py-2 bg-atlas-primary hover:bg-atlas-primary/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View in Graph
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
