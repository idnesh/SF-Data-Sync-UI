import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { SalesforceOrganization, SalesforceEnvironment } from '../features/create-job/steps/Step2Connections';


interface ConnectionSelection {
  organization: SalesforceOrganization | '';
  environment: SalesforceEnvironment | '';
}

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

interface QualityResult {
  score: number;
  totalRecords: number;
  cleanRecords: number;
  issuesFound: number;
  categories: {
    [key: string]: {
      name: string;
      count: number;
      issues: Array<{
        field: string;
        description: string;
        suggestion: string;
        count: number;
      }>;
    };
  };
}

type Stage = 'connection-selection' | 'object-selection' | 'processing' | 'results';

const DataCleansingPage: React.FC = () => {
  const [stage, setStage] = useState<Stage>('connection-selection');
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [results, setResults] = useState<QualityResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [connection, setConnection] = useState<ConnectionSelection>({
    organization: '',
    environment: ''
  });
  const [objects, setObjects] = useState<string[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportingReport, setExportingReport] = useState(false);


  // Available Salesforce Organizations
  const ORGANIZATIONS: OrganizationOption[] = [
    {
      value: 'service-cloud-mtmg',
      label: 'Service Cloud - Management',
      description: 'Multi-Tenant Management Group for Service Cloud'
    },
    {
      value: 'sales-cloud-sales-mgmt',
      label: 'Sales Cloud - Sales Management',
      description: 'Sales Management and CRM Platform'
    },
    {
      value: 'case-management',
      label: 'Service Cloud - Case Mgmt',
      description: 'Case Management and Support Platform'
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
      value: 'stage-sandbox',
      label: 'Stage Sandbox',
      description: 'Staging environment for testing'
    },
    {
      value: 'pre-prod-sandbox',
      label: 'Pre-Prod Sandbox',
      description: 'Pre-production environment for final testing'
    },
    {
      value: 'qa-sandbox',
      label: 'QA Sandbox',
      description: 'Quality assurance testing environment'
    },
    {
      value: 'prod-sandbox',
      label: 'Prod Sandbox',
      description: 'Production sandbox environment'
    }
  ];

  const mockResults: QualityResult = {
    score: 87,
    totalRecords: 28750,
    cleanRecords: 25013,
    issuesFound: 3737,
    categories: {
      'missing-data': {
        name: 'Missing Data',
        count: 1205,
        issues: [
          {
            field: 'Email',
            description: 'Missing email addresses in contact records',
            suggestion: 'Use data enrichment services or contact validation',
            count: 487
          },
          {
            field: 'Phone',
            description: 'Missing phone numbers',
            suggestion: 'Implement phone number collection in forms',
            count: 718
          }
        ]
      },
      'inconsistent-formatting': {
        name: 'Inconsistent Formatting',
        count: 892,
        issues: [
          {
            field: 'Name',
            description: 'Inconsistent name capitalization',
            suggestion: 'Apply title case formatting to all names',
            count: 892
          }
        ]
      },
      'duplicate-records': {
        name: 'Duplicate Records',
        count: 1640,
        issues: [
          {
            field: 'Email',
            description: 'Duplicate contacts with same email address',
            suggestion: 'Merge duplicate records and maintain single source',
            count: 820
          }
        ]
      }
    }
  };


  // Handle organization selection
  const handleOrganizationChange = (organization: SalesforceOrganization | '') => {
    setConnection({
      ...connection,
      organization,
      environment: '' // Reset environment when org changes
    });
  };

  // Handle environment selection
  const handleEnvironmentChange = (environment: SalesforceEnvironment | '') => {
    setConnection({
      ...connection,
      environment
    });
  };

  // Fetch objects from API when connection is complete
  useEffect(() => {
    const fetchObjects = async () => {
      if (connection.organization && connection.environment) {
        setLoadingObjects(true);
        try {
          const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getSfdcObjects');
          if (response.ok) {
            const data = await response.json();
            setObjects(data);
            setStage('object-selection');
          }
        } catch (error) {
          console.error('Error fetching objects:', error);
        } finally {
          setLoadingObjects(false);
        }
      }
    };

    fetchObjects();
  }, [connection.organization, connection.environment]);

  // Filter objects based on search term
  const filteredObjects = objects.filter(obj =>
    obj.toLowerCase().includes(searchTerm.toLowerCase())
  );


  useEffect(() => {
    if (stage === 'processing') {
      const steps = [
        'Connecting to data source...',
        'Analyzing data structure...',
        'Running quality checks...',
        'Identifying data patterns...',
        'Generating recommendations...',
        'Finalizing results...'
      ];

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProcessingStep(steps[stepIndex]);
          setProgress(((stepIndex + 1) / steps.length) * 100);
          stepIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setResults(mockResults);
            setStage('results');
          }, 500);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [stage]);

  const handleObjectSelect = (objectName: string) => {
    setSelectedObject(objectName);
    setStage('processing');
  };

  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/excel-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objectType: selectedObject,
          analysisResults: results,
          organizationId: connection.organization,
          environmentId: connection.environment
        })
      });

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedObject}_DataQuality_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Export failed:', response.statusText);
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please check your connection and try again.');
    } finally {
      setExportingReport(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderConnectionSelection = () => {
    return (
      <div className="dc-connection-selection">
        <div className="dc-header">
          <div className="dc-header-text">
            <h2 className="dc-title">Select Salesforce Connection</h2>
            <p className="dc-description">
              Choose your Salesforce organization and environment to begin data quality analysis.
            </p>
          </div>
        </div>

        <div className="dc-connections-panel">
          <div className="dc-connections-form">
            {/* Organization Dropdown */}
            <div className="dc-connections-form-group">
              <label htmlFor="dc-organization" className="dc-connections-form-label">
                Organization <span className="dc-connections-required">*</span>
              </label>
              <select
                id="dc-organization"
                value={connection.organization}
                onChange={(e) => handleOrganizationChange(e.target.value as SalesforceOrganization)}
                className="dc-connections-form-select"
              >
                <option value="">Select an organization...</option>
                {ORGANIZATIONS.map(org => (
                  <option key={org.value} value={org.value}>
                    {org.label}
                  </option>
                ))}
              </select>
              {connection.organization && (
                <div className="dc-connections-form-help">
                  {ORGANIZATIONS.find(org => org.value === connection.organization)?.description}
                </div>
              )}
            </div>

            {/* Environment Dropdown */}
            <div className="dc-connections-form-group">
              <label htmlFor="dc-environment" className="dc-connections-form-label">
                Environment <span className="dc-connections-required">*</span>
              </label>
              <select
                id="dc-environment"
                value={connection.environment}
                onChange={(e) => handleEnvironmentChange(e.target.value as SalesforceEnvironment)}
                className="dc-connections-form-select"
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
                <div className="dc-connections-form-help">
                  {ENVIRONMENTS.find(env => env.value === connection.environment)?.description}
                </div>
              )}
            </div>
          </div>

          {loadingObjects && (
            <div className="dc-loading">
              <div className="dc-spinner"></div>
              <p>Loading objects...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderObjectSelection = () => {
    return (
      <div className="dc-object-selection">
        <div className="dc-header">
          <div className="dc-header-content">
            <div className="dc-header-text">
              <h2 className="dc-title">Select Data Object</h2>
              <p className="dc-description">
                AI-powered data quality analysis. Choose which Salesforce object you'd like to analyze.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setStage('connection-selection')}
              className="dc-back-button"
            >
              ← Back to Connection
            </Button>
          </div>
        </div>

        <div className="dc-section-compact">
          <div className="dc-header-compact">
            <h3 className="dc-title-compact">Available Objects ({filteredObjects.length})</h3>
            <Input
              id="object-search"
              name="object-search"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search objects..."
              className="dc-search-compact"
            />
          </div>
          <div className="dc-list-compact">
            {filteredObjects.length === 0 ? (
              <div className="dc-empty-compact">No objects found</div>
            ) : (
              filteredObjects.map((objectName) => (
                <div
                  key={objectName}
                  className={`dc-object-card ${selectedObject === objectName ? 'selected' : ''}`}
                  onClick={() => handleObjectSelect(objectName)}
                >
                  <div className="dc-object-info">
                    <div className="dc-object-name">{objectName}</div>
                    <div className="dc-object-type">
                      {objectName.endsWith('__c') ? 'Custom Object' : 'Standard Object'}
                    </div>
                  </div>
                  <div className="dc-object-icon">
                    {objectName.includes('Account') ? '🏢' :
                      objectName.includes('Contact') ? '👤' :
                        objectName.includes('Lead') ? '🎯' :
                          objectName.includes('Opportunity') ? '💰' :
                            objectName.includes('Case') ? '📋' :
                              objectName.includes('Campaign') ? '📢' : '📊'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="processing-screen">
      <div className="processing-container">
        <div className="ai-logo">
          <div className="ai-circle">
            🧠
          </div>
        </div>

        <h2>AI-Powered Analysis in Progress</h2>
        <p>Our advanced algorithms are analyzing your data quality...</p>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{Math.round(progress)}% Complete</div>
        </div>

        <div className="processing-step">
          <span className="step-icon">⚙️</span>
          <span>{processingStep}</span>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="dc-results-screen">
        <div className="dc-results-header">
          <div className="dc-header-content">
            <div className="dc-header-text">
              <h2 className="dc-results-title">{selectedObject} - AI Analysis Summary</h2>
              <p className="dc-results-subtitle">Comprehensive analysis of {selectedObject} {results.totalRecords.toLocaleString()} records</p>
            </div>
            <div className="dc-header-actions">
              <Button
                variant="outline"
                onClick={handleExportReport}
                loading={exportingReport}
                disabled={exportingReport}
              >
                📊 {exportingReport ? 'Exporting...' : 'Export Report'}
              </Button>
              <Button variant="outline" onClick={() => setStage('object-selection')}>
                🔄 Analyze Another
              </Button>
            </div>
          </div>
        </div>

        {/* Quality Score Overview */}
        <div className="dc-score-section">
          <div className="dc-score-card">
            <div className="dc-score-circle">
              <span className="dc-score-value">{results.score}%</span>
              <span className="dc-score-label">Quality Score</span>
            </div>
            <div className="dc-score-breakdown">
              <div className="dc-breakdown-item">
                <div className="dc-item-value">28,750</div>
                <div className="dc-item-label">Records Analyzed</div>
              </div>
              <div className="dc-breakdown-item">
                <span className="dc-item-value">{results.cleanRecords.toLocaleString()}</span>
                <span className="dc-item-label">Clean Records</span>
              </div>
              <div className="dc-breakdown-item">
                <span className="dc-item-value">{results.issuesFound.toLocaleString()}</span>
                <span className="dc-item-label">Issues Found</span>
              </div>
              <div className="dc-breakdown-item">
                <span className="dc-item-value">{Object.keys(results.categories).length}</span>
                <span className="dc-item-label">Categories</span>
              </div>
              <div className="dc-breakdown-item">
                <div className="dc-item-value">15</div>
                <div className="dc-item-label">Quality Checks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Summary */}
        <div className="dc-issues-summary">
          <h3 className="dc-section-title">Issues Summary</h3>
          <div className="dc-summary-grid">
            {Object.entries(results.categories).map(([categoryId, category]) => (
              <div key={categoryId} className="dc-summary-card">
                <div className="dc-summary-icon">
                  {categoryId === 'missing-data' ? '🔍' :
                    categoryId === 'inconsistent-formatting' ? '📝' : '👥'}
                </div>
                <div className="dc-summary-content">
                  <div className="dc-summary-count">{category.count}</div>
                  <div className="dc-summary-type">{category.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Issues */}
        <div className="dc-detailed-issues">
          <h3 className="dc-section-title">Detailed Issues</h3>
          <div className="dc-issues-container">
            {Object.entries(results.categories).map(([categoryId, category]) => (
              <div key={categoryId} className="dc-issue-category">
                <div
                  className="dc-category-header"
                  onClick={() => toggleCategoryExpansion(categoryId)}
                >
                  <div className="dc-category-header-left">
                    <span className="dc-category-name">{category.name}</span>
                    <span className="dc-category-count">({category.count} issues)</span>
                  </div>
                  <span className="dc-expand-icon">
                    {expandedCategories.has(categoryId) ? '▲' : '▼'}
                  </span>
                </div>
                {expandedCategories.has(categoryId) && (
                  <div className="dc-category-content">
                    {category.issues.map((issue, index) => (
                      <div key={index} className="dc-issue-item">
                        <div className="dc-issue-header">
                          <div className="dc-severity-indicator" />
                          <strong className="dc-issue-field">{issue.field}</strong>
                          <span className="dc-issue-count">({issue.count} records)</span>
                        </div>
                        <div className="dc-issue-description">{issue.description}</div>
                        <div className="dc-issue-suggestion">💡 {issue.suggestion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="scrollable-content">
      <div className="data-cleansing-page">
        {stage === 'connection-selection' && renderConnectionSelection()}
        {stage === 'object-selection' && renderObjectSelection()}
        {stage === 'processing' && renderProcessing()}
        {stage === 'results' && renderResults()}
      </div>
    </main>
  );
};

export default DataCleansingPage;