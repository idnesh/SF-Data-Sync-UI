// Main Job Creation Wizard Container
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/layout/Header';
import { useJobWizard } from './hooks/useJobWizard';
import { Step1Details } from './steps/Step1Details';
import { Step2Connections } from './steps/Step2Connections';
import { Step3ObjectSelection } from './steps/Step3ObjectSelection';
// TODO: Import remaining steps when created
// import { Step4FieldMapping } from './steps/Step4FieldMapping';
// import { Step5Validation } from './steps/Step5Validation';
// import { Step6TestSchedule } from './steps/Step6TestSchedule';
import '../../App.css';

export const JobWizard: React.FC = () => {
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
    validateFields,
    testJob,
    createJob,
    saveAsDraft,
    clearDraft,
    setError
  } = useJobWizard();

  const handleExit = () => {
    if (isDirty) {
      const confirmExit = window.confirm(
        'You have unsaved changes. Would you like to save as draft before leaving?'
      );
      if (confirmExit) {
        saveAsDraft();
      }
    }
    navigate('/dashboard');
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
            sourceConnection={jobData.sourceConnection}
            targetConnection={jobData.targetConnection}
            onConnect={connectToOrg}
            onNext={nextStep}
            onPrevious={previousStep}
            isLoading={isLoading}
            error={error}
          />
        );

      case 3:
        return (
          <Step3ObjectSelection
            selectedObject={jobData.selectedObject}
            onSelectObject={selectObject}
            onNext={nextStep}
            onPrevious={previousStep}
            isLoading={isLoading}
          />
        );

      case 4:
        // TODO: Implement Step4FieldMapping
        return (
          <div className="step-container">
            <div className="step-header">
              <h4 className="step-title">Field Mapping</h4>
              <p className="step-description">Configure field mappings and transformations</p>
            </div>
            <div className="coming-soon-content">
              <p>🚧 Step 4: Field Mapping & Configuration</p>
              <p>This step will include:</p>
              <ul>
                <li>Sync All Fields vs Select Fields mode</li>
                <li>Field mapping interface</li>
                <li>Transformation options</li>
                <li>Bulk mapping tools</li>
              </ul>
            </div>
            <div className="step-actions">
              <Button variant="outline" onClick={previousStep}>Previous</Button>
              <Button variant="primary" onClick={nextStep}>Continue to Validation</Button>
            </div>
          </div>
        );

      case 5:
        // TODO: Implement Step5Validation
        return (
          <div className="step-container">
            <div className="step-header">
              <h4 className="step-title">Field Validation</h4>
              <p className="step-description">Validate field compatibility and mappings</p>
            </div>
            <div className="coming-soon-content">
              <p>🚧 Step 5: Field Validation & Compatibility</p>
              <p>This step will include:</p>
              <ul>
                <li>Field type compatibility checking</li>
                <li>Validation results display</li>
                <li>Error resolution suggestions</li>
                <li>Re-validation capabilities</li>
              </ul>
            </div>
            <div className="step-actions">
              <Button variant="outline" onClick={previousStep}>Previous</Button>
              <Button variant="primary" onClick={nextStep}>Continue to Testing</Button>
            </div>
          </div>
        );

      case 6:
        // TODO: Implement Step6TestSchedule
        return (
          <div className="step-container">
            <div className="step-header">
              <h4 className="step-title">Test & Schedule</h4>
              <p className="step-description">Test your job and configure scheduling</p>
            </div>
            <div className="coming-soon-content">
              <p>🚧 Step 6: Job Testing & Scheduling</p>
              <p>This step will include:</p>
              <ul>
                <li>Dry-run job testing</li>
                <li>Test results and error reporting</li>
                <li>Schedule configuration</li>
                <li>Final job creation</li>
              </ul>
            </div>
            <div className="step-actions">
              <Button variant="outline" onClick={previousStep}>Previous</Button>
              <Button variant="success" onClick={() => alert('Job creation will be implemented!')}>
                Create Job
              </Button>
            </div>
          </div>
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
    <div className="job-wizard" role="main" aria-labelledby="wizard-heading">
      <Header
        title="Salesforce Data Synchronization Platform"
        subtitle="Create a new data synchronization job"
      />

      {/* Wizard Header */}
      <header className="wizard-header">
        <h3 id="wizard-heading">Create Sync Job</h3>
        <div className="header-actions">
          <Button
            variant="outline"
            onClick={saveAsDraft}
            disabled={!isDirty}
            aria-label="Save current progress as draft"
          >
            Save Draft
          </Button>
          <Button
            variant="secondary"
            onClick={handleExit}
            aria-label="Exit wizard and return to dashboard"
          >
            Exit
          </Button>
        </div>
      </header>

      <div className="wizard-main">
        {/* Sidebar with Progress Stepper */}
        <aside className="wizard-sidebar" aria-label="Job creation progress">
          <nav className="progress-stepper" role="navigation" aria-label="Wizard steps">
            <ol className="stepper-list">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`stepper-item ${step.isActive ? 'active' : ''} ${
                    step.isCompleted ? 'completed' : ''
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
                    aria-label={`Step ${step.id}: ${step.title}${
                      step.isCompleted ? ' (completed)' : ''
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

          {/* Progress Summary */}
          <div className="progress-summary" aria-live="polite">
            <div className="progress-text">
              Step {currentStep} of {steps.length}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="progress-stats">
              {steps.filter(s => s.isCompleted).length} completed
              {steps.some(s => s.hasErrors) && (
                <span className="error-count">
                  • {steps.filter(s => s.hasErrors).length} with errors
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="wizard-content">
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