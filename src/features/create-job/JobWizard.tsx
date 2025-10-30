// Main Job Creation Wizard Container
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { useJobWizard } from './hooks/useJobWizard';
import { Step1Details } from './steps/Step1Details';
import { Step2Connections } from './steps/Step2Connections';
import { Step3ObjectSelection } from './steps/Step3ObjectSelection';
import { Step4FieldMapping } from './steps/Step4FieldMapping';
import { Step5TestSchedule } from './steps/Step5TestSchedule';
// TODO: Import remaining steps when created
// import { Step5Validation } from './steps/Step5Validation';
import '../../App.css';

interface JobWizardProps {
  onExit?: () => void;
}

export const JobWizard: React.FC<JobWizardProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const {
    currentStep,
    jobData,
    steps,
    isLoading,
    error,
    isDirty,
    goToStep,
    nextStep,
    previousStep,
    updateJobDetails,
    connectToOrg,
    selectObject,
    updateFieldMappings,
    testJob,
    updateSchedule,
    updateJobData,
    createJob,
    clearDraft,
    setError
  } = useJobWizard();

  const handleExit = () => {
    if (isDirty) {
      const confirmExit = window.confirm(
        'You have unsaved changes. Are you sure you want to exit?'
      );
      if (!confirmExit) {
        return;
      }
    }

    // Use onExit callback if provided, otherwise navigate to dashboard
    if (onExit) {
      onExit();
    } else {
      navigate('/dashboard');
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to completed steps or the next immediate step
    const targetStep = steps[stepNumber - 1];
    const currentStepData = steps[currentStep - 1];

    if (targetStep.isCompleted || stepNumber === currentStep ||
      (stepNumber === currentStep + 1 && currentStepData.isCompleted)) {
      goToStep(stepNumber);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Details
            jobName={jobData.name}
            jobDescription={jobData.description}
            onUpdate={updateJobDetails}
            onNext={nextStep}
            isLoading={isLoading}
          />
        );

      case 2:
        return (
          <Step2Connections
            onNext={nextStep}
            onPrevious={previousStep}
            isLoading={isLoading}
          />
        );

      case 3:
        return (
          <Step3ObjectSelection
            sourceObject={jobData.sourceObject}
            targetObject={jobData.targetObject}
            onSelectObject={selectObject}
            onNext={nextStep}
            onPrevious={previousStep}
            isLoading={isLoading}
          />
        );

      case 4:
        return (
          <Step4FieldMapping
            fieldMappings={jobData.fieldMappings}
            selectedFields={jobData.selectedFields}
            syncAllFields={jobData.syncAllFields}
            jobData={jobData}
            onUpdateMappings={updateFieldMappings}
            onNext={nextStep}
            onPrevious={previousStep}
            isLoading={isLoading}
          />
        );

      case 5:
        return (
          <Step5TestSchedule
            jobData={jobData}
            onUpdateSchedule={updateSchedule}
            onUpdateTestResult={(testResult, tested, sampleSize, testStartDate, testStartTime, testEndDate, testEndTime) => {
              updateJobData({
                testResult,
                tested,
                sampleSize,
                testStartDate,
                testStartTime,
                testEndDate,
                testEndTime
              });
            }}
            onNext={async () => {
              const result = await createJob();
              if (result.success) {
                // Use onExit callback if provided, otherwise navigate to jobs
                if (onExit) {
                  onExit();
                } else {
                  navigate('/jobs');
                }
              }
            }}
            onPrevious={previousStep}
            isLoading={isLoading}
            error={error}
          />
        );

      default:
        return (
          <div className="step-container">
            <div className="error-message">Invalid step</div>
          </div>
        );
    }
  };

  return (
    <div className="wizard-layout" role="main" aria-labelledby="wizard-heading">
      <div className="wizard-main">
        {/* Sidebar with Progress Stepper */}
        <aside className="wizard-sidebar" aria-label="Job creation progress">
          <nav className="progress-stepper" role="navigation" aria-label="Wizard steps">
            <ol className="stepper-list">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`stepper-item ${step.isActive ? 'active' : ''} ${step.isCompleted ? 'completed' : ''
                    } ${step.hasErrors ? 'has-errors' : ''}`}
                  role="presentation"
                >
                  <button
                    className="step-indicator"
                    onClick={() => handleStepClick(step.id)}
                    disabled={
                      !step.isCompleted &&
                      step.id !== currentStep &&
                      step.id !== currentStep + 1
                    }
                    aria-current={step.isActive ? 'step' : undefined}
                    aria-label={`Step ${step.id}: ${step.title}${step.isCompleted ? ' (completed)' : ''
                      }${step.hasErrors ? ' (has errors)' : ''}`}
                  >
                    {step.isCompleted ? '✓' : step.id}
                  </button>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="wizard-content">
          {/* Wizard Header moved inside content */}
          <header className="wizard-header">
            <h3 id="wizard-heading"></h3>
            <div className="header-actions">
              <Button
                variant="secondary"
                onClick={handleExit}
                aria-label="Exit wizard and return to dashboard"
              >
                Exit
              </Button>
            </div>
          </header>

          {error && (
            <div className="error-banner" role="alert" aria-live="assertive">
              <button
                className="error-dismiss"
                onClick={() => setError(null)}
                aria-label="Dismiss error message"
              >
                ×
              </button>
              {error}
            </div>
          )}

          {renderCurrentStep()}
        </main>
      </div>
    </div>
  );
};