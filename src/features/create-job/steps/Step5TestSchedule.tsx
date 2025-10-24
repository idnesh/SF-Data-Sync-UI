// Step 5: Simulate Component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { JobData, ScheduleOption } from '../types';

interface Step5TestScheduleProps {
  jobData: JobData;
  onUpdateSchedule: (schedule: ScheduleOption, startDate?: string, startTime?: string, customCron?: string, endDate?: string, endTime?: string) => void;
  onUpdateTestResult: (testResult: any, tested: boolean, sampleSize: number, testStartDate?: string, testStartTime?: string, testEndDate?: string, testEndTime?: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  error: string | null;
}

interface ScheduleOptionData {
  value: ScheduleOption;
  label: string;
  description: string;
  icon: string;
}

const SCHEDULE_OPTIONS: ScheduleOptionData[] = [
  { value: '6hours', label: 'Every 6 hours', description: 'Four times daily', icon: '🕕' },
  { value: '12hours', label: 'Every 12 hours', description: 'Twice daily', icon: '🕛' },
  { value: 'daily', label: 'Daily', description: 'Once per day', icon: '📅' },
  { value: 'weekly', label: 'Weekly', description: 'Once per week', icon: '📆' },
  { value: '2weeks', label: 'Every 2 weeks', description: 'Bi-weekly sync', icon: '🗓️' },
  { value: 'monthly', label: 'Monthly', description: 'Once per month', icon: '📊' },
  { value: 'custom', label: 'Custom (Cron)', description: 'Use cron expression', icon: '⚙️' },
];

export const Step5TestSchedule: React.FC<Step5TestScheduleProps> = ({
  jobData,
  onUpdateSchedule,
  onUpdateTestResult,
  onNext,
  onPrevious,
  isLoading,
  error
}) => {
  const navigate = useNavigate();
  // Simulate Schedule State
  const [testStartDate, setTestStartDate] = useState<string>(jobData.testStartDate || '');
  const [testStartTime, setTestStartTime] = useState<string>(jobData.testStartTime || '');
  const [testEndDate, setTestEndDate] = useState<string>(jobData.testEndDate || '');
  const [testEndTime, setTestEndTime] = useState<string>(jobData.testEndTime || '');
  const [sampleSize, setSampleSize] = useState<number>(jobData.sampleSize || 50);

  // Main Job Schedule State
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption>(jobData.schedule || '6hours');

  // API call state
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobCreationStatus, setJobCreationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [jobCreationMessage, setJobCreationMessage] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [startDate, setStartDate] = useState<string>(jobData.startDate || '');
  const [startTime, setStartTime] = useState<string>(jobData.startTime || '');
  const [endDate, setEndDate] = useState<string>(jobData.endDate || '');
  const [endTime, setEndTime] = useState<string>(jobData.endTime || '');
  const [customCron, setCustomCron] = useState<string>(jobData.customCron || '');

  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);

  // Check if there's a valid previous test result on component mount
  useEffect(() => {
    if (jobData.tested && jobData.testResult) {
      setTestCompleted(true);
    }
  }, [jobData.tested, jobData.testResult]);

