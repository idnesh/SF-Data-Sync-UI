import React, { useState } from 'react';
import { Button } from './Button';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// TypeScript interfaces
export interface IssueDetails {
  missingValues?: string[];
  sourceLimit?: number;
  targetLimit?: number;
  suggestion?: string;
}

export interface Issue {
  id: string;
  type: 'picklist' | 'character' | 'missing';
  severity: 'error' | 'warning';
  fieldName: string;
  sourcePath?: string;
  targetPath?: string;
  description: string;
  details?: IssueDetails;
  onMapValues?: () => void;
  onResolve?: () => void;
  onCreateField?: () => void;
}

export interface CompactFieldMappingIssuesProps {
  issues: Issue[];
}

const ISSUE_TYPE_LABELS = {
  picklist: 'Picklist Value Mismatches',
  character: 'Character Limit Mismatches',
  missing: 'Missing Fields in Target'
};

export const CompactFieldMappingIssues: React.FC<CompactFieldMappingIssuesProps> = ({
  issues
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Group issues by type
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = [];
    }
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  const toggleSection = (type: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };


  const getSeverityClass = (severity: string) => {
    return severity === 'error' ? 'compact-issue-severity-error' : 'compact-issue-severity-warning';
  };

  const renderActionButton = (issue: Issue) => {
    if (issue.type === 'picklist' && issue.onMapValues) {
      return (
        <Button
          variant="secondary"
          size="small"
          onClick={issue.onMapValues}
          className="compact-issue-action-button"
        >
          Map Values
        </Button>
      );
    }

    if (issue.type === 'character' && issue.onResolve) {
      return (
        <Button
          variant="secondary"
          size="small"
          onClick={issue.onResolve}
          className="compact-issue-action-button"
        >
          Mark as Resolved
        </Button>
      );
    }

    if (issue.type === 'missing' && issue.onCreateField) {
      return (
        <Button
          variant="secondary"
          size="small"
          onClick={issue.onCreateField}
          className="compact-issue-action-button"
        >
          Create Field
        </Button>
      );
    }

    return null;
  };

  const renderIssueDetails = (issue: Issue) => {
    if (!issue.details) return null;

    return (
      <div className="compact-issue-details">
        {issue.details.missingValues && (
          <div className="compact-issue-detail-item">
            <span className="compact-issue-detail-label">Missing values:</span>
            <span className="compact-issue-detail-value">
              {issue.details.missingValues.join(', ')}
            </span>
          </div>
        )}

        {issue.details.sourceLimit && issue.details.targetLimit && (
          <div className="compact-issue-detail-item">
            <span className="compact-issue-detail-label">Limits:</span>
            <span className="compact-issue-detail-value">
              Source: {issue.details.sourceLimit}, Target: {issue.details.targetLimit}
            </span>
          </div>
        )}

        {issue.details.suggestion && (
          <div className="compact-issue-detail-item">
            <span className="compact-issue-detail-label">Suggestion:</span>
            <span className="compact-issue-detail-value">{issue.details.suggestion}</span>
          </div>
        )}
      </div>
    );
  };

  if (issues.length === 0) {
    return null;
  }

  const totalIssues = issues.length;

  return (
    <div className="compact-field-mapping-issues">
      <div className="compact-issues-header">
        <WarningIcon className="compact-issues-warning-icon" />
        <h4 className="compact-issues-title">
          Field Mapping Issues ({totalIssues} issue{totalIssues !== 1 ? 's' : ''} found)
        </h4>
      </div>

      <div className="compact-issues-content">
        {Object.entries(groupedIssues).map(([type, typeIssues]) => (
          <div key={type} className="compact-issue-section">
            <button
              className="compact-section-header"
              onClick={() => toggleSection(type)}
              aria-expanded={expandedSections.has(type)}
              aria-controls={`section-${type}`}
            >
              <span className="compact-section-title">
                {ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS]}
              </span>
              <span className="compact-section-toggle">
                {expandedSections.has(type) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </span>
            </button>

            {expandedSections.has(type) && (
              <div
                id={`section-${type}`}
                className="compact-section-content"
                role="region"
                aria-labelledby={`header-${type}`}
              >
                {typeIssues.map((issue) => (
                  <div key={issue.id} className={`compact-issue-item ${getSeverityClass(issue.severity)}`}>
                    <div className="compact-issue-main">
                      <div className="compact-issue-info">
                        <div className="compact-issue-field">
                          {issue.sourcePath && issue.targetPath ? (
                            <span className="compact-issue-path">
                              {issue.sourcePath} → {issue.targetPath}
                            </span>
                          ) : (
                            <span className="compact-issue-field-name">
                              Field: {issue.fieldName}
                            </span>
                          )}
                        </div>
                        <div className="compact-issue-description">
                          {issue.description}
                        </div>
                      </div>

                      <div className="compact-issue-actions">
                        <span className={`compact-severity-badge compact-severity-${issue.severity}`}>
                          {issue.severity}
                        </span>
                        {renderActionButton(issue)}
                      </div>
                    </div>

                    {renderIssueDetails(issue)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};