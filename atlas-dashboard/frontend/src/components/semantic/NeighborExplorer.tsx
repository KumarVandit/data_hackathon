import { useState } from 'react'
import { useNodeNeighbors } from '../../hooks/useSemanticSearch'
import { Network, Loader2, X, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface NeighborExplorerProps {
  nodeId: string
  nodeType: string
  onClose: () => void
  onNodeSelect?: (nodeId: string) => void
}

export default function NeighborExplorer({
  nodeId,
  nodeType,
  onClose,
  onNodeSelect,
}: NeighborExplorerProps) {
  const [depth, setDepth] = useState(1)
  const { data, isLoading, error } = useNodeNeighbors(nodeId, depth)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-indigo-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Neighbor Explorer</h2>
              <p className="text-sm text-slate-400">{nodeType}: {nodeId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Depth:</label>
              <select
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-atlas-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">Failed to load neighbors</p>
              <p className="text-slate-400 text-sm mt-2">{(error as Error).message}</p>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {data.nodes && data.nodes.length > 0 ? (
                <>
                  <div className="text-sm text-slate-400 mb-4">
                    Found {data.nodes.length} neighbor{data.nodes.length !== 1 ? 's' : ''} at depth {depth}
                  </div>
                  <div className="space-y-2">
                    {data.nodes.map((node: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => onNodeSelect?.(node.id)}
                        className={clsx(
                          'p-4 bg-slate-800/50 border border-slate-700 rounded-lg',
                          'hover:border-atlas-primary/50 hover:bg-slate-800/70 transition-all cursor-pointer',
                          'flex items-center justify-between'
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{node.id}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                              {node.type}
                            </span>
                          </div>
                          {node.properties && (
                            <div className="text-xs text-slate-400 mt-1">
                              {Object.keys(node.properties).slice(0, 3).join(', ')}
                              {Object.keys(node.properties).length > 3 && '...'}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No neighbors found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
