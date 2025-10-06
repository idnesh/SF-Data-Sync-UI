// Step 4: Field Mapping Component
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { FieldMapping } from '../types';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

// API Response interfaces
interface APIFieldMapping {
  sourceField: string;
  sourceLabel: string;
  targetField: string;
  score: number;
}

interface APIResponse {
  fieldMappings: APIFieldMapping[];
}

interface Step4FieldMappingProps {
  fieldMappings: FieldMapping;
  selectedFields: string[];
  syncAllFields: boolean;
  jobData?: {
    sourceObject?: string;
    targetObject?: string;
  };
  onUpdateMappings: (mappings: FieldMapping, transformations: Record<string, any>, selectedFields: string[], syncAllFields: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
}

interface MappingRow {
  sourceField: string;
  sourceLabel: string;
  targetField: string;
  isEditing: boolean;
  confidenceScore: number; // AI confidence score (0-100)
  isPrimaryKey: boolean; // Indicates if this field is part of primary key combination
  includeInSync: boolean; // Indicates if this field should be included in sync
  isPII: boolean; // Indicates if this field contains Personally Identifiable Information
  maskPII: boolean; // Indicates if PII data should be masked during sync
}

// Available Salesforce fields for mapping (Account target object)
const SALESFORCE_FIELDS = [
  { value: 'Account_Name__c', label: 'Account_Name__c' },
  { value: 'Account_Owner__c', label: 'Account_Owner__c' },
  { value: 'Billing_Address_Line_1__c', label: 'Billing_Address_Line_1__c' },
  { value: 'Billing_Address_Line_2__c', label: 'Billing_Address_Line_2__c' },
  { value: 'Billing_City__c', label: 'Billing_City__c' },
  { value: 'Billing_Country__c', label: 'Billing_Country__c' },
  { value: 'Billing_StateProvince__c', label: 'Billing_StateProvince__c' },
  { value: 'Billing_Street__c', label: 'Billing_Street__c' },
  { value: 'Billing_ZipPostal_Code__c', label: 'Billing_ZipPostal_Code__c' },
  { value: 'CreatedById', label: 'CreatedById' },
  { value: 'Last_Activity__c', label: 'Last_Activity__c' },
  { value: 'LastModifiedById', label: 'LastModifiedById' },
  { value: 'Last_Modified_Date__c', label: 'Last_Modified_Date__c' },
  { value: 'OwnerId', label: 'OwnerId' },
  { value: 'Phone__c', label: 'Phone__c' },
  { value: 'Rating__c', label: 'Rating__c' },
  { value: 'Type__c', label: 'Type__c' },
  { value: 'extid__c', label: 'extid__c' },
  { value: '', label: '-- (Unmapped)' }
];

// Default field mappings for Contact source to Contact__c target
const DEFAULT_MAPPINGS: MappingRow[] = [
  { sourceField: 'Id', sourceLabel: 'Id', targetField: 'extid__c', isEditing: false, confidenceScore: 99, isPrimaryKey: true, includeInSync: true, isPII: false, maskPII: false },
  { sourceField: 'AccountId', sourceLabel: 'AccountId', targetField: 'Account.extid__c', isEditing: false, confidenceScore: 95, isPrimaryKey: false, includeInSync: true, isPII: false, maskPII: false },
  { sourceField: 'FirstName', sourceLabel: 'FirstName', targetField: 'FirstName', isEditing: false, confidenceScore: 99, isPrimaryKey: true, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'LastName', sourceLabel: 'LastName', targetField: 'LastName', isEditing: false, confidenceScore: 99, isPrimaryKey: true, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'Phone', sourceLabel: 'Phone', targetField: 'phone', isEditing: false, confidenceScore: 90, isPrimaryKey: false, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'Department', sourceLabel: 'Department', targetField: 'Department', isEditing: false, confidenceScore: 88, isPrimaryKey: false, includeInSync: false, isPII: false, maskPII: false },
  { sourceField: 'Description', sourceLabel: 'Description', targetField: 'Description', isEditing: false, confidenceScore: 85, isPrimaryKey: false, includeInSync: false, isPII: false, maskPII: false },
  { sourceField: 'Email', sourceLabel: 'Email', targetField: 'Email', isEditing: false, confidenceScore: 95, isPrimaryKey: true, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'Fax', sourceLabel: 'Fax', targetField: 'Fax', isEditing: false, confidenceScore: 80, isPrimaryKey: false, includeInSync: false, isPII: true, maskPII: true },
  { sourceField: 'Title', sourceLabel: 'Title', targetField: 'Title', isEditing: false, confidenceScore: 90, isPrimaryKey: false, includeInSync: true, isPII: false, maskPII: false },
  { sourceField: 'preferred_language__c', sourceLabel: 'preferred_language__c', targetField: 'language_preferred__c', isEditing: false, confidenceScore: 85, isPrimaryKey: false, includeInSync: false, isPII: false, maskPII: false },
  { sourceField: 'MailingStreet', sourceLabel: 'MailingStreet', targetField: 'MailingStreet', isEditing: false, confidenceScore: 92, isPrimaryKey: false, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'MailingCity', sourceLabel: 'MailingCity', targetField: 'MailingCity', isEditing: false, confidenceScore: 92, isPrimaryKey: false, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'MailingState', sourceLabel: 'MailingState', targetField: 'MailingState', isEditing: false, confidenceScore: 92, isPrimaryKey: false, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'MailingPostalCode', sourceLabel: 'MailingPostalCode', targetField: 'MailingPostalCode', isEditing: false, confidenceScore: 92, isPrimaryKey: false, includeInSync: true, isPII: true, maskPII: true },
  { sourceField: 'MailingCountry', sourceLabel: 'MailingCountry', targetField: 'MailingCountry', isEditing: false, confidenceScore: 92, isPrimaryKey: false, includeInSync: true, isPII: true, maskPII: true }
];

// Helper functions for confidence scoring
const getConfidenceLevel = (score: number): string => {
  if (score >= 90) return 'high';
  if (score >= 75) return 'medium';
  return 'low';
};

// Helper function to detect PII fields
const isPIIField = (fieldName: string): boolean => {
  const piiPatterns = [
    /firstname/i, /lastname/i, /email/i, /phone/i, /fax/i,
    /street/i, /address/i, /city/i, /state/i, /postal/i, /zip/i, /country/i,
    /ssn/i, /social/i, /birthdate/i, /birth/i, /age/i
  ];
  return piiPatterns.some(pattern => pattern.test(fieldName));
};

// Helper function to detect primary key fields
const isPrimaryKeyField = (fieldName: string): boolean => {
  const primaryKeyPatterns = [
    /^id$/i, /firstname/i, /lastname/i, /email/i, /accountid/i
  ];
  return primaryKeyPatterns.some(pattern => pattern.test(fieldName));
};

// Helper function to determine if field should be included in sync by default
const shouldIncludeInSync = (fieldName: string): boolean => {
  const includePatterns = [
    /^id$/i, /firstname/i, /lastname/i, /email/i, /phone/i, /title/i,
    /street/i, /city/i, /state/i, /postal/i, /country/i, /accountid/i
  ];
  return includePatterns.some(pattern => pattern.test(fieldName));
};

// API function to fetch field mappings
const fetchFieldMappings = async (objectName: string): Promise<APIFieldMapping[]> => {
  try {
    const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getFieldMapping?object=${objectName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: APIResponse = await response.json();
    return data.fieldMappings;
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    // Return empty array on error, will fall back to default mappings
    return [];
  }
};

// Transform API response to MappingRow format
const transformAPIResponseToMappingRows = (apiMappings: APIFieldMapping[]): MappingRow[] => {
  return apiMappings.map(mapping => ({
    sourceField: mapping.sourceField,
    sourceLabel: mapping.sourceLabel,
    targetField: mapping.targetField,
    isEditing: false,
    confidenceScore: mapping.score,
    isPrimaryKey: isPrimaryKeyField(mapping.sourceField),
    includeInSync: shouldIncludeInSync(mapping.sourceField),
    isPII: isPIIField(mapping.sourceField),
    maskPII: isPIIField(mapping.sourceField) // Default to mask if PII
  }));
};

export const Step4FieldMapping: React.FC<Step4FieldMappingProps> = ({
  fieldMappings,
  selectedFields,
  syncAllFields,
  jobData,
  onUpdateMappings,
  onNext,
  onPrevious,
  isLoading
}) => {
  const [showLoader, setShowLoader] = useState(true);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('Initializing field analysis...');

  const [mappingRows, setMappingRows] = useState<MappingRow[]>(() => {
    // Initialize with default mappings or existing mappings
    return DEFAULT_MAPPINGS.map(row => ({
      ...row,
      targetField: fieldMappings[row.sourceField] || row.targetField
    }));
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempTargetField, setTempTargetField] = useState<string>('');

  // API call and loader effect with progress animation - 3 seconds total
  useEffect(() => {
    if (!showLoader) return;

    const steps = [
      'Initializing field analysis...',
      'Fetching field mappings from API...',
      'Analyzing source data structure...',
      'Optimizing data transformations...',
      'Finalizing field mappings...'
    ];

    let currentStep = 0;
    let currentProgress = 0;

    // Start API call immediately using dynamic source object
    const sourceObject = jobData?.sourceObject || 'Contact';
    fetchFieldMappings(sourceObject).then(apiMappings => {
      if (apiMappings.length > 0) {
        const transformedMappings = transformAPIResponseToMappingRows(apiMappings);
        setMappingRows(prev => {
          // Update with API data while preserving any existing customizations
          return transformedMappings.map(apiRow => {
            const existingRow = prev.find(row => row.sourceField === apiRow.sourceField);
            return existingRow ? { ...apiRow, ...existingRow } : apiRow;
          });
        });
      }
    }).catch(error => {
      console.error('Failed to fetch field mappings:', error);
      // Continue with default mappings on error
    });

    const interval = setInterval(() => {
      currentProgress += 3.33; // 3.33% every 100ms = 3 seconds total
      setProgress(currentProgress);

      // Update processing step every 20% progress
      if (currentProgress >= 20 && currentStep === 0) {
        currentStep++;
        setProcessingStep(steps[currentStep]);
      } else if (currentProgress >= 40 && currentStep === 1) {
        currentStep++;
        setProcessingStep(steps[currentStep]);
      } else if (currentProgress >= 60 && currentStep === 2) {
        currentStep++;
        setProcessingStep(steps[currentStep]);
      } else if (currentProgress >= 80 && currentStep === 3) {
        currentStep++;
        setProcessingStep(steps[currentStep]);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowLoader(false);
        }, 300);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showLoader]);

  // Comprehensive validations
  const validationResults = useMemo(() => {
    const targetFields = mappingRows
      .map(row => row.targetField)
      .filter(field => field && field !== '');

    // Check for duplicate mappings
    const duplicates = targetFields.filter((field, index) =>
      targetFields.indexOf(field) !== index
    );
    const duplicateTargetFields = new Set(duplicates);

    // Check for required fields (at least one mapping should exist)
    const hasAnyMapping = mappingRows.some(row => row.targetField && row.targetField !== '');

    // Check for empty source fields
    const emptySourceFields = mappingRows.filter(row => !row.sourceField || row.sourceField.trim() === '');

    // Check for invalid field name patterns
    const invalidSourceFields = mappingRows.filter(row => {
      if (!row.sourceField) return false;
      // Source fields should not contain special characters except underscores
      return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(row.sourceField);
    });

    // Check for mapping completeness (source has target)
    const unmappedFields = mappingRows.filter(row =>
      row.sourceField && row.sourceField.trim() !== '' && (!row.targetField || row.targetField === '')
    );

    // Check for total mapping count
    const totalMappings = targetFields.length;
    const maxRecommendedMappings = 50; // Salesforce API limits

    return {
      duplicateTargetFields,
      hasAnyMapping,
      emptySourceFields,
      invalidSourceFields,
      unmappedFields,
      totalMappings,
      maxRecommendedMappings,
      isValid: duplicateTargetFields.size === 0 &&
               hasAnyMapping &&
               emptySourceFields.length === 0 &&
               invalidSourceFields.length === 0 &&
               totalMappings <= maxRecommendedMappings
    };
  }, [mappingRows]);

  const handleEditStart = useCallback((sourceField: string, currentTargetField: string) => {
    setEditingField(sourceField);
    setTempTargetField(currentTargetField);
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, isEditing: true }
          : row
      )
    );
  }, []);

  const handleEditSave = useCallback((sourceField: string) => {
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, targetField: tempTargetField, isEditing: false }
          : row
      )
    );
    setEditingField(null);
    setTempTargetField('');
  }, [tempTargetField]);

  const handleEditCancel = useCallback((sourceField: string) => {
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, isEditing: false }
          : row
      )
    );
    setEditingField(null);
    setTempTargetField('');
  }, []);


  const handlePrimaryKeyToggle = useCallback((sourceField: string) => {
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, isPrimaryKey: !row.isPrimaryKey }
          : row
      )
    );
  }, []);

  const handleSyncInclusionToggle = useCallback((sourceField: string) => {
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, includeInSync: !row.includeInSync }
          : row
      )
    );
  }, []);

  const handlePIIMaskingToggle = useCallback((sourceField: string) => {
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, maskPII: !row.maskPII }
          : row
      )
    );
  }, []);



  const handleSaveMappings = useCallback(() => {
    const newMappings: FieldMapping = {};
    const newSelectedFields: string[] = [];

    mappingRows.forEach(row => {
      if (row.targetField && row.targetField !== '') {
        newMappings[row.sourceField] = row.targetField;
        newSelectedFields.push(row.sourceField);
      }
    });

    // For now, no transformations are configured in this step
    const transformations = {};

    onUpdateMappings(newMappings, transformations, newSelectedFields, syncAllFields);
  }, [mappingRows, syncAllFields, onUpdateMappings]);

  const handleNext = useCallback(() => {
    if (validationResults.isValid) {
      handleSaveMappings();
      onNext();
    }
  }, [handleSaveMappings, onNext, validationResults.isValid]);

  const canProceed = validationResults.isValid;

  if (showLoader) {
    return (
      <div className="processing-screen">
        <div className="processing-container">
          <div className="ai-logo">
            <div className="ai-circle">
              🧠
            </div>
          </div>

          <h2>AI-Powered Analysis in Progress</h2>
          <p>Our advanced algorithms are analyzing your data quality...</p>

          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(progress)}% Complete</div>
          </div>

          <div className="processing-step">
            <span className="step-icon">⚙️</span>
            <span>{processingStep}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-container">
      <div className="step-header">
        <h4 className="step-title">Field Mapping</h4>
        <p className="step-description">
          This is AI-driven field mapping. It automatically maps fields based on names and provide autosuggestions.
          Configure how {jobData?.sourceObject || 'Contact'} (source) fields map to {jobData?.targetObject || 'Contact__c'} (target) Salesforce fields.
          Some default mappings are pre-configured to get you started.
        </p>
        <div className="mapping-info">
          <span className="source-info">📊 Source: <strong>{jobData?.sourceObject || 'Contact'}</strong></span>
          <span className="arrow">→</span>
          <span className="target-info">🎯 Target: <strong>{jobData?.targetObject || 'Contact__c'}</strong></span>
        </div>
      </div>

      <div className="field-mapping-table">
        <div className="table-header">
          <div className="column-header">Include in Sync</div>
          <div className="column-header">Primary Key</div>
          <div className="column-header">Mask PII</div>
          <div className="column-header">Source Field ({jobData?.sourceObject || 'Contact'})</div>
          <div className="column-header">Target Field ({jobData?.targetObject || 'Contact__c'})</div>
          <div className="column-header">AI Confidence</div>
        </div>

        {mappingRows.map((row) => {
          const isDuplicate = validationResults.duplicateTargetFields.has(row.targetField) && row.targetField !== '';
          const isInvalidSource = validationResults.invalidSourceFields.some(f => f.sourceField === row.sourceField);
          const isEmptySource = !row.sourceField || row.sourceField.trim() === '';

          return (
            <div
              key={row.sourceField}
              className={`mapping-row ${row.isEditing ? 'editing' : ''} ${isDuplicate ? 'duplicate' : ''} ${isInvalidSource ? 'invalid-source' : ''} ${isEmptySource ? 'empty-source' : ''}`}
            >
              <div className="sync-inclusion-cell">
                <input
                  type="checkbox"
                  checked={row.includeInSync}
                  onChange={() => handleSyncInclusionToggle(row.sourceField)}
                  className="sync-inclusion-checkbox"
                  aria-label={`Include ${row.sourceLabel} in sync`}
                />
              </div>
              <div className="primary-key-cell">
                <input
                  type="checkbox"
                  checked={row.isPrimaryKey}
                  onChange={() => handlePrimaryKeyToggle(row.sourceField)}
                  className="primary-key-checkbox"
                  aria-label={`Mark ${row.sourceLabel} as primary key`}
                />
              </div>
              <div className="pii-masking-cell">
                <input
                  type="checkbox"
                  checked={row.maskPII}
                  onChange={() => handlePIIMaskingToggle(row.sourceField)}
                  className="pii-masking-checkbox"
                  disabled={!row.isPII}
                  aria-label={`Mask PII data for ${row.sourceLabel}`}
                />
              </div>
              <div className="source-field">
                <div className={`field-label ${isInvalidSource || isEmptySource ? 'error' : ''}`}>
                  <span className="field-name">
                    {row.sourceLabel}
                    {row.isPII && <span className="pii-indicator" title="Contains Personally Identifiable Information">🔒</span>}
                  </span>
                  {isInvalidSource && <span className="error-indicator"> (Invalid)</span>}
                  {isEmptySource && <span className="error-indicator"> (Empty)</span>}
                </div>
              </div>

              <div className="target-field">
                {row.isEditing ? (
                  <div className="edit-container">
                    <div className="target-field-with-actions">
                      <select
                        value={tempTargetField}
                        onChange={(e) => setTempTargetField(e.target.value)}
                        className={`field-select ${isDuplicate ? 'error' : ''}`}
                        autoFocus
                      >
                        {SALESFORCE_FIELDS.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                      <div className="inline-actions">
                        <span
                          className={`action-icon save-icon ${isDuplicate ? 'disabled' : ''}`}
                          onClick={isDuplicate ? undefined : () => handleEditSave(row.sourceField)}
                          aria-label="Save mapping"
                          role="button"
                          tabIndex={isDuplicate ? -1 : 0}
                        >
                          <CheckIcon fontSize="small" />
                        </span>
                        <span
                          className="action-icon cancel-icon"
                          onClick={() => handleEditCancel(row.sourceField)}
                          aria-label="Cancel edit"
                          role="button"
                          tabIndex={0}
                        >
                          <CloseIcon fontSize="small" />
                        </span>
                      </div>
                    </div>
                    {isDuplicate && (
                      <div className="error-message">This field is already mapped</div>
                    )}
                  </div>
                ) : (
                  <div className="target-field-with-actions">
                    <div
                      className={`field-display ${!row.targetField ? 'unmapped' : ''} ${isDuplicate ? 'duplicate' : ''}`}
                      onClick={() => handleEditStart(row.sourceField, row.targetField)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEditStart(row.sourceField, row.targetField);
                        }
                      }}
                    >
                      {row.targetField || 'Click to map'}
                      {isDuplicate && <span className="duplicate-indicator"> (Duplicate)</span>}
                    </div>
                    <div className="inline-actions">
                      <span
                        className="action-icon edit-icon"
                        onClick={() => handleEditStart(row.sourceField, row.targetField)}
                        aria-label="Edit mapping"
                        role="button"
                        tabIndex={0}
                      >
                        <EditIcon fontSize="small" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="confidence-score">
                <div className={`confidence-badge confidence-${getConfidenceLevel(row.confidenceScore)}`}>
                  <span className="confidence-value">{row.confidenceScore}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional validation messages at the bottom */}
      {validationResults.duplicateTargetFields.size > 0 && (
        <div className="error-message" role="alert">
          <strong>Duplicate mappings detected:</strong> Multiple source fields are mapped to the same target field.
          Please resolve duplicates before proceeding.
        </div>
      )}

      {!validationResults.hasAnyMapping && (
        <div className="warning-message" role="alert">
          <strong>No mappings configured:</strong> At least one field mapping is required to proceed.
        </div>
      )}

      {validationResults.invalidSourceFields.length > 0 && (
        <div className="error-message" role="alert">
          <strong>Invalid source field names:</strong> Source field names must start with a letter or underscore and contain only letters, numbers, and underscores.
        </div>
      )}

      {validationResults.totalMappings > validationResults.maxRecommendedMappings && (
        <div className="warning-message" role="alert">
          <strong>Too many mappings:</strong> Consider reducing the number of field mappings for better performance.
        </div>
      )}

      <div className="step-actions">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
        >
          Previous
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          loading={isLoading}
        >
          Continue to Simulate
        </Button>
      </div>
    </div>
  );
};