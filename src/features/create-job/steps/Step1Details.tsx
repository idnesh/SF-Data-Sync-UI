// Step 1: Job Details Component
import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { validateFieldRealTime } from '../../../utils/validation';

interface Step1DetailsProps {
  jobName: string;
  jobDescription: string;
  onUpdate: (name: string, description?: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

export const Step1Details: React.FC<Step1DetailsProps> = ({
  jobName,
  jobDescription,
  onUpdate,
  onNext,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: jobName || '',
    description: jobDescription || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update parent when form data changes
  useEffect(() => {
    onUpdate(formData.name, formData.description);
  }, [formData, onUpdate]);

  const validateJobName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Job name is required';
    }
    if (name.trim().length < 3) {
      return 'Job name must be at least 3 characters';
    }
    if (name.trim().length > 120) {
      return 'Job name must be less than 120 characters';
    }
    if (name !== name.trim()) {
      return 'Job name cannot have leading or trailing whitespace';
    }
    return null;
  };

  const validateDescription = (description: string): string | null => {
    if (description && description.length > 1000) {
      return 'Description must be less than 1000 characters';
    }
    return null;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    let error: string | null = null;
    if (field === 'name') {
      error = validateJobName(formData.name);
    } else if (field === 'description') {
      error = validateDescription(formData.description);
    }

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateJobName(formData.name);
    const descriptionError = validateDescription(formData.description);

    const newErrors: Record<string, string> = {};
    if (nameError) newErrors.name = nameError;
    if (descriptionError) newErrors.description = descriptionError;

    setErrors(newErrors);
    setTouched({ name: true, description: true });

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const isValid = !errors.name && formData.name.trim().length >= 3;
  const characterCount = formData.description.length;

  return (
    <div className="step-container" role="main" aria-labelledby="step1-heading">
      <div className="step-header">
        <h4 id="step1-heading" className="step-title">Job Details</h4>
        <p className="step-description">
          Provide basic information about your sync job. This will help you identify and manage the job later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="step-form" noValidate>
        <div className="form-section">
          <Input
            type="text"
            id="job-name"
            name="name"
            label="Job Name"
            value={formData.name}
            onChange={(value) => handleFieldChange('name', value)}
            onBlur={() => handleFieldBlur('name')}
            error={touched.name ? errors.name : undefined}
            placeholder="e.g., Account Sync - Production to Sandbox"
            required
            autoComplete="off"
            aria-describedby="job-name-help"
          />
          <div id="job-name-help" className="field-help">
            Choose a descriptive name that clearly identifies the purpose of this sync job.
          </div>
        </div>

        <div className="form-section">
          <div className="textarea-wrapper">
            <label htmlFor="job-description" className="form-label">
              Job Description
              <span className="optional-text">(Optional)</span>
            </label>
            <textarea
              id="job-description"
              name="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={() => handleFieldBlur('description')}
              placeholder="Describe the purpose and scope of this sync job..."
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              rows={4}
              maxLength={1000}
              aria-describedby="description-help description-count"
            />
            <div className="textarea-footer">
              <div id="description-help" className="field-help">
                Provide additional context about what this job will accomplish.
              </div>
              <div
                id="description-count"
                className={`character-count ${characterCount > 900 ? 'warning' : ''}`}
                aria-live="polite"
              >
                {characterCount}/1000 characters
              </div>
            </div>
            {errors.description && (
              <div className="error-message" role="alert">
                {errors.description}
              </div>
            )}
          </div>
        </div>

        {/* Draft save indicator */}
        <div className="draft-indicator" aria-live="polite">
          <span className="draft-icon">💾</span>
          <span className="draft-text">Changes are automatically saved as draft</span>
        </div>

        <div className="step-actions">
          <Button
            type="submit"
            variant="primary"
            size="medium"
            disabled={!isValid || isLoading}
            loading={isLoading}
            aria-describedby="next-button-help"
          >
            Continue to Connections
          </Button>
          <div id="next-button-help" className="button-help">
            {!isValid && formData.name.length > 0 && 'Please fix the errors above to continue'}
            {formData.name.length === 0 && 'Enter a job name to continue'}
          </div>
        </div>
      </form>
    </div>
  );
};