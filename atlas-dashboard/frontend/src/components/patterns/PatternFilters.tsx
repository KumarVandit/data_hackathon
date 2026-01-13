import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface PatternFiltersProps {
  filters: {
    signature_type?: string
    min_confidence?: number
    min_occurrences?: number
  }
  onFiltersChange: (filters: PatternFiltersProps['filters']) => void
}

const SIGNATURE_TYPES = [
  'TEMPORAL_SPIKE',
  'COORDINATED_UPDATE',
  'SEASONAL_MIGRATION',
  'WEEKEND_ANOMALY',
  'GHOST_FARM_PATTERN',
]

export default function PatternFilters({
  filters,
  onFiltersChange,
}: PatternFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  const clearFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800/70 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="px-2 py-0.5 bg-atlas-primary text-white text-xs rounded-full">
            {Object.values(filters).filter((v) => v !== undefined && v !== '').length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Filter Patterns</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Signature Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Signature Type</label>
              <select
                value={filters.signature_type || ''}
                onChange={(e) => onFiltersChange({ ...filters, signature_type: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">All Types</option>
                {SIGNATURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Min Confidence (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.min_confidence !== undefined ? filters.min_confidence : ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    min_confidence: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="0.0"
              />
            </div>

            {/* Min Occurrences */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Min Occurrences</label>
              <input
                type="number"
                min="1"
                value={filters.min_occurrences !== undefined ? filters.min_occurrences : ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    min_occurrences: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="1"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
