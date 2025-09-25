import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ThemeToggle } from './components/common/ThemeToggle'
import './App.css'

function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <h1>R-Data-X</h1>
        </div>
        <div className="header-buttons">
          <ThemeToggle />
          <button className="btn btn-secondary" onClick={handleLogin}>Login</button>
          <button className="btn" onClick={handleSignup}>Sign Up</button>
        </div>
      </header>
      <main className="App-main">
        <div className="landing-container">
          <div className="hero-section">
            <div className="app-description">
              <h2 className="main-title">Transform Your Data Management</h2>
              <p className="description-text">
                R-Data-X is your comprehensive solution for data excellence. Our platform enables
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
                onClick={handleLogin}
                aria-label="Access Data Sync functionality"
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-text">Data Sync</span>
                <span className="btn-description">Synchronize and manage your data</span>
              </button>

              <button
                className="action-btn secondary-action"
                onClick={handleLogin}
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