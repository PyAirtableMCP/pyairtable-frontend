'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageErrorBoundaryProps {
  children: React.ReactNode
  showDetails?: boolean
  isDev?: boolean
  pageName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export function PageErrorBoundary({ 
  children, 
  showDetails, 
  isDev,
  pageName,
  onError 
}: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={PageErrorFallback}
      showDetails={showDetails}
      isDev={isDev}
      onError={(error, errorInfo) => {
        // Log page-specific error info
        console.error('Page Error Boundary:', {
          page: pageName || 'unknown',
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        })
        
        onError?.(error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

interface PageErrorFallbackProps {
  error: Error
  resetError: () => void
  errorId: string | null
}

function PageErrorFallback({ error, resetError, errorId }: PageErrorFallbackProps) {
  const router = useRouter()

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  const reportIssue = () => {
    const subject = encodeURIComponent(`Page Error Report: ${error.message}`)
    const body = encodeURIComponent(
      `Error ID: ${errorId}\nPage Error: ${error.message}\nURL: ${window.location.href}\nStack Trace:\n${error.stack}\nTime: ${new Date().toISOString()}`
    )
    window.open(`mailto:support@pyairtable.com?subject=${subject}&body=${body}`)
  }

  const reloadPage = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
            <div>
              <CardTitle className="text-xl">Page Error</CardTitle>
              <CardDescription>
                This page encountered an error and couldn&apos;t load properly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
            <strong>Error:</strong> {error.message}
          </div>

          {errorId && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
              <strong>Reference ID:</strong> {errorId}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button variant="outline" onClick={reloadPage}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" onClick={reportIssue}>
                Report Issue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific error boundary for critical pages
export function CriticalPageErrorBoundary({ 
  children, 
  pageName 
}: { 
  children: React.ReactNode
  pageName: string 
}) {
  return (
    <PageErrorBoundary
      pageName={pageName}
      showDetails={process.env.NODE_ENV === 'development'}
      isDev={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Enhanced logging for critical pages
        console.error(`Critical Page Error (${pageName}):`, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        })
      }}
    >
      {children}
    </PageErrorBoundary>
  )
}