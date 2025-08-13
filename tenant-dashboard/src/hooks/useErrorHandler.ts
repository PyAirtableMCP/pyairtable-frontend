'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';

interface ErrorOptions {
  showToast?: boolean;
  toastMessage?: string;
  logToConsole?: boolean;
  logToService?: boolean;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorOptions = {}
  ) => {
    const {
      showToast = true,
      toastMessage,
      logToConsole = true,
      logToService = process.env.NODE_ENV === 'production',
    } = options;

    // Convert unknown errors to Error objects
    const errorObj = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.error('Error caught:', errorObj);
    }

    // Show toast notification
    if (showToast) {
      const message = toastMessage || errorObj.message || 'An unexpected error occurred';
      toast.error(message);
    }

    // Log to error service in production
    if (logToService) {
      // TODO: Integrate with error logging service
      // logErrorToService(errorObj);
    }

    return errorObj;
  }, []);

  return { handleError };
}

export function useAsyncError() {
  const { handleError } = useErrorHandler();

  return useCallback((error: Error | unknown) => {
    handleError(error);
    throw error; // This will be caught by the nearest error boundary
  }, [handleError]);
}