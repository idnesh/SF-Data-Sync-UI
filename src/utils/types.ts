// Core type definitions for the Salesforce Data Sync Platform

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'System Administrator' | 'Integration Manager' | 'Read-Only Auditor';
  createdAt: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// Job Management Types (Future API Integration)
export interface Connection {
  id: string;
  name: string;
  type: 'Production' | 'Sandbox' | 'Developer';
  isActive: boolean;
  lastTested: string;
}

export interface Job {
  id: string;
  name: string;
  description: string;
  sourceConnection: Connection;
  targetConnection: Connection;
  schedule: JobSchedule;
  status: JobStatus;
  createdBy: string;
  createdAt: string;
  lastRun?: JobExecution;
}

export interface JobSchedule {
  frequency: 'Manual' | '30min' | '1hour' | '2hours' | '6hours' | '12hours' | 'Daily';
  isActive: boolean;
  nextRun?: string;
}

export type JobStatus = 'Draft' | 'Active' | 'Paused' | 'Failed' | 'Completed';

export interface JobExecution {
  id: string;
  jobId: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Paused';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorLog?: string[];
}

// Wizard Step Types
export interface WizardStep {
  id: number;
  label: string;
  icon: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface JobCreationData {
  step1: {
    name: string;
    description: string;
    owner: string;
  };
  step2: {
    sourceConnection: string;
    targetConnection: string;
  };
  step3: {
    selectedObjects: string[];
  };
  step4: {
    fieldMappings: FieldMapping[];
  };
  step5: {
    validationResults: ValidationResult[];
  };
  step6: {
    testResults: TestResult | null;
    schedule: JobSchedule;
  };
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

export interface ValidationResult {
  field: string;
  status: 'valid' | 'warning' | 'error';
  message: string;
}

export interface TestResult {
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  errors: string[];
  estimatedDuration: number;
}

// Form Validation Types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  match?: string;
  custom?: (value: string) => boolean;
  message: string;
}

export interface FieldError {
  field: string;
  message: string;
}