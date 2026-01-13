import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Network, 
  Map, 
  Activity, 
  AlertTriangle, 
  Shield,
  GitBranch,
  Brain,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: ReactNode
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/graph', label: '3D Graph', icon: Network },
  { path: '/map', label: '3D Map', icon: Map },
  { path: '/patterns', label: 'Patterns', icon: Activity },
  { path: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { path: '/threats', label: 'Threats', icon: Shield },
  { path: '/clustering', label: 'Clustering', icon: GitBranch },
  { path: '/semantic', label: 'Semantic', icon: Brain },
]

export default function Layout({ children, darkMode, setDarkMode }: LayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h1 className={`${sidebarOpen ? 'block' : 'hidden'} text-xl font-bold text-atlas-primary`}>
            Project Atlas
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-atlas-primary text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
          >
            {sidebarOpen ? `Switch to ${darkMode ? 'Light' : 'Dark'} Mode` : '🌙'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
