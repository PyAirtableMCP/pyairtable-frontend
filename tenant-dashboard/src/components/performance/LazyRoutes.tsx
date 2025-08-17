"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Enhanced loading component with skeleton patterns
const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[400px] bg-gray-50/50 rounded-lg">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
)

// Dashboard-specific lazy loading with skeleton
const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
)

// Heavy chart components - lazy loaded only when needed
export const LazyChartsLibrary = dynamic(
  () => import('@/components/dashboard/MetricsChart').then(mod => ({ default: mod.MetricsChart })),
  {
    loading: () => (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading charts...</p>
        </div>
      </div>
    ),
    ssr: false // Charts often have hydration issues
  }
)

// Data table components - heavy due to virtualization
export const LazyDataTable = dynamic(
  () => import('@/components/airtable/TableView').then(mod => ({ default: mod.TableView })),
  {
    loading: () => (
      <div className="space-y-3 p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-3"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }
)

// Chat interface - heavy due to markdown and AI features
export const LazyChatInterface = dynamic(
  () => import('@/components/chat/ChatInterface').then(mod => ({ default: mod.ChatInterface })),
  {
    loading: () => (
      <div className="h-[600px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-muted-foreground">Loading AI Chat...</p>
            <p className="text-xs text-muted-foreground">Initializing conversation interface</p>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
)

// Settings and profile pages - lower priority
export const LazySettingsPage = dynamic(
  () => import('@/components/settings/SettingsPage').then(mod => ({ default: mod.SettingsPage })),
  {
    loading: () => <LoadingFallback message="Loading settings..." />
  }
)

export const LazyProfilePage = dynamic(
  () => import('@/components/profile/ProfileForm').then(mod => ({ default: mod.ProfileForm })),
  {
    loading: () => <LoadingFallback message="Loading profile..." />
  }
)

// Onboarding flow - can be loaded on demand
export const LazyOnboardingFlow = dynamic(
  () => import('@/components/onboarding/ComprehensiveOnboarding').then(mod => ({ default: mod.ComprehensiveOnboarding })),
  {
    loading: () => (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

// Analytics and cost tracking - heavy dependencies
export const LazyCostDashboard = dynamic(
  () => import('@/components/cost/CostDashboard').then(mod => ({ default: mod.CostDashboard })),
  {
    loading: () => <LoadingFallback message="Loading cost analytics..." />,
    ssr: false
  }
)

// Error boundaries with lazy loading
export const LazyErrorBoundary = dynamic(
  () => import('@/components/error/AsyncErrorBoundary').then(mod => ({ default: mod.AsyncErrorBoundary })),
  {
    loading: () => <LoadingFallback message="Loading error handler..." />
  }
)

// Higher-order component for route-level lazy loading
export const withLazyLoading = (Component: any, loadingMessage?: string) => {
  const LazyComponent = dynamic(() => Promise.resolve({ default: Component }), {
    loading: () => <LoadingFallback message={loadingMessage} />
  })
  
  return function LazyLoadedComponent(props: any) {
    return (
      <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Route-specific lazy loading configurations
export const LAZY_ROUTES = {
  chat: LazyChatInterface,
  dashboard: LazyChartsLibrary,
  settings: LazySettingsPage,
  profile: LazyProfilePage,
  onboarding: LazyOnboardingFlow,
  cost: LazyCostDashboard,
  table: LazyDataTable
} as const

// Preload critical components on user interaction
export const preloadCriticalComponents = () => {
  // Preload dashboard components when user hovers over dashboard links
  const preloadDashboard = () => {
    import('@/components/dashboard/MetricsChart')
    import('@/components/dashboard/MetricCard')
  }
  
  // Preload chat when user shows intent to use it
  const preloadChat = () => {
    import('@/components/chat/ChatInterface')
    import('@/components/chat/ChatMessage')
  }
  
  return { preloadDashboard, preloadChat }
}