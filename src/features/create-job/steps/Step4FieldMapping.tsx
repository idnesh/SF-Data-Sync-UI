// Step 4: Field Mapping Component
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { CompactFieldMappingIssues, Issue } from '../../../components/common/CompactFieldMappingIssues';
import { FieldMapping, FieldMappingMetadata } from '../types';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ListIcon from '@mui/icons-material/List';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

// API Response interfaces
interface APIFieldMapping {
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
  defaultValue?: string;
  isError?: boolean;
  isWarning?: boolean;
  errorMessage?: string;
  suggestedFix?: string;
  valueMap?: Array<{
    source: string;
    target: string;
  }>;
}

interface APIResponse {
  fieldMaping: APIFieldMapping[]; // Note: API has typo in property name
}

interface Step4FieldMappingProps {
  fieldMappings: FieldMapping;
  selectedFields: string[];
  syncAllFields: boolean;
  jobData?: {
    sourceObject?: string;
    targetObject?: string;
  };
  onUpdateMappings: (mappings: FieldMapping, transformations: Record<string, any>, selectedFields: string[], syncAllFields: boolean, metadata?: FieldMappingMetadata) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
}

interface MappingRow {
  sourceField: string;
  sourceLabel: string;
  sourceType: string;
  targetField: string;
  targetType: string;
  isEditing: boolean;
  confidenceScore: number; // AI confidence score (0-100)
  isPrimaryKey: boolean; // Indicates if this field is part of primary key combination
  includeInSync: boolean; // Indicates if this field should be included in sync
  isPII: boolean; // Indicates if this field contains Personally Identifiable Information
  maskPII: boolean; // Indicates if PII data should be masked during sync
  defaultValue?: string;
  isError?: boolean;
  isWarning?: boolean;
  errorMessage?: string;
  suggestedFix?: string;
  valueMap?: Array<{
    source: string;
    target: string;
  }>;
}

// Note: Target field options are now derived from API mappings

// Note: Field mappings are now fetched from API endpoint instead of using hardcoded defaults

// Helper functions for confidence scoring
const getConfidenceLevel = (score: number): string => {
  if (score >= 90) return 'high';
  if (score >= 75) return 'medium';
  return 'low';
};

// Helper function to detect PII fields intelligently
const isPIIField = (fieldName: string): boolean => {
  const piiPatterns = [
    // Name fields
    /\b(first.*name|last.*name|full.*name|given.*name|family.*name|name)\b/i,
    // Email fields
    /\b(email|e_mail|mail)\b/i,
    // Phone/Communication fields
    /\b(phone|fax|mobile|cell|telephone|tel)\b/i,
    // Address fields
    /\b(street|address|addr|city|state|province|postal|zip|country|region)\b/i,
    // Personal identifiers
    /\b(ssn|social.*security|tax.*id|driver.*license|passport|national.*id)\b/i,
    // Date of birth and age
    /\b(birth.*date|date.*birth|dob|age|birth.*year)\b/i,
    // Financial fields
    /\b(salary|income|wage|credit.*card|bank.*account|account.*number)\b/i,
    // Health/Medical fields
    /\b(medical|health|diagnosis|treatment|patient.*id|insurance)\b/i,
    // Personal preferences
    /\b(language.*preferred|preferred.*language|gender|ethnicity|race)\b/i
  ];
  return piiPatterns.some(pattern => pattern.test(fieldName));
};

// Helper function to detect primary key fields
const isPrimaryKeyField = (fieldName: string): boolean => {
  const primaryKeyPatterns = [
    /^id$/i
  ];
  return primaryKeyPatterns.some(pattern => pattern.test(fieldName));
};

// Helper function to determine if field should be included in sync by default
const shouldIncludeInSync = (fieldName: string): boolean => {
  // By default, all fields are included in sync
  return true;
};

