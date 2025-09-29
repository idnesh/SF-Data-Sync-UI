// Step 1: Sync Configuration Component
import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

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
      return 'Sync name is required';
    }
    if (name.trim().length < 3) {
      return 'Sync name must be at least 3 characters';
    }
    if (name.trim().length > 120) {
      return 'Sync name must be less than 120 characters';
    }
    if (name !== name.trim()) {
      return 'Sync name cannot have leading or trailing whitespace';
    }
    return null;
  };

  const validateDescription = (description: string): string | null => {
    if (description && description.length > 500) {
      return 'Description must be less than 500 characters';
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
    <div className="step-container" role="main">
      <div className="ds-step-header-compact">
        <h4 className="ds-step-title-compact">Sync Configuration</h4>
        <p className="ds-step-description-compact">
          Configure basic settings for your data sync operation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="ds-details-form" noValidate>
        <div className="ds-details-section">
          <div className="ds-details-field">
            <Input
              type="text"
              id="sync-name"
              name="name"
              label="Sync Name"
              value={formData.name}
              onChange={(value) => handleFieldChange('name', value)}
              onBlur={() => handleFieldBlur('name')}
              error={touched.name ? errors.name : undefined}
              placeholder="Account Production Sync"
              required
              autoComplete="off"
              className="ds-details-input"
            />
          </div>

          <div className="ds-details-field">
            <label htmlFor="sync-description" className="ds-details-label">
              Description
              <span className="ds-details-optional">(Optional)</span>
            </label>
            <textarea
              id="sync-description"
              name="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={() => handleFieldBlur('description')}
              placeholder="Brief description of sync purpose..."
              className={`ds-details-textarea ${errors.description ? 'ds-details-error' : ''}`}
              rows={3}
              maxLength={500}
              aria-describedby="description-count"
            />
            <div className="ds-details-textarea-footer">
              <div
                id="description-count"
                className={`ds-details-counter ${characterCount > 450 ? 'ds-details-warning' : ''}`}
                aria-live="polite"
              >
                {characterCount}/500
              </div>
            </div>
            {errors.description && (
              <div className="ds-details-error-message" role="alert">
                {errors.description}
              </div>
            )}
          </div>
        </div>


        <div className="step-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || isLoading}
            loading={isLoading}
          >
            Continue to Connections
          </Button>

          <div id="next-help" className="ds-button-help">
            {!isValid && formData.name.length > 0 && 'Please fix the errors above to continue'}
            {formData.name.length === 0 && 'Enter a sync name to continue'}
          </div>
        </div>
      </form>
    </div>
  );
};