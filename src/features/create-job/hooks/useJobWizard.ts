// Job Wizard state management hook
import { useState, useCallback, useEffect } from 'react';
import {
  JobData,
  WizardState,
  WizardStep,
  ConnectOrgRequest,
  ConnectionData,
  FieldMapping,
  Transformation,
  Environment,
  ScheduleOption
} from '../types';
import { mockSalesforceAPI, mockJobsAPI } from '../api/mockAPI';

// Analytics helper (placeholder)
const trackEvent = (event: string, data?: any) => {
  console.log(`Analytics: ${event}`, data);
  // TODO: Integrate with actual analytics service
};

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Job Details', description: 'Basic job information', icon: 'info', isCompleted: false, isActive: true, hasErrors: false },
  { id: 2, title: 'Connections', description: 'Source and target orgs', icon: 'link', isCompleted: false, isActive: false, hasErrors: false },
  { id: 3, title: 'Object Selection', description: 'Choose Salesforce object', icon: 'database', isCompleted: false, isActive: false, hasErrors: false },
  { id: 4, title: 'Field Mapping', description: 'Map source to target fields', icon: 'arrow-right', isCompleted: false, isActive: false, hasErrors: false },
  { id: 5, title: 'Validation', description: 'Validate field compatibility', icon: 'check-circle', isCompleted: false, isActive: false, hasErrors: false },
  { id: 6, title: 'Test & Schedule', description: 'Test job and set schedule', icon: 'play', isCompleted: false, isActive: false, hasErrors: false }
];

const INITIAL_JOB_DATA: JobData = {
  name: '',
  description: '',
  sourceConnection: {
    username: '',
    password: '',
    securityToken: '',
    environment: 'production' as Environment,
    isConnected: false
  },
  targetConnection: {
    username: '',
    password: '',
    securityToken: '',
    environment: 'sandbox' as Environment,
    isConnected: false
  },
  selectedObject: '',
  syncAllFields: true,
  selectedFields: [],
  fieldMappings: {},
  transformations: {},
  schedule: 'manual' as ScheduleOption,
  tested: false
};

const STORAGE_KEY = 'job-wizard-draft';

