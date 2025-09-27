import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';

interface DataObject {
  id: string;
  name: string;
  icon: string;
  description: string;
  recordCount?: number;
  isAvailable: boolean;
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

type Stage = 'object-selection' | 'processing' | 'results';

const DataCleansingPage: React.FC = () => {
  const [stage, setStage] = useState<Stage>('object-selection');
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [results, setResults] = useState<QualityResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const dataObjects: DataObject[] = [
    {
      id: 'accounts',
      name: 'Accounts',
      icon: '🏢',
      description: 'Company and organization records',
      recordCount: 15420,
      isAvailable: false
    },
    {
      id: 'contacts',
      name: 'Contacts',
      icon: '👤',
      description: 'Individual contact records',
      recordCount: 28750,
      isAvailable: true
    },
    {
      id: 'opportunities',
      name: 'Opportunities',
      icon: '💰',
      description: 'Sales opportunity records',
      recordCount: 8320,
      isAvailable: false
    },
    {
      id: 'leads',
      name: 'Leads',
      icon: '🎯',
      description: 'Potential customer records',
      recordCount: 12100,
      isAvailable: false
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

  const issuesCount = Object.values(mockResults.categories).reduce((sum, cat) => sum + cat.count, 0);

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
          }, 1000);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [stage]);

  const handleObjectSelect = (objectId: string) => {
    const obj = dataObjects.find(o => o.id === objectId);
    if (obj?.isAvailable) {
      setSelectedObject(objectId);
      setStage('processing');
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

  const renderObjectSelection = () => {
    return (
      <div className="object-selection-screen">
        <div className="selection-header">
          <h2>Select Data Object</h2>
          <p>AI-powered data cleansing and quality analysis. Choose which data object you'd like to analyze for quality issues.</p>
        </div>

        <div className="objects-grid">
          {dataObjects.map((obj) => (
            <div
              key={obj.id}
              className={`object-card ${obj.isAvailable ? 'available' : 'disabled'}`}
              onClick={() => handleObjectSelect(obj.id)}
            >
              {!obj.isAvailable && <div className="coming-soon">Coming Soon</div>}
              <div className="object-icon">{obj.icon}</div>
              <h3 className="object-name">{obj.name}</h3>
              <p className="object-description">{obj.description}</p>
              {obj.recordCount && (
                <div className="record-count">
                  {obj.recordCount.toLocaleString()} records
                </div>
              )}
            </div>
          ))}
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

        <div className="processing-stats">
          <div className="stat-item">
            <div className="stat-number">28,750</div>
            <div className="stat-label">Records Analyzed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15</div>
            <div className="stat-label">Quality Checks</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">3</div>
            <div className="stat-label">AI Models</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="results-screen">
        <div className="results-header">
          <div className="header-content">
            <h2>Data Quality Analysis Complete</h2>
            <p>Comprehensive analysis of {results.totalRecords.toLocaleString()} records</p>
          </div>
          <div className="header-actions">
            <Button variant="outline" onClick={() => console.log('Export report')}>
              📊 Export Report
            </Button>
            {/* <Button variant="primary" onClick={() => console.log('Start cleansing')}>
              🧹 Start Cleansing
            </Button> */}
          </div>
        </div>

        {/* Quality Score Overview */}
        <div className="quality-score-section">
          <div className="score-card">
            <div className="score-circle">
              <span className="score-value">{results.score}%</span>
              <span className="score-label">Quality Score</span>
            </div>
            <div className="score-breakdown">
              <div className="breakdown-item">
                <span className="item-value">{results.cleanRecords.toLocaleString()}</span>
                <span className="item-label">Clean Records</span>
              </div>
              <div className="breakdown-item">
                <span className="item-value">{results.issuesFound.toLocaleString()}</span>
                <span className="item-label">Issues Found</span>
              </div>
              <div className="breakdown-item">
                <span className="item-value">{Object.keys(results.categories).length}</span>
                <span className="item-label">Categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Summary */}
        <div className="issues-summary">
          <h3>Issues Summary</h3>
          <div className="summary-grid">
            {Object.entries(results.categories).map(([categoryId, category]) => (
              <div key={categoryId} className="summary-card">
                <div className="summary-icon">
                  {categoryId === 'missing-data' ? '🔍' :
                   categoryId === 'inconsistent-formatting' ? '📝' : '👥'}
                </div>
                <div>
                  <div className="summary-count">{category.count}</div>
                  <div className="summary-type">{category.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Issues */}
        <div className="detailed-issues">
          <h3>Detailed Issues</h3>
          {Object.entries(results.categories).map(([categoryId, category]) => (
            <div key={categoryId} className="issue-category">
              <div
                className="category-header"
                onClick={() => toggleCategoryExpansion(categoryId)}
              >
                <div className="category-header-left">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">({category.count} issues)</span>
                </div>
                <span className="expand-icon">
                  {expandedCategories.has(categoryId) ? '▲' : '▼'}
                </span>
              </div>
              {expandedCategories.has(categoryId) && (
                <div className="category-content">
                  {category.issues.map((issue, index) => (
                    <div key={index} className="issue-item">
                      <div className="issue-header">
                        <div className="severity-indicator" />
                        <strong className="issue-field">{issue.field}</strong>
                        <span className="issue-count">({issue.count} records)</span>
                      </div>
                      <div className="issue-description">{issue.description}</div>
                      <div className="issue-suggestion">💡 {issue.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="action-panel">
          <div className="panel-content">
            <h3>🚀 Ready to Clean Your Data?</h3>
            <p>
              Start the automated cleansing process to fix {results.issuesFound.toLocaleString()}
              identified issues and improve your data quality to 95%+
            </p>
            <div className="panel-actions">
              <Button variant="outline" onClick={() => setStage('object-selection')}>
                🔄 Analyze Another Object
              </Button>
              <Button variant="primary" onClick={() => console.log('Start cleansing workflow')}>
                🚀 Start Data Cleanup
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="scrollable-content">
      <div className="data-cleansing-page">
        {stage === 'object-selection' && renderObjectSelection()}
        {stage === 'processing' && renderProcessing()}
        {stage === 'results' && renderResults()}
      </div>
    </main>
  );
};

export default DataCleansingPage;