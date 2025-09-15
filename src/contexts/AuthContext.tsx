import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, SignupData } from '../utils/types';
import { SESSION_STORAGE_KEY, LAST_ACTIVITY_KEY, SESSION_TIMEOUT, USER_ROLES } from '../utils/constants';
import { validateForm, authValidationRules } from '../utils/validation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

        if (sessionData && lastActivity) {
          const parsedUser = JSON.parse(sessionData);
          const lastActivityTime = parseInt(lastActivity);
          const now = Date.now();

          // Check if session is still valid
          if (now - lastActivityTime < SESSION_TIMEOUT) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            // Update last activity
            localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
          } else {
            // Session expired
            clearSession();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity);
        const now = Date.now();

        if (now - lastActivityTime >= SESSION_TIMEOUT) {
          logout();
          setError('Your session has expired. Please log in again.');
        }
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Update last activity on user interaction
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [isAuthenticated]);

  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate input
      const formData = { email, password };
      const validationErrors = validateForm(formData, {
        email: authValidationRules.email,
        password: authValidationRules.password
      });

      if (validationErrors.length > 0) {
        setError(validationErrors[0].message);
        return false;
      }

      // Simulate API call - In real implementation, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user creation (accept any valid email/password)
      const mockUser: User = {
        id: 'user_' + Date.now(),
        email: email,
        fullName: email.split('@')[0], // Use email prefix as name
        role: USER_ROLES.INTEGRATION_MANAGER,
        createdAt: new Date().toISOString()
      };

      // Store session
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

      setUser(mockUser);
      setIsAuthenticated(true);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate input
      const validationErrors = validateForm(userData, authValidationRules);

      if (validationErrors.length > 0) {
        setError(validationErrors[0].message);
        return false;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock user creation
      const newUser: User = {
        id: 'user_' + Date.now(),
        email: userData.email,
        fullName: userData.fullName,
        role: USER_ROLES.INTEGRATION_MANAGER,
        createdAt: new Date().toISOString()
      };

      // Store session
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

      setUser(newUser);
      setIsAuthenticated(true);
      return true;

    } catch (error) {
      console.error('Signup error:', error);
      setError('Signup failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};