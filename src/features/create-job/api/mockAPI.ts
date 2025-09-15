// Mock API implementations for Job Creation Wizard
// TODO: Integrate with backend API

import {
  ConnectOrgRequest,
  ConnectOrgResponse,
  ListObjectsRequest,
  ListObjectsResponse,
  GetFieldsRequest,
  GetFieldsResponse,
  ValidateFieldsRequest,
  ValidateFieldsResponse,
  TestJobRequest,
  TestJobResponse,
  CreateJobRequest,
  CreateJobResponse,
  SalesforceObject,
  SalesforceField,
  FieldValidationResult,
  ValidationStatus
} from '../types';

// Mock delay to simulate network requests
const mockDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Salesforce objects
export const MOCK_OBJECTS: SalesforceObject[] = [
  {
    name: 'Account',
    label: 'Account',
    apiName: 'Account',
    fieldCount: 45,
    description: 'Business accounts and organizations'
  },
  {
    name: 'Contact',
    label: 'Contact',
    apiName: 'Contact',
    fieldCount: 38,
    description: 'Individual people related to accounts'
  },
  {
    name: 'Lead',
    label: 'Lead',
    apiName: 'Lead',
    fieldCount: 32,
    description: 'Potential customers and prospects'
  },
  {
    name: 'Opportunity',
    label: 'Opportunity',
    apiName: 'Opportunity',
    fieldCount: 28,
    description: 'Sales opportunities and deals'
  },
  {
    name: 'Case',
    label: 'Case',
    apiName: 'Case',
    fieldCount: 25,
    description: 'Customer service cases and issues'
  },
  {
    name: 'Product2',
    label: 'Product',
    apiName: 'Product2',
    fieldCount: 15,
    description: 'Products and services offered'
  },
  {
    name: 'User',
    label: 'User',
    apiName: 'User',
    fieldCount: 65,
    description: 'System users and employees'
  },
  {
    name: 'Campaign',
    label: 'Campaign',
    apiName: 'Campaign',
    fieldCount: 22,
    description: 'Marketing campaigns and initiatives'
  }
];

