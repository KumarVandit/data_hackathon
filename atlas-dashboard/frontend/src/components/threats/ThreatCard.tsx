import { Shield, AlertTriangle, MapPin, Clock, Users, TrendingUp, Activity } from 'lucide-react'
import { Threat } from '../../hooks/useThreats'
import { clsx } from 'clsx'

interface ThreatCardProps {
  threat: Threat
  onClick?: () => void
}

const THREAT_TYPE_COLORS: Record<string, string> = {
  IDENTITY_FRAUD_RING: 'bg-red-500/20 text-red-300 border-red-500/30',
  HUMAN_TRAFFICKING_NETWORK: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  SLEEPER_CELL_ACTIVATION: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ECONOMIC_SHADOW_NETWORK: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  COORDINATED_ANOMALY: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border-red-500',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-red-500/20 text-red-300 border-red-500/30',
  MONITORING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  RESOLVED: 'bg-green-500/20 text-green-300 border-green-500/30',
  FALSE_POSITIVE: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

function getSeverityLevel(severity: number): string {
  if (severity >= 5) return 'critical'
  if (severity >= 4) return 'high'
  if (severity >= 3) return 'medium'
  return 'low'
}

function formatThreatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export default function ThreatCard({ threat, onClick }: ThreatCardProps) {
  const typeColor = THREAT_TYPE_COLORS[threat.threat_type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  const severityLevel = getSeverityLevel(threat.severity_level)
  const severityColor = SEVERITY_COLORS[severityLevel]
  const statusColor = STATUS_COLORS[threat.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'

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
            <Shield className="w-5 h-5 text-pink-500" />
            <h3 className="font-semibold text-white text-lg">{threat.title}</h3>
          </div>
          <p className="text-slate-400 text-sm line-clamp-2">{threat.narrative}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className={clsx('px-3 py-1 rounded-full text-xs font-medium border', severityColor)}>
            Level {threat.severity_level}
          </div>
          <div className={clsx('px-3 py-1 rounded-full text-xs font-medium border', statusColor)}>
            {threat.status}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        {threat.affected_locations && threat.affected_locations.length > 0 && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{threat.affected_locations.length} locations</span>
          </div>
        )}
        {threat.geographic_spread !== undefined && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Spread: {threat.geographic_spread}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Detected: {new Date(threat.first_detected).toLocaleDateString()}</span>
        </div>
        {threat.temporal_span_days !== undefined && (
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>{threat.temporal_span_days} days</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700/50">
        <div>
          <div className="text-xs text-slate-500 mb-1">Severity</div>
          <div className="text-lg font-semibold text-white">{threat.severity_level}/5</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Confidence</div>
          <div className="text-lg font-semibold text-indigo-400">{(threat.confidence * 100).toFixed(0)}%</div>
        </div>
        {threat.estimated_entities_involved !== undefined && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Entities</div>
            <div className="text-lg font-semibold text-purple-400">{threat.estimated_entities_involved}</div>
          </div>
        )}
        {threat.estimated_entities_involved === undefined && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Evidence</div>
            <div className="text-lg font-semibold text-blue-400">
              {(threat.related_tensions?.length || 0) + (threat.related_signatures?.length || 0)}
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx('px-2 py-1 rounded text-xs border', typeColor)}>
          {formatThreatType(threat.threat_type)}
        </span>
        {threat.related_tensions && threat.related_tensions.length > 0 && (
          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30">
            {threat.related_tensions.length} tensions
          </span>
        )}
        {threat.related_signatures && threat.related_signatures.length > 0 && (
          <span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {threat.related_signatures.length} patterns
          </span>
        )}
      </div>
    </div>
  )
}
