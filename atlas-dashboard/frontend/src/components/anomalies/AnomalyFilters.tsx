import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface AnomalyFiltersProps {
  filters: {
    tension_type?: string
    severity_min?: number
    severity_max?: number
    is_reviewed?: boolean
    state?: string
    district?: string
  }
  onFiltersChange: (filters: AnomalyFiltersProps['filters']) => void
  availableStates?: string[]
  availableDistricts?: string[]
}

const TENSION_TYPES = [
  'CREATION_WITHOUT_MOTION',
  'MOTION_WITHOUT_CREATION',
  'PERSISTENCE_WITHOUT_PAST',
  'DEMOGRAPHIC_MISMATCH',
  'TEMPORAL_SHOCK',
  'COORDINATED_ANOMALY',
]

export default function AnomalyFilters({
  filters,
  onFiltersChange,
  availableStates = [],
  availableDistricts = [],
}: AnomalyFiltersProps) {
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
              <h3 className="font-semibold text-white">Filter Anomalies</h3>
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

            {/* Tension Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tension Type</label>
              <select
                value={filters.tension_type || ''}
                onChange={(e) => onFiltersChange({ ...filters, tension_type: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">All Types</option>
                {TENSION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Severity</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.severity_min || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      severity_min: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Severity</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.severity_max || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      severity_max: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Review Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Review Status</label>
              <select
                value={filters.is_reviewed === undefined ? '' : filters.is_reviewed ? 'reviewed' : 'unreviewed'}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    is_reviewed: e.target.value === '' ? undefined : e.target.value === 'reviewed',
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">All</option>
                <option value="reviewed">Reviewed</option>
                <option value="unreviewed">Unreviewed</option>
              </select>
            </div>

            {/* State */}
            {availableStates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                <select
                  value={filters.state || ''}
                  onChange={(e) => onFiltersChange({ ...filters, state: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">All States</option>
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* District */}
            {availableDistricts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">District</label>
                <select
                  value={filters.district || ''}
                  onChange={(e) => onFiltersChange({ ...filters, district: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
