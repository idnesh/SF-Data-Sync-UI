// Storybook stories for Job Creation Wizard
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import { JobWizard } from '../JobWizard';
import { Step1Details } from '../steps/Step1Details';
import { Step2Connections } from '../steps/Step2Connections';
import { Step3ObjectSelection } from '../steps/Step3ObjectSelection';
import { ConnectionData, Environment } from '../types';

// Wrapper for components that need routing context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        {children}
      </div>
    </AuthProvider>
  </BrowserRouter>
);

// Job Wizard Stories
const meta: Meta<typeof JobWizard> = {
  title: 'Features/Create Job/JobWizard',
  component: JobWizard,
  decorators: [
    (Story) => (
      <RouterWrapper>
        <Story />
      </RouterWrapper>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete 5-Step job creation wizard for Salesforce data synchronization.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default state of the job creation wizard starting at step 1.',
      },
    },
  },
};

// Step 1 Stories
const step1Meta: Meta<typeof Step1Details> = {
  title: 'Features/Create Job/Steps/Step1Details',
  component: Step1Details,
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onUpdate: (name: string, description?: string) => {
      console.log('Job updated:', { name, description });
    },
    onNext: () => console.log('Next step'),
    isLoading: false,
  },
};

export const Step1Empty: StoryObj<typeof Step1Details> = {
  ...step1Meta,
  args: {
    jobName: '',
    jobDescription: '',
    onUpdate: step1Meta.args!.onUpdate,
    onNext: step1Meta.args!.onNext,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty step 1 form for job details input.',
      },
    },
  },
};

export const Step1WithData: StoryObj<typeof Step1Details> = {
  ...step1Meta,
  args: {
    jobName: 'Account Sync - Production to Sandbox',
    jobDescription: 'Daily synchronization of Account records from production to sandbox environment for testing purposes.',
    onUpdate: step1Meta.args!.onUpdate,
    onNext: step1Meta.args!.onNext,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 1 form pre-filled with job data.',
      },
    },
  },
};

export const Step1Loading: StoryObj<typeof Step1Details> = {
  ...step1Meta,
  args: {
    jobName: 'Simulate',
    jobDescription: '',
    onUpdate: step1Meta.args!.onUpdate,
    onNext: step1Meta.args!.onNext,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 1 in loading state.',
      },
    },
  },
};

// Step 2 Stories
const step2Meta: Meta<typeof Step2Connections> = {
  title: 'Features/Create Job/Steps/Step2Connections',
  component: Step2Connections,
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onConnect: async (type: 'source' | 'target', connectionData: any) => {
      console.log('Connect:', type, connectionData);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
    onNext: () => console.log('Next step'),
    onPrevious: () => console.log('Previous step'),
    isLoading: false,
    error: null,
  },
};

const emptyConnection: ConnectionData = {
  username: '',
  password: '',
  securityToken: '',
  environment: 'production' as Environment,
  isConnected: false,
};

const connectedSourceConnection: ConnectionData = {
  username: 'admin@company.com',
  password: '********',
  securityToken: '',
  environment: 'production' as Environment,
  isConnected: true,
  orgName: 'Production Org (ABC Corp)',
  connectionTimestamp: new Date().toISOString(),
};

const failedConnection: ConnectionData = {
  username: 'invalid@company.com',
  password: '********',
  securityToken: '',
  environment: 'sandbox' as Environment,
  isConnected: false,
  connectionError: 'Invalid credentials. Please check your username and password.',
};

export const Step2Empty: StoryObj<typeof Step2Connections> = {
  ...step2Meta,
  args: {
    sourceConnection: emptyConnection,
    targetConnection: { ...emptyConnection, environment: 'sandbox' as Environment },
    onConnect: step2Meta.args!.onConnect,
    onNext: step2Meta.args!.onNext,
    onPrevious: step2Meta.args!.onPrevious,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty connections form ready for user input.',
      },
    },
  },
};

export const Step2PartiallyConnected: StoryObj<typeof Step2Connections> = {
  ...step2Meta,
  args: {
    sourceConnection: connectedSourceConnection,
    targetConnection: { ...emptyConnection, environment: 'sandbox' as Environment },
    onConnect: step2Meta.args!.onConnect,
    onNext: step2Meta.args!.onNext,
    onPrevious: step2Meta.args!.onPrevious,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'One connection successful, one pending.',
      },
    },
  },
};

export const Step2FullyConnected: StoryObj<typeof Step2Connections> = {
  ...step2Meta,
  args: {
    sourceConnection: connectedSourceConnection,
    targetConnection: {
      ...connectedSourceConnection,
      environment: 'sandbox' as Environment,
      orgName: 'Full Sandbox (ABC Corp)',
    },
    onConnect: step2Meta.args!.onConnect,
    onNext: step2Meta.args!.onNext,
    onPrevious: step2Meta.args!.onPrevious,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Both connections successful, ready to proceed.',
      },
    },
  },
};

export const Step2WithError: StoryObj<typeof Step2Connections> = {
  ...step2Meta,
  args: {
    sourceConnection: connectedSourceConnection,
    targetConnection: failedConnection,
    onConnect: step2Meta.args!.onConnect,
    onNext: step2Meta.args!.onNext,
    onPrevious: step2Meta.args!.onPrevious,
    isLoading: false,
    error: 'Connection failed. Please check your credentials and try again.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Connection failure with error message and suggestions.',
      },
    },
  },
};

// Step 3 Stories
const step3Meta: Meta<typeof Step3ObjectSelection> = {
  title: 'Features/Create Job/Steps/Step3ObjectSelection',
  component: Step3ObjectSelection,
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onSelectObject: (objectName: string) => console.log('Selected object:', objectName),
    onNext: () => console.log('Next step'),
    onPrevious: () => console.log('Previous step'),
    isLoading: false,
  },
};

export const Step3Empty: StoryObj<typeof Step3ObjectSelection> = {
  ...step3Meta,
  args: {
    selectedObject: '',
    onSelectObject: step3Meta.args!.onSelectObject,
    onNext: step3Meta.args!.onNext,
    onPrevious: step3Meta.args!.onPrevious,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Object selection grid with no selection made.',
      },
    },
  },
};

export const Step3WithSelection: StoryObj<typeof Step3ObjectSelection> = {
  ...step3Meta,
  args: {
    selectedObject: 'Account',
    onSelectObject: step3Meta.args!.onSelectObject,
    onNext: step3Meta.args!.onNext,
    onPrevious: step3Meta.args!.onPrevious,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Object selection with Account object selected.',
      },
    },
  },
};

// Playground for interactive testing
export const InteractiveWizard: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive version of the wizard for testing user flows. Try navigating through the steps and testing various scenarios.',
      },
    },
  },
};

// TODO: Add more stories for remaining steps when implemented
// TODO: Add stories for error states and edge cases
// TODO: Add stories for mobile responsive views
// TODO: Add stories for accessibility testing scenarios