// Jobs API implementation with server-side pagination
// TODO: Integrate with backend API

import { Job, JobStatus } from '../utils/types';

// Response types for Jobs API
export interface JobListItem {
  id: string;
  name: string;
  object: string;
  sourceOrg: string;
  targetOrg: string;
  schedule: string;
  status: JobStatus;
  tested: boolean;
  created: string;
  lastRun?: string;
  recordsProcessed?: number;
  nextRun?: string;
}

export interface JobListResponse {
  success: boolean;
  data?: {
    jobs: JobListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

export interface DeleteJobResponse {
  success: boolean;
  error?: string;
}

// Mock delay to simulate network requests
const mockDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Mock job data generator
const generateMockJobs = (count: number): JobListItem[] => {
  const statuses: JobStatus[] = ['Active', 'Inactive', 'Draft'];
  const objects = ['Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'Product2', 'User', 'Campaign'];
  const schedules = ['Manual', '30min', '1hour', '2hours', '6hours', '12hours', 'Daily'];
  const orgs = [
    'Production Org (ABC Corp)',
    'Full Sandbox (ABC Corp)',
    'Developer Edition (Test)',
    'Staging Environment',
    'QA Environment'
  ];

  return Array.from({ length: count }, (_, index) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days

    return {
      id: `job_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 8)}`,
      name: `${objects[Math.floor(Math.random() * objects.length)]} Sync ${index + 1}`,
      object: objects[Math.floor(Math.random() * objects.length)],
      sourceOrg: orgs[Math.floor(Math.random() * orgs.length)],
      targetOrg: orgs[Math.floor(Math.random() * orgs.length)],
      schedule: schedules[Math.floor(Math.random() * schedules.length)],
      status,
      tested: Math.random() > 0.3, // 70% chance of being tested
      created: createdDate.toISOString(),
      lastRun: status !== 'Draft' ? new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      recordsProcessed: status === 'Active' ? Math.floor(Math.random() * 10000) + 100 : undefined,
      nextRun: status === 'Active' ? new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined
    };
  });
};

// Generate mock data - in real implementation this would come from the server
const MOCK_JOBS = generateMockJobs(157); // Generate 157 mock jobs for pagination testing

export const jobsAPI = {
  // TODO: Integrate with backend API - GET /api/jobs?page={page}&limit={pageSize}&search={searchTerm}
  async list(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = ''
  ): Promise<JobListResponse> {
    await mockDelay();

    try {
      // Filter jobs based on search term
      let filteredJobs = MOCK_JOBS;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredJobs = MOCK_JOBS.filter(job =>
          job.name.toLowerCase().includes(term) ||
          job.object.toLowerCase().includes(term) ||
          job.sourceOrg.toLowerCase().includes(term) ||
          job.targetOrg.toLowerCase().includes(term) ||
          job.status.toLowerCase().includes(term) ||
          job.schedule.toLowerCase().includes(term)
        );
      }

      // Calculate pagination
      const total = filteredJobs.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const jobs = filteredJobs.slice(startIndex, endIndex);

      // Sort by created date (newest first)
      jobs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return {
        success: true,
        data: {
          jobs,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        success: false,
        error: 'Failed to fetch jobs. Please try again.'
      };
    }
  },

  // TODO: Integrate with backend API - DELETE /api/jobs/{id}
  async delete(jobId: string): Promise<DeleteJobResponse> {
    await mockDelay(500);

    try {
      // Find job in mock data
      const jobIndex = MOCK_JOBS.findIndex(job => job.id === jobId);

      if (jobIndex === -1) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      // Remove job from mock data
      MOCK_JOBS.splice(jobIndex, 1);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting job:', error);
      return {
        success: false,
        error: 'Failed to delete job. Please try again.'
      };
    }
  },

  // TODO: Integrate with backend API - PUT /api/jobs/{id}/pause
  async pause(jobId: string): Promise<{ success: boolean; error?: string }> {
    await mockDelay(300);

    try {
      const job = MOCK_JOBS.find(j => j.id === jobId);
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      job.status = 'Inactive';
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to pause job' };
    }
  },

  // TODO: Integrate with backend API - PUT /api/jobs/{id}/resume
  async resume(jobId: string): Promise<{ success: boolean; error?: string }> {
    await mockDelay(300);

    try {
      const job = MOCK_JOBS.find(j => j.id === jobId);
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      job.status = 'Active';
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to resume job' };
    }
  },

  // TODO: Integrate with backend API - POST /api/jobs/{id}/run
  async runNow(jobId: string): Promise<{ success: boolean; error?: string }> {
    await mockDelay(1000);

    try {
      const job = MOCK_JOBS.find(j => j.id === jobId);
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      job.lastRun = new Date().toISOString();
      job.status = 'Active'; // Job successfully ran
      job.recordsProcessed = Math.floor(Math.random() * 5000) + 100;

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to run job' };
    }
  }
};