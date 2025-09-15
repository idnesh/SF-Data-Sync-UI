// Step 3: Salesforce Object Selection Component
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { SalesforceObject } from '../types';
import { mockSalesforceAPI, MOCK_OBJECTS } from '../api/mockAPI';

interface Step3ObjectSelectionProps {
  selectedObject: string;
  onSelectObject: (objectName: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
}

export const Step3ObjectSelection: React.FC<Step3ObjectSelectionProps> = ({
  selectedObject,
  onSelectObject,
  onNext,
  onPrevious,
  isLoading
}) => {
  const [objects, setObjects] = useState<SalesforceObject[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedObjectDetails, setSelectedObjectDetails] = useState<SalesforceObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Salesforce objects on mount
  useEffect(() => {
    const loadObjects = async () => {
      setLoadingObjects(true);
      setError(null);

      try {
        // TODO: Integrate with backend API
        const response = await mockSalesforceAPI.listObjects({
          connectionId: 'source' // In real implementation, use actual connection ID
        });

        if (response.success) {
          setObjects(response.objects);
        } else {
          setError(response.error || 'Failed to load Salesforce objects');
          // Fallback to mock data
          setObjects(MOCK_OBJECTS);
        }
      } catch (err) {
        console.error('Error loading objects:', err);
        setError('Network error occurred while loading objects');
        // Fallback to mock data
        setObjects(MOCK_OBJECTS);
      } finally {
        setLoadingObjects(false);
      }
    };

    loadObjects();
  }, []);

  // Set selected object details when selection changes
  useEffect(() => {
    if (selectedObject) {
      const objectDetails = objects.find(obj => obj.name === selectedObject);
      setSelectedObjectDetails(objectDetails || null);
    } else {
      setSelectedObjectDetails(null);
    }
  }, [selectedObject, objects]);

  // Filter objects based on search term
  const filteredObjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return objects;
    }

    const term = searchTerm.toLowerCase();
    return objects.filter(obj =>
      obj.name.toLowerCase().includes(term) ||
      obj.label.toLowerCase().includes(term) ||
      obj.description?.toLowerCase().includes(term)
    );
  }, [objects, searchTerm]);

  const handleObjectSelect = (objectName: string) => {
    onSelectObject(objectName);
  };

  const handleKeyDown = (event: React.KeyboardEvent, objectName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleObjectSelect(objectName);
    }
  };

  const canProceed = Boolean(selectedObject);

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
        <h2 id="step3-heading" className="step-title">Object Selection</h2>
        <p className="step-description">
          Choose the Salesforce object you want to synchronize. You can search by object name or label.
        </p>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="object-selection-container">
        {/* Search */}
        <div className="search-section">
          <Input
            type="text"
            id="object-search"
            name="search"
            label="Search Objects"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by object name or label..."
            aria-describedby="search-help"
          />
          <div id="search-help" className="field-help">
            Found {filteredObjects.length} object{filteredObjects.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>

        <div className="objects-grid-container">
          {/* Objects Grid */}
          <div className="objects-grid" role="radiogroup" aria-labelledby="step3-heading">
            {filteredObjects.length === 0 ? (
              <div className="no-objects">
                <p>No objects found matching your search criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              filteredObjects.map((object) => (
                <div
                  key={object.name}
                  className={`object-card ${selectedObject === object.name ? 'selected' : ''}`}
                  onClick={() => handleObjectSelect(object.name)}
                  onKeyDown={(e) => handleKeyDown(e, object.name)}
                  role="radio"
                  aria-checked={selectedObject === object.name}
                  tabIndex={0}
                  aria-describedby={`object-${object.name}-details`}
                >
                  <div className="object-header">
                    <div className="object-icon">
                      {getObjectIcon(object.name)}
                    </div>
                    <div className="object-info">
                      <h3 className="object-label">{object.label}</h3>
                      <div className="object-name">{object.name}</div>
                    </div>
                    <div className="selection-indicator">
                      {selectedObject === object.name && (
                        <span className="selected-icon" aria-hidden="true">✓</span>
                      )}
                    </div>
                  </div>

                  <div id={`object-${object.name}-details`} className="object-details">
                    <div className="field-count">
                      <span className="count-number">{object.fieldCount}</span>
                      <span className="count-label">fields</span>
                    </div>
                    {object.description && (
                      <div className="object-description">{object.description}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Object Details */}
          {selectedObjectDetails && (
            <div className="selected-object-details" aria-live="polite">
              <h3>Selected Object: {selectedObjectDetails.label}</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">API Name:</span>
                  <span className="detail-value">{selectedObjectDetails.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Field Count:</span>
                  <span className="detail-value">{selectedObjectDetails.fieldCount} fields</span>
                </div>
                {selectedObjectDetails.description && (
                  <div className="detail-item">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{selectedObjectDetails.description}</span>
                  </div>
                )}
              </div>

              <div className="preview-note">
                <span className="info-icon">ℹ️</span>
                <span>Field mapping and configuration will be available in the next step.</span>
              </div>
            </div>
          )}
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
          {!canProceed && 'Please select a Salesforce object to continue'}
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon for object type
function getObjectIcon(objectName: string): string {
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