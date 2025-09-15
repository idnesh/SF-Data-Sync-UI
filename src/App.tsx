import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
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
          <h1>Salesforce Data Synchronization Platform</h1>
        </div>
        <div className="header-buttons">
          <button className="btn btn-secondary" onClick={handleLogin}>Login</button>
          <button className="btn" onClick={handleSignup}>Sign Up</button>
        </div>
      </header>
      <main className="App-main">
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Data Import</h3>
            <p>Import data from various sources into Salesforce</p>
          </div>
          <div className="feature-card">
            <h3>Data Export</h3>
            <p>Export Salesforce data to external systems</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Sync</h3>
            <p>Keep data synchronized in real-time</p>
          </div>
          <div className="feature-card">
            <h3>Analytics</h3>
            <p>Monitor and analyze sync operations</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App