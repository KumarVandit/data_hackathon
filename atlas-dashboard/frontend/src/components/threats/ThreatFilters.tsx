import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface ThreatFiltersProps {
  filters: {
    threat_type?: string
    severity_min?: number
    severity_max?: number
    status?: string
    min_confidence?: number
  }
  onFiltersChange: (filters: ThreatFiltersProps['filters']) => void
}

const THREAT_TYPES = [
  'IDENTITY_FRAUD_RING',
  'HUMAN_TRAFFICKING_NETWORK',
  'SLEEPER_CELL_ACTIVATION',
  'ECONOMIC_SHADOW_NETWORK',
  'COORDINATED_ANOMALY',
]

const STATUSES = ['ACTIVE', 'MONITORING', 'RESOLVED', 'FALSE_POSITIVE']

export default function ThreatFilters({
  filters,
  onFiltersChange,
}: ThreatFiltersProps) {
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
              <h3 className="font-semibold text-white">Filter Threats</h3>
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

            {/* Threat Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Threat Type</label>
              <select
                value={filters.threat_type || ''}
                onChange={(e) => onFiltersChange({ ...filters, threat_type: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">All Types</option>
                {THREAT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Severity (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.severity_min !== undefined ? filters.severity_min : ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      severity_min: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Severity (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.severity_max !== undefined ? filters.severity_max : ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      severity_max: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
          </div>
        </>
      )}
    </div>
  )
}
