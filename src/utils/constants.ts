// Application constants

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_LOGIN: false, // Set to true to enable login/signup functionality
} as const;

// Session and authentication
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
export const SESSION_STORAGE_KEY = 'sf_sync_session';
export const LAST_ACTIVITY_KEY = 'sf_sync_last_activity';

// User roles
export const USER_ROLES = {
  SYSTEM_ADMIN: 'System Administrator',
  INTEGRATION_MANAGER: 'Integration Manager',
  READ_ONLY_AUDITOR: 'Read-Only Auditor'
} as const;

// Job statuses
export const JOB_STATUSES = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
} as const;

// Job execution statuses
export const EXECUTION_STATUSES = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  PAUSED: 'Paused'
} as const;

// Salesforce connection types
export const CONNECTION_TYPES = {
  PRODUCTION: 'Production',
  SANDBOX: 'Sandbox',
  DEVELOPER: 'Developer'
} as const;

// Job scheduling frequencies
export const SCHEDULE_FREQUENCIES = {
  MANUAL: 'Manual',
  EVERY_30_MIN: '30min',
  EVERY_HOUR: '1hour',
  EVERY_2_HOURS: '2hours',
  EVERY_6_HOURS: '6hours',
  EVERY_12_HOURS: '12hours',
  DAILY: 'Daily'
} as const;

// Wizard steps configuration
export const WIZARD_STEPS = [
  { id: 1, label: 'Job Details', icon: 'info', route: '/jobs/create/details' },
  { id: 2, label: 'Connections', icon: 'link', route: '/jobs/create/connections' },
  { id: 3, label: 'Objects', icon: 'database', route: '/jobs/create/objects' },
  { id: 4, label: 'Field Mapping', icon: 'mapping', route: '/jobs/create/mapping' },
  { id: 5, label: 'Validation', icon: 'check', route: '/jobs/create/validation' },
  { id: 6, label: 'Simulate', icon: 'calendar', route: '/jobs/create/schedule' }
];

// Validation statuses
export const VALIDATION_STATUSES = {
  VALID: 'valid',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100
} as const;

// API endpoints (for future backend integration)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VALIDATE: '/api/auth/validate'
  },
  JOBS: {
    LIST: '/api/jobs',
    CREATE: '/api/jobs',
    GET: '/api/jobs/:id',
    UPDATE: '/api/jobs/:id',
    DELETE: '/api/jobs/:id',
    TEST: '/api/jobs/:id/test',
    EXECUTE: '/api/jobs/:id/execute'
  },
  CONNECTIONS: {
    LIST: '/api/connections',
    CREATE: '/api/connections',
    TEST: '/api/connections/:id/test',
    DELETE: '/api/connections/:id'
  },
  SALESFORCE: {
    OBJECTS: '/api/salesforce/:connectionId/objects',
    FIELDS: '/api/salesforce/:connectionId/objects/:objectName/fields',
    VALIDATE_MAPPING: '/api/salesforce/validate-mapping'
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_FAILED: 'Please correct the errors below.',
  CONNECTION_FAILED: 'Failed to connect to Salesforce. Please check your credentials.',
  JOB_CREATION_FAILED: 'Failed to create job. Please try again.',
  JOB_EXECUTION_FAILED: 'Job execution failed. Check the logs for details.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  SIGNUP: 'Account created successfully!',
  JOB_CREATED: 'Job created successfully!',
  JOB_UPDATED: 'Job updated successfully!',
  JOB_DELETED: 'Job deleted successfully!',
  CONNECTION_TESTED: 'Connection test successful!',
  TEST_COMPLETED: 'Job test completed successfully!'
} as const;

// Theme colors (dark mode)
export const THEME_COLORS = {
  BG_PRIMARY: '#0a0a0a',
  BG_SECONDARY: '#1a1a1a',
  BG_TERTIARY: '#2a2a2a',
  BORDER_PRIMARY: '#333',
  BORDER_SECONDARY: '#555',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#e5e5e5',
  TEXT_MUTED: '#a0a0a0',
  ACCENT_PRIMARY: '#0071e3',
  ACCENT_HOVER: '#0056b3',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  ERROR: '#dc3545',
  INFO: '#17a2b8'
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1200px'
} as const;