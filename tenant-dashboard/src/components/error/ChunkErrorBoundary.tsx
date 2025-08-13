'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
  chunkName?: string;
}

export function ChunkErrorBoundary({ children, chunkName }: ChunkErrorBoundaryProps) {
  const handleChunkError = (error: Error) => {
    // Check if it's a chunk loading error
    if (
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch') ||
      error.name === 'ChunkLoadError'
    ) {
      // Reload the page to fetch the latest chunks
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  return (
    <ErrorBoundary
      onError={handleChunkError}
      fallback={
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Loading Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p>Failed to load {chunkName || 'this section'}. This might be due to a recent update.</p>
              <Button 
                onClick={() => window.location.reload()} 
                size="sm" 
                className="mt-3"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}