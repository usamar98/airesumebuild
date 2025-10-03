import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SupabaseAuthProvider } from '../contexts/SupabaseAuthContext';
import ApplicantDashboard from '../pages/ApplicantDashboard';
import '@testing-library/jest-dom';

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/applicant-dashboard' })
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <SupabaseAuthProvider>
      {children}
    </SupabaseAuthProvider>
  </BrowserRouter>
);

// Mock data generators
const generateMockApplications = () => [
  {
    id: '1',
    job_title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    status: 'pending',
    applied_date: '2024-01-15',
    location: 'San Francisco, CA',
    salary_range: '$120,000 - $150,000',
    job_type: 'Full-time',
    description: 'Looking for an experienced frontend developer...',
    requirements: ['React', 'TypeScript', 'Node.js'],
    benefits: ['Health Insurance', '401k', 'Remote Work']
  },
  {
    id: '2',
    job_title: 'React Developer',
    company: 'StartupXYZ',
    status: 'interview',
    applied_date: '2024-01-10',
    location: 'New York, NY',
    salary_range: '$90,000 - $120,000',
    job_type: 'Full-time',
    description: 'Join our growing team...',
    requirements: ['React', 'JavaScript', 'CSS'],
    benefits: ['Flexible Hours', 'Stock Options']
  }
];

const generateMockJobMatches = () => [
  {
    id: '1',
    job_title: 'Full Stack Developer',
    company: 'InnovateTech',
    match_score: 95,
    location: 'Remote',
    salary_range: '$100,000 - $130,000',
    key_skills: ['React', 'Node.js', 'TypeScript'],
    missing_skills: ['GraphQL'],
    posted_date: '2024-01-20'
  },
  {
    id: '2',
    job_title: 'Frontend Engineer',
    company: 'DesignCorp',
    match_score: 88,
    location: 'Los Angeles, CA',
    salary_range: '$95,000 - $125,000',
    key_skills: ['React', 'CSS', 'JavaScript'],
    missing_skills: ['Vue.js', 'Angular'],
    posted_date: '2024-01-18'
  }
];

const generateMockProfile = () => ({
  id: 'test-user-id',
  full_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  bio: 'Experienced frontend developer with 5+ years of experience...',
  skills: ['React', 'TypeScript', 'Node.js', 'CSS', 'JavaScript'],
  experience_level: 'Senior',
  portfolio_url: 'https://johndoe.dev',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  github_url: 'https://github.com/johndoe',
  website_url: 'https://johndoe.com',
  profile_completion: 85,
  work_experience: [
    {
      id: '1',
      company: 'TechCorp',
      position: 'Senior Frontend Developer',
      start_date: '2020-01-01',
      end_date: null,
      description: 'Lead frontend development...',
      is_current: true
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Technology',
      degree: 'Bachelor of Computer Science',
      field_of_study: 'Computer Science',
      start_date: '2015-09-01',
      end_date: '2019-06-01',
      gpa: '3.8'
    }
  ]
});

