'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteErrorBoundary({ error, reset }: RouteErrorBoundaryProps) {
  const router = useRouter();

  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Page Error</h2>
        <p className="text-muted-foreground mb-6">
          Sorry, this page encountered an error and couldn't load properly.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-muted rounded-lg text-left">
            <p className="text-sm font-mono text-destructive break-all">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center space-x-3">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}