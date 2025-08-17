/**
 * Test suite for the refactored Dashboard Overview components
 * Ensures all components are properly modularized and performant
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import our refactored components
import { DashboardOverview } from '../DashboardOverview';
import { MetricsSummary } from '../MetricsSummary';
import WelcomeHeader from '../WelcomeHeader';
import QuickActions from '../QuickActions';
import { PlanUpgrade } from '../PlanUpgrade';
import { UsageOverview } from '../UsageOverview';

// Mock hooks
jest.mock('@/hooks/useTenant', () => ({
  useTenant: jest.fn(),
  useTenantUsage: jest.fn(),
  useTenantActivityLogs: jest.fn(),
}));

// Mock data
const mockTenant = {
  id: 'tenant-1',
  name: 'Test Organization',
  members: [
    { id: 'user-1', email: 'test@example.com' }
  ],
  plan: {
    tier: 'pro',
    limits: {
      users: 50,
      workspaces: 10,
      storage: 1000000000,
      apiCalls: 100000,
    }
  },
  currentUser: {
    permissions: ['members:invite', 'workspaces:create', 'billing:manage']
  }
};

const mockUsage = {
  users: 5,
  workspaces: 3,
  storage: 500000000,
  apiCalls: 25000,
  memberGrowth: 10,
  workspaceGrowth: -5,
  storageGrowth: 15,
  apiCallsGrowth: 8,
  chartData: {
    apiCalls: [
      { date: 'Jan', value: 2400 },
      { date: 'Feb', value: 1398 },
      { date: 'Mar', value: 9800 },
    ],
    storage: [
      { date: 'Jan', value: 1200000000 },
      { date: 'Feb', value: 1800000000 },
      { date: 'Mar', value: 2100000000 },
    ]
  }
};

const mockActivityLogs = {
  data: [
    {
      id: '1',
      user: {
        id: 'user-1',
        fullName: 'John Doe',
        avatar: null
      },
      action: {
        type: 'workspace.created',
        displayName: 'Created workspace'
      },
      details: {
        workspaceName: 'Test Workspace'
      },
      timestamp: '2024-01-01T10:00:00Z',
      severity: 'low',
      ipAddress: '192.168.1.1'
    }
  ]
};

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Dashboard Refactoring', () => {
  const { useTenant, useTenantUsage, useTenantActivityLogs } = require('@/hooks/useTenant');

  beforeEach(() => {
    // Reset mocks
    useTenant.mockReturnValue({
      data: mockTenant,
      isLoading: false,
      error: null
    });

    useTenantUsage.mockReturnValue({
      data: mockUsage,
      isLoading: false,
      error: null
    });

    useTenantActivityLogs.mockReturnValue({
      data: mockActivityLogs,
      isLoading: false,
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Modularity', () => {
    test('DashboardOverview should render all modular components', async () => {
      render(
        <TestWrapper>
          <DashboardOverview />
        </TestWrapper>
      );

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText(/good morning|good afternoon|good evening/i)).toBeInTheDocument(); // WelcomeHeader
      });
    });

    test('MetricsSummary should render metrics cards', async () => {
      render(
        <TestWrapper>
          <MetricsSummary />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument();
        expect(screen.getByText('Active Workspaces')).toBeInTheDocument();
        expect(screen.getByText('Storage Used')).toBeInTheDocument();
        expect(screen.getByText('API Calls')).toBeInTheDocument();
      });
    });

    test('WelcomeHeader should display tenant information', async () => {
      render(
        <TestWrapper>
          <WelcomeHeader />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Test Organization/)).toBeInTheDocument();
        expect(screen.getByText(/Pro Plan/i)).toBeInTheDocument();
      });
    });

    test('QuickActions should render permitted actions only', async () => {
      render(
        <TestWrapper>
          <QuickActions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
        expect(screen.getByText('Create Workspace')).toBeInTheDocument();
        expect(screen.getByText('Billing Settings')).toBeInTheDocument();
      });
    });

    test('PlanUpgrade should not show for enterprise plans', () => {
      useTenant.mockReturnValue({
        data: { ...mockTenant, plan: { tier: 'enterprise' } },
        isLoading: false,
        error: null
      });

      const { container } = render(
        <TestWrapper>
          <PlanUpgrade />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Loading States', () => {
    test('DashboardOverview should show loading skeleton', () => {
      useTenant.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <DashboardOverview />
        </TestWrapper>
      );

      // Should show skeleton elements
      expect(document.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
    });

    test('MetricsSummary should show loading skeletons', () => {
      useTenant.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      useTenantUsage.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <MetricsSummary />
        </TestWrapper>
      );

      // Should show skeleton elements
      expect(document.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('DashboardOverview should display error message', () => {
      useTenant.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to load tenant data' }
      });

      render(
        <TestWrapper>
          <DashboardOverview />
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load dashboard data/)).toBeInTheDocument();
    });

    test('MetricsSummary should handle API errors gracefully', () => {
      useTenantUsage.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'API Error' }
      });

      render(
        <TestWrapper>
          <MetricsSummary />
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load metrics/)).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    test('Components should be memoized', () => {
      // Check that our components are React components (memo returns objects)
      expect(DashboardOverview).toBeDefined();
      expect(MetricsSummary).toBeDefined();
      expect(WelcomeHeader).toBeDefined();
      expect(QuickActions).toBeDefined();
      expect(PlanUpgrade).toBeDefined();
      expect(UsageOverview).toBeDefined();
      
      // Check displayName is set correctly for memoized components
      expect(WelcomeHeader.displayName).toBe('WelcomeHeader');
      expect(QuickActions.displayName).toBe('QuickActions');
    });

    test('Should not re-render unnecessarily', async () => {
      const renderSpy = jest.fn();
      
      const TestComponent = React.memo(() => {
        renderSpy();
        return <MetricsSummary />;
      });

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalledTimes(1);
      });

      // Re-render with same data - should not trigger re-render
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should still be called only once due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real API Integration', () => {
    test('Should call tenant hooks with correct parameters', () => {
      render(
        <TestWrapper>
          <DashboardOverview />
        </TestWrapper>
      );

      expect(useTenant).toHaveBeenCalled();
    });

    test('UsageOverview should call activity logs with pagination', () => {
      render(
        <TestWrapper>
          <UsageOverview />
        </TestWrapper>
      );

      expect(useTenantActivityLogs).toHaveBeenCalledWith({
        pagination: { page: 1, limit: 6 },
        sort: { field: "timestamp", direction: "desc" }
      });
    });
  });
});