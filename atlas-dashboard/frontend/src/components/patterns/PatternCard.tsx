import { Activity, MapPin, Calendar, TrendingUp, Users, Clock } from 'lucide-react'
import { Pattern } from '../../hooks/usePatterns'
import { clsx } from 'clsx'

interface PatternCardProps {
  pattern: Pattern
  onClick?: () => void
}

const SIGNATURE_TYPE_COLORS: Record<string, string> = {
  TEMPORAL_SPIKE: 'bg-red-500/20 text-red-300 border-red-500/30',
  COORDINATED_UPDATE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  SEASONAL_MIGRATION: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  WEEKEND_ANOMALY: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  GHOST_FARM_PATTERN: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-500/20 text-green-300 border-green-500',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
  low: 'bg-orange-500/20 text-orange-300 border-orange-500',
}

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

function formatSignatureType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export default function PatternCard({ pattern, onClick }: PatternCardProps) {
  const typeColor = SIGNATURE_TYPE_COLORS[pattern.signature_type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  const confidenceLevel = getConfidenceLevel(pattern.confidence_score)
  const confidenceColor = CONFIDENCE_COLORS[confidenceLevel]

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
            <Activity className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-white text-lg">{formatSignatureType(pattern.signature_type)}</h3>
          </div>
          <p className="text-slate-400 text-sm line-clamp-2">{pattern.description}</p>
        </div>
        <div className={clsx('px-3 py-1 rounded-full text-xs font-medium border', confidenceColor)}>
          {confidenceLevel.toUpperCase()}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          <span>{pattern.occurrence_count} occurrences</span>
        </div>
        {pattern.locations_involved && pattern.locations_involved.length > 0 && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{pattern.locations_involved.length} locations</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>First: {new Date(pattern.first_observed).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>Last: {new Date(pattern.last_observed).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700/50">
        <div>
          <div className="text-xs text-slate-500 mb-1">Confidence</div>
          <div className="text-lg font-semibold text-white">{(pattern.confidence_score * 100).toFixed(0)}%</div>
        </div>
        {pattern.magnitude_range && (
          <>
            <div>
              <div className="text-xs text-slate-500 mb-1">Min Magnitude</div>
              <div className="text-lg font-semibold text-slate-300">{pattern.magnitude_range.min.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Max Magnitude</div>
              <div className="text-lg font-semibold text-red-400">{pattern.magnitude_range.max.toFixed(1)}</div>
            </div>
          </>
        )}
        {!pattern.magnitude_range && (
          <>
            <div>
              <div className="text-xs text-slate-500 mb-1">Occurrences</div>
              <div className="text-lg font-semibold text-slate-300">{pattern.occurrence_count}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Locations</div>
              <div className="text-lg font-semibold text-blue-400">
                {pattern.locations_involved?.length || 0}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx('px-2 py-1 rounded text-xs border', typeColor)}>
          {formatSignatureType(pattern.signature_type)}
        </span>
        {pattern.affected_age_groups && pattern.affected_age_groups.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3 h-3" />
            <span>{pattern.affected_age_groups.length} age groups</span>
          </div>
        )}
        {pattern.temporal_pattern && (
          <span className="px-2 py-1 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Has Temporal Pattern
          </span>
        )}
      </div>
    </div>
  )
}
