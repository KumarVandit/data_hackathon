import { useState } from 'react'
import { useAnomalies, Anomaly } from '../hooks/useAnomalies'
import AnomalyCard from '../components/anomalies/AnomalyCard'
import AnomalyFilters from '../components/anomalies/AnomalyFilters'
import AnomalyDetails from '../components/anomalies/AnomalyDetails'
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

const ITEMS_PER_PAGE = 20

export default function AnomaliesView() {
  const [page, setPage] = useState(0)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)
  const [filters, setFilters] = useState<{
    tension_type?: string
    severity_min?: number
    severity_max?: number
    is_reviewed?: boolean
    state?: string
    district?: string
  }>({})

  const { data, isLoading, error } = useAnomalies(page * ITEMS_PER_PAGE, ITEMS_PER_PAGE, filters)

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0

  const handleViewInGraph = (anomalyId: string) => {
    // Navigate to graph view with anomaly selected
    // This would integrate with your routing system
    console.log('View anomaly in graph:', anomalyId)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-atlas-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading anomalies...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Failed to load anomalies</p>
          <p className="text-slate-400 text-sm mt-2">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!data || data.anomalies.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No anomalies found</p>
          <p className="text-slate-500 text-sm mt-2">
            {Object.keys(filters).length > 0
              ? 'Try adjusting your filters'
              : 'Anomalies will appear here after data processing'}
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
            <h1 className="text-3xl font-bold text-white mb-2">Anomaly Detection</h1>
            <p className="text-slate-400">
              {data.total} {data.total === 1 ? 'anomaly' : 'anomalies'} detected
            </p>
          </div>
          <AnomalyFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-400">
              {data.anomalies.filter((a) => a.severity >= 80).length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">High</div>
            <div className="text-2xl font-bold text-orange-400">
              {data.anomalies.filter((a) => a.severity >= 60 && a.severity < 80).length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Medium</div>
            <div className="text-2xl font-bold text-yellow-400">
              {data.anomalies.filter((a) => a.severity >= 40 && a.severity < 60).length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Unreviewed</div>
            <div className="text-2xl font-bold text-blue-400">
              {data.anomalies.filter((a) => !a.is_reviewed).length}
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.anomalies.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              onClick={() => setSelectedAnomaly(anomaly)}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4">
          <div className="text-sm text-slate-400">
            Showing {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, data.total)} of {data.total}
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

      {/* Anomaly Details Modal */}
      {selectedAnomaly && (
        <AnomalyDetails
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onViewInGraph={handleViewInGraph}
        />
      )}
    </div>
  )
}
