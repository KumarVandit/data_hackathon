import { Search, X, Filter } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  nodeTypes: string[]
  onNodeTypesChange: (types: string[]) => void
  availableNodeTypes: string[]
}

export default function SearchBar({
  query,
  onQueryChange,
  nodeTypes,
  onNodeTypesChange,
  availableNodeTypes,
}: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search for entities, patterns, relationships..."
            className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-atlas-primary focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors flex items-center gap-2 ${
            nodeTypes.length > 0 ? 'ring-2 ring-atlas-primary' : ''
          }`}
        >
          <Filter className="w-4 h-4" />
          {nodeTypes.length > 0 && (
            <span className="px-2 py-0.5 bg-atlas-primary text-white text-xs rounded-full">
              {nodeTypes.length}
            </span>
          )}
        </button>
      </div>

      {isFilterOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
            <h3 className="font-semibold text-white mb-3">Filter by Node Type</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableNodeTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={nodeTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onNodeTypesChange([...nodeTypes, type])
                      } else {
                        onNodeTypesChange(nodeTypes.filter((t) => t !== type))
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-atlas-primary focus:ring-atlas-primary"
                  />
                  <span className="text-sm text-slate-300">{type}</span>
                </label>
              ))}
            </div>
            {nodeTypes.length > 0 && (
              <button
                onClick={() => onNodeTypesChange([])}
                className="mt-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded hover:bg-slate-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