export const useJobWizard = () => {
  const [state, setState] = useState<WizardState>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          currentStep: parsed.currentStep || 1,
          jobData: { ...INITIAL_JOB_DATA, ...parsed.jobData },
          steps: WIZARD_STEPS.map((step, index) => ({
            ...step,
            isActive: index + 1 === (parsed.currentStep || 1),
            isCompleted: index + 1 < (parsed.currentStep || 1)
          })),
          isLoading: false,
          error: null,
          isDirty: true
        };
      } catch (e) {
        console.warn('Failed to restore job wizard state:', e);
      }
    }

    return {
      currentStep: 1,
      jobData: INITIAL_JOB_DATA,
      steps: WIZARD_STEPS,
      isLoading: false,
      error: null,
      isDirty: false
    };
  });

  // Save draft to localStorage whenever jobData changes
  useEffect(() => {
    if (state.isDirty) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep: state.currentStep,
        jobData: state.jobData
      }));
    }
  }, [state.jobData, state.currentStep, state.isDirty]);

  const updateJobData = useCallback((updates: Partial<JobData>) => {
    setState(prev => ({
      ...prev,
      jobData: { ...prev.jobData, ...updates },
      isDirty: true,
      error: null
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const goToStep = useCallback((stepNumber: number) => {
    if (stepNumber < 1 || stepNumber > WIZARD_STEPS.length) return;

    setState(prev => ({
      ...prev,
      currentStep: stepNumber,
      steps: prev.steps.map((step, index) => ({
        ...step,
        isActive: index + 1 === stepNumber,
        isCompleted: index + 1 < stepNumber
      })),
      error: null
    }));
  }, []);

  const nextStep = useCallback(() => {
    const currentStepData = state.steps[state.currentStep - 1];
    if (currentStepData && !currentStepData.hasErrors) {
      goToStep(state.currentStep + 1);
    }
  }, [state.currentStep, state.steps, goToStep]);

  const previousStep = useCallback(() => {
    goToStep(state.currentStep - 1);
  }, [state.currentStep, goToStep]);

  const markStepCompleted = useCallback((stepNumber: number, hasErrors: boolean = false) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepNumber
          ? { ...step, isCompleted: !hasErrors, hasErrors }
          : step
      )
    }));
  }, []);

  // Step 1: Job Details
  const updateJobDetails = useCallback((name: string, description?: string) => {
    updateJobData({ name, description });
    markStepCompleted(1, name.length < 3);

    if (name.length >= 3) {
      trackEvent('wizard.step_1_completed', { jobName: name });
    }
  }, [updateJobData, markStepCompleted]);

  // Step 2: Connect to Salesforce Orgs
  const connectToOrg = useCallback(async (type: 'source' | 'target', connectionData: Omit<ConnectionData, 'isConnected'>) => {
    // If this is a reset operation (no username/password), just update the state
    if (!connectionData.username && !connectionData.password) {
      const resetConnection: ConnectionData = {
        username: '',
        password: '',
        securityToken: '',
        environment: connectionData.environment || (type === 'source' ? 'production' : 'sandbox'),
        isConnected: false
      };

      const updates = type === 'source'
        ? { sourceConnection: resetConnection }
        : { targetConnection: resetConnection };

      updateJobData(updates);
      markStepCompleted(2, true); // Mark as having errors since we need both connections
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: ConnectOrgRequest = {
        ...connectionData,
        type
      };

      const response = await mockSalesforceAPI.connectOrg(request);

      if (response.success) {
        const updatedConnection: ConnectionData = {
          ...connectionData,
          isConnected: true,
          orgName: response.orgName,
          connectionTimestamp: new Date().toISOString()
        };

        const updates = type === 'source'
          ? { sourceConnection: updatedConnection }
          : { targetConnection: updatedConnection };

        updateJobData(updates);

        // Check if both connections are successful
        const otherConnection = type === 'source' ? state.jobData.targetConnection : state.jobData.sourceConnection;
        const bothConnected = otherConnection.isConnected;

        markStepCompleted(2, !bothConnected);

        trackEvent('wizard.connection_success', { type, orgName: response.orgName });
      } else {
        const updatedConnection: ConnectionData = {
          ...connectionData,
          isConnected: false,
          connectionError: response.error
        };

        const updates = type === 'source'
          ? { sourceConnection: updatedConnection }
          : { targetConnection: updatedConnection };

        updateJobData(updates);
        markStepCompleted(2, true);
        setError(response.error || 'Connection failed');

        trackEvent('wizard.connection_failed', { type, error: response.error });
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError('Network error occurred while testing connection');
      markStepCompleted(2, true);
      trackEvent('wizard.connection_error', { type, error: error });
    } finally {
      setLoading(false);
    }
  }, [state.jobData, updateJobData, markStepCompleted, setLoading, setError]);

  // Step 3: Select Salesforce Object
  const selectObject = useCallback(async (objectName: string) => {
    updateJobData({ selectedObject: objectName });
    markStepCompleted(3, false);

    // Pre-fetch fields for the selected object
    try {
      const fieldsResponse = await mockSalesforceAPI.getFields({
        connectionId: 'source', // In real implementation, use actual connection ID
        objectName
      });

      if (fieldsResponse.success) {
        // Cache fields for later use
        // In a real implementation, you might want to store this in a separate state or context
        trackEvent('wizard.object_selected', { objectName, fieldCount: fieldsResponse.fields.length });
      }
    } catch (error) {
      console.warn('Failed to pre-fetch fields:', error);
    }
  }, [updateJobData, markStepCompleted]);

  // Step 4: Configure Field Mappings
  const updateFieldMappings = useCallback((mappings: FieldMapping, transformations: Record<string, Transformation>, selectedFields: string[], syncAllFields: boolean) => {
    updateJobData({
      fieldMappings: mappings,
      transformations,
      selectedFields,
      syncAllFields
    });

    const hasRequiredMappings = Object.keys(mappings).length > 0;
    markStepCompleted(4, !hasRequiredMappings);

    trackEvent('wizard.field_mappings_updated', {
      mappingCount: Object.keys(mappings).length,
      transformationCount: Object.keys(transformations).length,
      syncAllFields
    });
  }, [updateJobData, markStepCompleted]);

  // Step 5: Validate Fields
  const validateFields = useCallback(async () => {
    if (!state.jobData.selectedObject || Object.keys(state.jobData.fieldMappings).length === 0) {
      setError('Please select an object and configure field mappings first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await mockSalesforceAPI.validateFields({
        sourceOrg: state.jobData.sourceConnection,
        targetOrg: state.jobData.targetConnection,
        object: state.jobData.selectedObject,
        mappings: state.jobData.fieldMappings,
        transformations: state.jobData.transformations
      });

      if (response.success) {
        updateJobData({ validationResults: response.results });

        const hasErrors = response.results.some(result => result.status === 'incompatible');
        const hasWarnings = response.results.some(result => result.status === 'warning');

        markStepCompleted(5, hasErrors);

        trackEvent('wizard.validation_completed', {
          totalFields: response.results.length,
          validFields: response.results.filter(r => r.status === 'valid').length,
          warningFields: response.results.filter(r => r.status === 'warning').length,
          errorFields: response.results.filter(r => r.status === 'incompatible').length
        });

        if (hasErrors) {
          setError('Some field mappings are incompatible. Please review and fix the errors.');
        } else if (hasWarnings) {
          setError('Some field mappings have warnings. Please review before proceeding.');
        }
      } else {
        setError(response.error || 'Validation failed');
        markStepCompleted(5, true);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Network error occurred during validation');
      markStepCompleted(5, true);
    } finally {
      setLoading(false);
    }
  }, [state.jobData, updateJobData, markStepCompleted, setLoading, setError]);

  // Step 6: Test Job
  const testJob = useCallback(async (sampleSize: number = 100) => {
    setLoading(true);
    setError(null);

    try {
      const response = await mockJobsAPI.testJob({
        jobData: state.jobData,
        dryRun: true,
        sampleSize
      });

      if (response.success) {
        updateJobData({ testResult: response.result, tested: true });
        markStepCompleted(6, !response.result.success);

        trackEvent('wizard.job_tested', {
          success: response.result.success,
          recordsProcessed: response.result.recordsProcessed,
          recordsSucceeded: response.result.recordsSucceeded,
          recordsFailed: response.result.recordsFailed
        });

        if (!response.result.success) {
          setError(`Test completed with ${response.result.recordsFailed} failed records. Please review the errors.`);
        }
      } else {
        setError(response.error || 'Job test failed');
        markStepCompleted(6, true);
      }
    } catch (error) {
      console.error('Test error:', error);
      setError('Network error occurred during job test');
      markStepCompleted(6, true);
    } finally {
      setLoading(false);
    }
  }, [state.jobData, updateJobData, markStepCompleted, setLoading, setError]);

  // Step 6: Update Schedule
  const updateSchedule = useCallback((schedule: ScheduleOption, startDate?: string, startTime?: string, customCron?: string) => {
    updateJobData({
      schedule,
      startDate,
      startTime,
      customCron
    });
    markStepCompleted(6, false);
  }, [updateJobData, markStepCompleted]);

  // Final: Create Job
  const createJob = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mockJobsAPI.createJob({
        name: state.jobData.name,
        description: state.jobData.description,
        sourceConnection: state.jobData.sourceConnection,
        targetConnection: state.jobData.targetConnection,
        object: state.jobData.selectedObject,
        mappings: state.jobData.fieldMappings,
        transformations: state.jobData.transformations,
        schedule: state.jobData.schedule,
        customCron: state.jobData.customCron,
        dryRunResult: state.jobData.testResult
      });

      if (response.success) {
        // Clear the draft from localStorage
        localStorage.removeItem(STORAGE_KEY);

        trackEvent('wizard.job_created', {
          jobId: response.jobId,
          jobName: state.jobData.name,
          schedule: state.jobData.schedule,
          fieldCount: Object.keys(state.jobData.fieldMappings).length
        });

        return { success: true, jobId: response.jobId, job: response.job };
      } else {
        setError(response.error || 'Failed to create job');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Create job error:', error);
      const errorMessage = 'Network error occurred while creating job';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [state.jobData, setLoading, setError]);

  // Save as draft
  const saveAsDraft = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStep: state.currentStep,
      jobData: state.jobData
    }));
    trackEvent('wizard.saved_as_draft', { currentStep: state.currentStep });
  }, [state.currentStep, state.jobData]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      currentStep: 1,
      jobData: INITIAL_JOB_DATA,
      steps: WIZARD_STEPS,
      isLoading: false,
      error: null,
      isDirty: false
    });
  }, []);

  return {
    // State
    currentStep: state.currentStep,
    jobData: state.jobData,
    steps: state.steps,
    isLoading: state.isLoading,
    error: state.error,
    isDirty: state.isDirty,

    // Navigation
    goToStep,
    nextStep,
    previousStep,

    // Actions
    updateJobDetails,
    connectToOrg,
    selectObject,
    updateFieldMappings,
    validateFields,
    testJob,
    updateSchedule,
    createJob,
    saveAsDraft,
    clearDraft,

    // Utilities
    setError,
    updateJobData
  };
};