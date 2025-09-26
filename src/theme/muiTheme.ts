import { createTheme } from '@mui/material/styles';

// Create a custom MUI theme that integrates with our existing CSS variables
export const createMuiTheme = (isDark: boolean = false) => {
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#007bff',
        light: '#4dabf7',
        dark: '#0056b3',
      },
      secondary: {
        main: '#6c757d',
        light: '#adb5bd',
        dark: '#495057',
      },
      background: {
        default: isDark ? '#212529' : '#ffffff',
        paper: isDark ? '#343a40' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#212529',
        secondary: isDark ? '#adb5bd' : '#6c757d',
      },
      divider: isDark ? '#495057' : '#dee2e6',
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      },
    },
    typography: {
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
      '0 0.25rem 0.5rem rgba(0, 0, 0, 0.1)',
      '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      '0 1rem 3rem rgba(0, 0, 0, 0.175)',
      '0 0.25rem 0.5rem rgba(0, 0, 0, 0.1)',
      '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      '0 1rem 3rem rgba(0, 0, 0, 0.175)',
      '0 2rem 6rem rgba(0, 0, 0, 0.2)',
      '0 0.25rem 0.5rem rgba(0, 0, 0, 0.1)',
      '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      '0 1rem 3rem rgba(0, 0, 0, 0.175)',
      '0 2rem 6rem rgba(0, 0, 0, 0.2)',
      '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      '0 1rem 3rem rgba(0, 0, 0, 0.175)',
      '0 2rem 6rem rgba(0, 0, 0, 0.2)',
      '0 3rem 9rem rgba(0, 0, 0, 0.25)',
      '0 2rem 6rem rgba(0, 0, 0, 0.2)',
      '0 3rem 9rem rgba(0, 0, 0, 0.25)',
      '0 4rem 12rem rgba(0, 0, 0, 0.3)',
      '0 3rem 9rem rgba(0, 0, 0, 0.25)',
      '0 4rem 12rem rgba(0, 0, 0, 0.3)',
      '0 5rem 15rem rgba(0, 0, 0, 0.35)',
      '0 4rem 12rem rgba(0, 0, 0, 0.3)',
      '0 5rem 15rem rgba(0, 0, 0, 0.35)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDark ? '#495057' : '#f1f3f5',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#6c757d' : '#adb5bd',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: isDark ? '#adb5bd' : '#6c757d',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '8px',
            padding: '8px 16px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: isDark
              ? '0 0.25rem 0.5rem rgba(0, 0, 0, 0.3)'
              : '0 0.25rem 0.5rem rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  });
};