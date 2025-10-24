import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';

interface ViewJobsPageProps {
  onBackToDashboard?: () => void;
  onCreateJob?: () => void;
}

interface JobData {
  name: string;
  schedule: {
    frequency: string;
    timeUnit: string;
  };
  fromDate: string;
  toDate: string;
  sourceObject: string;
  targetObject: string;
  extId: string;
  fieldMaping: Array<{
    source: string;
    sourceType: string;
    target: string;
    targetType: string;
  }>;
}

interface ApiResponse {
  [jobName: string]: string; // JSON string that needs to be parsed
}

export const ViewJobsPage: React.FC<ViewJobsPageProps> = ({
  onBackToDashboard,
  onCreateJob
}) => {
  const [jobs, setJobs] = useState<{ [key: string]: JobData }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs from API
  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/readJobs');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // Parse the JSON strings in the response
      const parsedJobs: { [key: string]: JobData } = {};
      Object.keys(data).forEach(jobName => {
        try {
          parsedJobs[jobName] = JSON.parse(data[jobName]);
        } catch (parseError) {
          console.error(`Failed to parse job data for ${jobName}:`, parseError);
        }
      });

      setJobs(parsedJobs);
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

  const formatSchedule = (schedule: JobData['schedule']) => {
    const unit = schedule.timeUnit.toLowerCase();
    const freq = schedule.frequency;
    return `Every ${freq} ${unit}`;
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
        ) : Object.keys(jobs).length === 0 ? (
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
              <table className="ds-jobs-table">
                <thead className="ds-jobs-thead">
                  <tr className="ds-jobs-header-row">
                    <th className="ds-jobs-th">Job Name</th>
                    <th className="ds-jobs-th">Objects</th>
                    <th className="ds-jobs-th">Schedule</th>
                    <th className="ds-jobs-th">Duration</th>
                    <th className="ds-jobs-th">Field Mappings</th>
                  </tr>
                </thead>
                <tbody className="ds-jobs-tbody">
                  {Object.entries(jobs).map(([jobName, jobData]) => (
                    <tr key={jobName} className="ds-jobs-row">
                      <td className="ds-jobs-td ds-jobs-name-cell">
                        <div className="ds-jobs-name">{jobData.name}</div>
                        <div className="ds-jobs-ext-id">ID: {jobData.extId}</div>
                      </td>

                      <td className="ds-jobs-td ds-jobs-objects-cell">
                        <div className="ds-jobs-object-flow">
                          <span className="ds-jobs-source">{jobData.sourceObject}</span>
                          <span className="ds-jobs-arrow">→</span>
                          <span className="ds-jobs-target">{jobData.targetObject}</span>
                        </div>
                      </td>

                      <td className="ds-jobs-td ds-jobs-schedule-cell">
                        <div className="ds-jobs-schedule">
                          {formatSchedule(jobData.schedule)}
                        </div>
                      </td>

                      <td className="ds-jobs-td ds-jobs-duration-cell">
                        <div className="ds-jobs-date-range">
                          <div className="ds-jobs-from">From: {formatDate(jobData.fromDate)}</div>
                          <div className="ds-jobs-to">To: {formatDate(jobData.toDate)}</div>
                        </div>
                      </td>

                      <td className="ds-jobs-td ds-jobs-mappings-cell">
                        <div className="ds-jobs-mappings-count">
                          {jobData.fieldMaping.length} field{jobData.fieldMaping.length !== 1 ? 's' : ''}
                        </div>
                        <details className="ds-jobs-mappings-details">
                          <summary className="ds-jobs-mappings-summary">View mappings</summary>
                          <div className="ds-jobs-mappings-list">
                            {jobData.fieldMaping.map((mapping, index) => (
                              <div key={index} className="ds-jobs-mapping-item">
                                <span className="ds-jobs-mapping-source">{mapping.source}</span>
                                <span className="ds-jobs-mapping-arrow">→</span>
                                <span className="ds-jobs-mapping-target">{mapping.target}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ds-jobs-footer">
              <div className="ds-jobs-count">
                {Object.keys(jobs).length} job{Object.keys(jobs).length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};