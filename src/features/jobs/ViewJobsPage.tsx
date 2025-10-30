import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface ViewJobsPageProps {
  onBackToDashboard?: () => void;
  onCreateJob?: () => void;
}

interface JobData {
  Id: string;
  jobName: string | null;
  name: string;
  isActive: string;
  jobSchedule: string | null;
  jobFrequency: string | null;
  sourceOrg: string;
  targetOrg: string;
  sourceObject: string;
  targetObject: string;
  fromDate: string;
  toDate: string;
  jobDetails: {
    name?: string;
    schedule?: {
      frequency?: string;
      timeUnit?: string;
      cronExpression?: string;
      description?: string;
    };
    isActive?: boolean;
    sourceOrg?: string;
    targetOrg?: string;
    fromDate?: string;
    toDate?: string;
    sourceObject?: string;
    targetObject?: string;
    extId?: string;
    fieldMapping?: Array<{
      source: string;
      sourceType?: string;
      target: string;
      targetType?: string;
    }>;
    fieldMaping?: Array<{
      source: string;
      sourceType?: string;
      target: string;
      targetType?: string;
    }>;
  };
}

type ApiResponse = JobData[];

export const ViewJobsPage: React.FC<ViewJobsPageProps> = ({
  onBackToDashboard,
  onCreateJob
}) => {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    job: JobData | null;
  }>({ isOpen: false, job: null });

  // Fetch jobs from API
  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/readJobsSfdc');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // No parsing needed - data is already in the correct format
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSchedule = (job: JobData) => {
    // Use jobFrequency if available, otherwise try to construct from jobDetails
    if (job.jobFrequency) {
      return job.jobFrequency;
    }

    if (job.jobDetails.schedule?.frequency && job.jobDetails.schedule?.timeUnit) {
      const unit = job.jobDetails.schedule.timeUnit.toLowerCase();
      const freq = job.jobDetails.schedule.frequency;
      return `Every ${freq} ${unit}`;
    }

    if (job.jobDetails.schedule?.cronExpression) {
      return job.jobDetails.schedule.description || `Cron: ${job.jobDetails.schedule.cronExpression}`;
    }

    return 'Not scheduled';
  };

  const handleEditJob = (job: JobData) => {
    console.log('Edit job:', job.name);
    // TODO: Implement edit functionality
    alert(`Edit job: ${job.name}`);
  };

  const handleDeleteJob = (job: JobData) => {
    console.log('Delete job:', job.name);
    setDeleteConfirmation({ isOpen: true, job });
  };

  const confirmDeleteJob = async () => {
    const job = deleteConfirmation.job;
    if (!job) return;

    try {
      setIsLoading(true);
      setDeleteConfirmation({ isOpen: false, job: null });

      console.log('Deleting job with key:', job.name);

      const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/deleteJobSfdc?key=${encodeURIComponent(job.name)}`, {
        method: 'GET'
      });

      if (response.ok) {
        console.log('Job deleted successfully');
        // Refresh the job list after successful deletion
        await fetchJobs();
      } else {
        const errorData = await response.text();
        console.error('Delete failed:', response.status, errorData);
        setError(`Failed to delete job: ${response.status} ${response.statusText}. ${errorData}`);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(`Failed to delete job: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteJob = () => {
    setDeleteConfirmation({ isOpen: false, job: null });
  };

  return (
    <div className="ds-jobs-page">
      {/* Header Section */}
      <div className="ds-jobs-header">
        <div className="ds-jobs-header-content">
          <h2 className="ds-jobs-title">Job Details</h2>
          {onBackToDashboard && (
            <Button
              variant="outline"
              onClick={onBackToDashboard}
              className="ds-jobs-back-button"
            >
              ← Back to Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="ds-jobs-content">
        {error && (
          <div className="ds-jobs-error" role="alert">
            <span className="ds-jobs-error-icon">⚠️</span>
            <span className="ds-jobs-error-text">{error}</span>
            <Button
              variant="outline"
              size="small"
              onClick={fetchJobs}
              className="ds-jobs-retry-button"
            >
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="ds-jobs-loading">
            <div className="ds-jobs-spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="ds-jobs-empty">
            <div className="ds-jobs-empty-icon">📊</div>
            <h3>No jobs found</h3>
            <p>No synchronization jobs are currently configured.</p>
            {onCreateJob && (
              <Button
                variant="primary"
                onClick={onCreateJob}
                className="ds-jobs-empty-action"
              >
                Create Your First Job
              </Button>
            )}
          </div>
        ) : (
          <div className="ds-jobs-table-container">
            <div className="ds-jobs-table-wrapper">
              <div className="ds-jobs-grid" role="table" aria-label="Jobs table">
                <div className="ds-jobs-grid-header" role="rowgroup">
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Job Name & Status</div>
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Objects</div>
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Organizations</div>
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Schedule</div>
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Duration</div>
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Field Mappings</div>
                  <div className="ds-jobs-grid-header-cell" role="columnheader">Actions</div>
                </div>
                {jobs.map((job) => (
                  <div key={job.Id} className="ds-jobs-grid-row" role="row">
                    <div className="ds-jobs-grid-cell ds-jobs-name-cell" role="cell">
                      <div className="ds-jobs-name">{job.name}</div>
                      <div className="ds-jobs-ext-id">ID: {job.Id}</div>
                      <div className="ds-jobs-status">
                        <span className={`ds-jobs-status-badge ${job.isActive === 'true' ? 'active' : 'inactive'}`}>
                          {job.isActive === 'true' ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="ds-jobs-grid-cell ds-jobs-objects-cell" role="cell">
                      <div className="ds-jobs-object-flow">
                        <span className="ds-jobs-source">{job.sourceObject}</span>
                        <span className="ds-jobs-arrow">→</span>
                        <span className="ds-jobs-target">{job.targetObject}</span>
                      </div>
                    </div>

                    <div className="ds-jobs-grid-cell ds-jobs-orgs-cell" role="cell">
                      <div className="ds-jobs-org-flow">
                        <span className="ds-jobs-source-org">{job.sourceOrg}</span>
                        <span className="ds-jobs-arrow">→</span>
                        <span className="ds-jobs-target-org">{job.targetOrg}</span>
                      </div>
                    </div>

                    <div className="ds-jobs-grid-cell ds-jobs-schedule-cell" role="cell">
                      <div className="ds-jobs-schedule">
                        {formatSchedule(job)}
                      </div>
                      {job.jobSchedule && (
                        <div className="ds-jobs-cron">
                          Cron: {job.jobSchedule}
                        </div>
                      )}
                    </div>

                    <div className="ds-jobs-grid-cell ds-jobs-duration-cell" role="cell">
                      <div className="ds-jobs-date-range">
                        <div className="ds-jobs-from">From: {formatDate(job.fromDate)}</div>
                        <div className="ds-jobs-to">To: {formatDate(job.toDate)}</div>
                      </div>
                    </div>

                    <div className="ds-jobs-grid-cell ds-jobs-mappings-cell" role="cell">
                      {(() => {
                        const fieldMappings = job.jobDetails.fieldMapping || job.jobDetails.fieldMaping || [];
                        return (
                          <>
                            <div className="ds-jobs-mappings-count">
                              {fieldMappings.length} field{fieldMappings.length !== 1 ? 's' : ''}
                            </div>
                            <details className="ds-jobs-mappings-details">
                              <summary className="ds-jobs-mappings-summary">View mappings</summary>
                              <div className="ds-jobs-mappings-list">
                                {fieldMappings.map((mapping, index) => (
                                  <div key={index} className="ds-jobs-mapping-item">
                                    <span className="ds-jobs-mapping-source">{mapping.source}</span>
                                    <span className="ds-jobs-mapping-arrow">→</span>
                                    <span className="ds-jobs-mapping-target">{mapping.target}</span>
                                    {mapping.sourceType && mapping.targetType && (
                                      <div className="ds-jobs-mapping-types">
                                        <span className="ds-jobs-mapping-type">({mapping.sourceType} → {mapping.targetType})</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </>
                        );
                      })()}
                    </div>

                    <div className="ds-jobs-grid-cell ds-jobs-actions-cell" role="cell">
                      <div className="ds-jobs-actions">
                        <span
                          className="action-icon edit-icon"
                          onClick={() => handleEditJob(job)}
                          aria-label="Edit job"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleEditJob(job);
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </span>
                        <span
                          className={`action-icon delete-icon ${isLoading ? 'disabled' : ''}`}
                          onClick={isLoading ? undefined : () => handleDeleteJob(job)}
                          aria-label="Delete job"
                          role="button"
                          tabIndex={isLoading ? -1 : 0}
                          onKeyDown={isLoading ? undefined : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleDeleteJob(job);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ds-jobs-footer">
              <div className="ds-jobs-count">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && deleteConfirmation.job && (
        <div className="ds-delete-modal-overlay">
          <div className="ds-delete-modal">
            <div className="ds-delete-modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="ds-delete-modal-body">
              <p>Delete this job?</p>
              <div className="ds-delete-job-info">
                <strong>"{deleteConfirmation.job.name}"</strong>
              </div>
              <p className="ds-delete-warning">This cannot be undone.</p>
            </div>
            <div className="ds-delete-modal-actions">
              <Button
                variant="outline"
                onClick={cancelDeleteJob}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteJob}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Job'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};