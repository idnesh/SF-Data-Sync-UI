import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Header } from '../components/layout/Header';
import '../App.css';

// Mock data for demonstration
const mockJobs = [
  {
    id: '1',
    name: 'Account Sync - Prod to Sandbox',
    description: 'Daily synchronization of Account records',
    status: 'Active',
    lastRun: '2024-01-15 10:30:00',
    nextRun: '2024-01-16 10:30:00',
    recordsProcessed: 1250,
    schedule: 'Daily'
  },
  {
    id: '2',
    name: 'Contact Export to Marketing',
    description: 'Export Contact data to marketing system',
    status: 'Inactive',
    lastRun: '2024-01-15 08:00:00',
    nextRun: '2024-01-22 08:00:00',
    recordsProcessed: 3450,
    schedule: 'Weekly'
  },
  {
    id: '3',
    name: 'Opportunity Data Backup',
    description: 'Backup Opportunity records to archive',
    status: 'Draft',
    lastRun: '2024-01-14 23:00:00',
    nextRun: '2024-01-15 23:00:00',
    recordsProcessed: 0,
    schedule: 'Daily'
  }
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'Draft': 'status-draft'
    };

    return (
      <span className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || 'status-draft'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Jobs</h3>
                <p className="stat-number">12</p>
                <span className="stat-change">+2 this week</span>
              </div>
            </div>
            <div className="stat-card" onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Active Jobs</h3>
                <p className="stat-number">8</p>
                <span className="stat-change">Running smoothly</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>Failed Jobs</h3>
                <p className="stat-number">1</p>
                <span className="stat-change">Needs attention</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            <div className="action-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="action-buttons">
              <Button
                variant="primary"
                size="large"
                onClick={() => navigate('/create-job')}
              >
                + Create New Job
              </Button>
              <Button
                variant="outline"
                size="large"
                onClick={() => console.log('Test connections')}
              >
                Test Connections
              </Button>
              <Button
                variant="outline"
                size="large"
                onClick={() => console.log('View reports')}
              >
                View Reports
              </Button>
            </div>
          </div>

          {/* Recent Jobs Table */}
          <div className="jobs-section">
            <div className="section-header">
              <h2>Recent Jobs</h2>
              <Button variant="outline" onClick={() => navigate('/jobs')}>
                View All
              </Button>
            </div>

            <div className="jobs-table-container">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Name</th>
                    <th>Status</th>
                    <th>Schedule</th>
                    <th>Records</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="job-info">
                          <strong>{job.name}</strong>
                          <span className="job-description">{job.description}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td>{job.schedule}</td>
                      <td>{job.recordsProcessed.toLocaleString()}</td>
                      <td>
                        <div className="job-actions">
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => console.log(`View job ${job.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => console.log(`Edit job ${job.id}`)}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="coming-soon-section">
            <h3>🚀 Coming Soon</h3>
            <div className="feature-preview">
              <ul>
                <li>6-Step Job Creation Wizard</li>
                <li>Real-time Job Monitoring</li>
                <li>Salesforce Connection Management</li>
                <li>Advanced Field Mapping</li>
                <li>Automated Testing & Validation</li>
                <li>Detailed Analytics & Reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;