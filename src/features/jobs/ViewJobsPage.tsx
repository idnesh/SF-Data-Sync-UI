import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, JobListItem } from '../../api/jobsAPI';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Header } from '../../components/layout/Header';

interface ViewJobsPageProps {}

export const ViewJobsPage: React.FC<ViewJobsPageProps> = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [pageSize] = useState(10);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string }>({});

  const totalPages = Math.ceil(totalJobs / pageSize);

  const fetchJobs = useCallback(async (page: number = 1, search: string = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await jobsAPI.list(page, pageSize, search);

      if (response.success && response.data) {
        setJobs(response.data.jobs);
        setTotalJobs(response.data.total);
        setCurrentPage(response.data.page);
      } else {
        setError(response.error || 'Failed to fetch jobs');
        setJobs([]);
        setTotalJobs(0);
      }
    } catch (err) {
      setError('Network error occurred while fetching jobs');
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchJobs(1, searchTerm);
  }, [fetchJobs, searchTerm]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage === 1) {
        fetchJobs(1, searchTerm);
      } else {
        setCurrentPage(1);
        fetchJobs(1, searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchJobs]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchJobs(page, searchTerm);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;

    setIsDeleting(true);
    try {
      const response = await jobsAPI.delete(deleteJobId);

      if (response.success) {
        setDeleteJobId(null);
        fetchJobs(currentPage, searchTerm);
      } else {
        setError(response.error || 'Failed to delete job');
      }
    } catch (err) {
      setError('Network error occurred while deleting job');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJobAction = async (jobId: string, action: 'pause' | 'resume' | 'run') => {
    setActionLoading(prev => ({ ...prev, [jobId]: action }));

    try {
      let response;
      switch (action) {
        case 'pause':
          response = await jobsAPI.pause(jobId);
          break;
        case 'resume':
          response = await jobsAPI.resume(jobId);
          break;
        case 'run':
          response = await jobsAPI.runNow(jobId);
          break;
      }

      if (response.success) {
        fetchJobs(currentPage, searchTerm);
      } else {
        setError(response.error || `Failed to ${action} job`);
      }
    } catch (err) {
      setError(`Network error occurred while trying to ${action} job`);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[jobId];
        return newState;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="status-icon active">▶️</span>;
      case 'Inactive':
        return <span className="status-icon inactive">⏸️</span>;
      case 'Draft':
        return <span className="status-icon draft">📝</span>;
      default:
        return <span className="status-icon">⚪</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 7;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="pagination">
        <Button
          variant="outline"
          size="small"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ←
        </Button>

        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="pagination-ellipsis">...</span>
            ) : (
              <Button
                variant={currentPage === page ? 'primary' : 'outline'}
                size="small"
                onClick={() => handlePageChange(page as number)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="small"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          →
        </Button>
      </div>
    );
  };

  return (
    <div className="jobs-page">
      <Header
        title="Salesforce Data Synchronization Platform"
        subtitle="Manage and monitor your data synchronization jobs"
      />
      <div className="jobs-header">
        <div className="header-content">
          <h3 className="page-title">All Jobs</h3>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => navigate('/create-job')}
            aria-label="Create new job"
          >
            + New Job
          </Button>
        </div>
      </div>

      <div className="jobs-controls">
        <div className="search-section">
          <Input
            type="text"
            placeholder="Search jobs by name, object, organization, or status..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="search-input"
            aria-label="Search jobs"
          />
        </div>

        <div className="jobs-stats">
          <span className="stats-text">
            {isLoading ? 'Loading...' : `${totalJobs} total jobs`}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              setError(null);
              fetchJobs(currentPage, searchTerm);
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="jobs-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No jobs found</h3>
                <p>No jobs match your search criteria. Try adjusting your search terms.</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <div className="empty-icon">📊</div>
                <h3>No jobs yet</h3>
                <p>Get started by creating your first data synchronization job.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/create-job')}
                >
                  Create Your First Job
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <table className="jobs-table" role="table" aria-label="Jobs list">
              <thead>
                <tr>
                  <th scope="col">Job Name</th>
                  <th scope="col">Object</th>
                  <th scope="col">Source → Target</th>
                  <th scope="col">Schedule</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="job-row">
                    <td className="job-name-cell">
                      <div className="job-name">{job.name}</div>
                      <div className="job-meta">
                        {job.tested && <span className="tested-badge">Tested</span>}
                        <span className="created-date">
                          Created {formatDate(job.created)}
                        </span>
                      </div>
                    </td>

                    <td className="object-cell">
                      <span className="object-name">{job.object}</span>
                    </td>

                    <td className="orgs-cell">
                      <div className="org-flow">
                        <div className="source-org" title={job.sourceOrg}>
                          {job.sourceOrg}
                        </div>
                        <div className="flow-arrow">→</div>
                        <div className="target-org" title={job.targetOrg}>
                          {job.targetOrg}
                        </div>
                      </div>
                    </td>

                    <td className="schedule-cell">
                      <span className="schedule-value">{job.schedule}</span>
                      {job.nextRun && (
                        <div className="next-run">
                          Next: {formatDate(job.nextRun)}
                        </div>
                      )}
                    </td>

                    <td className="status-cell">
                      <div className="status-container">
                        {getStatusIcon(job.status)}
                        <span className={`status-text status-${job.status.toLowerCase()}`}>
                          {job.status}
                        </span>
                      </div>
                    </td>

                    <td className="actions-cell">
                      <div className="job-actions">
                        {job.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleJobAction(job.id, 'pause')}
                            disabled={!!actionLoading[job.id]}
                            loading={actionLoading[job.id] === 'pause'}
                            title="Deactivate job"
                          >
                            ⏸️
                          </Button>
                        )}

                        {job.status === 'Inactive' && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleJobAction(job.id, 'resume')}
                            disabled={!!actionLoading[job.id]}
                            loading={actionLoading[job.id] === 'resume'}
                            title="Activate job"
                          >
                            ▶️
                          </Button>
                        )}

                        {(job.status === 'Active' || job.status === 'Inactive') && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleJobAction(job.id, 'run')}
                            disabled={!!actionLoading[job.id]}
                            loading={actionLoading[job.id] === 'run'}
                            title="Run now"
                          >
                            🚀
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => setDeleteJobId(job.id)}
                          disabled={!!actionLoading[job.id]}
                          title="Delete job"
                          className="delete-button"
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              <div className="results-info">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalJobs)} to{' '}
                {Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} jobs
              </div>
              {renderPagination()}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!deleteJobId}
        onClose={() => setDeleteJobId(null)}
        title="Delete Job"
        size="small"
      >
        <div className="delete-confirmation">
          <p>
            Are you sure you want to delete this job? This action cannot be undone.
          </p>
          <div className="confirmation-actions">
            <Button
              variant="outline"
              onClick={() => setDeleteJobId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteJob}
              loading={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Job'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};