// API function to fetch field mappings
const fetchFieldMappings = async (objectName: string): Promise<APIFieldMapping[]> => {
  try {
    const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getFieldMapping?object=${objectName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: APIResponse = await response.json();

    // Add the Description__c mapping as specified in the requirements
    const mappings = data.fieldMaping || [];

    return mappings;
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    // Return empty array on error, will fall back to default mappings
    return [];
  }
};

// Interface for picklist values
interface PicklistValue {
  label: string;
  value: string;
  isActive: boolean;
}

// Interface for field metadata
interface FieldMetadata {
  name: string;
  type: string;
  label: string;
  picklistValues?: PicklistValue[];
}

// Interface for object metadata response
interface ObjectMetadata {
  objectName: string;
  fields: FieldMetadata[];
}

// API function to fetch object metadata with picklist values
const fetchObjectMetadata = async (objectName: string, org: 'source' | 'target'): Promise<ObjectMetadata | null> => {
  try {
    const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getSfdcObjects?objectName=${objectName}&org=${org}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ObjectMetadata = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching object metadata:', error);
    return null;
  }
};

// Note: Field names are displayed exactly as received from API

// Function to detect if a field should be treated as Picklist based on name patterns
// Example: "Deal_Status__c" with type "String" will be converted to "Picklist"
const isPicklistField = (fieldName: string): boolean => {
  const picklistPatterns = [
    /.*Status.*__c$/i,     // Fields ending with Status__c (e.g., Deal_Status__c, Account_Status__c)
  ];

  return picklistPatterns.some(pattern => pattern.test(fieldName));
};

// Function to convert String types to Picklist for fields that should be picklists
const convertFieldType = (fieldName: string, fieldType: string): string => {
  if (fieldType === 'String' && isPicklistField(fieldName)) {
    return 'Picklist';
  }
  return fieldType;
};

// Interface for picklist mismatch validation
interface PicklistMismatch {
  sourceField: string;
  targetField: string;
  missingValues: string[];
  extraValues: string[];
  severity: 'warning' | 'error';
}

// Interface for character limit mismatch validation
interface CharacterLimitMismatch {
  sourceField: string;
  targetField: string;
  sourceLength: number;
  targetLength: number;
  severity: 'warning' | 'error';
}

// Interface for missing field validation
interface MissingFieldMismatch {
  sourceField: string;
  severity: 'warning' | 'error';
}

// Function to validate picklist values between source and target
const validatePicklistValues = (
  sourcePicklistValues: PicklistValue[],
  targetPicklistValues: PicklistValue[],
  sourceField: string,
  targetField: string
): PicklistMismatch | null => {
  if (!sourcePicklistValues || !targetPicklistValues) {
    return null;
  }

  const sourceValues = sourcePicklistValues.map(pv => pv.value);
  const targetValues = targetPicklistValues.map(pv => pv.value);

  // Find values in source that don't exist in target
  const missingValues = sourceValues.filter(value => !targetValues.includes(value));

  // Find values in target that don't exist in source (less critical)
  const extraValues = targetValues.filter(value => !sourceValues.includes(value));

  if (missingValues.length > 0) {
    return {
      sourceField,
      targetField,
      missingValues,
      extraValues,
      severity: missingValues.length > 2 ? 'error' : 'warning'
    };
  }

  return null;
};

// Function to validate character limits between source and target fields
const validateCharacterLimits = (
  sourceField: string,
  targetField: string,
  sourceFieldMetadata?: FieldMetadata,
  targetFieldMetadata?: FieldMetadata
): CharacterLimitMismatch | null => {
  // Mock field metadata for demonstration
  // In real implementation, this would come from the API metadata
  const mockFieldLimits: Record<string, number> = {
    'Description__c': 255,
    'Deal_Description__c': 100,
  };

  const sourceLength = mockFieldLimits[sourceField] || sourceFieldMetadata?.length || 255;
  const targetLength = mockFieldLimits[targetField] || targetFieldMetadata?.length || 255;

  if (sourceLength > targetLength) {
    return {
      sourceField,
      targetField,
      sourceLength,
      targetLength,
      severity: sourceLength > targetLength * 1.5 ? 'error' : 'warning'
    };
  }

  return null;
};

// Function to validate missing fields (fields that exist in source but not in target)
const validateMissingFields = (
  sourceField: string,
  targetField: string
): MissingFieldMismatch | null => {
  // If sourceField exists but targetField is empty, it's a missing field
  if (sourceField && sourceField.trim() !== '' && (!targetField || targetField.trim() === '')) {
    // Make Last_Viewed_Date specifically an error, others remain warnings
    const severity = sourceField === 'Last_Viewed_Date' ? 'error' : 'warning';
    return {
      sourceField,
      severity
    };
  }

  return null;
};

// PicklistMappingDialog Component
interface PicklistMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mismatch: PicklistMismatch;
  sourcePicklistValues: PicklistValue[];
  targetPicklistValues: PicklistValue[];
  onSaveMapping: (mapping: Record<string, string>) => void;
}

