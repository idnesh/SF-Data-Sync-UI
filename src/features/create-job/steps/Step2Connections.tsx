// Step 2: Salesforce Connections Component
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../../../components/common/Button';

// New simplified types for org/environment selection
export type SalesforceOrganization = 'service-cloud-mtmg' | 'sales-cloud-sales-mgmt' | 'marketing-cloud-hub' | 'experience-cloud-portal';
export type SalesforceEnvironment = 'production' | 'sandbox' | 'development' | 'pre-production';

interface OrganizationOption {
  value: SalesforceOrganization;
  label: string;
  description: string;
}

interface EnvironmentOption {
  value: SalesforceEnvironment;
  label: string;
  description: string;
}

interface ConnectionSelection {
  organization: SalesforceOrganization | '';
  environment: SalesforceEnvironment | '';
}

interface Step2ConnectionsProps {
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
}

// Available Salesforce Organizations
const ORGANIZATIONS: OrganizationOption[] = [
  {
    value: 'service-cloud-mtmg',
    label: 'Service Cloud - MTMG',
    description: 'Multi-Tenant Management Group for Service Cloud'
  },
  {
    value: 'sales-cloud-sales-mgmt',
    label: 'Sales Cloud - Sales Management',
    description: 'Sales Management and CRM Platform'
  },
  {
    value: 'marketing-cloud-hub',
    label: 'Marketing Cloud - Hub',
    description: 'Marketing Automation and Customer Journey'
  },
  {
    value: 'experience-cloud-portal',
    label: 'Experience Cloud - Portal',
    description: 'Customer and Partner Portal Platform'
  }
];

// Available Environments
const ENVIRONMENTS: EnvironmentOption[] = [
  {
    value: 'production',
    label: 'Production',
    description: 'Live production environment with real data'
  },
  {
    value: 'sandbox',
    label: 'Sandbox',
    description: 'Testing environment with sample data'
  },
  {
    value: 'development',
    label: 'Development',
    description: 'Development environment for testing'
  },
  {
    value: 'pre-production',
    label: 'Pre-Production',
    description: 'Staging environment before production'
  }
];

interface ConnectionPanelProps {
  type: 'source' | 'target';
  title: string;
  connection: ConnectionSelection;
  onConnectionChange: (connection: ConnectionSelection) => void;
  validationError?: string;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  type,
  title,
  connection,
  onConnectionChange,
  validationError
}) => {
  const handleOrganizationChange = (organization: SalesforceOrganization | '') => {
    onConnectionChange({
      ...connection,
      organization,
      environment: '' // Reset environment when org changes
    });
  };

  const handleEnvironmentChange = (environment: SalesforceEnvironment | '') => {
    onConnectionChange({
      ...connection,
      environment
    });
  };

  const isFormValid = connection.organization && connection.environment;

  return (
    <div className={`ds-connections-panel ${isFormValid ? 'ds-connections-ready' : ''}`}>
      <div className="ds-connections-panel-header">
        <h3 className="ds-connections-panel-title">{title}</h3>
      </div>

      <div className="ds-connections-form">
        {/* Organization Dropdown */}
        <div className="ds-connections-form-group">
          <label htmlFor={`${type}-organization`} className="ds-connections-form-label">
            Organization <span className="ds-connections-required">*</span>
          </label>
          <select
            id={`${type}-organization`}
            value={connection.organization}
            onChange={(e) => handleOrganizationChange(e.target.value as SalesforceOrganization)}
            className="ds-connections-form-select"
          >
            <option value="">Select an organization...</option>
            {ORGANIZATIONS.map(org => (
              <option key={org.value} value={org.value}>
                {org.label}
              </option>
            ))}
          </select>
          {connection.organization && (
            <div className="ds-connections-form-help">
              {ORGANIZATIONS.find(org => org.value === connection.organization)?.description}
            </div>
          )}
        </div>

        {/* Environment Dropdown */}
        <div className="ds-connections-form-group">
          <label htmlFor={`${type}-environment`} className="ds-connections-form-label">
            Environment <span className="ds-connections-required">*</span>
          </label>
          <select
            id={`${type}-environment`}
            value={connection.environment}
            onChange={(e) => handleEnvironmentChange(e.target.value as SalesforceEnvironment)}
            className="ds-connections-form-select"
            disabled={!connection.organization}
          >
            <option value="">Select an environment...</option>
            {ENVIRONMENTS.map(env => (
              <option key={env.value} value={env.value}>
                {env.label}
              </option>
            ))}
          </select>
          {connection.environment && (
            <div className="ds-connections-form-help">
              {ENVIRONMENTS.find(env => env.value === connection.environment)?.description}
            </div>
          )}
        </div>


        {validationError && (
          <div className="ds-connections-error" role="alert">
            {validationError}
          </div>
        )}
      </div>
    </div>
  );
};

export const Step2Connections: React.FC<Step2ConnectionsProps> = ({
  onNext,
  onPrevious,
  isLoading
}) => {
  const [sourceConnection, setSourceConnection] = useState<ConnectionSelection>({
    organization: '',
    environment: ''
  });

  const [targetConnection, setTargetConnection] = useState<ConnectionSelection>({
    organization: '',
    environment: ''
  });

  // Validation logic
  const validationResult = useMemo(() => {
    const errors: string[] = [];

    // Check if same org and same environment are selected
    if (
      sourceConnection.organization &&
      targetConnection.organization &&
      sourceConnection.environment &&
      targetConnection.environment &&
      sourceConnection.organization === targetConnection.organization &&
      sourceConnection.environment === targetConnection.environment
    ) {
      errors.push('Source and target cannot use the same organization and environment combination');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [sourceConnection, targetConnection]);

  const canProceed = sourceConnection.organization &&
                   sourceConnection.environment &&
                   targetConnection.organization &&
                   targetConnection.environment &&
                   validationResult.isValid;

  return (
    <div className="step-container">
      <div className="step-header">
        <h4 className="step-title">Salesforce Connections</h4>
        <p className="step-description">
          Select your source and target Salesforce organizations and environments.
          You can connect to the same organization with different environments or different organizations with any environment.
        </p>
      </div>

      {!validationResult.isValid && (
        <div className="ds-connections-validation-error" role="alert">
          <strong>⚠️ Connection Validation Error:</strong>
          <ul>
            {validationResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="ds-connections-grid">
        <ConnectionPanel
          type="source"
          title="Source Organization"
          connection={sourceConnection}
          onConnectionChange={setSourceConnection}
          validationError={!validationResult.isValid ? validationResult.errors[0] : undefined}
        />

        <ConnectionPanel
          type="target"
          title="Target Organization"
          connection={targetConnection}
          onConnectionChange={setTargetConnection}
          validationError={!validationResult.isValid ? validationResult.errors[0] : undefined}
        />
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
        >
          Continue to Object Selection
        </Button>
      </div>
    </div>
  );
};