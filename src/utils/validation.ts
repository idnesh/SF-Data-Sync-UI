import { ValidationRule, FieldError } from './types';

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation regex (at least 8 chars, upper, lower, number, symbol)
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Validation rules for authentication
export const authValidationRules = {
  email: {
    required: true,
    pattern: EMAIL_REGEX,
    message: "Please enter a valid email address"
  },
  password: {
    required: true,
    minLength: 8,
    pattern: PASSWORD_REGEX,
    message: "Password must be at least 8 characters with uppercase, lowercase, number, and symbol"
  },
  confirmPassword: {
    required: true,
    message: "Passwords must match"
  },
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: "Full name is required (2-50 characters)"
  }
};

// Generic validation function
export const validateField = (
  value: string,
  rule: ValidationRule,
  matchValue?: string
): FieldError | null => {
  // Required validation
  if (rule.required && (!value || value.trim().length === 0)) {
    return { field: '', message: rule.message };
  }

  // Skip other validations if field is empty and not required
  if (!value && !rule.required) {
    return null;
  }

  // Length validations
  if (rule.minLength && value.length < rule.minLength) {
    return { field: '', message: rule.message };
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return { field: '', message: rule.message };
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    return { field: '', message: rule.message };
  }

  // Match validation (for confirm password)
  if (matchValue !== undefined && value !== matchValue) {
    return { field: '', message: rule.message };
  }

  // Custom validation
  if (rule.custom && !rule.custom(value)) {
    return { field: '', message: rule.message };
  }

  return null;
};

// Validate entire form
export const validateForm = (
  formData: Record<string, string>,
  validationRules: Record<string, ValidationRule>
): FieldError[] => {
  const errors: FieldError[] = [];

  Object.keys(validationRules).forEach(fieldName => {
    const value = formData[fieldName] || '';
    const rule = validationRules[fieldName];

    // Special handling for confirmPassword
    let matchValue: string | undefined;
    if (fieldName === 'confirmPassword') {
      matchValue = formData.password;
    }

    const error = validateField(value, rule, matchValue);
    if (error) {
      errors.push({ field: fieldName, message: error.message });
    }
  });

  return errors;
};

// Real-time validation for individual fields
export const validateFieldRealTime = (
  fieldName: string,
  value: string,
  formData: Record<string, string>
): string | null => {
  const rule = authValidationRules[fieldName as keyof typeof authValidationRules];
  if (!rule) return null;

  let matchValue: string | undefined;
  if (fieldName === 'confirmPassword') {
    matchValue = formData.password;
  }

  const error = validateField(value, rule, matchValue);
  return error ? error.message : null;
};

// Password strength indicator
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string;
  color: string;
} => {
  let score = 0;
  let feedback = '';

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  switch (score) {
    case 0-1:
      feedback = 'Very Weak';
      return { score, feedback, color: '#dc3545' };
    case 2:
      feedback = 'Weak';
      return { score, feedback, color: '#fd7e14' };
    case 3:
      feedback = 'Fair';
      return { score, feedback, color: '#ffc107' };
    case 4:
      feedback = 'Good';
      return { score, feedback, color: '#20c997' };
    case 5:
      feedback = 'Strong';
      return { score, feedback, color: '#28a745' };
    default:
      feedback = 'Weak';
      return { score, feedback, color: '#dc3545' };
  }
};

// Job validation rules (for future use)
export const jobValidationRules = {
  jobName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    message: "Job name is required (3-100 characters)"
  },
  jobDescription: {
    required: false,
    maxLength: 500,
    message: "Description must be less than 500 characters"
  },
  connectionRequired: {
    required: true,
    message: "Please select a connection"
  }
};