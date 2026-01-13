import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/common/Layout'
import Graph3DView from './views/Graph3DView'
import Map3DView from './views/Map3DView'
import PatternsView from './views/PatternsView'
import AnomaliesView from './views/AnomaliesView'
import ThreatsView from './views/ThreatsView'
import OverviewView from './views/OverviewView'
import ClusteringView from './views/ClusteringView'
import SemanticView from './views/SemanticView'

function App() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <BrowserRouter>
      <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewView />} />
          <Route path="/graph" element={<Graph3DView />} />
          <Route path="/map" element={<Map3DView />} />
          <Route path="/patterns" element={<PatternsView />} />
          <Route path="/anomalies" element={<AnomaliesView />} />
          <Route path="/threats" element={<ThreatsView />} />
          <Route path="/clustering" element={<ClusteringView />} />
          <Route path="/semantic" element={<SemanticView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
