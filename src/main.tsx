import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import DashboardPage from './pages/DashboardPage'
import { JobWizard } from './features/create-job/JobWizard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Job Management Routes */}
          <Route
            path="/jobs/create"
            element={
              <ProtectedRoute>
                <JobWizard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/*"
            element={
              <ProtectedRoute>
                <div className="coming-soon-page">
                  <h2>🚧 Job Management</h2>
                  <p>Job listing, editing, and monitoring features coming soon!</p>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <div className="coming-soon-page">
                  <h2>🔗 Salesforce Connections</h2>
                  <p>Connection management interface coming soon!</p>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="coming-soon-page">
                  <h2>⚙️ Settings</h2>
                  <p>User settings and preferences coming soon!</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>,
)