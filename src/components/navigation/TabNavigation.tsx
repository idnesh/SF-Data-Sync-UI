import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Tab, Box, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SyncIcon from '@mui/icons-material/Sync';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import WorkIcon from '@mui/icons-material/Work';

// Types
interface TabConfig {
  id: string;
  label: string;
  route: string;
  icon: React.ReactElement;
}

interface TabNavigationProps {
  className?: string;
}

// Styled components
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  minHeight: '60px',
  '& .MuiTabs-indicator': {
    height: '3px',
    borderRadius: '2px 2px 0 0',
    background: 'linear-gradient(90deg, #007bff 0%, #4dabf7 100%)',
  },
  '& .MuiTabs-flexContainer': {
    maxWidth: '1200px',
    margin: '0 auto',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 120,
  minHeight: '60px',
  fontWeight: 500,
  fontSize: '0.95rem',
  color: theme.palette.text.secondary,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  '& .MuiTab-iconWrapper': {
    marginBottom: '4px',
  },
  [theme.breakpoints.down('md')]: {
    minWidth: 100,
    fontSize: '0.9rem',
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 80,
    fontSize: '0.85rem',
    '& .MuiTab-iconWrapper': {
      marginBottom: '2px',
    },
  },
}));

const TabContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  top: '80px',
  zIndex: 100,
  boxShadow: theme.shadows[1],
  [theme.breakpoints.down('sm')]: {
    top: '70px',
  },
}));

// Tab configuration with MUI icons
const tabs: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    icon: <DashboardIcon />
  },
  {
    id: 'data-sync',
    label: 'Data Sync',
    route: '/create-job',
    icon: <SyncIcon />
  },
  {
    id: 'data-quality',
    label: 'Data Quality',
    route: '/data-cleansing',
    icon: <CleaningServicesIcon />
  },
  {
    id: 'job-details',
    label: 'Job Details',
    route: '/jobs',
    icon: <WorkIcon />
  }
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get current tab index based on location
  const getCurrentTabIndex = (): number => {
    const currentTab = tabs.findIndex(tab => tab.route === location.pathname);
    return currentTab !== -1 ? currentTab : 0;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const selectedTab = tabs[newValue];
    if (selectedTab) {
      navigate(selectedTab.route);
    }
  };

  return (
    <TabContainer className={className}>
      <Box sx={{
        px: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        justifyContent: 'center'
      }}>
        <StyledTabs
          value={getCurrentTabIndex()}
          onChange={handleTabChange}
          aria-label="Main navigation tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
        >
          {tabs.map((tab) => (
            <StyledTab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              id={`tab-${tab.id}`}
              aria-controls={`tabpanel-${tab.id}`}
              iconPosition="top"
            />
          ))}
        </StyledTabs>
      </Box>
    </TabContainer>
  );
};

export type { TabConfig, TabNavigationProps };