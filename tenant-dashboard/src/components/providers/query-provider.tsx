"use client";

import React from "react";
import { 
  QueryClient, 
  QueryClientProvider, 
  QueryCache,
  MutationCache,
  focusManager,
  onlineManager
} from "@tanstack/react-query";
// Temporarily disable ReactQueryDevtools to resolve initialization issues
const ReactQueryDevtools = null;
import { toast } from "react-hot-toast";

import { handleAsyncError } from "@/components/error-boundary";
import { isApiError } from "@/lib/api/types";

interface QueryProviderProps {
  children: React.ReactNode;
}

// Global error handler for queries
const handleQueryError = (error: unknown, context?: string) => {
  console.error(`Query error (${context}):`, error);
  
  if (isApiError(error)) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Don't show toast for auth errors, let auth system handle
        break;
      case 'FORBIDDEN':
        toast.error('You do not have permission to perform this action.');
        break;
      case 'RATE_LIMITED':
        toast.error('Too many requests. Please slow down.');
        break;
      case 'NETWORK_ERROR':
        toast.error('Connection error. Please check your internet.');
        break;
      default:
        // Only show generic errors for non-auth issues
        if (!error.code.includes('AUTH') && !error.code.includes('TOKEN')) {
          toast.error(error.message || 'Something went wrong.');
        }
    }
  } else if (error instanceof Error) {
    toast.error(error.message);
  }
  
  // Report to error tracking
  if (typeof handleAsyncError === 'function') {
    handleAsyncError(error as Error, context || 'react-query');
  }
};

// Global error handler for mutations  
const handleMutationError = (error: unknown, variables: unknown, context: unknown) => {
  console.error('Mutation error:', error, { variables, context });
  
  if (isApiError(error)) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Auth system will handle redirect
        break;
      case 'FORBIDDEN':
        toast.error('You do not have permission to perform this action.');
        break;
      case 'VALIDATION_ERROR':
        toast.error(error.message || 'Please check your input and try again.');
        break;
      case 'CONFLICT':
        toast.error('This action conflicts with existing data.');
        break;
      case 'RATE_LIMITED':
        toast.error('Too many requests. Please wait before trying again.');
        break;
      default:
        toast.error(error.message || 'The operation failed. Please try again.');
    }
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('Something went wrong. Please try again.');
  }
  
  // Report to error tracking
  if (typeof handleAsyncError === 'function') {
    handleAsyncError(error as Error, 'react-query-mutation');
  }
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only show error toasts for foreground queries
            if (query.state.fetchStatus !== 'idle') {
              handleQueryError(error, 'query-cache');
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: handleMutationError,
          onSuccess: (data, variables, context, mutation) => {
            // Show success message if mutation has success handler
            const meta = mutation.meta;
            if (meta && typeof meta === 'object' && 'successMessage' in meta) {
              toast.success(meta.successMessage as string);
            }
          },
        }),
        defaultOptions: {
          queries: {
            // Stale time - data is fresh for this duration
            staleTime: 5 * 60 * 1000, // 5 minutes
            
            // Cache time - data stays in cache for this duration when unused
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            
            // Retry configuration
            retry: (failureCount, error) => {
              // Don't retry on certain error types
              if (isApiError(error)) {
                switch (error.code) {
                  case 'UNAUTHORIZED':
                  case 'FORBIDDEN':
                  case 'NOT_FOUND':
                  case 'VALIDATION_ERROR':
                    return false;
                  case 'RATE_LIMITED':
                    return failureCount < 2; // Limited retries for rate limits
                  default:
                    return failureCount < 3;
                }
              }
              
              // Don't retry 4xx errors (except specific cases)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500 && ![408, 429].includes(status)) {
                  return false;
                }
              }
              
              return failureCount < 3;
            },
            
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Background refetch settings
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
            
            // Network mode
            networkMode: 'online',
          },
          mutations: {
            // Mutation retry settings
            retry: (failureCount, error) => {
              // Generally don't retry mutations, but allow for network errors
              if (isApiError(error) && error.code === 'NETWORK_ERROR') {
                return failureCount < 2;
              }
              return false;
            },
            
            networkMode: 'online',
          },
        },
      })
  );

  // Set up focus manager
  React.useEffect(() => {
    // Configure focus manager behavior
    focusManager.setEventListener((handleFocus) => {
      if (typeof window !== 'undefined') {
        const handleVisibilityChange = () => {
          handleFocus(!document.hidden);
        };

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', () => handleFocus(true));
        window.addEventListener('blur', () => handleFocus(false));

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', () => handleFocus(true));
          window.removeEventListener('blur', () => handleFocus(false));
        };
      }
    });
  }, []);

  // Set up online manager
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Custom online/offline detection
      const handleOnline = () => {
        onlineManager.setOnline(true);
        toast.success('Connection restored', { id: 'connection-status' });
      };

      const handleOffline = () => {
        onlineManager.setOnline(false);
        toast.error('Connection lost. Working offline.', { 
          id: 'connection-status',
          duration: Infinity 
        });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clear any pending toasts
      toast.dismiss();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
            },
          }}
        />
      )}
    </QueryClientProvider>
  );
}

// Hook to access the query client from components  
// Note: TanStack Query provides its own useQueryClient hook, so we don't need to export our own

// HOC for components that need query client access
export function withQueryClient<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithQueryClientComponent(props: P) {
    return (
      <QueryProvider>
        <Component {...props} />
      </QueryProvider>
    );
  };
}

export default QueryProvider;