  // Generate time options with 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        options.push({ value: timeStr, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Set default dates and times for Simulate
  useEffect(() => {
    if (!testStartDate) {
      const now = new Date();
      now.setHours(now.getHours() + 1); // 1 hour from now
      const defaultDate = now.toISOString().split('T')[0];
      setTestStartDate(defaultDate);
    }
    if (!testStartTime) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${Math.floor(now.getMinutes() / 30) * 30 === 0 ? '00' : '30'}`;
      setTestStartTime(timeStr);
    }
    if (!testEndDate && testStartDate && testStartTime) {
      // Create proper start datetime and add 2 hours
      const startDateTime = new Date(`${testStartDate}T${testStartTime}:00`);
      startDateTime.setHours(startDateTime.getHours() + 2);
      setTestEndDate(startDateTime.toISOString().split('T')[0]);
    }
    if (!testEndTime && testStartDate && testStartTime) {
      // Create proper start datetime and add 2 hours for end time
      const startDateTime = new Date(`${testStartDate}T${testStartTime}:00`);
      startDateTime.setHours(startDateTime.getHours() + 2);
      const timeStr = `${startDateTime.getHours().toString().padStart(2, '0')}:${Math.floor(startDateTime.getMinutes() / 30) * 30 === 0 ? '00' : '30'}`;
      setTestEndTime(timeStr);
    }
  }, [testStartDate, testStartTime, testEndDate, testEndTime]);

  // Set default dates and times for main job
  useEffect(() => {
    if (!startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultDate = tomorrow.toISOString().split('T')[0];
      setStartDate(defaultDate);
    }
    if (!startTime) {
      setStartTime('09:00');
    }
    if (!endDate && startDate) {
      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + 30); // Default to 30 days later
      setEndDate(endDateObj.toISOString().split('T')[0]);
    }
    if (!endTime) {
      setEndTime('17:00');
    }
  }, [startDate, startTime, endDate, endTime]);

  // Update parent when schedule changes
  useEffect(() => {
    onUpdateSchedule(selectedSchedule, startDate, startTime, customCron, endDate, endTime);
  }, [selectedSchedule, startDate, startTime, customCron, endDate, endTime, onUpdateSchedule]);

  const handleTestJob = async () => {
    if (!isTestDateTimeValid) {
      return;
    }

    // Reset test state when starting a new simulation
    setTestCompleted(false);
    setIsTestRunning(true);
    try {
      // Create test date strings in UTC format with milliseconds
      const testFromDate = new Date(`${testStartDate}T${testStartTime}:00.000Z`).toISOString();
      const testToDate = new Date(`${testEndDate}T${testEndTime}:00.000Z`).toISOString();

      // Helper function to determine field type based on field name
      const getFieldType = (fieldName: string): string => {
        if (/email/i.test(fieldName)) return 'Email';
        if (/phone|fax/i.test(fieldName)) return 'Phone';
        return 'String';
      };

      // Convert fieldMappings object to API format array with proper field types
      // Only include fields where includeInSync is true
      const fieldMappingArray = Object.entries(jobData.fieldMappings || {})
        .filter(([sourceField]) => {
          const metadata = jobData.fieldMappingMetadata?.[sourceField];
          return metadata?.includeInSync === true;
        })
        .map(([sourceField, targetField]) => ({
          source: sourceField,
          sourceType: getFieldType(sourceField),
          target: targetField,
          targetType: getFieldType(targetField)
        }));

      const testRequestBody = {
        name: `${jobData.name || 'TestSync'}`,
        schedule: {
          frequency: "30",
          timeUnit: "MINUTES"
        },
        fromDate: testFromDate,
        toDate: testToDate,
        sourceObject: jobData.sourceObject || 'Contact',
        targetObject: jobData.targetObject || 'Contact',
        extId: "extid__c",
        fieldMaping: fieldMappingArray
      };

      console.log('Sending test request:', testRequestBody);

      const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/syncsfdc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test response:', result);

        // Handle different response formats
        if (result.jobId && !result.id) {
          // Format 1: Response has jobId but no id
          if (result.jobState === 'JobComplete') {
            // Show success message for completed job
            const testResult = {
              success: true,
              recordsProcessed: result.recordsProcessed || 0,
              recordsSucceeded: result.recordsProcessed || 0,
              recordsFailed: result.recordsFailed || 0,
              errors: [],
              estimatedDuration: 0,
              sampleData: []
            };

            onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
            console.log('Sync completed successfully');
            setTestCompleted(true);
          } else {
            // Job not complete yet
            const testResult = {
              success: false,
              recordsProcessed: 0,
              recordsSucceeded: 0,
              recordsFailed: 0,
              errors: [{ field: 'Status', message: `Job state: ${result.jobState}`, record: null }],
              estimatedDuration: 0,
              sampleData: []
            };

            onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
            setTestCompleted(true);
          }
        } else if (result.id && !result.jobId) {
          // Format 2: Response has id but no jobId - make follow-up API call
          try {
            const statusResponse = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/jobStatus?jobId=${result.id}`);

            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();
              console.log('Job status response:', statusResult);

              // Extract data from nested jobState object
              const jobState = statusResult.jobState || {};
              const recordsProcessed = jobState.numberRecordsProcessed || 0;
              const recordsFailed = jobState.numberRecordsFailed || 0;
              const recordsSucceeded = recordsProcessed - recordsFailed;

              const testResult = {
                success: recordsFailed === 0,
                recordsProcessed,
                recordsSucceeded,
                recordsFailed,
                errors: [],
                estimatedDuration: jobState.totalProcessingTime || 0,
                sampleData: []
              };

              onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
              console.log(`Test completed: ${recordsSucceeded}/${recordsProcessed} records succeeded`);
              setTestCompleted(true);
            } else {
              throw new Error(`Status check failed: ${statusResponse.status}`);
            }
          } catch (statusError) {
            console.error('Failed to check job status:', statusError);

            const testResult = {
              success: false,
              recordsProcessed: 0,
              recordsSucceeded: 0,
              recordsFailed: sampleSize,
              errors: [{ field: 'API', message: 'Failed to check job status', record: null }],
              estimatedDuration: 0,
              sampleData: []
            };

            onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
            setTestCompleted(true);
          }
        } else {
          // Fallback: Handle legacy format or unexpected response
          const recordsProcessed = result.numberRecordsProcessed || 0;
          const recordsFailed = result.numberRecordsFailed || 0;
          const recordsSucceeded = recordsProcessed - recordsFailed;

          const testResult = {
            success: recordsFailed === 0,
            recordsProcessed,
            recordsSucceeded,
            recordsFailed,
            errors: [],
            estimatedDuration: result.totalProcessingTime || 0,
            sampleData: []
          };

          onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
          console.log(`Test completed: ${recordsSucceeded}/${recordsProcessed} records succeeded`);
          setTestCompleted(true);
        }
      } else {
        const errorData = await response.text();
        console.error('Test failed:', response.status, errorData);

        // Create failed test result
        const testResult = {
          success: false,
          recordsProcessed: 0,
          recordsSucceeded: 0,
          recordsFailed: sampleSize,
          errors: [{ field: 'API', message: `API call failed: ${response.status}`, record: null }],
          estimatedDuration: 0,
          sampleData: []
        };

        onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
        setTestCompleted(true);
      }
    } catch (err) {
      console.error('Test failed:', err);

      // Create error test result
      const testResult = {
        success: false,
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: sampleSize,
        errors: [{ field: 'Network', message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`, record: null }],
        estimatedDuration: 0,
        sampleData: []
      };

      onUpdateTestResult(testResult, true, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime);
      setTestCompleted(true);
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleCreateJob = async () => {
    if (!canProceed) {
      return;
    }

    setIsCreatingJob(true);
    setJobCreationStatus('idle');
    setJobCreationMessage('');

    try {
      // Convert schedule to frequency and timeUnit
      const scheduleMapping: { [key in ScheduleOption]: { frequency: string; timeUnit: string } } = {
        'manual': { frequency: '0', timeUnit: 'MANUAL' },
        '30min': { frequency: '30', timeUnit: 'MINUTES' },
        '1hour': { frequency: '1', timeUnit: 'HOURS' },
        '2hours': { frequency: '2', timeUnit: 'HOURS' },
        '6hours': { frequency: '6', timeUnit: 'HOURS' },
        '12hours': { frequency: '12', timeUnit: 'HOURS' },
        'daily': { frequency: '1', timeUnit: 'DAYS' },
        'weekly': { frequency: '1', timeUnit: 'WEEKS' },
        '2weeks': { frequency: '2', timeUnit: 'WEEKS' },
        'monthly': { frequency: '1', timeUnit: 'MONTHS' },
        'custom': { frequency: '0', timeUnit: 'CRON' },
      };

      // Create ISO date strings in UTC format with milliseconds
      const fromDate = new Date(`${startDate}T${startTime}:00.000Z`).toISOString();
      const toDate = new Date(`${endDate}T${endTime}:00.000Z`).toISOString();

      // Helper function to determine field type based on field name
      const getFieldType = (fieldName: string): string => {
        if (/email/i.test(fieldName)) return 'Email';
        if (/phone|fax/i.test(fieldName)) return 'Phone';
        return 'String';
      };

      // Convert fieldMappings object to API format array with proper field types
      // Only include fields where includeInSync is true
      const fieldMappingArray = Object.entries(jobData.fieldMappings || {})
        .filter(([sourceField]) => {
          const metadata = jobData.fieldMappingMetadata?.[sourceField];
          return metadata?.includeInSync === true;
        })
        .map(([sourceField, targetField]) => ({
          source: sourceField,
          sourceType: getFieldType(sourceField),
          target: targetField,
          targetType: getFieldType(targetField)
        }));

      const requestBody: any = {
        name: jobData.name,
        schedule: scheduleMapping[selectedSchedule],
        fromDate,
        toDate,
        sourceObject: jobData.sourceObject,
        targetObject: jobData.targetObject,
        extId: 'extid__c',
        fieldMaping: fieldMappingArray
      };

      console.log('Creating job with request body:', requestBody);

      // Make API call to create the job
      const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/createJob?key=${encodeURIComponent(jobData.name || 'DefaultJob')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Job creation response:', result);

        // Clear job wizard data from localStorage on successful job creation
        localStorage.removeItem('job-wizard-draft');
        localStorage.removeItem('jobWizard_sourceConnection');
        localStorage.removeItem('jobWizard_targetConnection');
        console.log('Job wizard data cleared from localStorage (draft, sourceConnection, targetConnection)');

        setJobCreationStatus('success');
        setJobCreationMessage('Job created successfully! Your sync job has been scheduled.');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.text();
        console.error('Job creation failed:', response.status, errorData);
        setJobCreationStatus('error');
        setJobCreationMessage(`Failed to create job: ${response.status} ${response.statusText}. ${errorData}`);
      }
    } catch (error) {
      setJobCreationStatus('error');
      setJobCreationMessage(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleScheduleSelect = (schedule: ScheduleOption) => {
    setSelectedSchedule(schedule);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/data-sync/job-details'); // Navigate to ViewJobsPage when modal is closed
  };

  // Countdown timer effect for auto-redirect
  useEffect(() => {
    let timer: number;

    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showSuccessModal && countdown === 0) {
      // Auto-redirect when countdown reaches 0
      handleSuccessModalClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSuccessModal, countdown]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (showSuccessModal) {
      setCountdown(5);
    }
  }, [showSuccessModal]);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // At least 30 minutes from now
    return {
      minDate: now.toISOString().split('T')[0],
      minTime: now.toTimeString().slice(0, 5)
    };
  };

  const { minDate } = getMinDateTime();

  // Validation functions for Simulate
  const isTestStartDateTimeValid = testStartDate && testStartTime && new Date(`${testStartDate}T${testStartTime}`) > new Date();
  const isTestEndDateTimeValid = testEndDate && testEndTime && testStartDate && testStartTime &&
    new Date(`${testEndDate}T${testEndTime}`) > new Date(`${testStartDate}T${testStartTime}`);
  const isTestDateTimeValid = isTestStartDateTimeValid && isTestEndDateTimeValid;

  // Validation functions for main job
  const isStartDateTimeValid = startDate && startTime && new Date(`${startDate}T${startTime}`) > new Date();
  const isEndDateTimeValid = endDate && endTime && startDate && startTime &&
    new Date(`${endDate}T${endTime}`) > new Date(`${startDate}T${startTime}`);
  const isCronValid = selectedSchedule !== 'custom' || (customCron && customCron.trim().length > 0);
  const isMainDateTimeValid = selectedSchedule === 'manual' || (selectedSchedule === 'custom' ? isCronValid : (isStartDateTimeValid && isEndDateTimeValid));

  const canProceed = isMainDateTimeValid;

  return (
    <div className="ds-schedule-container" role="main" aria-labelledby="step5-heading">


      {error && (
        <div className="ds-schedule-error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="ds-schedule-layout">
        {/* Test Section */}
        <div className="ds-schedule-test-section">
          <div className="ds-schedule-section-card">
            <div className="ds-schedule-section-header">
              <div className="ds-schedule-section-icon">🧪</div>
              <div className="ds-schedule-section-info">
                <h3 className="ds-schedule-section-title">Simulate</h3>
                <p className="ds-schedule-section-subtitle">
                  Simulate sample records to verify data sync
                </p>
              </div>
            </div>

            {/* Test Duration - Compact Grid */}
            <div className="ds-schedule-test-duration">
              <div className="ds-schedule-duration-grid">
                <div className="ds-schedule-grid-item">
                  <label className="ds-schedule-grid-label">Start Date</label>
                  <input
                    type="date"
                    className="ds-schedule-date-input"
                    value={testStartDate}
                    min={minDate}
                    onChange={(e) => setTestStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="ds-schedule-grid-item">
                  <label className="ds-schedule-grid-label">Start Time</label>
                  <select
                    className="ds-schedule-time-select"
                    value={testStartTime}
                    onChange={(e) => setTestStartTime(e.target.value)}
                    required
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ds-schedule-grid-item">
                  <label className="ds-schedule-grid-label">End Date</label>
                  <input
                    type="date"
                    className="ds-schedule-date-input"
                    value={testEndDate}
                    min={testStartDate || minDate}
                    onChange={(e) => setTestEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className="ds-schedule-grid-item">
                  <label className="ds-schedule-grid-label">End Time</label>
                  <select
                    className="ds-schedule-time-select"
                    value={testEndTime}
                    onChange={(e) => setTestEndTime(e.target.value)}
                    required
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validation Errors */}
              {!isTestStartDateTimeValid && testStartDate && testStartTime && (
                <div className="ds-schedule-error-message">
                  Test start time must be in the future
                </div>
              )}
              {!isTestEndDateTimeValid && testEndDate && testEndTime && testStartDate && testStartTime && (
                <div className="ds-schedule-error-message">
                  Test end time must be after start time
                </div>
              )}
            </div>

            {/* Test Controls - Compact */}
            <div className="ds-schedule-test-controls">
              <div className="ds-schedule-sample-control">
                <label className="ds-schedule-control-label">Sample Size</label>
                <select
                  className="ds-schedule-sample-select"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value) || 50)}
                  disabled={isTestRunning}
                >
                  <option value={50}>50 records</option>
                  <option value={100}>100 records</option>
                  <option value={200}>200 records</option>
                  <option value={500}>500 records</option>
                  <option value={1000}>1000 records</option>
                </select>
              </div>
              <Button
                variant="primary"
                onClick={handleTestJob}
                disabled={isTestRunning || isLoading || !isTestDateTimeValid}
                loading={isTestRunning}
                className="ds-schedule-test-button"
              >
                {isTestRunning ? 'Testing...' : 'Run Simulation'}
              </Button>
            </div>

            {/* Test Results - Compact */}
            {testCompleted && jobData.testResult && (
              <div className="ds-schedule-test-results">
                <div className="ds-schedule-result-header">
                  <span className="ds-schedule-result-icon">
                    {jobData.testResult.success ? '✅' : '⚠️'}
                  </span>
                  <span className="ds-schedule-result-status">
                    {jobData.testResult.success ? 'Test Successful' : 'Issues Found'}
                  </span>
                </div>
                <div className="ds-schedule-result-stats">
                  <div className="ds-schedule-stat">
                    <span className="ds-schedule-stat-value">{jobData.testResult.recordsProcessed}</span>
                    <span className="ds-schedule-stat-label">Processed</span>
                  </div>
                  <div className="ds-schedule-stat success">
                    <span className="ds-schedule-stat-value">{jobData.testResult.recordsSucceeded}</span>
                    <span className="ds-schedule-stat-label">Success</span>
                  </div>
                  {jobData.testResult.recordsFailed > 0 && (
                    <div className="ds-schedule-stat error">
                      <span className="ds-schedule-stat-value">{jobData.testResult.recordsFailed}</span>
                      <span className="ds-schedule-stat-label">Failed</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="ds-schedule-schedule-section">
          <div className="ds-schedule-section-card">
            <div className="ds-schedule-section-header">
              <div className="ds-schedule-section-icon">⏰</div>
              <div className="ds-schedule-section-info">
                <h3 className="ds-schedule-section-title">Schedule</h3>
                <p className="ds-schedule-section-subtitle">
                  Choose how often to run this job
                </p>
              </div>
            </div>

            <div className="ds-schedule-frequency-control">
              <label className="ds-schedule-control-label">Frequency</label>
              <select
                className="ds-schedule-frequency-select"
                value={selectedSchedule}
                onChange={(e) => handleScheduleSelect(e.target.value as ScheduleOption)}
                required
              >
                {SCHEDULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Cron Input */}
            {selectedSchedule === 'custom' && (
              <div className="ds-schedule-frequency-control">
                <label className="ds-schedule-control-label">Cron Expression</label>
                <input
                  type="text"
                  className="ds-schedule-date-input"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 0 * * * (every hour at minute 0)"
                  required
                />
                <div className="ds-schedule-cron-help">
                  Format: minute hour day month weekday (e.g., "0 9 * * 1-5" for 9 AM weekdays)
                </div>
              </div>
            )}

            {/* Job Duration - Compact Layout */}
            {selectedSchedule !== 'manual' && selectedSchedule !== 'custom' && (
              <div className="ds-schedule-job-duration">
                <div className="ds-schedule-duration-header">
                  <span className="ds-schedule-duration-icon">📅</span>
                  <span className="ds-schedule-duration-title">Job Duration</span>
                </div>

                <div className="ds-schedule-job-grid">
                  <div className="ds-schedule-job-group">
                    <div className="ds-schedule-group-label">
                      <span className="ds-schedule-group-icon">🚀</span>
                      Start
                    </div>
                    <div className="ds-schedule-group-controls">
                      <input
                        type="date"
                        className="ds-schedule-date-input"
                        value={startDate}
                        min={minDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                      <select
                        className="ds-schedule-time-select"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      >
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ds-schedule-job-group">
                    <div className="ds-schedule-group-label">
                      <span className="ds-schedule-group-icon">🏁</span>
                      End
                    </div>
                    <div className="ds-schedule-group-controls">
                      <input
                        type="date"
                        className="ds-schedule-date-input"
                        value={endDate}
                        min={startDate || minDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                      <select
                        className="ds-schedule-time-select"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      >
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Duration Preview - Compact */}
                {startDate && startTime && endDate && endTime && isStartDateTimeValid && isEndDateTimeValid && (
                  <div className="ds-schedule-duration-preview">
                    <div className="ds-schedule-preview-grid">
                      <div className="ds-schedule-preview-item">
                        <span className="ds-schedule-preview-label">Starts</span>
                        <span className="ds-schedule-preview-value">
                          {new Date(`${startDate}T${startTime}`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="ds-schedule-preview-item">
                        <span className="ds-schedule-preview-label">Ends</span>
                        <span className="ds-schedule-preview-value">
                          {new Date(`${endDate}T${endTime}`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="ds-schedule-preview-item">
                        <span className="ds-schedule-preview-label">Duration</span>
                        <span className="ds-schedule-preview-value">
                          {(() => {
                            const start = new Date(`${startDate}T${startTime}`);
                            const end = new Date(`${endDate}T${endTime}`);
                            const diffMs = end.getTime() - start.getTime();
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            return `${diffDays} days`;
                          })()}
                        </span>
                      </div>
                      <div className="ds-schedule-preview-item">
                        <span className="ds-schedule-preview-label">Frequency</span>
                        <span className="ds-schedule-preview-value">
                          {SCHEDULE_OPTIONS.find(opt => opt.value === selectedSchedule)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Validation Errors */}
                {!isStartDateTimeValid && startDate && startTime && (
                  <div className="ds-schedule-error-message">
                    Job start time must be at least 30 minutes from now
                  </div>
                )}
                {!isEndDateTimeValid && endDate && endTime && startDate && startTime && (
                  <div className="ds-schedule-error-message">
                    Job end time must be after start time
                  </div>
                )}
              </div>
            )}

            {/* Cron Validation Errors */}
            {selectedSchedule === 'custom' && !isCronValid && (
              <div className="ds-schedule-error-message">
                Please enter a valid cron expression
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ds-schedule-actions">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
        >
          Previous
        </Button>

        <div className="ds-schedule-action-main">
          <Button
            variant="primary"
            onClick={handleCreateJob}
            disabled={!canProceed || isLoading || isCreatingJob}
            loading={isCreatingJob}
            className="ds-schedule-create-button"
          >
            {isCreatingJob ? 'Creating Job...' : 'Create Job'}
          </Button>

          {/* Job Creation Status Messages (Success now shown in modal) */}
          {jobCreationStatus === 'error' && (
            <div className="ds-schedule-error-message">
              ❌ {jobCreationMessage}
            </div>
          )}

          {jobCreationStatus === 'idle' && (
            <div className="ds-schedule-action-help">
              {!isMainDateTimeValid && 'Please set valid schedule configuration'}
              {canProceed && 'Ready to create your job'}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Job Created Successfully"
        size="small"
      >
        <div style={{
          textAlign: 'center',
          padding: '1rem 0'
        }}>

          {/* Countdown with Circular Progress */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '1.5rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                margin: '0 0 1.5rem 0',
                fontWeight: '500'
              }}
              aria-live="polite"
              aria-atomic="true"
            >
              🟢 Job created successfully. Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}
            </p>

            {/* Circular Progress Timer */}
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto',
              position: 'relative'
            }}>
              <CircularProgressbar
                value={((5 - countdown) / 5) * 100}
                text={`⏳${countdown}`}
                styles={buildStyles({
                  textSize: '24px',
                  pathColor: '#10B981',
                  textColor: '#10B981',
                  trailColor: 'var(--border-primary)',
                  backgroundColor: 'transparent',
                  pathTransitionDuration: 1,
                  strokeLinecap: 'round'
                })}
              />
            </div>

            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              margin: '1rem 0 0 0',
              opacity: 0.7
            }}>
              You can also click the button below to go immediately
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleSuccessModalClose}
          >
            View Jobs Now
          </Button>
        </div>

        {/* Add keyframe animations */}
        <style>{`
          @keyframes successPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes countdownPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}</style>
      </Modal>
    </div>
  );
};