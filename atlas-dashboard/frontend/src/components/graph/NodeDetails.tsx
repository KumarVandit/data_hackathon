import { X, ExternalLink } from 'lucide-react'
import { GraphNode } from '../../types/graph'

interface NodeDetailsProps {
  node: GraphNode
  onClose: () => void
}

export default function NodeDetails({ node, onClose }: NodeDetailsProps) {
  return (
    <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Node Details</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase">ID</label>
          <p className="text-sm text-white font-mono">{node.id}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 uppercase">Type</label>
          <p className="text-sm text-white">{node.type}</p>
        </div>

        {Object.entries(node.properties || {}).map(([key, value]) => (
          <div key={key}>
            <label className="text-xs font-medium text-slate-400 uppercase">
              {key.replace(/_/g, ' ')}
            </label>
            <p className="text-sm text-white break-words">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </p>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full py-2 px-4 bg-atlas-primary hover:bg-atlas-primary/90 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
        <ExternalLink className="w-4 h-4" />
        View Reasoning Chain
      </button>
    </div>
  )
}
