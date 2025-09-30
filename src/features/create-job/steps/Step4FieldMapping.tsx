// Step 4: Field Mapping Component
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { FieldMapping } from '../types';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Step4FieldMappingProps {
  fieldMappings: FieldMapping;
  selectedFields: string[];
  syncAllFields: boolean;
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

// Default field mappings for Account source to Account__c target
const DEFAULT_MAPPINGS: MappingRow[] = [
  { sourceField: 'Name', sourceLabel: 'Name', targetField: 'Account_Name__c', isEditing: false, confidenceScore: 95 },
  { sourceField: 'OwnerId', sourceLabel: 'OwnerId', targetField: 'OwnerId', isEditing: false, confidenceScore: 99 },
  { sourceField: 'BillingAddress', sourceLabel: 'BillingAddress', targetField: 'Billing_Address_Line_1__c', isEditing: false, confidenceScore: 92 },
  { sourceField: 'CreatedById', sourceLabel: 'CreatedById', targetField: 'CreatedById', isEditing: false, confidenceScore: 99 },
  { sourceField: 'Phone', sourceLabel: 'Phone', targetField: 'Phone__c', isEditing: false, confidenceScore: 90 },
  { sourceField: 'Rating', sourceLabel: 'Rating', targetField: 'Rating__c', isEditing: false, confidenceScore: 88 },
  { sourceField: 'Type', sourceLabel: 'Type', targetField: 'Type__c', isEditing: false, confidenceScore: 87 },
  { sourceField: 'Id', sourceLabel: 'Id', targetField: 'extid__c', isEditing: false, confidenceScore: 85 }
];

// Helper functions for confidence scoring
const getConfidenceLevel = (score: number): string => {
  if (score >= 90) return 'high';
  if (score >= 75) return 'medium';
  return 'low';
};

export const Step4FieldMapping: React.FC<Step4FieldMappingProps> = ({
  fieldMappings,
  selectedFields,
  syncAllFields,
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

  // Loader effect with progress animation - 3 seconds total
  useEffect(() => {
    if (!showLoader) return;

    const steps = [
      'Initializing field analysis...',
      'Analyzing source data structure...',
      'Mapping field relationships...',
      'Optimizing data transformations...',
      'Finalizing field mappings...'
    ];

    let currentStep = 0;
    let currentProgress = 0;

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

  const handleDelete = useCallback((sourceField: string) => {
    setMappingRows(prev => prev.filter(row => row.sourceField !== sourceField));
  }, []);

  const handleAddNewMapping = useCallback(() => {
    const newRow: MappingRow = {
      sourceField: `NewField_${Date.now()}`,
      sourceLabel: `NewField_${Date.now()}`,
      targetField: '',
      isEditing: true,
      confidenceScore: 50 // Default confidence for new mappings
    };
    setMappingRows(prev => [...prev, newRow]);
    setEditingField(newRow.sourceField);
    setTempTargetField('');
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
          Configure how Account (source) fields map to Account__c (target) Salesforce fields.
          Some default mappings are pre-configured to get you started.
        </p>
        <div className="mapping-info">
          <span className="source-info">📊 Source: <strong>Account</strong></span>
          <span className="arrow">→</span>
          <span className="target-info">🎯 Target: <strong>Account__c</strong></span>
        </div>
      </div>

      <div className="field-mapping-table">
        <div className="table-header">
          <div className="column-header">Source Field (Account)</div>
          <div className="column-header">Target Field (Account__c)</div>
          <div className="column-header">AI Confidence</div>
          <div className="column-header">Actions</div>
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
              <div className="source-field">
                <div className={`field-label ${isInvalidSource || isEmptySource ? 'error' : ''}`}>
                  {row.sourceLabel}
                  {isInvalidSource && <span className="error-indicator"> (Invalid)</span>}
                  {isEmptySource && <span className="error-indicator"> (Empty)</span>}
                </div>
              </div>

              <div className="target-field">
                {row.isEditing ? (
                  <div className="edit-container">
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
                    {isDuplicate && (
                      <div className="error-message">This field is already mapped</div>
                    )}
                  </div>
                ) : (
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
                )}
              </div>

              <div className="confidence-score">
                <div className={`confidence-badge confidence-${getConfidenceLevel(row.confidenceScore)}`}>
                  <span className="confidence-value">{row.confidenceScore}%</span>
                </div>
              </div>

              <div className="actions">
                {row.isEditing ? (
                  <div className="edit-actions">
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
                ) : (
                  <div className="row-actions edit-actions">
                    <span
                      className="action-icon edit-icon"
                      onClick={() => handleEditStart(row.sourceField, row.targetField)}
                      aria-label="Edit mapping"
                      role="button"
                      tabIndex={0}
                    >
                      <EditIcon fontSize="small" />
                    </span>
                    <span
                      className="action-icon delete-icon"
                      onClick={() => handleDelete(row.sourceField)}
                      aria-label="Delete mapping"
                      role="button"
                      tabIndex={0}
                    >
                      <DeleteIcon fontSize="small" />
                    </span>
                  </div>
                )}
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
          Continue to Test & Schedule
        </Button>
      </div>
    </div>
  );
};