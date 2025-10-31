// Step 4: Field Mapping Component
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { FieldMapping, FieldMappingMetadata } from '../types';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';

// API Response interfaces
interface APIFieldMapping {
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
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
    const descriptionMapping: APIFieldMapping = {
      source: "Description__c",
      sourceType: "String",
      target: "Deal_Description__c",
      targetType: "String"
    };

    // Add the Last_Viewed_Date mapping with empty target as specified in the requirements
    const lastViewedDateMapping: APIFieldMapping = {
      source: "Last_Viewed_Date",
      sourceType: "String",
      target: "",
      targetType: ""
    };

    // Add the Description__c mapping if it doesn't already exist
    const descriptionExists = mappings.some(mapping =>
      mapping.source === "Description__c" && mapping.target === "Deal_Description__c"
    );

    if (!descriptionExists) {
      mappings.push(descriptionMapping);
    }

    // Add the Last_Viewed_Date mapping if it doesn't already exist
    const lastViewedExists = mappings.some(mapping =>
      mapping.source === "Last_Viewed_Date"
    );

    if (!lastViewedExists) {
      mappings.push(lastViewedDateMapping);
    }

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
    return {
      sourceField,
      severity: 'warning'
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
      <div style={{ padding: '0', margin: '0' }}>
        <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '4px', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#92400e' }}>
            <strong>"{mismatch.sourceField}"</strong> → <strong>"{mismatch.targetField}"</strong>
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', marginBottom: '0.5rem', padding: '0.4rem 0.5rem', background: '#f9fafb', borderRadius: '3px', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280' }}>
            <span>Source Value</span>
            <span>→</span>
            <span>Target Value</span>
          </div>

          {mismatch.missingValues.map(sourceValue => (
            <div key={sourceValue} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center', padding: '0.5rem', background: '#fff', borderRadius: '4px', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ padding: '0.3rem 0.5rem', borderRadius: '3px', fontWeight: '500', fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
                  {sourceValue}
                </span>
              </div>
              <div style={{ color: '#6b7280', fontWeight: '600', textAlign: 'center', fontSize: '0.8rem' }}>→</div>
              <div>
                <select
                  value={mappings[sourceValue] || ''}
                  onChange={(e) => handleMappingChange(sourceValue, e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '3px', fontSize: '0.8rem' }}
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

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
      confidenceScore: 100, // Default high confidence for API mappings
      isPrimaryKey: isPrimaryKeyField(mapping.source),
      includeInSync: shouldIncludeInSync(mapping.source),
      isPII: isPII,
      maskPII: isPII // Default to mask if PII
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

      // Fetch metadata for both source and target objects
      const [sourceMetadataResponse, targetMetadataResponse] = await Promise.all([
        fetchObjectMetadata(jobData.sourceObject, 'source'),
        fetchObjectMetadata(jobData.targetObject, 'target')
      ]);

      if (!sourceMetadataResponse || !targetMetadataResponse) return;

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
    };

    validatePicklists();
  }, [mappingRows, jobData?.sourceObject, jobData?.targetObject]);

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

  const handleSaveMappings = useCallback(() => {
    const newMappings: FieldMapping = {};
    const newSelectedFields: string[] = [];
    const metadata: FieldMappingMetadata = {};

    mappingRows.forEach(row => {
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
      </div>

      {/* Picklist Validation Warnings */}
      {picklistMismatches.length > 0 && (
        <div className="ds-fieldmapping-validation-warnings">
          <div className="ds-fieldmapping-warning-header">
            <WarningIcon className="ds-fieldmapping-warning-icon" />
            <h4 className="ds-fieldmapping-warning-title">Picklist Issues</h4>
          </div>
          {picklistMismatches.map((mismatch, index) => (
            <div key={index} className={`ds-fieldmapping-warning-item ${index < picklistMismatches.length - 1 ? 'ds-fieldmapping-warning-item-with-margin' : ''}`}>
              <div className="ds-fieldmapping-warning-content">
                <div className="ds-fieldmapping-warning-subheader">
                  <div className="ds-fieldmapping-field-mapping">
                    {mismatch.sourceField} → {mismatch.targetField}
                  </div>
                  <div className="ds-fieldmapping-warning-actions">
                    <span className={`ds-fieldmapping-severity-badge ds-fieldmapping-severity-${mismatch.severity}`}>
                      {mismatch.severity}
                    </span>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleOpenPicklistMapping(mismatch)}
                      className="ds-fieldmapping-map-button"
                    >
                      Map Values
                    </Button>
                  </div>
                </div>
                <div className="ds-fieldmapping-missing-values">
                  Missing values: <strong>{mismatch.missingValues.join(', ')}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Character Limit Validation Warnings */}
      {characterLimitMismatches.length > 0 && (
        <div className="ds-fieldmapping-validation-warnings">
          <div className="ds-fieldmapping-warning-header">
            <WarningIcon className="ds-fieldmapping-warning-icon" />
            <h4 className="ds-fieldmapping-warning-title">Character Limit Mismatch</h4>
          </div>
          {characterLimitMismatches.map((mismatch, index) => (
            <div key={index} className={`ds-fieldmapping-warning-item ${index < characterLimitMismatches.length - 1 ? 'ds-fieldmapping-warning-item-with-margin' : ''}`}>
              <div className="ds-fieldmapping-warning-content">
                <div className="ds-fieldmapping-warning-subheader">
                  <div className="ds-fieldmapping-field-mapping">
                    Field: {mismatch.sourceField}
                  </div>
                  <div className="ds-fieldmapping-warning-actions">
                    <span className={`ds-fieldmapping-severity-badge ds-fieldmapping-severity-${mismatch.severity}`}>
                      {mismatch.severity}
                    </span>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleResolveCharacterLimitIssue(mismatch)}
                      className="ds-fieldmapping-map-button"
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
                <div className="ds-fieldmapping-missing-values">
                  ⚠️ Field Length Mismatch: The field "{mismatch.sourceField}" in the Source org exceeds the Target field's character limit (Source: {mismatch.sourceLength}, Target: {mismatch.targetLength}).
                </div>
                <div className="ds-fieldmapping-missing-values" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                  Suggested Action: Increase Target field length to match Source or enable Truncate option in mapping settings.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing Field Validation Warnings */}
      {missingFieldMismatches.length > 0 && (
        <div className="ds-fieldmapping-validation-warnings">
          <div className="ds-fieldmapping-warning-header">
            <WarningIcon className="ds-fieldmapping-warning-icon" />
            <h4 className="ds-fieldmapping-warning-title">Missing Field in Target</h4>
          </div>
          {missingFieldMismatches.map((mismatch, index) => (
            <div key={index} className={`ds-fieldmapping-warning-item ${index < missingFieldMismatches.length - 1 ? 'ds-fieldmapping-warning-item-with-margin' : ''}`}>
              <div className="ds-fieldmapping-warning-content">
                <div className="ds-fieldmapping-warning-subheader">
                  <div className="ds-fieldmapping-field-mapping">
                    Field: {mismatch.sourceField}
                  </div>
                  <div className="ds-fieldmapping-warning-actions">
                    <span className={`ds-fieldmapping-severity-badge ds-fieldmapping-severity-${mismatch.severity}`}>
                      {mismatch.severity}
                    </span>
                  </div>
                </div>
                <div className="ds-fieldmapping-missing-values">
                  ⚠️ Field Missing in Target Org: The field "{mismatch.sourceField}" exists in Source but not in Target. Please create it before running simulation.
                </div>
                <div className="ds-fieldmapping-missing-values" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                  Suggested Action: Create the missing field in Target and re-validate metadata before simulation.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <div className="column-header">Source Field (<span style={{ color: '#3B82F6', fontWeight: '800', padding: '2px 6px'}}>{jobData?.sourceObject || 'Contact'}</span>)</div>
          <div className="column-header">Target Field (<span style={{ color: '#3B82F6', fontWeight: '800', padding: '2px 6px'}}>{jobData?.targetObject || 'Contact__c'}</span>)</div>
          <div className="column-header">AI Confidence</div>
        </div>
        <div className="table-body-scrollable">

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
    </div>
  );
};