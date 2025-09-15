// Unit tests for Step1Details component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1Details } from '../steps/Step1Details';

// Mock the Input component
jest.mock('../../../components/common/Input', () => ({
  Input: ({
    label,
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    required
  }: any) => (
    <div>
      <label>{label} {required && '*'}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        data-testid={label?.toLowerCase().replace(/\s+/g, '-')}
      />
      {error && <div role="alert">{error}</div>}
    </div>
  )
}));

// Mock the Button component
jest.mock('../../../components/common/Button', () => ({
  Button: ({ children, onClick, disabled, loading, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      data-testid="continue-button"
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}));

describe('Step1Details', () => {
  const defaultProps = {
    jobName: '',
    jobDescription: '',
    onUpdate: jest.fn(),
    onNext: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Step1Details {...defaultProps} />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Job Details')).toBeInTheDocument();
      expect(screen.getByTestId('job-name')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeInTheDocument();
    });

    it('should render with existing job data', () => {
      render(
        <Step1Details
          {...defaultProps}
          jobName="Existing Job"
          jobDescription="Existing description"
        />
      );

      expect(screen.getByDisplayValue('Existing Job')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<Step1Details {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate job name on blur', async () => {
      const user = userEvent.setup();
      render(<Step1Details {...defaultProps} />);

      const nameInput = screen.getByTestId('job-name');

      // Enter invalid name (too short)
      await user.type(nameInput, 'AB');
      await user.tab(); // Trigger blur

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Job name must be at least 3 characters'
      );
    });

    it('should validate empty job name', async () => {
      const user = userEvent.setup();
      render(<Step1Details {...defaultProps} />);

      const nameInput = screen.getByTestId('job-name');

      // Focus and blur without entering text
      await user.click(nameInput);
      await user.tab();

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Job name is required'
      );
    });

    it('should validate job name length', async () => {
      const user = userEvent.setup();
      render(<Step1Details {...defaultProps} />);

      const nameInput = screen.getByTestId('job-name');

      // Enter name that's too long
      const longName = 'A'.repeat(121);
      await user.type(nameInput, longName);
      await user.tab();

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Job name must be less than 120 characters'
      );
    });

    it('should validate whitespace in job name', async () => {
      const user = userEvent.setup();
      render(<Step1Details {...defaultProps} />);

      const nameInput = screen.getByTestId('job-name');

      // Enter name with leading/trailing whitespace
      await user.type(nameInput, '  Valid Name  ');
      await user.tab();

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Job name cannot have leading or trailing whitespace'
      );
    });

    it('should show character count for description', () => {
      render(<Step1Details {...defaultProps} />);

      expect(screen.getByText('0/1000 characters')).toBeInTheDocument();
    });

    it('should update character count as user types description', async () => {
      const user = userEvent.setup();
      render(<Step1Details {...defaultProps} />);

      const descriptionTextarea = screen.getByRole('textbox', { name: /description/i });

      await user.type(descriptionTextarea, 'Test description');

      expect(screen.getByText('16/1000 characters')).toBeInTheDocument();
    });

    it('should warn when description approaches limit', async () => {
      const user = userEvent.setup();
      render(<Step1Details {...defaultProps} />);

      const descriptionTextarea = screen.getByRole('textbox', { name: /description/i });
      const longDescription = 'A'.repeat(950);

      await user.type(descriptionTextarea, longDescription);

      const characterCount = screen.getByText('950/1000 characters');
      expect(characterCount).toHaveClass('warning');
    });
  });

  describe('User Interactions', () => {
    it('should call onUpdate when job name changes', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      render(<Step1Details {...defaultProps} onUpdate={onUpdate} />);

      const nameInput = screen.getByTestId('job-name');

      await user.type(nameInput, 'New Job Name');

      // onUpdate should be called for each character typed
      expect(onUpdate).toHaveBeenCalledWith('New Job Name', '');
    });

    it('should call onUpdate when description changes', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      render(<Step1Details {...defaultProps} onUpdate={onUpdate} />);

      const descriptionTextarea = screen.getByRole('textbox', { name: /description/i });

      await user.type(descriptionTextarea, 'New description');

      expect(onUpdate).toHaveBeenCalledWith('', 'New description');
    });

    it('should disable continue button when name is invalid', () => {
      render(<Step1Details {...defaultProps} jobName="AB" />);

      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toBeDisabled();
    });

    it('should enable continue button when name is valid', () => {
      render(<Step1Details {...defaultProps} jobName="Valid Job Name" />);

      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).not.toBeDisabled();
    });

    it('should call onNext when form is submitted with valid data', async () => {
      const user = userEvent.setup();
      const onNext = jest.fn();
      render(
        <Step1Details
          {...defaultProps}
          jobName="Valid Job Name"
          onNext={onNext}
        />
      );

      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);

      expect(onNext).toHaveBeenCalled();
    });

    it('should not call onNext when form is submitted with invalid data', async () => {
      const user = userEvent.setup();
      const onNext = jest.fn();
      render(<Step1Details {...defaultProps} jobName="AB" onNext={onNext} />);

      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);

      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Step1Details {...defaultProps} />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-labelledby', 'step1-heading');
      expect(screen.getByTestId('job-name')).toHaveAttribute('aria-describedby', 'job-name-help');
    });

    it('should announce draft saving', () => {
      render(<Step1Details {...defaultProps} />);

      const draftIndicator = screen.getByText('Changes are automatically saved as draft').closest('div');
      expect(draftIndicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide helpful button descriptions', () => {
      render(<Step1Details {...defaultProps} />);

      expect(screen.getByText('Enter a job name to continue')).toBeInTheDocument();
    });
  });
});

// TODO: Add E2E tests with Cypress/Playwright
// TODO: Add tests for form submission behavior
// TODO: Add tests for keyboard navigation
// TODO: Add visual regression tests