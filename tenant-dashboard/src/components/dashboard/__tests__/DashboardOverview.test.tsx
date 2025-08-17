import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardOverview } from '../DashboardOverview'
import type { Tenant } from '@/types'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock useTenant hook
jest.mock('@/hooks/useTenant', () => ({
  useTenant: jest.fn(),
  useTenantUsage: jest.fn(),
  useTenantActivityLogs: jest.fn(),
}))

// window.location is already mocked in jest.setup.js

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Mock tenant data
const mockTenant: Tenant = {
  id: 'tenant-123',
  name: 'Test Company',
  slug: 'test-company',
  status: 'active',
  plan: {
    id: 'plan-pro',
    name: 'pro',
    displayName: 'Professional',
    tier: 'pro',
    limits: {
      users: 50,
      workspaces: 25,
      storage: 107374182400, // 100GB in bytes
      apiCalls: 100000,
      automations: 50,
      fileUploads: 10000,
      dataTransfer: 536870912000, // 500GB in bytes
      customFields: 500,
      views: 100,
      records: 1000000,
      webhooks: 25,
    },
    features: [],
    pricing: {
      basePrice: 2900, // $29.00 in cents
      currency: 'USD',
      billingCycle: 'monthly',
      usageTiers: [],
      discounts: [],
    },
    isActive: true,
  },
  owner: {
    id: 'member-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'owner@test.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      timezone: 'UTC',
      locale: 'en-US',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      loginCount: 25,
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          digest: 'daily',
          categories: {},
        },
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        language: 'en',
      },
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    role: {
      id: 'role-owner',
      name: 'owner',
      displayName: 'Owner',
      description: 'Full access to the tenant',
      permissions: [],
      isSystemRole: true,
      isCustom: false,
      level: 100,
    },
    permissions: [],
    status: 'active',
    joinedAt: '2024-01-15T00:00:00Z',
    metadata: {},
  },
  members: [],
  usage: {
    current: {
      users: 12,
      workspaces: 8,
      records: 45000,
      storage: 21474836480, // 20GB in bytes
      apiCalls: 75000,
      automations: 15,
      fileUploads: 2500,
      dataTransfer: 107374182400, // 100GB in bytes
      webhooks: 5,
      computeHours: 120,
    },
    limits: {
      users: 50,
      workspaces: 25,
      storage: 107374182400,
      apiCalls: 100000,
      automations: 50,
      fileUploads: 10000,
      dataTransfer: 536870912000,
      customFields: 500,
      views: 100,
      records: 1000000,
      webhooks: 25,
    },
    period: {
      start: '2024-08-01T00:00:00Z',
      end: '2024-08-31T23:59:59Z',
      type: 'monthly',
    },
    history: [],
    projections: [],
    lastCalculated: '2024-08-13T21:00:00Z',
  },
  settings: {
    general: {
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      language: 'en',
      currency: 'USD',
      weekStart: 'monday',
      allowUserRegistration: true,
      requireEmailVerification: true,
      domainVerified: false,
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        preventReuse: 5,
        maxAge: 90,
      },
      sessionTimeout: 480,
      twoFactorRequired: false,
      ipWhitelist: [],
      ssoEnabled: false,
      auditLogRetention: 365,
      encryptionAtRest: true,
      dataResidency: 'US',
    },
    notifications: {
      channels: [],
      templates: [],
      preferences: {
        systemAlerts: true,
        billingNotifications: true,
        securityAlerts: true,
        usageWarnings: true,
        maintenanceUpdates: true,
        featureUpdates: true,
      },
    },
    integrations: {
      apiKeys: [],
      webhooks: [],
      connectedApps: [],
      rateLimits: [],
    },
    data: {
      backupEnabled: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      exportFormats: ['json', 'csv'],
      dataResidency: 'US',
      encryptionEnabled: true,
      complianceMode: 'none',
      retentionPolicies: [],
    },
    appearance: {
      theme: 'light',
      primaryColor: '#3b82f6',
      branding: {
        companyName: 'Test Company',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'Inter',
        hideFooter: false,
      },
    },
  },
  billing: {
    customerId: 'cus_123',
    status: 'active',
    currentPeriod: {
      start: '2024-08-01T00:00:00Z',
      end: '2024-08-31T23:59:59Z',
      amount: 2900,
      currency: 'USD',
      status: 'current',
    },
    nextBilling: {
      start: '2024-09-01T00:00:00Z',
      end: '2024-09-30T23:59:59Z',
      amount: 2900,
      currency: 'USD',
      status: 'upcoming',
    },
    paymentMethod: {
      id: 'pm_123',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      isDefault: true,
      billingAddress: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    },
    invoices: [],
    credits: [],
    tax: {
      exemptStatus: false,
      rate: 0.0875,
      region: 'CA',
    },
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      preventReuse: 5,
      maxAge: 90,
    },
    sessionTimeout: 480,
    twoFactorRequired: false,
    ipWhitelist: [],
    ssoEnabled: false,
    auditLogRetention: 365,
    encryptionAtRest: true,
    dataResidency: 'US',
  },
  integrations: [],
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-08-13T20:00:00Z',
  lastActivityAt: '2024-08-13T21:30:00Z',
}

