'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    resetError: () => void
    errorId: string | null
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
  isDev?: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate a simple error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Log error for monitoring (console.error for now as requested)
    console.error('Error Boundary Caught Error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    this.setState({
      errorInfo,
      errorId,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            errorId={this.state.errorId}
          />
        )
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorId={this.state.errorId}
          showDetails={this.props.showDetails || this.props.isDev}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorId: string | null
  showDetails?: boolean
  errorInfo: React.ErrorInfo | null
}

function ErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  showDetails = false,
  errorInfo 
}: ErrorFallbackProps) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false)

  const reportIssue = () => {
    // Create email with error details
    const subject = encodeURIComponent(`Error Report: ${error.message}`)
    const body = encodeURIComponent(
      `Error ID: ${errorId}\nError: ${error.message}\nStack Trace:\n${error.stack}\nTime: ${new Date().toISOString()}`
    )
    window.open(`mailto:support@pyairtable.com?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. You can try again or report this issue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorId && (
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <strong>Error ID:</strong> {errorId}
                <br />
                Reference this ID when reporting the issue for faster resolution.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={resetError} className="flex-1 min-w-32">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/"} 
              className="flex-1 min-w-32"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button 
              variant="outline" 
              onClick={reportIssue}
              className="flex-1 min-w-32"
            >
              <Bug className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          </div>

          {showDetails && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className="text-muted-foreground"
              >
                {detailsExpanded ? "Hide" : "Show"} Technical Details
              </Button>
              
              {detailsExpanded && (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Error Message:</strong>
                      <pre className="mt-2 text-sm whitespace-pre-wrap">{error.message}</pre>
                    </AlertDescription>
                  </Alert>
                  
                  {error.stack && (
                    <Alert>
                      <AlertDescription>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <Alert>
                      <AlertDescription>
                        <strong>Component Stack:</strong>
                        <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-40">
                          {errorInfo.componentStack}
                        </pre>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Simple hook for programmatic error handling
export const useErrorHandler = () => {
  return React.useCallback((error: Error, context?: string) => {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.error('Manual Error Reported:', {
      errorId,
      error: error.message,
      stack: error.stack,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
    })

    return errorId
  }, [])
}