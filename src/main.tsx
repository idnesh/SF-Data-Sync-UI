import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { createMuiTheme } from './theme/muiTheme'
import App from './App'
import Login from './Login'
import Signup from './Signup'
import DashboardPage from './pages/DashboardPage'
import DataCleansingPage from './pages/DataCleansingPage'
import { JobWizard } from './features/create-job/JobWizard'
import { ViewJobsPage } from './features/jobs/ViewJobsPage'
import LandingPageLayout from './components/layout/LandingPageLayout'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MuiThemeProvider theme={createMuiTheme(false)}>
        <CssBaseline />
        <AuthProvider>
          <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes with tab navigation */}
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

          {/* Job Management Routes */}
          <Route
            path="/create-job"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="Data Sync" subtitle="Create and manage data synchronization jobs">
                  <JobWizard />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="Job Details" subtitle="View and manage all synchronization jobs">
                  <ViewJobsPage />
                </LandingPageLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-cleansing"
            element={
              <ProtectedRoute>
                <LandingPageLayout title="Data Quality" subtitle="AI-powered data cleansing and quality analysis">
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Router>
        </AuthProvider>
      </MuiThemeProvider>
    </ThemeProvider>
  </React.StrictMode>,
)