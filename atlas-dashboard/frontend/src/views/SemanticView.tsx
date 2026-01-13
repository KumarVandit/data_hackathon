import { useState } from 'react'
import { useSemanticSearch, SemanticSearchResult } from '../hooks/useSemanticSearch'
import SearchBar from '../components/semantic/SearchBar'
import SearchResultCard from '../components/semantic/SearchResultCard'
import ReasoningChain from '../components/semantic/ReasoningChain'
import NeighborExplorer from '../components/semantic/NeighborExplorer'
import { Loader2, Search, Brain, Network, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AVAILABLE_NODE_TYPES = [
  'GeographicSoul',
  'IdentityLifecycle',
  'SystemicTension',
  'BehavioralSignature',
  'EmergentThreat',
]

export default function SemanticView() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([])
  const [selectedResult, setSelectedResult] = useState<SemanticSearchResult | null>(null)
  const [exploringNode, setExploringNode] = useState<{ id: string; type: string } | null>(null)

  const { data, isLoading, error } = useSemanticSearch(
    searchQuery,
    selectedNodeTypes.length > 0 ? selectedNodeTypes : undefined,
    true
  )

  const handleViewInGraph = (nodeId: string) => {
    navigate(`/graph?highlight=${nodeId}`)
  }

  const handleExploreNeighbors = (result: SemanticSearchResult) => {
    setExploringNode({ id: result.id, type: result.type })
  }

  const handleNodeSelect = (nodeId: string) => {
    setExploringNode(null)
    handleViewInGraph(nodeId)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Semantic Search</h1>
            <p className="text-slate-400">Explore relationships and reasoning chains in the knowledge graph</p>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          nodeTypes={selectedNodeTypes}
          onNodeTypesChange={setSelectedNodeTypes}
          availableNodeTypes={AVAILABLE_NODE_TYPES}
        />
      </div>

      {/* Reasoning Chain */}
      {data?.reasoning_chain && data.reasoning_chain.length > 0 && (
        <div className="mb-6">
          <ReasoningChain chain={data.reasoning_chain} />
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-atlas-primary mx-auto mb-4" />
              <p className="text-slate-400">Searching knowledge graph...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-400 mb-2">Failed to perform search</p>
              <p className="text-slate-400 text-sm">{(error as Error).message}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && searchQuery && (
          <>
            {data && data.results.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-slate-400">
                    Found {data.total} result{data.total !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Semantic search powered by LLM reasoning</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {data.results.map((result) => (
                    <SearchResultCard
                      key={result.id}
                      result={result}
                      onClick={() => setSelectedResult(result)}
                      onExploreNeighbors={() => handleExploreNeighbors(result)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No results found</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Try a different search query or adjust filters
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !searchQuery && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Start Your Semantic Search</h2>
              <p className="text-slate-400 mb-6">
                Enter a query to explore the knowledge graph using semantic understanding. The system will
                find relevant entities, patterns, and relationships based on meaning, not just keywords.
              </p>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-slate-300 mb-2">Example queries:</p>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>• "Find identity fraud patterns in Delhi"</li>
                  <li>• "Show threats related to biometric updates"</li>
                  <li>• "What anomalies exist in Maharashtra?"</li>
                  <li>• "Patterns of coordinated activity"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Result Details Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedResult.id}</h2>
                <p className="text-slate-400">{selectedResult.type}</p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="text-slate-400">✕</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Properties */}
              {selectedResult.properties && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Properties</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedResult.properties).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">{key}</div>
                        <div className="text-sm text-white font-mono">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              {selectedResult.relationships && selectedResult.relationships.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Relationships ({selectedResult.relationships.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedResult.relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white">{rel.type}</span>
                          <span className="text-xs text-slate-400">{rel.target_type}</span>
                        </div>
                        <div className="text-sm text-slate-300 font-mono">{rel.target}</div>
                        {rel.properties && (
                          <div className="mt-2 text-xs text-slate-400">
                            {Object.entries(rel.properties).map(([k, v]) => (
                              <span key={k} className="mr-3">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    handleViewInGraph(selectedResult.id)
                    setSelectedResult(null)
                  }}
                  className="flex-1 px-4 py-2 bg-atlas-primary hover:bg-atlas-primary/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Network className="w-4 h-4" />
                  View in Graph
                </button>
                <button
                  onClick={() => {
                    handleExploreNeighbors(selectedResult)
                    setSelectedResult(null)
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Network className="w-4 h-4" />
                  Explore Neighbors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Neighbor Explorer Modal */}
      {exploringNode && (
        <NeighborExplorer
          nodeId={exploringNode.id}
          nodeType={exploringNode.type}
          onClose={() => setExploringNode(null)}
          onNodeSelect={handleNodeSelect}
        />
      )}
    </div>
  )
}
