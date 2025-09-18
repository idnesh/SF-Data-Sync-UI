// Step 3: Salesforce Object Selection Component
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { SalesforceObject } from '../types';
import { MOCK_SFDC_OBJECTS_RESPONSE } from '../api/mockSfdcObjects';

interface Step3ObjectSelectionProps {
  selectedObject: string; // Keep for backward compatibility
  sourceObject: string;
  targetObject: string;
  onSelectObject: (objectName: string, type: 'source' | 'target') => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
}

export const Step3ObjectSelection: React.FC<Step3ObjectSelectionProps> = ({
  selectedObject, // Keep for backward compatibility
  sourceObject,
  targetObject,
  onSelectObject,
  onNext,
  onPrevious,
  isLoading
}) => {
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [targetSearchTerm, setTargetSearchTerm] = useState('');
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load Salesforce objects on mount
  useEffect(() => {
    const loadObjects = async () => {
      setLoadingObjects(true);
      setError(null);

      try {
        // Make API call to get SFDC objects
        const response = await fetch('https://syncsfdc-j39330.5sc6y6-3.usa-e2.cloudhub.io/getSfdcObjects', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform the API response to match our SalesforceObject interface
        const transformedObjects = data.sobjects?.map((sobject: any) => ({
          name: sobject.name,
          label: sobject.label || sobject.name, // Use label if available, fallback to name
          apiName: sobject.name,
          fieldCount: 0, // API doesn't provide field count in this endpoint
          description: sobject.labelPlural ? `${sobject.labelPlural} - ${sobject.name}` : `Standard Salesforce object: ${sobject.name}`,
          isCustom: sobject.custom || false
        })) || [];

        setObjects(transformedObjects);
      } catch (err) {
        console.error('Error loading objects:', err);
        setError(`Failed to load Salesforce objects: ${err instanceof Error ? err.message : 'Unknown error'}`);

        // Fallback to mock data if API call fails
        try {
          const transformedMockObjects = MOCK_SFDC_OBJECTS_RESPONSE.sobjects?.map((sobject: any) => ({
            name: sobject.name,
            label: sobject.label || sobject.name,
            apiName: sobject.name,
            fieldCount: 0,
            description: sobject.labelPlural ? `${sobject.labelPlural} - ${sobject.name}` : `Standard Salesforce object: ${sobject.name}`,
            isCustom: sobject.custom || false
          })) || [];

          setObjects(transformedMockObjects);
          setError('Using offline data - API connection failed');
        } catch (mockErr) {
          console.error('Error loading mock data:', mockErr);
          setObjects([]);
        }
      } finally {
        setLoadingObjects(false);
      }
    };

    loadObjects();
  }, []);


  // Filter source objects based on search term
  const filteredSourceObjects = useMemo(() => {
    if (!sourceSearchTerm.trim()) {
      return objects;
    }

    const term = sourceSearchTerm.toLowerCase();
    return objects.filter(obj =>
      obj.name.toLowerCase().includes(term) ||
      obj.label.toLowerCase().includes(term) ||
      obj.description?.toLowerCase().includes(term)
    );
  }, [objects, sourceSearchTerm]);

  // Filter target objects based on search term
  const filteredTargetObjects = useMemo(() => {
    if (!targetSearchTerm.trim()) {
      return objects;
    }

    const term = targetSearchTerm.toLowerCase();
    return objects.filter(obj =>
      obj.name.toLowerCase().includes(term) ||
      obj.label.toLowerCase().includes(term) ||
      obj.description?.toLowerCase().includes(term)
    );
  }, [objects, targetSearchTerm]);

  // Handle object expansion toggle
  const toggleObjectExpansion = useCallback((objectName: string) => {
    setExpandedObjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectName)) {
        newSet.delete(objectName);
      } else {
        newSet.add(objectName);
      }
      return newSet;
    });
  }, []);

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
      <div className="step-container loading-state">
        <div className="loading-content">
          <div className="loading-spinner">
            <svg className="spinner" viewBox="0 0 24 24">
              <circle
                className="spinner-circle"
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
    <div className="step-container" role="main" aria-labelledby="step3-heading">
      <div className="step-header">
        <h4 id="step3-heading" className="step-title">Object Selection</h4>
        <p className="step-description">
          Select source and target objects for synchronization. Source objects are what you'll sync from, and target objects are what you'll sync to.
        </p>
      </div>

      {error && (
        <div className={`error-banner ${error.includes('offline') ? 'warning' : 'error'}`} role="alert">
          <span className="error-icon">{error.includes('offline') ? '⚠️' : '❌'}</span>
          {error}
          {error.includes('offline') && (
            <div className="error-details">
              The application will continue using cached data. Please check your network connection.
            </div>
          )}
        </div>
      )}

      <div className="object-selection-container">

        <div className="objects-grid-container">
          {/* Source Objects Section */}
          <div className="objects-section">
            <div className="search-section">
              <h5 className="section-title">
                Source Objects
                <div id="source-search-help" className="field-help">
                  Found {filteredSourceObjects.length} object{filteredSourceObjects.length !== 1 ? 's' : ''}
                  {sourceSearchTerm && ` matching "${sourceSearchTerm}"`}
                </div>
              </h5>
              <Input
                type="text"
                id="source-object-search"
                name="sourceSearch"
                label="Search Source Objects"
                value={sourceSearchTerm}
                onChange={setSourceSearchTerm}
                placeholder="Search source objects..."
                aria-describedby="source-search-help"
              />

            </div>
            <div className="objects-list" role="radiogroup" aria-labelledby="step3-heading">
              {filteredSourceObjects.length === 0 ? (
                <div className="no-objects">
                  <p>No source objects found matching your search criteria.</p>
                  <Button
                    variant="outline"
                    onClick={() => setSourceSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                filteredSourceObjects.map((object) => (
                  <ExpandableObjectCard
                    key={`source-${object.name}`}
                    object={object}
                    isSelected={sourceObject === object.name}
                    isExpanded={expandedObjects.has(object.name)}
                    onSelect={(objectName) => handleObjectSelect(objectName, 'source')}
                    onToggleExpand={toggleObjectExpansion}
                    onKeyDown={(event, objectName) => handleKeyDown(event, objectName, 'source')}
                    isTarget={false}
                  />
                ))
              )}
            </div>
          </div>

          {/* Target Objects Section */}
          <div className="objects-section">
            <div className="search-section">
              <h5 className="section-title">Target Objects
                <div id="target-search-help" className="field-help">
                  Found {filteredTargetObjects.length} object{filteredTargetObjects.length !== 1 ? 's' : ''}
                  {targetSearchTerm && ` matching "${targetSearchTerm}"`}
                </div>
              </h5>
              <Input
                type="text"
                id="target-object-search"
                name="targetSearch"
                label="Search Target Objects"
                value={targetSearchTerm}
                onChange={setTargetSearchTerm}
                placeholder="Search target objects..."
                aria-describedby="target-search-help"
              />
            </div>
            <div className="objects-list" role="radiogroup" aria-labelledby="step3-heading">
              {filteredTargetObjects.length === 0 ? (
                <div className="no-objects">
                  <p>No target objects found matching your search criteria.</p>
                  <Button
                    variant="outline"
                    onClick={() => setTargetSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                filteredTargetObjects.map((object) => (
                  <ExpandableObjectCard
                    key={`target-${object.name}`}
                    object={object}
                    isSelected={targetObject === object.name}
                    isExpanded={expandedObjects.has(object.name)}
                    onSelect={(objectName) => handleObjectSelect(objectName, 'target')}
                    onToggleExpand={toggleObjectExpansion}
                    onKeyDown={(event, objectName) => handleKeyDown(event, objectName, 'target')}
                    isTarget={true}
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

        <div id="next-help" className="button-help">
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
  isTarget?: boolean;
}

const ExpandableObjectCard: React.FC<ExpandableObjectCardProps> = ({
  object,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onKeyDown,
  isTarget = false
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
    <div className={`object-card ${isSelected ? 'selected' : ''} ${object.isCustom ? 'custom' : ''} ${isTarget ? 'target' : 'source'}`}>
      <div className="object-header">
        <div
          className="expand-toggle"
          onClick={handleExpandToggle}
          onKeyDown={handleExpandKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${object.label}`}
        >
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
        </div>
        <div
          className="object-clickable-area"
          onClick={() => onSelect(object.name)}
          onKeyDown={(e) => onKeyDown(e, object.name)}
          role="radio"
          aria-checked={isSelected}
          tabIndex={0}
        >
          <div className="object-icon">
            {getObjectIcon(object.name, object.isCustom)}
          </div>
          <div className="object-info">
            <h3 className="object-label">
              {object.label}
              {object.isCustom && <span className="custom-indicator">Custom</span>}
            </h3>
            <div className="object-name">{object.name}</div>
          </div>
          <div className="selection-indicator">
            {isSelected && (
              <span className="selected-icon" aria-hidden="true">✓</span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="object-details">
          <div className="object-description">{object.description}</div>
          <div className="object-metadata">
            <div className="metadata-item">
              <span className="metadata-label">API Name:</span>
              <span className="metadata-value">{object.name}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Type:</span>
              <span className="metadata-value">{object.isCustom ? 'Custom' : 'Standard'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Queryable:</span>
              <span className="metadata-value">Yes</span>
            </div>
          </div>
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

