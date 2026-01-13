import { Search, Filter } from 'lucide-react'

interface GraphControlsProps {
  nodeFilter: string
  edgeFilter: string
  searchQuery: string
  onNodeFilterChange: (filter: string) => void
  onEdgeFilterChange: (filter: string) => void
  onSearchChange: (query: string) => void
}

const nodeTypes = ['all', 'GeographicSoul', 'IdentityLifecycle', 'SystemicTension', 'BehavioralSignature', 'EmergentThreat']
const edgeTypes = ['all', 'LOCATED_IN', 'BORN_IN', 'EXPERIENCES', 'MANIFESTS', 'REVEALS', 'ECHOES', 'PRECEDES', 'SUGGESTS']

export default function GraphControls({
  nodeFilter,
  edgeFilter,
  searchQuery,
  onNodeFilterChange,
  onEdgeFilterChange,
  onSearchChange,
}: GraphControlsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4">Graph Controls</h2>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-atlas-primary"
          />
        </div>
      </div>

      {/* Node Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Node Type
        </label>
        <select
          value={nodeFilter}
          onChange={(e) => onNodeFilterChange(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-atlas-primary"
        >
          {nodeTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type}
            </option>
          ))}
        </select>
      </div>

      {/* Edge Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Edge Type
        </label>
        <select
          value={edgeFilter}
          onChange={(e) => onEdgeFilterChange(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-atlas-primary"
        >
          {edgeTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
