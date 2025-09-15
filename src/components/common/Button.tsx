import React from 'react';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  onClick,
  className = '',
  id,
  'aria-label': ariaLabel,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const fullWidthClass = fullWidth ? 'btn-full-width' : '';
  const disabledClass = disabled || loading ? 'btn-disabled' : '';
  const loadingClass = loading ? 'btn-loading' : '';

  const combinedClassName = [
    baseClasses,
    variantClass,
    sizeClass,
    fullWidthClass,
    disabledClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      id={id}
      className={combinedClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
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
        </span>
      )}
      <span className={loading ? 'btn-text-loading' : 'btn-text'}>
        {children}
      </span>
    </button>
  );
};