// Mock Salesforce fields by object
export const MOCK_FIELDS: Record<string, SalesforceField[]> = {
  Account: [
    { name: 'Id', label: 'Account ID', type: 'id', required: false, description: 'Unique identifier' },
    { name: 'Name', label: 'Account Name', type: 'string', required: true, length: 255, description: 'Name of the account' },
    { name: 'Type', label: 'Account Type', type: 'picklist', required: false, picklistValues: ['Customer', 'Partner', 'Prospect', 'Other'] },
    { name: 'Industry', label: 'Industry', type: 'picklist', required: false, picklistValues: ['Technology', 'Healthcare', 'Manufacturing', 'Finance', 'Retail'] },
    { name: 'Phone', label: 'Phone', type: 'phone', required: false, length: 40 },
    { name: 'Website', label: 'Website', type: 'url', required: false, length: 255 },
    { name: 'BillingStreet', label: 'Billing Street', type: 'textarea', required: false, length: 255 },
    { name: 'BillingCity', label: 'Billing City', type: 'string', required: false, length: 40 },
    { name: 'BillingState', label: 'Billing State', type: 'string', required: false, length: 80 },
    { name: 'BillingPostalCode', label: 'Billing Postal Code', type: 'string', required: false, length: 20 },
    { name: 'BillingCountry', label: 'Billing Country', type: 'string', required: false, length: 80 },
    { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency', required: false, precision: 18, scale: 0 },
    { name: 'NumberOfEmployees', label: 'Employees', type: 'int', required: false },
    { name: 'Description', label: 'Description', type: 'textarea', required: false, length: 32000 },
    { name: 'CreatedDate', label: 'Created Date', type: 'datetime', required: false },
    { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime', required: false }
  ],
  Contact: [
    { name: 'Id', label: 'Contact ID', type: 'id', required: false },
    { name: 'AccountId', label: 'Account ID', type: 'reference', required: false },
    { name: 'FirstName', label: 'First Name', type: 'string', required: false, length: 40 },
    { name: 'LastName', label: 'Last Name', type: 'string', required: true, length: 80 },
    { name: 'Email', label: 'Email', type: 'email', required: false, length: 80 },
    { name: 'Phone', label: 'Phone', type: 'phone', required: false, length: 40 },
    { name: 'MobilePhone', label: 'Mobile Phone', type: 'phone', required: false, length: 40 },
    { name: 'Title', label: 'Title', type: 'string', required: false, length: 128 },
    { name: 'Department', label: 'Department', type: 'string', required: false, length: 80 },
    { name: 'LeadSource', label: 'Lead Source', type: 'picklist', required: false, picklistValues: ['Web', 'Phone Inquiry', 'Partner', 'Purchased List', 'Other'] },
    { name: 'Birthdate', label: 'Birthdate', type: 'date', required: false },
    { name: 'Description', label: 'Description', type: 'textarea', required: false, length: 32000 },
    { name: 'CreatedDate', label: 'Created Date', type: 'datetime', required: false },
    { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime', required: false }
  ],
  Lead: [
    { name: 'Id', label: 'Lead ID', type: 'id', required: false },
    { name: 'FirstName', label: 'First Name', type: 'string', required: false, length: 40 },
    { name: 'LastName', label: 'Last Name', type: 'string', required: true, length: 80 },
    { name: 'Company', label: 'Company', type: 'string', required: true, length: 255 },
    { name: 'Email', label: 'Email', type: 'email', required: false, length: 80 },
    { name: 'Phone', label: 'Phone', type: 'phone', required: false, length: 40 },
    { name: 'Status', label: 'Lead Status', type: 'picklist', required: true, picklistValues: ['Open', 'Contacted', 'Qualified', 'Unqualified', 'Converted'] },
    { name: 'LeadSource', label: 'Lead Source', type: 'picklist', required: false, picklistValues: ['Web', 'Phone Inquiry', 'Partner', 'Purchased List', 'Other'] },
    { name: 'Industry', label: 'Industry', type: 'picklist', required: false, picklistValues: ['Technology', 'Healthcare', 'Manufacturing', 'Finance', 'Retail'] },
    { name: 'Rating', label: 'Rating', type: 'picklist', required: false, picklistValues: ['Hot', 'Warm', 'Cold'] },
    { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'currency', required: false, precision: 18, scale: 0 },
    { name: 'NumberOfEmployees', label: 'Employees', type: 'int', required: false },
    { name: 'Description', label: 'Description', type: 'textarea', required: false, length: 32000 },
    { name: 'CreatedDate', label: 'Created Date', type: 'datetime', required: false },
    { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'datetime', required: false }
  ]
};

// Mock API implementations
export const mockSalesforceAPI = {
  // TODO: Integrate with backend API - POST /api/salesforce/connect
  async connectOrg(request: ConnectOrgRequest): Promise<ConnectOrgResponse> {
    await mockDelay(2000); // Simulate connection test time

    // Simulate different scenarios based on username
    if (request.username.includes('invalid')) {
      return {
        success: false,
        error: 'Invalid credentials. Please check your username and password.'
      };
    }

    if (request.username.includes('timeout')) {
      return {
        success: false,
        error: 'Connection timeout. Please check your network connection and Salesforce instance URL.'
      };
    }

    if (request.username.includes('ip-restricted')) {
      return {
        success: false,
        error: 'IP address not allowed. Please add your IP to the trusted IP ranges in Salesforce.'
      };
    }

    // Simulate successful connection
    const orgNames = {
      production: 'Production Org (ABC Corp)',
      sandbox: 'Full Sandbox (ABC Corp)',
      developer: 'Developer Edition (ABC Corp)'
    };

    return {
      success: true,
      orgName: orgNames[request.environment],
      orgId: `00D${Math.random().toString(36).substr(2, 15)}`
    };
  },

  // TODO: Integrate with backend API - GET /api/salesforce/:connectionId/objects
  async listObjects(request: ListObjectsRequest): Promise<ListObjectsResponse> {
    await mockDelay(1500);

    return {
      success: true,
      objects: MOCK_OBJECTS
    };
  },

  // TODO: Integrate with backend API - GET /api/salesforce/:connectionId/objects/:objectName/fields
  async getFields(request: GetFieldsRequest): Promise<GetFieldsResponse> {
    await mockDelay(1000);

    const fields = MOCK_FIELDS[request.objectName];
    if (!fields) {
      return {
        success: false,
        fields: [],
        error: `Object ${request.objectName} not found or not accessible.`
      };
    }

    return {
      success: true,
      fields
    };
  },

  // TODO: Integrate with backend API - POST /api/salesforce/validate-mapping
  async validateFields(request: ValidateFieldsRequest): Promise<ValidateFieldsResponse> {
    await mockDelay(2000);

    const results: FieldValidationResult[] = [];
    const sourceFields = MOCK_FIELDS[request.object] || [];
    const targetFields = MOCK_FIELDS[request.object] || []; // In real scenario, these would be from target org

    Object.entries(request.mappings).forEach(([sourceField, targetField]) => {
      const sourceFieldDef = sourceFields.find(f => f.name === sourceField);
      const targetFieldDef = targetFields.find(f => f.name === targetField);

      if (!sourceFieldDef || !targetFieldDef) {
        results.push({
          sourceField,
          targetField,
          sourceType: sourceFieldDef?.type || 'unknown',
          targetType: targetFieldDef?.type || 'unknown',
          status: 'incompatible',
          message: `Field ${!sourceFieldDef ? sourceField : targetField} not found`,
          suggestion: 'Please select a valid field mapping'
        });
        return;
      }

      // Type compatibility logic
      const isCompatible = checkTypeCompatibility(sourceFieldDef.type, targetFieldDef.type);
      const status: ValidationStatus = isCompatible.status;

      results.push({
        sourceField,
        targetField,
        sourceType: sourceFieldDef.type,
        targetType: targetFieldDef.type,
        status,
        message: isCompatible.message,
        suggestion: isCompatible.suggestion
      });
    });

    return {
      success: true,
      results
    };
  }
};

export const mockJobsAPI = {
  // TODO: Integrate with backend API - POST /api/jobs/test
  async testJob(request: TestJobRequest): Promise<TestJobResponse> {
    await mockDelay(3000); // Simulate test execution time

    const sampleSize = request.sampleSize || 100;
    const successRate = 0.85; // 85% success rate for mock

    const recordsSucceeded = Math.floor(sampleSize * successRate);
    const recordsFailed = sampleSize - recordsSucceeded;

    const errors = [];
    if (recordsFailed > 0) {
      errors.push({
        field: 'Email',
        message: 'Invalid email format',
        record: { Id: '001xx000001', Email: 'invalid-email' }
      });
      errors.push({
        field: 'Phone',
        message: 'Phone number too long',
        record: { Id: '001xx000002', Phone: '123456789012345678901234567890' }
      });
    }

    return {
      success: true,
      result: {
        success: recordsFailed === 0,
        recordsProcessed: sampleSize,
        recordsSucceeded,
        recordsFailed,
        errors,
        estimatedDuration: Math.floor(sampleSize / 10), // ~10 records per second
        sampleData: [
          { Id: '001xx000001', Name: 'Acme Corp', Phone: '555-1234', Email: 'contact@acme.com' },
          { Id: '001xx000002', Name: 'Tech Solutions', Phone: '555-5678', Email: 'info@techsolutions.com' },
          { Id: '001xx000003', Name: 'Global Industries', Phone: '555-9012', Email: 'sales@global.com' }
        ]
      }
    };
  },

  // TODO: Integrate with backend API - POST /api/jobs
  async createJob(request: CreateJobRequest): Promise<CreateJobResponse> {
    await mockDelay(1500);

    // Simulate validation errors
    if (!request.name || request.name.length < 3) {
      return {
        success: false,
        error: 'Job name must be at least 3 characters long'
      };
    }

    if (!request.sourceConnection.isConnected || !request.targetConnection.isConnected) {
      return {
        success: false,
        error: 'Both source and target connections must be established'
      };
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    return {
      success: true,
      jobId,
      job: {
        id: jobId,
        name: request.name,
        description: request.description,
        sourceConnection: request.sourceConnection,
        targetConnection: request.targetConnection,
        selectedObject: request.object,
        syncAllFields: Object.keys(request.mappings).length === (MOCK_FIELDS[request.object]?.length || 0),
        selectedFields: Object.keys(request.mappings),
        fieldMappings: request.mappings,
        transformations: request.transformations,
        schedule: request.schedule,
        customCron: request.customCron,
        tested: !!request.dryRunResult,
        testResult: request.dryRunResult
      }
    };
  }
};

// Helper function to check type compatibility
function checkTypeCompatibility(sourceType: string, targetType: string): {
  status: ValidationStatus;
  message: string;
  suggestion?: string;
} {
  // Same types are always compatible
  if (sourceType === targetType) {
    return {
      status: 'valid',
      message: 'Types match perfectly'
    };
  }

  // String can go to most types with transformation
  if (sourceType === 'string') {
    if (['textarea', 'email', 'phone', 'url'].includes(targetType)) {
      return {
        status: 'valid',
        message: 'Text types are compatible'
      };
    }
    if (['int', 'double', 'currency'].includes(targetType)) {
      return {
        status: 'warning',
        message: 'Text to number conversion requires validation',
        suggestion: 'Use parseFloat or parseInt transformation'
      };
    }
    if (targetType === 'date' || targetType === 'datetime') {
      return {
        status: 'warning',
        message: 'Text to date conversion requires proper format',
        suggestion: 'Use formatDate transformation'
      };
    }
  }

  // Numeric type conversions
  if (['int', 'double', 'currency'].includes(sourceType) && ['int', 'double', 'currency'].includes(targetType)) {
    return {
      status: 'warning',
      message: 'Numeric conversion may lose precision',
      suggestion: 'Verify precision and scale requirements'
    };
  }

  // Date/datetime conversions
  if ((sourceType === 'date' && targetType === 'datetime') || (sourceType === 'datetime' && targetType === 'date')) {
    return {
      status: 'warning',
      message: 'Date format conversion',
      suggestion: sourceType === 'date' ? 'Time will be set to midnight' : 'Time portion will be removed'
    };
  }

  // Incompatible types
  return {
    status: 'incompatible',
    message: `Cannot convert ${sourceType} to ${targetType}`,
    suggestion: 'Please select a compatible target field or add a custom transformation'
  };
}