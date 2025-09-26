import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ThemeToggle } from './components/common/ThemeToggle'
import { FEATURE_FLAGS } from './utils/constants'
import './App.css'

function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to home page (default behavior) or dashboard if already authenticated
  useEffect(() => {
    if (FEATURE_FLAGS.ENABLE_LOGIN && isAuthenticated) {
      navigate('/dashboard');
    } else if (!FEATURE_FLAGS.ENABLE_LOGIN) {
      // When login is disabled, redirect to home page
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Login/Signup handlers - disabled when FEATURE_FLAGS.ENABLE_LOGIN is false
  const handleLogin = () => {
    if (FEATURE_FLAGS.ENABLE_LOGIN) {
      navigate('/login');
    }
  };

  const handleSignup = () => {
    if (FEATURE_FLAGS.ENABLE_LOGIN) {
      navigate('/signup');
    }
  };

  // Direct navigation handlers for main functionality
  const handleDataSync = () => {
    navigate('/create-job');
  };

  const handleDataQuality = () => {
    navigate('/data-cleansing');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <div className="header-brand">
            <img
              src="/Relanto.png"
              alt="Relanto Logo"
              className="header-logo"
            />
            <h1>R-DataX</h1>
          </div>
        </div>
        <div className="header-buttons">
          <ThemeToggle />
          {/* Login/Signup buttons - only show when feature flag is enabled */}
          {FEATURE_FLAGS.ENABLE_LOGIN && (
            <>
              <button className="btn btn-secondary" onClick={handleLogin}>Login</button>
              <button className="btn" onClick={handleSignup}>Sign Up</button>
            </>
          )}
        </div>
      </header>
      <main className="App-main">
        <div className="landing-container">
          <div className="hero-section">
            <div className="app-description">
              <h2 className="main-title">Transform Your Data Management</h2>
              <p className="description-text">
                R-DataX is your comprehensive solution for data excellence. Our platform enables
                thorough data quality assessment, resolves data inconsistency issues, and helps
                synchronize data across your systems seamlessly.
              </p>
              <div className="features-highlight">
                <div className="feature-point">
                  <span className="feature-icon">🔍</span>
                  <span>Data Quality Assessment</span>
                </div>
                <div className="feature-point">
                  <span className="feature-icon">🔧</span>
                  <span>Resolve Data Inconsistencies</span>
                </div>
                <div className="feature-point">
                  <span className="feature-icon">🔄</span>
                  <span>Seamless Data Synchronization</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="action-btn primary-action"
                onClick={handleDataSync}
                aria-label="Access Data Sync functionality"
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-text">Data Sync</span>
                <span className="btn-description">Synchronize and manage your data</span>
              </button>

              <button
                className="action-btn secondary-action"
                onClick={handleDataQuality}
                aria-label="Access Data Quality tools"
              >
                <span className="btn-icon">📊</span>
                <span className="btn-text">Data Quality</span>
                <span className="btn-description">Assess and improve data quality</span>
              </button>
            </div>
          </div>

          <div className="background-elements">
            <div className="floating-element element-1"></div>
            <div className="floating-element element-2"></div>
            <div className="floating-element element-3"></div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App