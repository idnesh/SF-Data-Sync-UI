// Step 6: Test & Schedule Component
import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { JobData, ScheduleOption } from '../types';

interface Step6TestScheduleProps {
  jobData: JobData;
  onTest: (sampleSize: number) => Promise<void>;
  onUpdateSchedule: (schedule: ScheduleOption, startDate?: string, startTime?: string, customCron?: string) => void;
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
  { value: 'manual', label: 'Manual', description: 'Run manually when needed', icon: '🎯' },
  { value: '30min', label: 'Every 30 minutes', description: 'High frequency sync', icon: '⚡' },
  { value: '1hour', label: 'Every hour', description: 'Regular updates', icon: '🕐' },
  { value: '2hours', label: 'Every 2 hours', description: 'Moderate frequency', icon: '🕑' },
  { value: '6hours', label: 'Every 6 hours', description: 'Four times daily', icon: '🕕' },
  { value: '12hours', label: 'Every 12 hours', description: 'Twice daily', icon: '🕛' },
  { value: 'daily', label: 'Daily', description: 'Once per day', icon: '📅' },
  { value: 'weekly', label: 'Weekly', description: 'Once per week', icon: '📆' },
  { value: '2weeks', label: 'Every 2 weeks', description: 'Bi-weekly sync', icon: '🗓️' },
  { value: 'monthly', label: 'Monthly', description: 'Once per month', icon: '📊' },
];

export const Step6TestSchedule: React.FC<Step6TestScheduleProps> = ({
  jobData,
  onTest,
  onUpdateSchedule,
  onNext,
  onPrevious,
  isLoading,
  error
}) => {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption>(jobData.schedule || 'manual');
  const [startDate, setStartDate] = useState<string>(jobData.startDate || '');
  const [startTime, setStartTime] = useState<string>(jobData.startTime || '');
  const [sampleSize, setSampleSize] = useState<number>(100);
  const [testCompleted, setTestCompleted] = useState<boolean>(jobData.tested || false);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);

  // Set default start date to tomorrow if not set
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
  }, [startDate, startTime]);

  // Update parent when schedule changes
  useEffect(() => {
    onUpdateSchedule(selectedSchedule, startDate, startTime);
  }, [selectedSchedule, startDate, startTime, onUpdateSchedule]);

  const handleTestJob = async () => {
    setIsTestRunning(true);
    try {
      await onTest(sampleSize);
      setTestCompleted(true);
    } catch (err) {
      console.error('Test failed:', err);
    } finally {
      setIsTestRunning(false);
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

  const { minDate, minTime } = getMinDateTime();
  const isDateTimeValid = startDate && startTime && new Date(`${startDate}T${startTime}`) > new Date();
  const canProceed = testCompleted && isDateTimeValid && selectedSchedule !== 'custom';

  return (
    <div className="step-container" role="main" aria-labelledby="step6-heading">
      <div className="step-header">
        <h4 id="step6-heading" className="step-title">Test & Schedule</h4>
        <p className="step-description">
          Test your job configuration and set up the synchronization schedule
        </p>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* Test Section */}
      <div className="test-schedule-container">
        <div className="test-section">
          <div className="section-card">
            <div className="section-header-inline">
              <div className="section-icon">🧪</div>
              <div className="section-info">
                <h3 className="section-title">Test Job</h3>
                <p className="section-subtitle">
                  Run a test to validate the sync before scheduling. This will process a small sample of data.
                </p>
              </div>
            </div>

            <div className="test-controls">
              <div className="sample-size-control">
                <label htmlFor="sample-size" className="form-label">
                  Sample Size
                </label>
                <Input
                  type="number"
                  id="sample-size"
                  name="sampleSize"
                  label=""
                  value={sampleSize.toString()}
                  onChange={(value) => setSampleSize(parseInt(value) || 100)}
                  min="10"
                  max="1000"
                  placeholder="100"
                  disabled={isTestRunning}
                />
                <span className="help-text">
                  Number of records to process in the test (10-1000)
                </span>
              </div>

              <Button
                variant="primary"
                onClick={handleTestJob}
                disabled={isTestRunning || isLoading}
                loading={isTestRunning}
                className="test-button"
              >
                {isTestRunning ? 'Running Test...' : 'Run Test'}
              </Button>
            </div>

            {testCompleted && jobData.testResult && (
              <div className="test-results">
                <div className="result-header">
                  <span className="result-icon">
                    {jobData.testResult.success ? '✅' : '⚠️'}
                  </span>
                  <span className="result-status">
                    {jobData.testResult.success ? 'Test Successful' : 'Test Completed with Issues'}
                  </span>
                </div>
                <div className="result-stats">
                  <div className="stat-item">
                    <span className="stat-label">Records Processed:</span>
                    <span className="stat-value">{jobData.testResult.recordsProcessed}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Successful:</span>
                    <span className="stat-value success">{jobData.testResult.recordsSucceeded}</span>
                  </div>
                  {jobData.testResult.recordsFailed > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Failed:</span>
                      <span className="stat-value error">{jobData.testResult.recordsFailed}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="schedule-section">
          <div className="section-card">
            <div className="section-header-inline">
              <div className="section-icon">⏰</div>
              <div className="section-info">
                <h3 className="section-title">Schedule</h3>
                <p className="section-subtitle">
                  Choose how often to run this synchronization job
                </p>
              </div>
            </div>

            <div className="schedule-options">
              {SCHEDULE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`schedule-option ${selectedSchedule === option.value ? 'selected' : ''}`}
                  onClick={() => handleScheduleSelect(option.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleScheduleSelect(option.value);
                    }
                  }}
                >
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-content">
                    <div className="option-label">{option.label}</div>
                    <div className="option-description">{option.description}</div>
                  </div>
                  <div className="option-radio">
                    <div className={`radio-dot ${selectedSchedule === option.value ? 'selected' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Start Time Section */}
        {selectedSchedule !== 'manual' && (
          <div className="start-time-section">
            <div className="section-card">
              <div className="section-header-inline">
                <div className="section-icon">📅</div>
                <div className="section-info">
                  <h3 className="section-title">Initial Start Time</h3>
                  <p className="section-subtitle">
                    When should this job start running?
                  </p>
                </div>
              </div>

              <div className="datetime-controls">
                <div className="datetime-group">
                  <div className="form-group">
                    <label htmlFor="start-date" className="form-label">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start-date"
                      className="form-input date-input"
                      value={startDate}
                      min={minDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="start-time" className="form-label">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="start-time"
                      className="form-input time-input"
                      value={startTime}
                      min={startDate === minDate ? minTime : undefined}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {startDate && startTime && (
                  <div className="datetime-preview">
                    <span className="preview-label">First run:</span>
                    <span className="preview-value">
                      {new Date(`${startDate}T${startTime}`).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {!isDateTimeValid && startDate && startTime && (
                  <div className="datetime-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">
                      Start time must be at least 30 minutes from now
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
          onClick={onNext}
          disabled={!canProceed || isLoading}
          loading={isLoading}
          aria-describedby="next-help"
        >
          Create Job
        </Button>

        <div id="next-help" className="button-help">
          {!testCompleted && 'Please run a test before proceeding'}
          {testCompleted && !isDateTimeValid && selectedSchedule !== 'manual' && 'Please set a valid start time'}
          {canProceed && 'Ready to create your synchronization job'}
        </div>
      </div>
    </div>
  );
};