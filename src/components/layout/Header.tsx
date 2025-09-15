import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Salesforce Data Synchronization Platform",
  subtitle
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleTitleClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1
          className="header-title clickable"
          onClick={handleTitleClick}
          style={{ cursor: 'pointer' }}
          title="Go to Dashboard"
        >
          {title}
        </h1>
        <p className="header-subtitle">
          {subtitle || `Welcome back, ${user?.fullName}`}
        </p>
      </div>
      <div className="header-buttons">
        <Button variant="outline" onClick={handleSettingsClick}>
          Settings
        </Button>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
};