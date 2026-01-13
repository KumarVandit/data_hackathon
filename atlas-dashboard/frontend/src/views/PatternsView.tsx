import { useState } from 'react'
import { usePatterns, usePatternStats, Pattern } from '../hooks/usePatterns'
import PatternCard from '../components/patterns/PatternCard'
import PatternFilters from '../components/patterns/PatternFilters'
import PatternDetails from '../components/patterns/PatternDetails'
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Activity, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'

const ITEMS_PER_PAGE = 20

export default function PatternsView() {
  const [page, setPage] = useState(0)
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null)
  const [filters, setFilters] = useState<{
    signature_type?: string
    min_confidence?: number
    min_occurrences?: number
  }>({})

  const { data, isLoading, error } = usePatterns(page * ITEMS_PER_PAGE, ITEMS_PER_PAGE, filters)
  const { data: stats } = usePatternStats()

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0

  const handleViewInGraph = (patternId: string) => {
    // Navigate to graph view with pattern selected
    console.log('View pattern in graph:', patternId)
  }

  const handleViewInMap = (patternId: string) => {
    // Navigate to map view with pattern selected
    console.log('View pattern in map:', patternId)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-atlas-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading patterns...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Failed to load patterns</p>
          <p className="text-slate-400 text-sm mt-2">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!data || data.patterns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No patterns found</p>
          <p className="text-slate-500 text-sm mt-2">
            {Object.keys(filters).length > 0
              ? 'Try adjusting your filters'
              : 'Patterns will appear here after data processing'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Behavioral Patterns</h1>
            <p className="text-slate-400">
              {data.total} {data.total === 1 ? 'pattern' : 'patterns'} detected
            </p>
          </div>
          <PatternFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Patterns
              </div>
              <div className="text-2xl font-bold text-white">{stats.total_patterns}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Avg Confidence
              </div>
              <div className="text-2xl font-bold text-indigo-400">
                {(stats.avg_confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1">Most Frequent</div>
              <div className="text-2xl font-bold text-purple-400">{stats.most_frequent.occurrence_count}</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.most_frequent.signature_type.replace(/_/g, ' ').toLowerCase()}
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1">By Type</div>
              <div className="text-lg font-bold text-blue-400">
                {Object.keys(stats.by_type).length} types
              </div>
            </div>
          </div>
        )}

        {/* Type Breakdown */}
        {stats && stats.by_type && Object.keys(stats.by_type).length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Patterns by Type</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                    {type.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Patterns Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.patterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onClick={() => setSelectedPattern(pattern)}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4">
          <div className="text-sm text-slate-400">
            Showing {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, data.total)} of{' '}
            {data.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                page === 0
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="px-4 py-2 text-slate-300">
              Page {page + 1} of {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                page >= totalPages - 1
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pattern Details Modal */}
      {selectedPattern && (
        <PatternDetails
          pattern={selectedPattern}
          onClose={() => setSelectedPattern(null)}
          onViewInGraph={handleViewInGraph}
          onViewInMap={handleViewInMap}
        />
      )}
    </div>
  )
}
