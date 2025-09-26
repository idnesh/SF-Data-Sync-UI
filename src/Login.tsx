import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Input } from './components/common/Input'
import { Button } from './components/common/Button'
import { validateFieldRealTime } from './utils/validation'
import { FEATURE_FLAGS } from './utils/constants'
import './App.css'

function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect to home if login is disabled
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_LOGIN) {
      navigate('/');
    }
  }, [navigate]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate field on blur
    const errorMessage = validateFieldRealTime(field, formData[field as keyof typeof formData], formData);
    if (errorMessage) {
      setFieldErrors(prev => ({ ...prev, [field]: errorMessage }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const errorMessage = validateFieldRealTime(field, formData[field as keyof typeof formData], formData);
      if (errorMessage) {
        errors[field] = errorMessage;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({ email: true, password: true });
      return;
    }

    const success = await login(formData.email, formData.password);
    if (success) {
      navigate('/dashboard');
    }
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="auth-page-layout">
      <header className="App-header fixed-header">
        <div className="header-left">
          <div className="header-brand">
            <img
              src="/Relanto.png"
              alt="Relanto Logo"
              className="header-logo"
            />
            <h1>R-DataX</h1>
          </div>
          <p>Login to your account</p>
        </div>
        <div className="header-buttons">
          <button className="btn btn-secondary" onClick={goBack}>Back</button>
        </div>
      </header>
      <main className="scrollable-content">
        <div className="login-container">
          <h2>Welcome Back</h2>
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              type="email"
              id="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={(value) => handleFieldChange('email', value)}
              onBlur={() => handleFieldBlur('email')}
              error={touched.email ? fieldErrors.email : undefined}
              required
              autoComplete="email"
              placeholder="Enter your email address"
            />

            <Input
              type="password"
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={(value) => handleFieldChange('password', value)}
              onBlur={() => handleFieldBlur('password')}
              error={touched.password ? fieldErrors.password : undefined}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="primary"
              size="medium"
              fullWidth
              loading={isLoading}
              disabled={isLoading || Object.keys(fieldErrors).some(key => fieldErrors[key])}
            >
              {isLoading ? 'Signing In...' : 'Login'}
            </Button>
          </form>
          <p className="auth-link">
            Don't have an account? <button
              type="button"
              className="link-button"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login