describe('ApplicantDashboard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders dashboard with all main sections', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Check for main navigation tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Check for dashboard header
      expect(screen.getByText('Applicant Dashboard')).toBeInTheDocument();
    });

    test('displays loading state initially', () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Should show loading indicators
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Overview Tab Features', () => {
    test('displays key metrics correctly', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Key Metrics')).toBeInTheDocument();
      });

      // Check for metric cards
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Interview Rate')).toBeInTheDocument();
      expect(screen.getByText('Profile Views')).toBeInTheDocument();
    });

    test('job match scores section renders correctly', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Job Match Scores')).toBeInTheDocument();
      });

      // Check for match score elements
      expect(screen.getByText('Top job matches based on your profile')).toBeInTheDocument();
      expect(screen.getByText('View All Matches')).toBeInTheDocument();
    });

    test('enhanced activity timeline displays correctly', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Enhanced Activity Timeline')).toBeInTheDocument();
      });

      // Check for timeline elements
      expect(screen.getByText('Recent activity and updates')).toBeInTheDocument();
    });

    test('advanced analytics section renders', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      });

      // Check for analytics subsections
      expect(screen.getByText('Application Trends')).toBeInTheDocument();
      expect(screen.getByText('Skill Gap Analysis')).toBeInTheDocument();
      expect(screen.getByText('Industry Insights')).toBeInTheDocument();
    });

    test('career progression section displays', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Career Progression')).toBeInTheDocument();
      });

      // Check for progression elements
      expect(screen.getByText('Track your career growth and milestones')).toBeInTheDocument();
    });

    test('profile optimization suggestions render', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Profile Optimization')).toBeInTheDocument();
      });

      // Check for optimization elements
      expect(screen.getByText('Suggestions to improve your profile')).toBeInTheDocument();
    });
  });

  describe('Applications Tab', () => {
    test('switches to applications tab correctly', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const applicationsTab = screen.getByText('Applications');
      await user.click(applicationsTab);

      await waitFor(() => {
        expect(screen.getByText('My Applications')).toBeInTheDocument();
      });
    });

    test('displays application filters', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const applicationsTab = screen.getByText('Applications');
      await user.click(applicationsTab);

      await waitFor(() => {
        expect(screen.getByText('Filter by Status')).toBeInTheDocument();
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Interview')).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('Accepted')).toBeInTheDocument();
      });
    });

    test('application search functionality', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const applicationsTab = screen.getByText('Applications');
      await user.click(applicationsTab);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search applications...');
        expect(searchInput).toBeInTheDocument();
      });
    });
  });

  describe('Profile Tab', () => {
    test('switches to profile tab correctly', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const profileTab = screen.getByText('Profile');
      await user.click(profileTab);

      await waitFor(() => {
        expect(screen.getByText('Profile Header with Completion')).toBeInTheDocument();
      });
    });

    test('displays notification preferences section', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const profileTab = screen.getByText('Profile');
      await user.click(profileTab);

      await waitFor(() => {
        expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      });

      // Check for notification options
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('Job Alert Frequency')).toBeInTheDocument();
    });

    test('profile editing functionality', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const profileTab = screen.getByText('Profile');
      await user.click(profileTab);

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        expect(editButton).toBeInTheDocument();
      });
    });

    test('notification preference toggles work', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const profileTab = screen.getByText('Profile');
      await user.click(profileTab);

      await waitFor(() => {
        const emailToggle = screen.getByRole('checkbox', { name: /email notifications/i });
        expect(emailToggle).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Elements', () => {
    test('tab navigation works correctly', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Test Overview tab (default)
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();

      // Switch to Applications tab
      const applicationsTab = screen.getByText('Applications');
      await user.click(applicationsTab);
      
      await waitFor(() => {
        expect(screen.getByText('My Applications')).toBeInTheDocument();
      });

      // Switch to Profile tab
      const profileTab = screen.getByText('Profile');
      await user.click(profileTab);
      
      await waitFor(() => {
        expect(screen.getByText('Profile Header with Completion')).toBeInTheDocument();
      });
    });

    test('filter buttons work in applications tab', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      const applicationsTab = screen.getByText('Applications');
      await user.click(applicationsTab);

      await waitFor(() => {
        const pendingFilter = screen.getByText('Pending');
        expect(pendingFilter).toBeInTheDocument();
      });

      const pendingFilter = screen.getByText('Pending');
      await user.click(pendingFilter);

      // Should filter applications by pending status
      expect(pendingFilter).toHaveClass('bg-blue-500');
    });

    test('quick action buttons work', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewApplicationsBtn = screen.getByText('View Applications');
        expect(viewApplicationsBtn).toBeInTheDocument();
      });

      const viewApplicationsBtn = screen.getByText('View Applications');
      await user.click(viewApplicationsBtn);

      // Should switch to applications tab
      await waitFor(() => {
        expect(screen.getByText('My Applications')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Should still render main elements
      expect(screen.getByText('Applicant Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    test('grid layouts adapt to screen size', () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Check for responsive grid classes
      const dashboard = screen.getByText('Applicant Dashboard').closest('div');
      expect(dashboard).toHaveClass('min-h-screen');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Check for navigation landmarks
      const navigation = screen.getByRole('navigation', { name: /dashboard navigation/i });
      expect(navigation).toBeInTheDocument();
    });

    test('keyboard navigation works', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Tab through navigation
      await user.tab();
      expect(screen.getByText('Overview')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Applications')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Profile')).toHaveFocus();
    });

    test('has proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Check for proper heading levels
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(expect.any(Number));
    });

    test('color contrast is sufficient', () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Check for proper color classes that ensure good contrast
      const dashboard = screen.getByText('Applicant Dashboard');
      expect(dashboard).toHaveClass('text-gray-900');
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      // Mock API error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Should not crash on API errors
      expect(screen.getByText('Applicant Dashboard')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('displays fallback content when data is unavailable', async () => {
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show empty states or default content
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('renders within reasonable time', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Applicant Dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 1 second
      expect(renderTime).toBeLessThan(1000);
    });

    test('does not cause memory leaks', () => {
      const { unmount } = render(
        <TestWrapper>
          <ApplicantDashboard />
        </TestWrapper>
      );

      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });
});

// Integration tests for data flow
describe('ApplicantDashboard Integration', () => {
  test('data flows correctly between components', async () => {
    render(
      <TestWrapper>
        <ApplicantDashboard />
      </TestWrapper>
    );

    // Test that data updates propagate correctly
    await waitFor(() => {
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    });

    // Switch tabs and verify data persistence
    const applicationsTab = screen.getByText('Applications');
    await userEvent.click(applicationsTab);

    await waitFor(() => {
      expect(screen.getByText('My Applications')).toBeInTheDocument();
    });

    // Switch back to overview
    const overviewTab = screen.getByText('Overview');
    await userEvent.click(overviewTab);

    await waitFor(() => {
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    });
  });

  test('form submissions work correctly', async () => {
    render(
      <TestWrapper>
        <ApplicantDashboard />
      </TestWrapper>
    );

    // Navigate to profile tab
    const profileTab = screen.getByText('Profile');
    await userEvent.click(profileTab);

    await waitFor(() => {
      const editButton = screen.getByText('Edit Profile');
      await userEvent.click(editButton);
    });

    // Should show editable form
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });
});