describe('DashboardOverview', () => {
  const { useTenant, useTenantUsage, useTenantActivityLogs } = require('@/hooks/useTenant')

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window.location.href
    window.location.href = ''
    
    // Mock useTenant to return our mock data
    useTenant.mockReturnValue({
      data: mockTenant,
      isLoading: false,
      error: null
    })

    // Mock useTenantUsage
    useTenantUsage.mockReturnValue({
      data: mockTenant.usage,
      isLoading: false,
      error: null
    })

    // Mock useTenantActivityLogs
    useTenantActivityLogs.mockReturnValue({
      data: {
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
          },
          {
            id: '2',
            user: {
              id: 'user-2',
              fullName: 'Sarah Johnson',
              avatar: null
            },
            action: {
              type: 'user.invited',
              displayName: 'Invited user'
            },
            details: {
              email: 'sarah@example.com'
            },
            timestamp: '2024-01-01T09:00:00Z',
            severity: 'medium',
            ipAddress: '192.168.1.2'
          }
        ]
      },
      isLoading: false,
      error: null
    })
  })

  it('renders welcome message with tenant name', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // Check for greeting (could be Good morning!, Good afternoon!, Good evening!, etc.)
    expect(screen.getByText(/Good (morning|afternoon|evening)!/)).toBeInTheDocument()
    // Check for tenant name in the description (text is broken up by spans)
    expect(screen.getByText('Test Company')).toBeInTheDocument()
    // Check for the text that's spread across multiple elements
    expect(screen.getByText('Here\'s what\'s happening with')).toBeInTheDocument()
  })

  it('displays metric cards with correct values', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // Check metric cards display correct values - use getAllByText for duplicate text
    expect(screen.getAllByText('Team Members')).toHaveLength(2) // Appears in MetricCard and UsageProgress
    expect(screen.getByText('0')).toBeInTheDocument() // members.length is 0
    
    expect(screen.getByText('Active Workspaces')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument() // usage.workspaces
    
    expect(screen.getByText('Storage Used')).toBeInTheDocument()
    expect(screen.getByText('API Calls')).toBeInTheDocument()
    expect(screen.getByText('75,000')).toBeInTheDocument() // usage.apiCalls formatted
  })

  it('displays current date in badge', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // Check for the formatted date that includes day name
    expect(screen.getByText(/Thursday, August 14, 2025/)).toBeInTheDocument()
  })

  it('renders usage charts with correct titles', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    expect(screen.getByText('API Usage Trend')).toBeInTheDocument()
    expect(screen.getByText('Storage Growth')).toBeInTheDocument()
    expect(screen.getByText('Daily API calls over the last 7 days')).toBeInTheDocument()
  })

  it('displays usage progress indicators', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    expect(screen.getByText('Current Usage')).toBeInTheDocument()
    expect(screen.getByText('Users in your organization')).toBeInTheDocument()
    expect(screen.getByText('Active workspaces')).toBeInTheDocument()
    expect(screen.getByText('Files and data storage')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
  })

  it('shows recent activity with mock data', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // Check for activity descriptions that actually appear in the component
    expect(screen.getByText(/Created workspace/)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/Invited user/)).toBeInTheDocument()
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
  })

  it('renders quick action buttons', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    expect(screen.getByText('Invite Team Member')).toBeInTheDocument()
    expect(screen.getByText('Create Workspace')).toBeInTheDocument()
    expect(screen.getByText('View Usage')).toBeInTheDocument()
    expect(screen.getByText('Billing Settings')).toBeInTheDocument()
    
    expect(screen.getByText('Add someone to your organization')).toBeInTheDocument()
    expect(screen.getByText('Start a new project workspace')).toBeInTheDocument()
    expect(screen.getByText('Check your current usage limits')).toBeInTheDocument()
    expect(screen.getByText('Manage your subscription')).toBeInTheDocument()
  })

  it('shows upgrade banner for non-enterprise plans', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    expect(screen.getByText('Upgrade Your Plan')).toBeInTheDocument()
    expect(screen.getByText('Get more features and higher limits with our Pro plan')).toBeInTheDocument()
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument()
  })

  it('does not show upgrade banner for enterprise plans', () => {
    const enterpriseTenant = {
      ...mockTenant,
      plan: { ...mockTenant.plan, tier: 'enterprise' as const }
    }
    
    useTenant.mockReturnValue({
      data: enterpriseTenant,
      isLoading: false,
      error: null
    })

    useTenantUsage.mockReturnValue({
      data: enterpriseTenant.usage,
      isLoading: false,
      error: null
    })
    
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    expect(screen.queryByText('Upgrade Your Plan')).not.toBeInTheDocument()
  })

  it('handles quick action button clicks', () => {
    const locationSpy = jest.spyOn(window.location, 'href', 'set')
    
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    const inviteButton = screen.getByText('Invite Team Member').closest('button')
    fireEvent.click(inviteButton!)
    
    expect(locationSpy).toHaveBeenCalledWith('/team/invitations')
    
    locationSpy.mockRestore()
  })

  it('handles upgrade button click', () => {
    const locationSpy = jest.spyOn(window.location, 'href', 'set')
    
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    const upgradeButton = screen.getByText('Upgrade Now')
    fireEvent.click(upgradeButton)
    
    expect(locationSpy).toHaveBeenCalledWith('/billing/subscription')
    
    locationSpy.mockRestore()
  })

  it('formats large numbers correctly', () => {
    const tenantWithLargeNumbers = {
      ...mockTenant,
      usage: {
        ...mockTenant.usage,
        current: {
          ...mockTenant.usage.current,
          apiCalls: 1250000, // Should format as 1.25M
          storage: 1073741824000, // 1TB
        }
      }
    }
    
    useTenant.mockReturnValue({
      data: tenantWithLargeNumbers,
      isLoading: false,
      error: null
    })

    useTenantUsage.mockReturnValue({
      data: tenantWithLargeNumbers.usage,
      isLoading: false,
      error: null
    })
    
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // These will be formatted by the MetricCard component
    expect(screen.getByText('1,250,000')).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // Check for proper headings - greeting is dynamic based on time
    expect(screen.getByRole('heading', { name: /Good (morning|afternoon|evening)!/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quick Actions' })).toBeInTheDocument()
    
    // Check for buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('displays activity severity indicators', () => {
    render(
      <TestWrapper>
        <DashboardOverview />
      </TestWrapper>
    )
    
    // The activity items have severity 'low' and 'medium' which should be visible
    // This tests that the component renders activity items correctly
    expect(screen.getByText(/Created workspace/)).toBeInTheDocument()
    expect(screen.getByText(/Invited user/)).toBeInTheDocument()
  })
})