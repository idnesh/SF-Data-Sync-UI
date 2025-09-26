import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Direct navigation handlers for main functionality
  const handleDataSync = () => {
    navigate('/create-job');
  };

  const handleDataQuality = () => {
    navigate('/data-cleansing');
  };

  return (
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
  );
};

export default HomePage;