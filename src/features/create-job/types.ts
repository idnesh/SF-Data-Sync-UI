// Types and interfaces for the Job Creation Wizard

export type Environment = 'production' | 'sandbox' | 'developer';

export type ScheduleOption = 'manual' | '30min' | '1hour' | '2hours' | '6hours' | '12hours' | 'daily' | 'weekly' | '2weeks' | 'monthly' | 'custom';

export type ValidationStatus = 'valid' | 'warning' | 'incompatible';

export type TransformationType = 'none' | 'script' | 'builtin';

export interface ConnectionData {
  username: string;
  password: string;
  securityToken?: string;
  environment: Environment;
  orgName?: string;
  isConnected?: boolean;
  connectionTimestamp?: string;
  connectionError?: string;
}

export interface SalesforceObject {
  name: string;
  label: string;
  apiName: string;
  fieldCount: number;
  description?: string;
  isCustom?: boolean;
  parentObject?: string;
  childObjects?: ChildObject[];
}

export interface SalesforceField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  length?: number;
  precision?: number;
  scale?: number;
  picklistValues?: string[];
  isCustom?: boolean;
}

export interface ChildObject {
  label: string;
  apiName: string;
  relationshipType: 'Lookup' | 'Master-Detail' | 'Hierarchical';
  description?: string;
}

export interface FieldMapping {
  [sourceField: string]: string; // source field -> target field
}

export interface Transformation {
  type: TransformationType;
  script?: string;
  builtinName?: string;
  description?: string;
}

export interface FieldValidationResult {
  sourceField: string;
  targetField: string;
  sourceType: string;
  targetType: string;
  status: ValidationStatus;
  message: string;
  suggestion?: string;
}

export interface TestResult {
  success: boolean;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: Array<{
    field: string;
    message: string;
    record?: any;
  }>;
  estimatedDuration: number;
  sampleData?: any[];
}

export interface JobData {
  id?: string;
  name: string;
  description?: string;
  sourceConnection: ConnectionData;
  targetConnection: ConnectionData;
  selectedObject: string; // Keep for backward compatibility
  sourceObject: string;
  targetObject: string;
  syncAllFields: boolean;
  selectedFields: string[];
  fieldMappings: FieldMapping;
  transformations: Record<string, Transformation>;
  schedule: ScheduleOption;
  customCron?: string;
  startDate?: string;
  startTime?: string;
  tested: boolean;
  testResult?: TestResult;
  validationResults?: FieldValidationResult[];
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  isActive: boolean;
  hasErrors: boolean;
}

export interface WizardState {
  currentStep: number;
  jobData: JobData;
  steps: WizardStep[];
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

// API Request/Response types
export interface ConnectOrgRequest {
  username: string;
  password: string;
  securityToken?: string;
  environment: Environment;
  type: 'source' | 'target';
}

export interface ConnectOrgResponse {
  success: boolean;
  orgName?: string;
  orgId?: string;
  error?: string;
}

export interface ListObjectsRequest {
  connectionId: string;
}

export interface ListObjectsResponse {
  success: boolean;
  objects: SalesforceObject[];
  error?: string;
}

export interface GetFieldsRequest {
  connectionId: string;
  objectName: string;
}

export interface GetFieldsResponse {
  success: boolean;
  fields: SalesforceField[];
  error?: string;
}

export interface ValidateFieldsRequest {
  sourceOrg: ConnectionData;
  targetOrg: ConnectionData;
  object: string;
  mappings: FieldMapping;
  transformations: Record<string, Transformation>;
}

export interface ValidateFieldsResponse {
  success: boolean;
  results: FieldValidationResult[];
  error?: string;
}

export interface TestJobRequest {
  jobData: JobData;
  dryRun: boolean;
  sampleSize?: number;
}

export interface TestJobResponse {
  success: boolean;
  result: TestResult;
  error?: string;
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  sourceConnection: ConnectionData;
  targetConnection: ConnectionData;
  object: string;
  mappings: FieldMapping;
  transformations: Record<string, Transformation>;
  schedule: ScheduleOption;
  customCron?: string;
  dryRunResult?: TestResult;
}

export interface CreateJobResponse {
  success: boolean;
  jobId?: string;
  job?: JobData;
  error?: string;
}

// Built-in transformation options
export const BUILTIN_TRANSFORMATIONS = [
  { name: 'toUpperCase', label: 'Convert to Uppercase', description: 'Converts text to uppercase' },
  { name: 'toLowerCase', label: 'Convert to Lowercase', description: 'Converts text to lowercase' },
  { name: 'trim', label: 'Trim Whitespace', description: 'Removes leading and trailing whitespace' },
  { name: 'parseFloat', label: 'Parse Number', description: 'Converts text to number' },
  { name: 'formatDate', label: 'Format Date', description: 'Formats date to YYYY-MM-DD' },
  { name: 'formatDateTime', label: 'Format DateTime', description: 'Formats datetime to ISO string' },
  { name: 'removeNonAlphaNumeric', label: 'Remove Special Characters', description: 'Keeps only letters and numbers' },
  { name: 'capitalizeFirst', label: 'Capitalize First Letter', description: 'Capitalizes the first letter of each word' }
] as const;

// Schedule options
export const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual', description: 'Run manually when needed' },
  { value: '30min', label: 'Every 30 minutes', description: 'Runs every 30 minutes' },
  { value: '1hour', label: 'Every hour', description: 'Runs every hour' },
  { value: '2hours', label: 'Every 2 hours', description: 'Runs every 2 hours' },
  { value: '6hours', label: 'Every 6 hours', description: 'Runs every 6 hours' },
  { value: '12hours', label: 'Every 12 hours', description: 'Runs every 12 hours' },
  { value: 'daily', label: 'Daily', description: 'Runs once per day' },
  { value: 'custom', label: 'Custom (Cron)', description: 'Custom cron expression' }
] as const;

// Environment options
export const ENVIRONMENT_OPTIONS = [
  { value: 'production', label: 'Production', description: 'Live production environment' },
  { value: 'sandbox', label: 'Sandbox', description: 'Testing/staging environment' },
  { value: 'developer', label: 'Developer', description: 'Development environment' }
] as const;