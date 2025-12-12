import React from 'react'
import ReactDOM from 'react-dom/client'
import DataDashboard from './data_dashboard.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DataDashboard />
  </React.StrictMode>,
)
