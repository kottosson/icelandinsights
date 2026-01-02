import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DataDashboard from './data_dashboard.tsx'
import SpendingDashboard from './spending_dashboard.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/arrivals" replace />} />
        <Route path="/arrivals" element={<DataDashboard />} />
        <Route path="/spending" element={<SpendingDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)