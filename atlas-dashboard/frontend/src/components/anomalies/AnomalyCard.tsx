import { AlertTriangle, MapPin, Clock, TrendingUp, FileText } from 'lucide-react'
import { Anomaly } from '../../hooks/useAnomalies'
import { clsx } from 'clsx'

interface AnomalyCardProps {
  anomaly: Anomaly
  onClick?: () => void
}

const TENSION_TYPE_COLORS: Record<string, string> = {
  CREATION_WITHOUT_MOTION: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  MOTION_WITHOUT_CREATION: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PERSISTENCE_WITHOUT_PAST: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  DEMOGRAPHIC_MISMATCH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  TEMPORAL_SHOCK: 'bg-red-500/20 text-red-300 border-red-500/30',
  COORDINATED_ANOMALY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border-red-500',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500',
}

function getSeverityLevel(severity: number): string {
  if (severity >= 80) return 'critical'
  if (severity >= 60) return 'high'
  if (severity >= 40) return 'medium'
  return 'low'
}

function formatTensionType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export default function AnomalyCard({ anomaly, onClick }: AnomalyCardProps) {
  const severityLevel = getSeverityLevel(anomaly.severity)
  const tensionColor = TENSION_TYPE_COLORS[anomaly.tension_type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  const severityColor = SEVERITY_COLORS[severityLevel]

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
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-white text-lg">{formatTensionType(anomaly.tension_type)}</h3>
          </div>
          <p className="text-slate-400 text-sm line-clamp-2">{anomaly.description}</p>
        </div>
        <div className={clsx('px-3 py-1 rounded-full text-xs font-medium border', severityColor)}>
          {severityLevel.toUpperCase()}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        {anomaly.location_name && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{anomaly.location_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{new Date(anomaly.detected_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          <span>Z-score: {anomaly.z_score.toFixed(2)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700/50">
        <div>
          <div className="text-xs text-slate-500 mb-1">Severity</div>
          <div className="text-lg font-semibold text-white">{anomaly.severity.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Expected</div>
          <div className="text-lg font-semibold text-slate-300">{anomaly.expected_value.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Observed</div>
          <div className="text-lg font-semibold text-red-400">{anomaly.observed_value.toFixed(1)}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx('px-2 py-1 rounded text-xs border', tensionColor)}>
          {formatTensionType(anomaly.tension_type)}
        </span>
        {anomaly.is_reviewed && (
          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/30">
            Reviewed
          </span>
        )}
        {anomaly.analyst_notes && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <FileText className="w-3 h-3" />
            <span>Has Notes</span>
          </div>
        )}
      </div>
    </div>
  )
}
