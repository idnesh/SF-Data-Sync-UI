// Step 3: Salesforce Object Selection Component
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { SalesforceObject } from '../types';

interface Step3ObjectSelectionProps {
  sourceObject: string;
  targetObject: string;
  onSelectObject: (objectName: string, type: 'source' | 'target') => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
}

export const Step3ObjectSelection: React.FC<Step3ObjectSelectionProps> = ({
  sourceObject,
  targetObject,
  onSelectObject,
  onNext,
  onPrevious,
  isLoading
}) => {
  const [sourceObjects, setSourceObjects] = useState<SalesforceObject[]>([]);
  const [targetObjects, setTargetObjects] = useState<SalesforceObject[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [targetSearchTerm, setTargetSearchTerm] = useState('');
  const [expandedSourceObjects, setExpandedSourceObjects] = useState<Set<string>>(new Set());
  const [expandedTargetObjects, setExpandedTargetObjects] = useState<Set<string>>(new Set());
  const [objectFields, setObjectFields] = useState<Record<string, any[]>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());

  // Load Salesforce objects on mount
  useEffect(() => {
    const loadObjects = async () => {
      setLoadingObjects(true);
      setError(null);

      try {
        // Fetch source objects
        const sourceResponse = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getSfdcObjects?org=source', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Fetch target objects
        const targetResponse = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getSfdcObjects?org=source', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!sourceResponse.ok) {
          throw new Error(`Source API request failed with status ${sourceResponse.status}: ${sourceResponse.statusText}`);
        }

        if (!targetResponse.ok) {
          throw new Error(`Target API request failed with status ${targetResponse.status}: ${targetResponse.statusText}`);
        }

        const sourceData = await sourceResponse.json();
        const targetData = await targetResponse.json();

        // Transform the API response (array of strings) to match our SalesforceObject interface
        const transformedSourceObjects = sourceData.map((objectString: string) => ({
          name: objectString,
          isCustom: objectString.endsWith('__c') // Custom objects end with __c
        }));

        const transformedTargetObjects = targetData.map((objectString: string) => ({
          name: objectString,
          isCustom: objectString.endsWith('__c') // Custom objects end with __c
        }));

        setSourceObjects(transformedSourceObjects);
        setTargetObjects(transformedTargetObjects);
      } catch (err) {
        console.error('Error loading objects:', err);
        setError(`Failed to load Salesforce objects: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setSourceObjects([]);
        setTargetObjects([]);
      } finally {
        setLoadingObjects(false);
      }
    };

    loadObjects();
  }, []);

  // Fetch object fields when object is expanded
  const fetchObjectFields = useCallback(async (objectName: string) => {
    // Check if already loaded or currently fetching
    if (objectFields[objectName] || fetchingRef.current.has(objectName)) {
      return;
    }

    // Add to fetching ref to prevent duplicate calls
    fetchingRef.current.add(objectName);

    setLoadingFields(prev => new Set(prev).add(objectName));

    try {
      const response = await fetch(`https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getSfdcObjects?objectName=${objectName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.fields && Array.isArray(data.fields)) {
        setObjectFields(prev => ({
          ...prev,
          [objectName]: data.fields
        }));
      }
    } catch (err) {
      console.error(`Error loading fields for ${objectName}:`, err);
      // Don't show error for field loading failures, just log them
    } finally {
      // Remove from both fetching ref and loading state
      fetchingRef.current.delete(objectName);
      setLoadingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectName);
        return newSet;
      });
    }
  }, [objectFields]);


  // Filter source objects based on search term
  const filteredSourceObjects = useMemo(() => {
    if (!sourceSearchTerm.trim()) {
      return sourceObjects;
    }

    const term = sourceSearchTerm.toLowerCase();
    return sourceObjects.filter((obj: SalesforceObject) =>
      obj.name.toLowerCase().includes(term)
    );
  }, [sourceObjects, sourceSearchTerm]);

  // Filter target objects based on search term
  const filteredTargetObjects = useMemo(() => {
    if (!targetSearchTerm.trim()) {
      return targetObjects;
    }

    const term = targetSearchTerm.toLowerCase();
    return targetObjects.filter((obj: SalesforceObject) =>
      obj.name.toLowerCase().includes(term)
    );
  }, [targetObjects, targetSearchTerm]);

  // Handle object expansion toggle
  const toggleObjectExpansion = useCallback((objectName: string, type: 'source' | 'target') => {
    const setExpandedObjects = type === 'source' ? setExpandedSourceObjects : setExpandedTargetObjects;

    setExpandedObjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectName)) {
        newSet.delete(objectName);
      } else {
        newSet.add(objectName);
        // Fetch fields when expanding
        fetchObjectFields(objectName);
      }
      return newSet;
    });
  }, [fetchObjectFields]);

  const handleObjectSelect = useCallback((objectName: string, type: 'source' | 'target') => {
    onSelectObject(objectName, type);
  }, [onSelectObject]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, objectName: string, type: 'source' | 'target') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleObjectSelect(objectName, type);
    }
  }, [handleObjectSelect]);

  const canProceed = Boolean(sourceObject && targetObject);

  if (loadingObjects) {
    return (
      <div className="ds-step-container ds-loading-state">
        <div className="ds-loading-content">
          <div className="ds-loading-spinner">
            <svg className="ds-spinner" viewBox="0 0 24 24">
              <circle
                className="ds-spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
          <p>Loading Salesforce objects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-step-container" role="main" aria-labelledby="step3-heading">
      <div className="ds-step-header-compact">
        <h4 className="ds-step-title-compact">Object Selection</h4>
        <p className="ds-step-description-compact">Choose source and target objects for data sync.</p>
      </div>

      {error && (
        <div className={`ds-error-banner ${error.includes('offline') ? 'ds-warning' : 'ds-error'}`} role="alert">
          <span className="ds-error-icon">{error.includes('offline') ? '⚠️' : '❌'}</span>
          {error}
          {error.includes('offline') && (
            <div className="ds-error-details">
              The application will continue using cached data. Please check your network connection.
            </div>
          )}
        </div>
      )}

      <div className="ds-object-selection-container">

        <div className="ds-layout-compact">
          <div className="ds-section-compact">
            <div className="ds-header-compact">
              <h3 className="ds-title-compact">
                <img
                  src="/salesforce-logo.png"
                  alt="Salesforce"
                  style={{
                    height: '20px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}
                />
                Source ({filteredSourceObjects.length})
              </h3>
              <Input
                id="source-search"
                name="source-search"
                value={sourceSearchTerm}
                onChange={setSourceSearchTerm}
                placeholder="Search..."
                className="ds-search-compact"
              />
            </div>
            <div className="ds-list-compact">
              {filteredSourceObjects.length === 0 ? (
                <div className="ds-empty-compact">No objects found</div>
              ) : (
                filteredSourceObjects.map((object: SalesforceObject) => (
                  <ExpandableObjectCard
                    key={`source-${object.name}`}
                    object={object}
                    isSelected={sourceObject === object.name}
                    isExpanded={expandedSourceObjects.has(object.name)}
                    onSelect={(objectName) => handleObjectSelect(objectName, 'source')}
                    onToggleExpand={(objectName) => toggleObjectExpansion(objectName, 'source')}
                    onKeyDown={(event, objectName) => handleKeyDown(event, objectName, 'source')}
                    fields={objectFields[object.name]}
                    isLoadingFields={loadingFields.has(object.name)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="ds-section-compact">
            <div className="ds-header-compact">
              <h3 className="ds-title-compact">
                <img
                  src="/salesforce-logo.png"
                  alt="Salesforce"
                  style={{
                    height: '20px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}
                />
                Target ({filteredTargetObjects.length})
              </h3>
              <Input
                id="target-search"
                name="target-search"
                value={targetSearchTerm}
                onChange={setTargetSearchTerm}
                placeholder="Search..."
                className="ds-search-compact"
              />
            </div>
            <div className="ds-list-compact">
              {filteredTargetObjects.length === 0 ? (
                <div className="ds-empty-compact">No objects found</div>
              ) : (
                filteredTargetObjects.map((object: SalesforceObject) => (
                  <ExpandableObjectCard
                    key={`target-${object.name}`}
                    object={object}
                    isSelected={targetObject === object.name}
                    isExpanded={expandedTargetObjects.has(object.name)}
                    onSelect={(objectName) => handleObjectSelect(objectName, 'target')}
                    onToggleExpand={(objectName) => toggleObjectExpansion(objectName, 'target')}
                    onKeyDown={(event, objectName) => handleKeyDown(event, objectName, 'target')}
                    fields={objectFields[object.name]}
                    isLoadingFields={loadingFields.has(object.name)}
                  />
                ))
              )}
            </div>
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
          Continue to Field Mapping
        </Button>

        <div id="next-help" className="ds-button-help">
          {!canProceed && 'Please select both source and target objects to continue'}
        </div>
      </div>

    </div>
  );
};

// ExpandableObjectCard Component
interface ExpandableObjectCardProps {
  object: SalesforceObject;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (objectName: string) => void;
  onToggleExpand: (objectName: string) => void;
  onKeyDown: (event: React.KeyboardEvent, objectName: string) => void;
  fields?: any[];
  isLoadingFields?: boolean;
}

const ExpandableObjectCard: React.FC<ExpandableObjectCardProps> = ({
  object,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onKeyDown,
  fields,
  isLoadingFields = false
}) => {
  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(object.name);
  };

  const handleExpandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onToggleExpand(object.name);
    }
  };

  return (
    <div className={`ds-object-card-compact ${isSelected ? 'ds-selected' : ''}`}>
      <div className="ds-object-row-compact">
        <div
          className="ds-object-main-compact"
          onClick={() => onSelect(object.name)}
          onKeyDown={(e) => onKeyDown(e, object.name)}
          role="radio"
          aria-checked={isSelected}
          tabIndex={0}
        >
          <span className="ds-object-icon-compact">{getObjectIcon(object.name, object.isCustom)}</span>
          <span className="ds-object-name-compact">{object.name}</span>
          {isSelected && <span className="ds-selected-compact">✓</span>}
        </div>
        <button
          className="ds-expand-btn-compact"
          onClick={handleExpandToggle}
          onKeyDown={handleExpandKeyDown}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Hide' : 'Show'} fields`}
        >
          <span className={`ds-expand-arrow-compact ${isExpanded ? 'ds-expanded' : ''}`}>▼</span>
        </button>
      </div>

      {isExpanded && (
        <div className="ds-fields-compact">
          {isLoadingFields ? (
            <div className="ds-loading-compact">⏳ Loading...</div>
          ) : fields && fields.length > 0 ? (
            <div className="ds-fields-table-container">
              <table className="ds-fields-table-compact">
                <thead>
                  <tr>
                    <th>Field Name</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field: any, index: number) => (
                    <tr key={`field-${index}`}>
                      <td className="ds-field-name-compact">{field.name}</td>
                      <td className="ds-field-type-compact">{field.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ds-no-fields-compact">No fields</div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get icon for object type
function getObjectIcon(objectName: string, isCustom?: boolean): string {
  if (isCustom) {
    return '🔧';
  }

  const iconMap: Record<string, string> = {
    Account: '🏢',
    Contact: '👤',
    Lead: '🎯',
    Opportunity: '💰',
    Case: '📋',
    Product2: '📦',
    User: '👥',
    Campaign: '📢',
    Task: '✅',
    Event: '📅'
  };

  return iconMap[objectName] || '📊';
}

