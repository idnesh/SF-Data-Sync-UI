import React, { useState, useEffect } from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  showPasswordStrength?: boolean;
  validate?: (value: string) => string | null;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  error,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  showPasswordStrength = false,
  validate
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Real-time validation
  useEffect(() => {
    if (validate && value && !isFocused) {
      const validationError = validate(value);
      setLocalError(validationError);
    }
  }, [value, validate, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalError(null);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
    if (validate && value) {
      const validationError = validate(value);
      setLocalError(validationError);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (localError) {
      setLocalError(null);
    }
  };

  const displayError = error || localError;
  const hasError = Boolean(displayError);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Password strength calculation
  const getPasswordStrength = () => {
    if (type !== 'password' || !value) return null;

    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[@$!%*?&]/.test(value)) score++;

    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] || 'Very Weak';
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745'];

    return { strength, score, color: colors[score] || colors[0] };
  };

  const passwordStrength = showPasswordStrength ? getPasswordStrength() : null;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        <input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`form-input ${hasError ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />

        {type === 'password' && value && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>

      {passwordStrength && showPasswordStrength && (
        <div className="password-strength">
          <div className="strength-bar">
            <div
              className="strength-fill"
              style={{
                width: `${(passwordStrength.score / 5) * 100}%`,
                backgroundColor: passwordStrength.color
              }}
            />
          </div>
          <span className="strength-text" style={{ color: passwordStrength.color }}>
            {passwordStrength.strength}
          </span>
        </div>
      )}

      {displayError && (
        <div id={`${id}-error`} className="error-message" role="alert">
          {displayError}
        </div>
      )}
    </div>
  );
};