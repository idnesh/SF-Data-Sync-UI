// Step 5: Simulate Component
import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { JobData, ScheduleOption } from '../types';

interface Step5TestScheduleProps {
  jobData: JobData;
  onTest: (sampleSize: number, testStartDate?: string, testStartTime?: string, testEndDate?: string, testEndTime?: string) => Promise<void>;
  onUpdateSchedule: (schedule: ScheduleOption, startDate?: string, startTime?: string, customCron?: string, endDate?: string, endTime?: string) => void;
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
  onTest,
  onUpdateSchedule,
  onNext,
  onPrevious,
  isLoading,
  error
}) => {
  // Test Job Schedule State
  const [testStartDate, setTestStartDate] = useState<string>(jobData.testStartDate || '');
  const [testStartTime, setTestStartTime] = useState<string>(jobData.testStartTime || '');
  const [testEndDate, setTestEndDate] = useState<string>(jobData.testEndDate || '');
  const [testEndTime, setTestEndTime] = useState<string>(jobData.testEndTime || '');
  const [sampleSize, setSampleSize] = useState<number>(jobData.sampleSize || 50);

  // Main Job Schedule State
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption>(jobData.schedule || 'manual');

  // API call state
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobCreationStatus, setJobCreationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [jobCreationMessage, setJobCreationMessage] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(jobData.startDate || '');
  const [startTime, setStartTime] = useState<string>(jobData.startTime || '');
  const [endDate, setEndDate] = useState<string>(jobData.endDate || '');
  const [endTime, setEndTime] = useState<string>(jobData.endTime || '');
  const [customCron, setCustomCron] = useState<string>(jobData.customCron || '');

  const [testCompleted, setTestCompleted] = useState<boolean>(jobData.tested || false);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);

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

  // Set default dates and times for test job
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
    if (!testEndDate && testStartDate) {
      const endDateObj = new Date(testStartDate);
      endDateObj.setHours(endDateObj.getHours() + 2); // 2 hours later for test
      setTestEndDate(endDateObj.toISOString().split('T')[0]);
    }
    if (!testEndTime) {
      const now = new Date();
      now.setHours(now.getHours() + 3);
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${Math.floor(now.getMinutes() / 30) * 30 === 0 ? '00' : '30'}`;
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
    setIsTestRunning(true);
    try {
      // Create test date strings
      const testFromDate = new Date(`${testStartDate}T${testStartTime}:00.000Z`).toISOString();
      const testToDate = new Date(`${testEndDate}T${testEndTime}:00.000Z`).toISOString();

      // Convert fieldMappings object to API format array
      const fieldMappingArray = Object.entries(jobData.fieldMappings || {}).map(([sourceField, targetField]) => ({
        source: sourceField,
        sourceType: "String",
        target: targetField,
        targetType: "String"
      }));

      const testRequestBody = {
        name: `${jobData.name}_test`,
        schedule: { frequency: '0', timeUnit: 'MANUAL' },
        fromDate: testFromDate,
        toDate: testToDate,
        sourceObject: jobData.sourceObject,
        targetObject: jobData.targetObject,
        extId: jobData.extId || 'extid__c',
        fieldMaping: fieldMappingArray,
        isTest: true,
        sampleSize: sampleSize
      };

      const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/syncsfdc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequestBody)
      });

      if (response.ok) {
        const result = await response.json();
        // Update jobData with test results
        setJobData(prev => ({
          ...prev,
          testResult: {
            success: true,
            recordsProcessed: result.recordsProcessed || sampleSize,
            recordsSucceeded: result.recordsSucceeded || sampleSize,
            recordsFailed: result.recordsFailed || 0
          }
        }));
        setTestCompleted(true);
      } else {
        const errorData = await response.text();
        console.error('Test failed:', errorData);
        // Set error result
        setJobData(prev => ({
          ...prev,
          testResult: {
            success: false,
            recordsProcessed: 0,
            recordsSucceeded: 0,
            recordsFailed: sampleSize
          }
        }));
        setTestCompleted(true);
      }
    } catch (err) {
      console.error('Test failed:', err);
      // Set error result
      setJobData(prev => ({
        ...prev,
        testResult: {
          success: false,
          recordsProcessed: 0,
          recordsSucceeded: 0,
          recordsFailed: sampleSize
        }
      }));
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
        '6hours': { frequency: '6', timeUnit: 'HOURS' },
        '12hours': { frequency: '12', timeUnit: 'HOURS' },
        'daily': { frequency: '1', timeUnit: 'DAYS' },
        'weekly': { frequency: '1', timeUnit: 'WEEKS' },
        '2weeks': { frequency: '2', timeUnit: 'WEEKS' },
        'monthly': { frequency: '1', timeUnit: 'MONTHS' },
        'custom': { frequency: '0', timeUnit: 'CRON' },
      };

      // Create ISO date strings
      const fromDate = new Date(`${startDate}T${startTime}:00.000Z`).toISOString();
      const toDate = new Date(`${endDate}T${endTime}:00.000Z`).toISOString();

      // Convert fieldMappings object to API format array
      const fieldMappingArray = Object.entries(jobData.fieldMappings || {}).map(([sourceField, targetField]) => ({
        source: sourceField,
        sourceType: "String", // Default to String, could be enhanced with actual field types
        target: targetField,
        targetType: "String"
      }));

      const requestBody: any = {
        name: jobData.name,
        schedule: scheduleMapping[selectedSchedule],
        fromDate,
        toDate,
        sourceObject: jobData.sourceObject,
        targetObject: jobData.targetObject,
        extId: jobData.extId || 'extid__c',
        fieldMaping: fieldMappingArray
      };

      const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/createJob?key=${encodeURIComponent(jobData.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        setJobCreationStatus('success');
        setJobCreationMessage('Job created successfully! Your sync job has been scheduled.');
        // Wait 2 seconds then proceed to next step (which will handle navigation)
        setTimeout(() => {
          onNext();
        }, 2000);
      } else {
        const errorData = await response.text();
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

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // At least 30 minutes from now
    return {
      minDate: now.toISOString().split('T')[0],
      minTime: now.toTimeString().slice(0, 5)
    };
  };

  const { minDate } = getMinDateTime();

  // Validation functions for test job
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
      <div className="ds-schedule-header">
        <h4 id="step5-heading" className="ds-schedule-title">Simulate</h4>
        <p className="ds-schedule-description">
          Test your job configuration and set up the synchronization schedule
        </p>
      </div>

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
                <h3 className="ds-schedule-section-title">Test Job</h3>
                <p className="ds-schedule-section-subtitle">
                  Run a test to validate the sync before scheduling
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
                {isTestRunning ? 'Testing...' : 'Run Test'}
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
                          {selectedSchedule === 'custom' && customCron ? customCron : SCHEDULE_OPTIONS.find(opt => opt.value === selectedSchedule)?.label}
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

          {/* Job Creation Status Messages */}
          {jobCreationStatus === 'success' && (
            <div className="ds-schedule-success-message">
              ✅ {jobCreationMessage}
            </div>
          )}
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
    </div>
  );
};