const PicklistMappingDialog: React.FC<PicklistMappingDialogProps> = ({
  isOpen,
  onClose,
  mismatch,
  sourcePicklistValues,
  targetPicklistValues,
  onSaveMapping
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // Initialize mappings when dialog opens
  useEffect(() => {
    if (isOpen) {
      const initialMappings: Record<string, string> = {};
      mismatch.missingValues.forEach(value => {
        initialMappings[value] = ''; // Start with empty mapping
      });
      setMappings(initialMappings);
    }
  }, [isOpen, mismatch.missingValues]);

  const handleMappingChange = (sourceValue: string, targetValue: string) => {
    setMappings(prev => ({
      ...prev,
      [sourceValue]: targetValue
    }));
  };

  const handleSave = () => {
    onSaveMapping(mappings);
    onClose();
  };

  const canSave = mismatch.missingValues.every(value => mappings[value] !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Picklist Value Mapping"
      size="large"
    >
      <div className="ds-field-mapping-dialog-container">
        <div className="ds-field-mapping-dialog-warning-header">
          <p className="ds-field-mapping-dialog-warning-text">
            <strong>"{mismatch.sourceField}"</strong> → <strong>"{mismatch.targetField}"</strong>
          </p>
        </div>

        <div className="ds-field-mapping-dialog-section">
          <div className="ds-field-mapping-dialog-grid-header">
            <span>Source Value</span>
            <span>→</span>
            <span>Target Value</span>
          </div>

          {mismatch.missingValues.map(sourceValue => (
            <div key={sourceValue} className="ds-field-mapping-dialog-grid-row">
              <div className="ds-field-mapping-dialog-source-value">
                <span className="ds-field-mapping-dialog-source-value-badge">
                  {sourceValue}
                </span>
              </div>
              <div className="ds-field-mapping-dialog-arrow">→</div>
              <div>
                <select
                  value={mappings[sourceValue] || ''}
                  onChange={(e) => handleMappingChange(sourceValue, e.target.value)}
                  className="ds-field-mapping-dialog-select"
                >
                  <option value="">Select target value...</option>
                  {targetPicklistValues.map(targetValue => (
                    <option key={targetValue.value} value={targetValue.value}>
                      {targetValue.label || targetValue.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="ds-field-mapping-dialog-actions">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save Mapping
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Function to calculate AI confidence based on validation issues
const calculateConfidenceScore = (
  sourceField: string,
  targetField: string,
  sourceType: string,
  targetType: string,
  picklistMismatches: PicklistMismatch[],
  characterLimitMismatches: CharacterLimitMismatch[],
  missingFieldMismatches: MissingFieldMismatch[]
): number => {
  let confidence = 100; // Start with perfect confidence

  // Check for missing field (unmapped)
  if (!targetField || targetField.trim() === '') {
    confidence -= 60; // Major penalty for unmapped fields
  }

  // Check for type mismatches
  if (sourceType !== targetType && targetField) {
    confidence -= 20; // Penalty for type mismatch
  }

  // Check for picklist issues
  const picklistIssue = picklistMismatches.find(m =>
    m.sourceField === sourceField && m.targetField === targetField
  );
  if (picklistIssue) {
    if (picklistIssue.severity === 'error') {
      confidence -= 30; // High penalty for picklist errors
    } else {
      confidence -= 15; // Medium penalty for picklist warnings
    }
  }

  // Check for character limit issues
  const characterLimitIssue = characterLimitMismatches.find(m =>
    m.sourceField === sourceField && m.targetField === targetField
  );
  if (characterLimitIssue) {
    if (characterLimitIssue.severity === 'error') {
      confidence -= 25; // High penalty for character limit errors
    } else {
      confidence -= 10; // Low penalty for character limit warnings
    }
  }

  // Check for missing field issues
  const missingFieldIssue = missingFieldMismatches.find(m =>
    m.sourceField === sourceField
  );
  if (missingFieldIssue) {
    if (missingFieldIssue.severity === 'error') {
      confidence -= 50; // Very high penalty for error-level missing fields (like Last_Viewed_Date)
    } else {
      confidence -= 30; // High penalty for warning-level missing fields
    }
  }

  // Ensure confidence doesn't go below 0
  return Math.max(0, confidence);
};


// API Field Issue Dialog Component
interface APIFieldIssueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  row: MappingRow | null;
}

const APIFieldIssueDialog: React.FC<APIFieldIssueDialogProps> = ({
  isOpen,
  onClose,
  row
}) => {
  if (!row) return null;

  const hasIssue = row.isError || row.isWarning;
  if (!hasIssue) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Field Issue: ${row.sourceField}`}
      size="large"
    >
      <div className="ds-field-mapping-error-container">
        <div className={`ds-field-mapping-error-item ${row.isError ? 'ds-field-mapping-error-item-error' : 'ds-field-mapping-error-item-warning'}`}>
          <div className={`ds-field-mapping-error-header ${row.isError ? 'ds-field-mapping-error-header-error' : 'ds-field-mapping-error-header-warning'}`}>
            <span>{row.isError ? '❌' : '⚠️'}</span>
            <span>{row.isError ? 'Error' : 'Warning'}</span>
          </div>

          {row.errorMessage && (
            <div className="ds-field-mapping-error-description">
              {row.errorMessage}
            </div>
          )}

          {row.suggestedFix && (
            <div className="ds-field-mapping-error-details-section">
              <div className="ds-field-mapping-error-details-title">
                Suggested Fix:
              </div>
              <div className="ds-field-mapping-error-suggestion">
                {row.suggestedFix}
              </div>
            </div>
          )}

          {row.defaultValue && (
            <div className="ds-field-mapping-error-details-section">
              <div className="ds-field-mapping-error-details-title">
                Default Value:
              </div>
              <div className="ds-field-mapping-error-details-content">
                {row.defaultValue}
              </div>
            </div>
          )}

          {row.valueMap && row.valueMap.length > 0 && (
            <div className="ds-field-mapping-error-details-section">
              <div className="ds-field-mapping-error-details-title">
                Value Mapping:
              </div>
              <div className="ds-field-mapping-error-details-content">
                <table style={{ width: '100%', marginTop: '8px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ddd' }}>Source</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ddd' }}>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.valueMap.map((mapping, index) => (
                      <tr key={index}>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{mapping.source}</td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{mapping.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="ds-field-mapping-error-dialog-close">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Transform API response to MappingRow format
const transformAPIResponseToMappingRows = (apiMappings: APIFieldMapping[]): MappingRow[] => {
  return apiMappings.map(mapping => {
    const isPII = isPIIField(mapping.source);

    // Convert String types to Picklist for fields that match picklist patterns
    const convertedSourceType = convertFieldType(mapping.source, mapping.sourceType);
    const convertedTargetType = convertFieldType(mapping.target, mapping.targetType);

    return {
      sourceField: mapping.source,
      sourceLabel: mapping.source, // Use original field name as label
      sourceType: convertedSourceType,
      targetField: mapping.target,
      targetType: convertedTargetType,
      isEditing: false,
      confidenceScore: 100, // Initial confidence, will be updated after validation
      isPrimaryKey: isPrimaryKeyField(mapping.source),
      includeInSync: shouldIncludeInSync(mapping.source),
      isPII: isPII,
      maskPII: isPII, // Default to mask if PII
      defaultValue: mapping.defaultValue,
      isError: mapping.isError,
      isWarning: mapping.isWarning,
      errorMessage: mapping.errorMessage,
      suggestedFix: mapping.suggestedFix,
      valueMap: mapping.valueMap
    };
  });
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

  const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempTargetField, setTempTargetField] = useState<string>('');
  const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);

  // Picklist validation state
  const [picklistMismatches, setPicklistMismatches] = useState<PicklistMismatch[]>([]);
  const [sourceMetadata, setSourceMetadata] = useState<ObjectMetadata | null>(null);
  const [targetMetadata, setTargetMetadata] = useState<ObjectMetadata | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [currentMismatch, setCurrentMismatch] = useState<PicklistMismatch | null>(null);
  const [picklistMappings, setPicklistMappings] = useState<Record<string, Record<string, string>>>({});
  const [metadataFetchAttempted, setMetadataFetchAttempted] = useState<Set<string>>(new Set());
  const [metadataFetchError, setMetadataFetchError] = useState<boolean>(false);


  // API field issue dialog state
  const [showAPIFieldIssueDialog, setShowAPIFieldIssueDialog] = useState(false);
  const [selectedRowForAPIIssue, setSelectedRowForAPIIssue] = useState<MappingRow | null>(null);

  // Character limit validation state
  const [characterLimitMismatches, setCharacterLimitMismatches] = useState<CharacterLimitMismatch[]>([]);
  const [resolvedCharacterLimitIssues, setResolvedCharacterLimitIssues] = useState<Set<string>>(new Set());

  // Missing field validation state
  const [missingFieldMismatches, setMissingFieldMismatches] = useState<MissingFieldMismatch[]>([]);

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
            // Ensure all properties from apiRow are preserved, then override with existing customizations
            return existingRow ? {
              ...apiRow,
              ...existingRow,
              // Ensure type fields are preserved from API
              sourceType: apiRow.sourceType,
              targetType: apiRow.targetType
            } : apiRow;
          });
        });
      }
    }).catch(error => {
      console.error('Failed to fetch field mappings:', error);
      // Continue with default mappings on error
    });

    const interval = setInterval(() => {
      currentProgress += 100 / 30; // 100% / 30 intervals = 3.333...% per interval
      setProgress(Math.min(currentProgress, 100)); // Cap at 100%

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

  // Update select all checkbox state when mappingRows change
  useEffect(() => {
    if (mappingRows.length > 0) {
      const allChecked = mappingRows.every(row => row.includeInSync);
      setSelectAllChecked(allChecked);
    }
  }, [mappingRows]);

  // Picklist validation effect - runs after mappings are loaded
  useEffect(() => {
    const validatePicklists = async () => {
      if (mappingRows.length === 0 || !jobData?.sourceObject || !jobData?.targetObject) return;

      // Create a unique key for this fetch attempt
      const fetchKey = `${jobData.sourceObject}-${jobData.targetObject}`;

      // Skip if we've already attempted to fetch this combination or if there was an error
      if (metadataFetchAttempted.has(fetchKey) || metadataFetchError) return;

      // Mark this combination as attempted
      setMetadataFetchAttempted(prev => new Set([...prev, fetchKey]));

      try {
        // Fetch metadata for both source and target objects
        const [sourceMetadataResponse, targetMetadataResponse] = await Promise.all([
          fetchObjectMetadata(jobData.sourceObject, 'source'),
          fetchObjectMetadata(jobData.targetObject, 'target')
        ]);

        if (!sourceMetadataResponse || !targetMetadataResponse) {
          console.warn('Failed to fetch metadata for objects');
          setMetadataFetchError(true);
          return;
        }

        setSourceMetadata(sourceMetadataResponse);
        setTargetMetadata(targetMetadataResponse);

        // Validate picklist fields
        const mismatches: PicklistMismatch[] = [];

        mappingRows.forEach(row => {
          if (row.sourceType === 'Picklist' && row.targetType === 'Picklist') {
            const sourceField = sourceMetadataResponse.fields.find(f => f.name === row.sourceField);
            const targetField = targetMetadataResponse.fields.find(f => f.name === row.targetField);

            if (sourceField?.picklistValues && targetField?.picklistValues) {
              const mismatch = validatePicklistValues(
                sourceField.picklistValues,
                targetField.picklistValues,
                row.sourceField,
                row.targetField
              );

              if (mismatch) {
                mismatches.push(mismatch);
              }
            }
          }
        });

        setPicklistMismatches(mismatches);
      } catch (error) {
        console.error('Error validating picklists:', error);
        setMetadataFetchError(true);
      }
    };

    validatePicklists();
  }, [mappingRows, jobData?.sourceObject, jobData?.targetObject, metadataFetchAttempted, metadataFetchError]);

  // Character limit validation effect - runs after mappings are loaded
  useEffect(() => {
    const validateCharacterLimitsMismatches = () => {
      if (mappingRows.length === 0) return;

      const mismatches: CharacterLimitMismatch[] = [];

      mappingRows.forEach(row => {
        if (row.sourceType === 'String' && row.targetType === 'String') {
          const fieldKey = `${row.sourceField}->${row.targetField}`;

          // Skip if already resolved
          if (resolvedCharacterLimitIssues.has(fieldKey)) return;

          const sourceFieldMetadata = sourceMetadata?.fields.find(f => f.name === row.sourceField);
          const targetFieldMetadata = targetMetadata?.fields.find(f => f.name === row.targetField);

          const mismatch = validateCharacterLimits(
            row.sourceField,
            row.targetField,
            sourceFieldMetadata,
            targetFieldMetadata
          );

          if (mismatch) {
            mismatches.push(mismatch);
          }
        }
      });

      setCharacterLimitMismatches(mismatches);
    };

    validateCharacterLimitsMismatches();
  }, [mappingRows, sourceMetadata, targetMetadata, resolvedCharacterLimitIssues]);

  // Missing field validation effect - runs after mappings are loaded
  useEffect(() => {
    const validateMissingFieldsMismatches = () => {
      if (mappingRows.length === 0) return;

      const mismatches: MissingFieldMismatch[] = [];

      mappingRows.forEach(row => {
        const mismatch = validateMissingFields(row.sourceField, row.targetField);

        if (mismatch) {
          mismatches.push(mismatch);
        }
      });

      setMissingFieldMismatches(mismatches);
    };

    validateMissingFieldsMismatches();
  }, [mappingRows]);

  // Calculate mapping rows with updated confidence scores
  const mappingRowsWithConfidence = useMemo(() => {
    return mappingRows.map(row => ({
      ...row,
      confidenceScore: calculateConfidenceScore(
        row.sourceField,
        row.targetField,
        row.sourceType,
        row.targetType,
        picklistMismatches,
        characterLimitMismatches,
        missingFieldMismatches
      )
    }));
  }, [mappingRows, picklistMismatches, characterLimitMismatches, missingFieldMismatches]);

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

    // Helper function to check if a row has errors (defined within useMemo to avoid circular dependency)
    const hasRowErrors = (row: MappingRow): boolean => {
      const sourceField = row.sourceField;
      const targetField = row.targetField;

      // Check for critical validation errors
      const isDuplicate = duplicateTargetFields.has(targetField) && targetField !== '';
      const isInvalidSource = invalidSourceFields.some((f: any) => f.sourceField === sourceField);
      const isEmptySource = !sourceField || sourceField.trim() === '';

      if (isDuplicate || isInvalidSource || isEmptySource) {
        return true;
      }

      // Check for picklist errors
      const hasPicklistError = picklistMismatches.some(m =>
        m.sourceField === sourceField && m.targetField === targetField && m.severity === 'error'
      );

      if (hasPicklistError) {
        return true;
      }

      // Check for character limit errors
      const hasCharacterLimitError = characterLimitMismatches.some(m =>
        m.sourceField === sourceField && m.targetField === targetField && m.severity === 'error'
      );

      if (hasCharacterLimitError) {
        return true;
      }

      return false;
    };

    // Check for rows with errors that are included in sync
    const syncIncludedErrorRows = mappingRows.filter(row =>
      row.includeInSync && hasRowErrors(row)
    );

    const hasSyncIncludedErrors = syncIncludedErrorRows.length > 0;

    return {
      duplicateTargetFields,
      hasAnyMapping,
      emptySourceFields,
      invalidSourceFields,
      unmappedFields,
      totalMappings,
      maxRecommendedMappings,
      syncIncludedErrorRows,
      hasSyncIncludedErrors,
      isValid: duplicateTargetFields.size === 0 &&
               hasAnyMapping &&
               emptySourceFields.length === 0 &&
               invalidSourceFields.length === 0 &&
               totalMappings <= maxRecommendedMappings &&
               !hasSyncIncludedErrors
    };
  }, [mappingRows, picklistMismatches, characterLimitMismatches]);

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
    setMappingRows(prev => {
      const updated = prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, includeInSync: !row.includeInSync }
          : row
      );

      // Update select all checkbox based on current state
      const allChecked = updated.every(row => row.includeInSync);
      const noneChecked = updated.every(row => !row.includeInSync);

      if (allChecked) {
        setSelectAllChecked(true);
      } else if (noneChecked) {
        setSelectAllChecked(false);
      } else {
        setSelectAllChecked(false); // Indeterminate state, show as unchecked
      }

      return updated;
    });
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    const newCheckedState = !selectAllChecked;
    setSelectAllChecked(newCheckedState);

    setMappingRows(prev =>
      prev.map(row => ({
        ...row,
        includeInSync: newCheckedState
      }))
    );
  }, [selectAllChecked]);

  const handlePIIMaskingToggle = useCallback((sourceField: string) => {
    setMappingRows(prev =>
      prev.map(row =>
        row.sourceField === sourceField
          ? { ...row, maskPII: !row.maskPII }
          : row
      )
    );
  }, []);

  // Picklist dialog handlers
  const handleOpenPicklistMapping = useCallback((mismatch: PicklistMismatch) => {
    setCurrentMismatch(mismatch);
    setShowMappingDialog(true);
  }, []);

  const handleClosePicklistMapping = useCallback(() => {
    setShowMappingDialog(false);
    setCurrentMismatch(null);
  }, []);

  const handleSavePicklistMapping = useCallback((mapping: Record<string, string>) => {
    if (!currentMismatch) return;

    const fieldKey = `${currentMismatch.sourceField}->${currentMismatch.targetField}`;
    setPicklistMappings(prev => ({
      ...prev,
      [fieldKey]: mapping
    }));

    // Remove this mismatch from the list as it's been resolved
    setPicklistMismatches(prev =>
      prev.filter(m =>
        !(m.sourceField === currentMismatch.sourceField && m.targetField === currentMismatch.targetField)
      )
    );
  }, [currentMismatch]);

  // Character limit handlers
  const handleResolveCharacterLimitIssue = useCallback((mismatch: CharacterLimitMismatch) => {
    const fieldKey = `${mismatch.sourceField}->${mismatch.targetField}`;
    setResolvedCharacterLimitIssues(prev => new Set([...prev, fieldKey]));

    // Remove this mismatch from the list as it's been resolved
    setCharacterLimitMismatches(prev =>
      prev.filter(m =>
        !(m.sourceField === mismatch.sourceField && m.targetField === mismatch.targetField)
      )
    );
  }, []);


  // API field issue dialog handlers
  const handleOpenAPIFieldIssue = useCallback((row: MappingRow) => {
    setSelectedRowForAPIIssue(row);
    setShowAPIFieldIssueDialog(true);
  }, []);

  const handleCloseAPIFieldIssue = useCallback(() => {
    setShowAPIFieldIssueDialog(false);
    setSelectedRowForAPIIssue(null);
  }, []);


  // Helper function to determine issue severity for a row based on API response
  const getRowIssueClass = useCallback((row: MappingRow): string => {
    // Check API response flags first
    if (row.isError) {
      return 'has-error';
    }

    if (row.isWarning) {
      return 'has-warning';
    }

    return '';
  }, []);

  // Convert mismatches to Issues format for CompactFieldMappingIssues
  const convertToIssues = useCallback((): Issue[] => {
    const issues: Issue[] = [];

    // Convert picklist mismatches
    picklistMismatches.forEach((mismatch, index) => {
      const missingValuesText = mismatch.missingValues.length > 0
        ? `(${mismatch.missingValues.join(', ')})`
        : '';

      const description = `⚠️ Picklist Mismatch Detected: The source field "${mismatch.sourceField}" contains values ${missingValuesText} that are not available in the target org. Please review the mapping below or update the target picklist to include these values before simulation.`;

      const suggestion = mismatch.missingValues.length > 0
        ? `Map the missing source values ${missingValuesText} to existing target values, or add these values to the target picklist in your Salesforce org.`
        : 'Review and map the picklist values between source and target fields.';

      issues.push({
        id: `picklist-${index}`,
        type: 'picklist',
        severity: mismatch.severity,
        fieldName: mismatch.sourceField,
        sourcePath: mismatch.sourceField,
        targetPath: mismatch.targetField,
        description: description,
        details: {
          missingValues: mismatch.missingValues,
          suggestion: suggestion
        },
        onMapValues: () => handleOpenPicklistMapping(mismatch)
      });
    });

    // Convert character limit mismatches
    characterLimitMismatches.forEach((mismatch, index) => {
      issues.push({
        id: `character-${index}`,
        type: 'character',
        severity: mismatch.severity,
        fieldName: mismatch.sourceField,
        description: `⚠️ Field Length Mismatch: The field "${mismatch.sourceField}" in the Source org exceeds the Target field's character limit (Source: ${mismatch.sourceLength}, Target: ${mismatch.targetLength}).`,
        details: {
          sourceLimit: mismatch.sourceLength,
          targetLimit: mismatch.targetLength,
          suggestion: 'Increase Target field length to match Source or enable Truncate option in mapping settings.'
        },
        onResolve: () => handleResolveCharacterLimitIssue(mismatch)
      });
    });

    // Convert missing field mismatches
    missingFieldMismatches.forEach((mismatch, index) => {
      issues.push({
        id: `missing-${index}`,
        type: 'missing',
        severity: mismatch.severity,
        fieldName: mismatch.sourceField,
        description: `⚠️ Field Missing in Target Org: The field "${mismatch.sourceField}" exists in Source but not in Target. Please create it before running simulation.`,
        details: {
          suggestion: 'Create the missing field in Target and re-validate metadata before simulation.'
        }
      });
    });

    return issues;
  }, [picklistMismatches, characterLimitMismatches, missingFieldMismatches, handleOpenPicklistMapping, handleResolveCharacterLimitIssue]);

  const handleSaveMappings = useCallback(() => {
    const newMappings: FieldMapping = {};
    const newSelectedFields: string[] = [];
    const metadata: FieldMappingMetadata = {};

    mappingRowsWithConfidence.forEach(row => {
      if (row.targetField && row.targetField !== '') {
        newMappings[row.sourceField] = row.targetField;
        newSelectedFields.push(row.sourceField);
      }

      // Always capture metadata for all mapped fields
      if (row.targetField && row.targetField !== '') {
        metadata[row.sourceField] = {
          includeInSync: row.includeInSync,
          isPrimaryKey: row.isPrimaryKey,
          maskPII: row.maskPII,
          isPII: row.isPII
        };
      }
    });

    // For now, no transformations are configured in this step
    const transformations = {};

    onUpdateMappings(newMappings, transformations, newSelectedFields, syncAllFields, metadata);
  }, [mappingRowsWithConfidence, syncAllFields, onUpdateMappings]);

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
      </div>

      {/* Field Mapping Issues using CompactFieldMappingIssues component */}
      {/* <CompactFieldMappingIssues issues={convertToIssues()} /> */}

      <div className="field-mapping-table">
        <div className="table-header-fixed">
          <div className="column-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={selectAllChecked}
                onChange={handleSelectAllToggle}
                className="select-all-checkbox"
                title="Select/Unselect all rows"
                aria-label="Select or unselect all rows for sync inclusion"
              />
              <span>Include in Sync</span>
            </div>
          </div>
          <div className="column-header">Primary Key</div>
          <div className="column-header">Mask PII</div>
          <div className="column-header">Source Field (<span className="ds-field-mapping-object-label">{jobData?.sourceObject || 'Contact'}</span>)</div>
          <div className="column-header">Target Field (<span className="ds-field-mapping-object-label">{jobData?.targetObject || 'Contact__c'}</span>)</div>
          <div className="column-header">AI Confidence</div>
          <div className="column-header">Actions</div>
        </div>
        <div className="table-body-scrollable">

        {mappingRowsWithConfidence.map((row) => {
          const isDuplicate = validationResults.duplicateTargetFields.has(row.targetField) && row.targetField !== '';
          const isInvalidSource = validationResults.invalidSourceFields.some(f => f.sourceField === row.sourceField);
          const isEmptySource = !row.sourceField || row.sourceField.trim() === '';
          const issueClass = getRowIssueClass(row);

          return (
            <div
              key={row.sourceField}
              className={`mapping-row ${row.isEditing ? 'editing' : ''} ${isDuplicate ? 'duplicate' : ''} ${isInvalidSource ? 'invalid-source' : ''} ${isEmptySource ? 'empty-source' : ''} ${issueClass}`}
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
                  <span className="field-type">({row.sourceType})</span>
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
                        <option value="">-- (Unmapped)</option>
                        {/* Generate unique target fields from current mappings */}
                        {Array.from(new Set(mappingRows.map(r => r.targetField).filter(field => field)))
                          .sort()
                          .map((targetField) => (
                            <option key={targetField} value={targetField}>
                              {targetField}
                            </option>
                          ))
                        }
                        {/* Allow custom target field entry */}
                        <option value="__custom__">+ Enter custom field...</option>
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
                      <span className="field-name">
                        {row.targetField || 'Click to map'}
                      </span>
                      {row.targetField && <span className="field-type">({row.targetType})</span>}
                      {isDuplicate && <span className="duplicate-indicator"> (Duplicate)</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="confidence-score">
                <div className={`confidence-badge confidence-${getConfidenceLevel(row.confidenceScore)}`}>
                  <span className="confidence-value">{row.confidenceScore}%</span>
                </div>
              </div>

              <div className="actions-column">
                <div className="inline-actions">
                  {/* API Error icon */}
                  {row.isError && (
                    <span
                      className="action-icon error-icon"
                      onClick={() => handleOpenAPIFieldIssue(row)}
                      aria-label="View error details"
                      role="button"
                      tabIndex={0}
                      title={`Error: ${row.errorMessage || 'Field mapping error'}`}
                      style={{ color: '#dc2626' }}
                    >
                      <ErrorIcon fontSize="small" />
                    </span>
                  )}

                  {/* API Warning icon */}
                  {row.isWarning && !row.isError && (
                    <span
                      className="action-icon warning-icon"
                      onClick={() => handleOpenAPIFieldIssue(row)}
                      aria-label="View warning details"
                      role="button"
                      tabIndex={0}
                      title={`Warning: ${row.errorMessage || 'Field mapping warning'}`}
                      style={{ color: '#d97706' }}
                    >
                      <WarningIcon fontSize="small" />
                    </span>
                  )}


                  {row.sourceType === 'Picklist' && row.targetType === 'Picklist' && (
                    <span
                      className="action-icon map-values-icon"
                      onClick={() => {
                        const mismatch = picklistMismatches.find(m =>
                          m.sourceField === row.sourceField && m.targetField === row.targetField
                        );
                        if (mismatch) {
                          handleOpenPicklistMapping(mismatch);
                        }
                      }}
                      aria-label="Map picklist values"
                      role="button"
                      tabIndex={0}
                      title="Map picklist values"
                    >
                      <ListIcon fontSize="small" />
                    </span>
                  )}

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
            </div>
          );
        })}
        </div> {/* End table-body-scrollable */}
      </div> {/* End field-mapping-table */}

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

      {validationResults.hasSyncIncludedErrors && (
        <div className="error-message" role="alert">
          <strong>Critical field errors detected:</strong> Fields with errors that are included in sync must be resolved before simulation. Please fix the highlighted field issues or exclude them from sync.
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

      {/* Picklist Mapping Dialog */}
      {showMappingDialog && currentMismatch && sourceMetadata && targetMetadata && (
        <PicklistMappingDialog
          isOpen={showMappingDialog}
          onClose={handleClosePicklistMapping}
          mismatch={currentMismatch}
          sourcePicklistValues={
            sourceMetadata.fields.find(f => f.name === currentMismatch.sourceField)?.picklistValues || []
          }
          targetPicklistValues={
            targetMetadata.fields.find(f => f.name === currentMismatch.targetField)?.picklistValues || []
          }
          onSaveMapping={handleSavePicklistMapping}
        />
      )}


      {/* API Field Issue Dialog */}
      {showAPIFieldIssueDialog && selectedRowForAPIIssue && (
        <APIFieldIssueDialog
          isOpen={showAPIFieldIssueDialog}
          onClose={handleCloseAPIFieldIssue}
          row={selectedRowForAPIIssue}
        />
      )}
    </div>
  );
};