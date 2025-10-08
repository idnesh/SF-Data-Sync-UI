import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { MuiThemeWrapper } from './components/providers/MuiThemeWrapper'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import DataSyncPage from './pages/DataSyncPage'
import DataCleansingPage from './pages/DataCleansingPage'
import LandingPageLayout from './components/layout/LandingPageLayout'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MuiThemeWrapper>
        <AuthProvider>
          <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes with tab navigation */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="R-DataX" subtitle="Your comprehensive solution for data excellence">
                  <HomePage />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LandingPageLayout>
                  <DashboardPage />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          {/* Data Sync Routes */}
          <Route
            path="/data-sync"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="R-DataX" subtitle="Data Synchronization Service">
                  <DataSyncPage />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-sync/create-job"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="R-DataX" subtitle="Data Synchronization Service">
                  <DataSyncPage />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-sync/job-details"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="R-DataX" subtitle="View and manage all synchronization jobs">
                  <DataSyncPage />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy route redirect for backward compatibility */}
          <Route
            path="/create-job"
            element={<Navigate to="/data-sync/create-job" replace />}
          />

          <Route
            path="/jobs"
            element={<Navigate to="/data-sync/job-details" replace />}
          />

          <Route
            path="/data-cleansing"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="R-DataX" subtitle="AI-powered data cleansing and quality analysis">
                  <DataCleansingPage />
                </LandingPageLayout>
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
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
          </Router>
        </AuthProvider>
      </MuiThemeWrapper>
    </ThemeProvider>
  </React.StrictMode>,
)