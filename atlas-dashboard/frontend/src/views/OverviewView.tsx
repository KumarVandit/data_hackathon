import { useQuery } from '@tanstack/react-query'
import { fetchGraphStats } from '../services/api'
import { api } from '../services/api'
import { Network, AlertTriangle, Shield, Activity } from 'lucide-react'

export default function OverviewView() {
  const { data: stats } = useQuery({ queryKey: ['graph-stats'], queryFn: fetchGraphStats })
  
  // Use new API endpoints
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies-overview'],
    queryFn: async () => {
      const response = await api.get('/api/anomalies', { params: { limit: 10, offset: 0 } })
      return response.data
    },
  })
  
  const { data: threats } = useQuery({
    queryKey: ['threats-overview'],
    queryFn: async () => {
      const response = await api.get('/api/threats', { params: { limit: 10 } })
      return response.data
    },
  })
  
  const { data: patterns } = useQuery({
    queryKey: ['patterns-overview'],
    queryFn: async () => {
      const response = await api.get('/api/patterns', { params: { limit: 10, offset: 0 } })
      return response.data
    },
  })

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Project Atlas Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Graph Nodes"
            value={stats?.total_nodes || 0}
            icon={Network}
            color="indigo"
          />
          <StatCard
            title="Anomalies"
            value={anomalies?.total || 0}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Threats"
            value={threats?.total || 0}
            icon={Shield}
            color="pink"
          />
          <StatCard
            title="Patterns"
            value={patterns?.total || 0}
            icon={Activity}
            color="amber"
          />
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSection 
            title="Recent Anomalies" 
            items={anomalies?.anomalies || []} 
            getTitle={(item) => item.id || `Anomaly ${item.severity || 'N/A'}`}
            getSubtitle={(item) => item.tension_type || 'Unknown type'}
          />
          <RecentSection 
            title="Active Threats" 
            items={threats?.threats || []}
            getTitle={(item) => item.title || item.id || 'Unknown threat'}
            getSubtitle={(item) => item.threat_type || 'Unknown type'}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    indigo: 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400',
    red: 'bg-red-500/10 border-red-500/50 text-red-400',
    pink: 'bg-pink-500/10 border-pink-500/50 text-pink-400',
    amber: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
  }

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

function RecentSection({ 
  title, 
  items, 
  getTitle = (item: any) => item.id || item.title || 'Unknown',
  getSubtitle = (item: any) => item.severity ? `Severity: ${item.severity}` : undefined
}: { 
  title: string
  items: any[]
  getTitle?: (item: any) => string
  getSubtitle?: (item: any) => string | undefined
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-3">
        {items.slice(0, 5).map((item, idx) => (
          <div key={idx} className="p-3 bg-slate-800 rounded border border-slate-700">
            <p className="text-sm text-white font-medium">{getTitle(item)}</p>
            {getSubtitle(item) && (
              <p className="text-xs text-slate-400 mt-1">{getSubtitle(item)}</p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No items available</p>
        )}
      </div>
    </div>
  )
}
