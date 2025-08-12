'use client'

import { PageErrorBoundary } from '@/lib/components/PageErrorBoundary'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <PageErrorBoundary 
      pageName="Dashboard"
      showDetails={process.env.NODE_ENV === 'development'}
      isDev={process.env.NODE_ENV === 'development'}
    >
      {children}
    </PageErrorBoundary>
  )
}