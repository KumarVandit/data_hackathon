import { Filter, X } from 'lucide-react'
import { useState } from 'react'

interface ClusterFiltersProps {
  filters: {
    cluster_type?: string
    min_size?: number
    max_size?: number
  }
  onFiltersChange: (filters: ClusterFiltersProps['filters']) => void
}

const CLUSTER_TYPES = ['geographic', 'anomaly', 'pattern', 'threat']

export default function ClusterFilters({
  filters,
  onFiltersChange,
}: ClusterFiltersProps) {
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
              <h3 className="font-semibold text-white">Filter Clusters</h3>
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

            {/* Cluster Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Cluster Type</label>
              <select
                value={filters.cluster_type || ''}
                onChange={(e) => onFiltersChange({ ...filters, cluster_type: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">All Types</option>
                {CLUSTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Size</label>
                <input
                  type="number"
                  min="1"
                  value={filters.min_size || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      min_size: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Size</label>
                <input
                  type="number"
                  min="1"
                  value={filters.max_size || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      max_size: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="∞"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
