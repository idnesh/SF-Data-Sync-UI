import React, { useState } from 'react';
import { JobWizard } from '../features/create-job/JobWizard';
import { ViewJobsPage } from '../features/jobs/ViewJobsPage';

// Define the different views available in the DataSync page
type DataSyncView = 'dashboard' | 'create-job' | 'job-details';

interface StatCardProps {
  icon?: string;
  title: string;
  number: string;
  change: string;
  onClick?: () => void;
  clickable?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, number, change, onClick, clickable = false }) => (
  <div
    className={`ds-stat-card ${clickable ? 'ds-clickable' : ''}`}
    onClick={onClick}
    style={{ cursor: clickable ? 'pointer' : 'default' }}
  >
    <div className="ds-stat-header">
      <div className="ds-stat-meta">
        <span className="ds-stat-title">{title}</span>
        {change && <span className="ds-stat-change">{change}</span>}
      </div>
      {icon && <div className="ds-stat-icon">{icon}</div>}
    </div>
    <div className="ds-stat-main">
      <div className="ds-stat-number">{number}</div>
    </div>
  </div>
);

const DataSyncDashboard: React.FC<{ onNavigate: (view: DataSyncView) => void }> = ({ onNavigate }) => {
  return (
    <div className="ds-dashboard">
      {/* Statistics Dashboard */}
      <div className="ds-stats-section">
        <div className="ds-stats-grid">
          <StatCard title="Total Jobs" number="12" change="+2 this week" onClick={() => onNavigate('job-details')} clickable={true} />
          <StatCard title="Active Jobs" number="8" change="" onClick={() => onNavigate('job-details')} clickable={true} />
          <StatCard title="Inactive Jobs" number="4" change="" clickable={false} />
        </div>
      </div>
      {/* Professional Introduction */}
      <div className="ds-service-introduction">
        <h2 className="ds-main-title">Data Synchronization Service</h2>
        <p className="ds-description-text">
          Our Data Synchronization Service is engineered to provide robust data migration and protection solutions.
          It ensures the integrity and accessibility of your critical assets by facilitating secure, high-speed transfers.
          All data in transit is protected through industry-standard encryption and rigorously validated upon completion,
          guaranteeing both confidentiality and accuracy.
        </p>
      </div>

      {/* Call-to-Action Buttons */}
      <div className="ds-action-buttons-section">
        <div className="ds-cta-buttons">
          <button
            className="ds-action-btn ds-primary-action"
            onClick={() => onNavigate('create-job')}
            aria-label="Create a new data synchronization job"
          >
            <span className="ds-btn-icon">➕</span>
            <span className="ds-btn-text">Create New Job</span>
            <span className="ds-btn-description">Set up a new data synchronization task</span>
          </button>

          <button
            className="ds-action-btn ds-secondary-action"
            onClick={() => onNavigate('job-details')}
            aria-label="View and manage existing jobs"
          >
            <span className="ds-btn-icon">📋</span>
            <span className="ds-btn-text">Job Details</span>
            <span className="ds-btn-description">View and manage all synchronization jobs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const DataSyncPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<DataSyncView>('dashboard');

  const handleNavigate = (view: DataSyncView) => {
    setCurrentView(view);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create-job':
        return <JobWizard onExit={handleBackToDashboard} />;
      case 'job-details':
        return (
          <ViewJobsPage
            onBackToDashboard={handleBackToDashboard}
            onCreateJob={() => handleNavigate('create-job')}
          />
        );
      case 'dashboard':
      default:
        return <DataSyncDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="ds-page">
      {renderCurrentView()}
    </div>
  );
};

export default DataSyncPage;