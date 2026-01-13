import { useEffect, useRef, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import { useGraphData } from '../hooks/useGraphData'
import { GraphNode, GraphEdge } from '../types/graph'
import GraphControls from '../components/graph/GraphControls'
import NodeDetails from '../components/graph/NodeDetails'
import { Loader2 } from 'lucide-react'

export default function Graph3DView() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [nodeFilter, setNodeFilter] = useState<string>('all')
  const [edgeFilter, setEdgeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, error } = useGraphData(nodeFilter, edgeFilter, searchQuery)
  const graphRef = useRef<any>()

  useEffect(() => {
    if (graphRef.current && data) {
      graphRef.current.d3Force('charge')?.strength(-300)
      graphRef.current.d3Force('link')?.distance(100)
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-atlas-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading graph data</p>
          <p className="text-slate-400 text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full relative">
      {/* 3D Graph */}
      <div className="flex-1 relative">
        <ForceGraph3D
          ref={graphRef}
          graphData={data}
          nodeLabel={(node: GraphNode) => `${node.type}: ${node.id}`}
          nodeColor={(node: GraphNode) => getNodeColor(node.type)}
          nodeVal={(node: GraphNode) => getNodeSize(node)}
          linkLabel={(edge: GraphEdge) => edge.type}
          linkColor={(edge: GraphEdge) => getEdgeColor(edge.type)}
          linkWidth={2}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node: GraphNode) => setSelectedNode(node)}
          backgroundColor="#0f172a"
          showNavInfo={false}
        />
      </div>

      {/* Controls Panel */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
        <GraphControls
          nodeFilter={nodeFilter}
          edgeFilter={edgeFilter}
          searchQuery={searchQuery}
          onNodeFilterChange={setNodeFilter}
          onEdgeFilterChange={setEdgeFilter}
          onSearchChange={setSearchQuery}
        />

        {selectedNode && (
          <NodeDetails
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  )
}

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    GeographicSoul: '#6366f1', // indigo
    IdentityLifecycle: '#8b5cf6', // violet
    SystemicTension: '#ef4444', // red
    BehavioralSignature: '#f59e0b', // amber
    EmergentThreat: '#ec4899', // pink
  }
  return colors[type] || '#64748b'
}

function getNodeSize(node: GraphNode): number {
  // Size based on node properties
  if (node.properties?.anomaly_score) {
    return Math.max(3, Math.min(15, (node.properties.anomaly_score / 100) * 15))
  }
  if (node.properties?.severity) {
    return Math.max(3, Math.min(15, (node.properties.severity / 100) * 15))
  }
  return 5
}

function getEdgeColor(type: string): string {
  const colors: Record<string, string> = {
    LOCATED_IN: '#64748b', // slate
    BORN_IN: '#8b5cf6', // violet
    EXPERIENCES: '#ef4444', // red
    MANIFESTS: '#f59e0b', // amber
    REVEALS: '#ec4899', // pink
    ECHOES: '#10b981', // green
    PRECEDES: '#06b6d4', // cyan
    SUGGESTS: '#f97316', // orange
  }
  return colors[type] || '#64748b'
}
