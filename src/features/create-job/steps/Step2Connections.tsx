// Step 2: Salesforce Connections Component
import React, { useState } from 'react';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { ConnectionData, Environment, ENVIRONMENT_OPTIONS } from '../types';

interface Step2ConnectionsProps {
  sourceConnection: ConnectionData;
  targetConnection: ConnectionData;
  onConnect: (type: 'source' | 'target', connectionData: Omit<ConnectionData, 'isConnected'>) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  error: string | null;
}

interface ConnectionFormData {
  username: string;
  password: string;
  securityToken: string;
  environment: Environment;
}

export const Step2Connections: React.FC<Step2ConnectionsProps> = ({
  sourceConnection,
  targetConnection,
  onConnect,
  onNext,
  onPrevious,
  isLoading,
  error
}) => {
  const [sourceForm, setSourceForm] = useState<ConnectionFormData>({
    username: sourceConnection.username || '',
    password: sourceConnection.password || '',
    securityToken: sourceConnection.securityToken || '',
    environment: sourceConnection.environment || 'production'
  });

  const [targetForm, setTargetForm] = useState<ConnectionFormData>({
    username: targetConnection.username || '',
    password: targetConnection.password || '',
    securityToken: targetConnection.securityToken || '',
    environment: targetConnection.environment || 'sandbox'
  });

  const [testingConnection, setTestingConnection] = useState<'source' | 'target' | null>(null);

  const handleSourceChange = (field: keyof ConnectionFormData, value: string) => {
    setSourceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTargetChange = (field: keyof ConnectionFormData, value: string) => {
    setTargetForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async (type: 'source' | 'target') => {
    const formData = type === 'source' ? sourceForm : targetForm;

    if (!formData.username || !formData.password) {
      return;
    }

    setTestingConnection(type);
    try {
      await onConnect(type, formData);
    } finally {
      setTestingConnection(null);
    }
  };

  const isFormValid = (form: ConnectionFormData) => {
    return form.username.trim() && form.password.trim();
  };

  const canProceed = sourceConnection.isConnected && targetConnection.isConnected;

  const ConnectionPanel = ({
    type,
    title,
    form,
    connection,
    onChange,
    onTest
  }: {
    type: 'source' | 'target';
    title: string;
    form: ConnectionFormData;
    connection: ConnectionData;
    onChange: (field: keyof ConnectionFormData, value: string) => void;
    onTest: () => void;
  }) => (
    <div className={`connection-panel ${connection.isConnected ? 'connected' : ''}`}>
      <div className="panel-header">
        <h3 className="panel-title">{title}</h3>
        {connection.isConnected && (
          <div className="connection-status success" role="status" aria-live="polite">
            <span className="status-icon">✅</span>
            <span className="status-text">Connected</span>
          </div>
        )}
        {connection.connectionError && (
          <div className="connection-status error" role="alert" aria-live="polite">
            <span className="status-icon">❌</span>
            <span className="status-text">Failed</span>
          </div>
        )}
      </div>

      {connection.isConnected ? (
        <div className="connection-success">
          <div className="org-info">
            <div className="org-name">{connection.orgName}</div>
            <div className="connection-time">
              Connected at {new Date(connection.connectionTimestamp!).toLocaleString()}
            </div>
            <div className="environment-badge">
              {ENVIRONMENT_OPTIONS.find(opt => opt.value === connection.environment)?.label}
            </div>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              // Reset connection to allow re-testing
              const resetForm = type === 'source' ? setSourceForm : setTargetForm;
              resetForm(prev => ({ ...prev }));
            }}
          >
            Change Connection
          </Button>
        </div>
      ) : (
        <div className="connection-form">
          <div className="form-grid">
            <Input
              type="email"
              id={`${type}-username`}
              name="username"
              label="Username"
              value={form.username}
              onChange={(value) => onChange('username', value)}
              placeholder="user@company.com"
              required
              autoComplete="username"
              disabled={testingConnection === type}
            />

            <div className="form-group">
              <label htmlFor={`${type}-environment`} className="form-label">
                Environment <span className="required-asterisk">*</span>
              </label>
              <select
                id={`${type}-environment`}
                value={form.environment}
                onChange={(e) => onChange('environment', e.target.value as Environment)}
                className="form-select"
                disabled={testingConnection === type}
                required
              >
                {ENVIRONMENT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="password"
              id={`${type}-password`}
              name="password"
              label="Password"
              value={form.password}
              onChange={(value) => onChange('password', value)}
              placeholder="Enter your Salesforce password"
              required
              autoComplete="current-password"
              disabled={testingConnection === type}
            />

            <Input
              type="password"
              id={`${type}-token`}
              name="securityToken"
              label="Security Token"
              value={form.securityToken}
              onChange={(value) => onChange('securityToken', value)}
              placeholder="Security token (if required)"
              autoComplete="off"
              disabled={testingConnection === type}
            />
          </div>

          {connection.connectionError && (
            <div className="error-message" role="alert">
              <strong>Connection Failed:</strong> {connection.connectionError}
              <div className="error-suggestions">
                <p><strong>Common solutions:</strong></p>
                <ul>
                  <li>Verify your username and password are correct</li>
                  <li>Check if your IP address is in the trusted IP ranges</li>
                  <li>Ensure you have the correct security token (if required)</li>
                  <li>Verify the environment selection matches your org type</li>
                </ul>
              </div>
            </div>
          )}

          <div className="panel-actions">
            <Button
              variant="primary"
              onClick={onTest}
              disabled={!isFormValid(form) || testingConnection === type}
              loading={testingConnection === type}
              aria-describedby={`${type}-test-help`}
            >
              {testingConnection === type ? 'Testing Connection...' : 'Test Connection'}
            </Button>
            <div id={`${type}-test-help`} className="button-help">
              {!isFormValid(form) && 'Please enter username and password'}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="step-container" role="main" aria-labelledby="step2-heading">
      <div className="step-header">
        <h2 id="step2-heading" className="step-title">Salesforce Connections</h2>
        <p className="step-description">
          Connect to your source and target Salesforce organizations. Both connections must be successful to proceed.
        </p>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="connections-grid">
        <ConnectionPanel
          type="source"
          title="Source Organization"
          form={sourceForm}
          connection={sourceConnection}
          onChange={handleSourceChange}
          onTest={() => handleTestConnection('source')}
        />

        <ConnectionPanel
          type="target"
          title="Target Organization"
          form={targetForm}
          connection={targetConnection}
          onChange={handleTargetChange}
          onTest={() => handleTestConnection('target')}
        />
      </div>

      <div className="connection-flow-indicator">
        <div className="flow-item">
          <span className="flow-label">Source</span>
          <div className={`flow-status ${sourceConnection.isConnected ? 'connected' : 'pending'}`}>
            {sourceConnection.isConnected ? '✅' : '⏳'}
          </div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-item">
          <span className="flow-label">Target</span>
          <div className={`flow-status ${targetConnection.isConnected ? 'connected' : 'pending'}`}>
            {targetConnection.isConnected ? '✅' : '⏳'}
          </div>
        </div>
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
          Continue to Object Selection
        </Button>

        <div id="next-help" className="button-help">
          {!canProceed && 'Both source and target connections must be successful to continue'}
        </div>
      </div>
    </div>
  );
};