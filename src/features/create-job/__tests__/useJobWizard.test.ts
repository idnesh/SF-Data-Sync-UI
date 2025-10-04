// Unit tests for useJobWizard hook
import { renderHook, act } from '@testing-library/react';
import { useJobWizard } from '../hooks/useJobWizard';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock API calls
jest.mock('../api/mockAPI', () => ({
  mockSalesforceAPI: {
    connectOrg: jest.fn(),
    listObjects: jest.fn(),
    getFields: jest.fn(),
    validateFields: jest.fn(),
  },
  mockJobsAPI: {
    testJob: jest.fn(),
    createJob: jest.fn(),
  },
}));

describe('useJobWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useJobWizard());

      expect(result.current.currentStep).toBe(1);
      expect(result.current.jobData.name).toBe('');
      expect(result.current.jobData.description).toBe('');
      expect(result.current.steps).toHaveLength(6);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isDirty).toBe(false);
    });

    it('should restore state from localStorage', () => {
      const savedState = JSON.stringify({
        currentStep: 3,
        jobData: {
          name: 'Simulate',
          description: 'Test Description'
        }
      });
      mockLocalStorage.getItem.mockReturnValue(savedState);

      const { result } = renderHook(() => useJobWizard());

      expect(result.current.currentStep).toBe(3);
      expect(result.current.jobData.name).toBe('Simulate');
      expect(result.current.jobData.description).toBe('Test Description');
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next step', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStep).toBe(2);
      expect(result.current.steps[1].isActive).toBe(true);
      expect(result.current.steps[0].isActive).toBe(false);
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.goToStep(3);
      });

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should not allow navigation to invalid step numbers', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.goToStep(0);
      });

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.goToStep(10);
      });

      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('Job Details', () => {
    it('should update job details', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.updateJobDetails('My Simulate', 'Job description');
      });

      expect(result.current.jobData.name).toBe('My Simulate');
      expect(result.current.jobData.description).toBe('Job description');
      expect(result.current.isDirty).toBe(true);
    });

    it('should mark step as completed when name is valid', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.updateJobDetails('Valid Job Name');
      });

      expect(result.current.steps[0].isCompleted).toBe(true);
      expect(result.current.steps[0].hasErrors).toBe(false);
    });

    it('should mark step as having errors when name is too short', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.updateJobDetails('AB'); // Less than 3 characters
      });

      expect(result.current.steps[0].isCompleted).toBe(false);
      expect(result.current.steps[0].hasErrors).toBe(true);
    });
  });

  describe('Object Selection', () => {
    it('should select object and mark step completed', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.selectObject('Account');
      });

      expect(result.current.jobData.selectedObject).toBe('Account');
      expect(result.current.steps[2].isCompleted).toBe(true);
      expect(result.current.steps[2].hasErrors).toBe(false);
    });
  });

  describe('Field Mappings', () => {
    it('should update field mappings', () => {
      const { result } = renderHook(() => useJobWizard());

      const mappings = { 'Name': 'Name', 'Email': 'Email' };
      const transformations = {};
      const selectedFields = ['Name', 'Email'];

      act(() => {
        result.current.updateFieldMappings(mappings, transformations, selectedFields, false);
      });

      expect(result.current.jobData.fieldMappings).toEqual(mappings);
      expect(result.current.jobData.selectedFields).toEqual(selectedFields);
      expect(result.current.jobData.syncAllFields).toBe(false);
      expect(result.current.steps[3].isCompleted).toBe(true);
    });

    it('should mark step as having errors when no mappings provided', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.updateFieldMappings({}, {}, [], true);
      });

      expect(result.current.steps[3].isCompleted).toBe(false);
      expect(result.current.steps[3].hasErrors).toBe(true);
    });
  });

  describe('Draft Management', () => {
    it('should save draft to localStorage', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.updateJobDetails('Simulate');
        result.current.saveAsDraft();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'job-wizard-draft',
        expect.stringContaining('Simulate')
      );
    });

    it('should clear draft from localStorage', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.clearDraft();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('job-wizard-draft');
      expect(result.current.currentStep).toBe(1);
      expect(result.current.jobData.name).toBe('');
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useJobWizard());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });
});

// TODO: Add integration tests for API calls
// TODO: Add tests for connection functionality
// TODO: Add tests for validation functionality
// TODO: Add tests for job testing and creation