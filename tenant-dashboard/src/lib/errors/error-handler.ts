/**
 * Centralized Error Handler Utility
 * 
 * This module provides a unified error handling system that standardizes
 * error processing, logging, user notifications, and reporting across the app.
 */

import * as Sentry from '@sentry/nextjs';
import { trackEvent } from '@/app/posthog-provider';
import { 
  AppError, 
  ValidationError,
  NetworkError,
  PermissionError,
  ErrorCode, 
  ErrorSeverity, 
  ERROR_MESSAGES,
  isAppError 
} from './error-types';

// Re-export the types for other modules to use
export {
  AppError,
  ValidationError, 
  NetworkError,
  PermissionError,
  ErrorCode,
  ErrorSeverity,
  ERROR_MESSAGES,
  isAppError
} from './error-types';

// Error handler configuration
interface ErrorHandlerConfig {
  enableConsoleLogging?: boolean;
  enableSentryReporting?: boolean;
  enableAnalyticsTracking?: boolean;
  showUserNotifications?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableSentryReporting: true,
  enableAnalyticsTracking: true,
  showUserNotifications: true
};

// Toast notification types (matches existing toast component)
export interface ToastNotification {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Centralized error handler class
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private toastCallback?: (notification: ToastNotification) => void;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Set toast callback for user notifications
  setToastCallback(callback: (notification: ToastNotification) => void) {
    this.toastCallback = callback;
  }

  // Main error handling method
  handle(error: unknown, context?: string, userInfo?: { id?: string; email?: string }): AppError {
    // Normalize error to AppError
    const appError = this.normalizeError(error, context);
    
    // Log error for development
    if (this.config.enableConsoleLogging) {
      this.logToConsole(appError, context);
    }

    // Report to Sentry
    if (this.config.enableSentryReporting) {
      this.reportToSentry(appError, userInfo);
    }

    // Track with analytics
    if (this.config.enableAnalyticsTracking) {
      this.trackError(appError, context);
    }

    // Show user notification
    if (this.config.showUserNotifications && this.shouldShowToUser(appError)) {
      this.showToastNotification(appError);
    }

    return appError;
  }

  // Handle async operations with error catching
  async handleAsync<T>(
    operation: () => Promise<T>, 
    context?: string,
    userInfo?: { id?: string; email?: string }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const handledError = this.handle(error, context, userInfo);
      throw handledError;
    }
  }

  // Handle validation errors specifically
  handleValidation(
    errors: Record<string, string[]> | string, 
    context?: string
  ): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    if (typeof errors === 'string') {
      validationErrors.push(new ValidationError(errors));
    } else {
      Object.entries(errors).forEach(([field, messages]) => {
        messages.forEach(message => {
          validationErrors.push(new ValidationError(message, field));
        });
      });
    }

    // Log and track validation errors
    validationErrors.forEach(error => {
      if (this.config.enableConsoleLogging) {
        this.logToConsole(error, context);
      }
      if (this.config.enableAnalyticsTracking) {
        this.trackError(error, context);
      }
    });

    return validationErrors;
  }

  // Get user-friendly error message
  getUserMessage(error: unknown): string {
    if (isAppError(error)) {
      return ERROR_MESSAGES[error.code] || error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
  }

  // Check if error should be shown to user
  private shouldShowToUser(error: AppError): boolean {
    // Don't show validation errors as toast (they're handled in forms)
    if (error instanceof ValidationError) {
      return false;
    }

    // Show critical and error severity
    return error.severity === ErrorSeverity.ERROR || 
           error.severity === ErrorSeverity.CRITICAL;
  }

  // Normalize any error to AppError
  private normalizeError(error: unknown, context?: string): AppError {
    // Already an AppError
    if (isAppError(error)) {
      return error;
    }

    // Standard JavaScript Error
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('fetch')) {
        return new NetworkError(error.message, undefined, undefined, { originalError: error.message });
      }
      
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        return new PermissionError(error.message);
      }

      // Generic error conversion
      return new AppError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        ErrorSeverity.ERROR,
        { originalError: error.message, context }
      );
    }

    // Handle API response errors (existing ApiError from api.ts)
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as any;
      return new AppError(
        apiError.code || ErrorCode.API_ERROR,
        apiError.message || 'An API error occurred',
        ErrorSeverity.ERROR,
        apiError.details,
        apiError.field,
        apiError.requestId
      );
    }

    // Fallback for unknown error types
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      typeof error === 'string' ? error : 'An unexpected error occurred',
      ErrorSeverity.ERROR,
      { originalError: error, context }
    );
  }

  // Console logging for development
  private logToConsole(error: AppError, context?: string) {
    const prefix = context ? `[${context}]` : '[Error]';
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`${prefix} CRITICAL:`, error.toJSON());
        break;
      case ErrorSeverity.ERROR:
        console.error(`${prefix} ERROR:`, error.toJSON());
        break;
      case ErrorSeverity.WARNING:
        console.warn(`${prefix} WARNING:`, error.toJSON());
        break;
      case ErrorSeverity.INFO:
        console.info(`${prefix} INFO:`, error.toJSON());
        break;
    }
  }

  // Report to Sentry
  private reportToSentry(error: AppError, userInfo?: { id?: string; email?: string }) {
    const eventId = Sentry.captureException(error, {
      tags: {
        errorCode: error.code,
        severity: error.severity,
      },
      contexts: {
        error: {
          field: error.field,
          requestId: error.requestId,
          ...error.context
        }
      },
      user: userInfo ? {
        id: userInfo.id,
        email: userInfo.email
      } : undefined
    });

    // Add event ID to error for reference
    (error as any).sentryEventId = eventId;
  }

  // Track error with analytics
  private trackError(error: AppError, context?: string) {
    trackEvent('error_handled', {
      error_code: error.code,
      error_message: error.message,
      severity: error.severity,
      context: context || 'unknown',
      field: error.field,
      request_id: error.requestId,
      timestamp: error.timestamp.toISOString()
    });
  }

  // Show toast notification to user
  private showToastNotification(error: AppError) {
    if (!this.toastCallback) return;

    const isDestructive = error.severity === ErrorSeverity.ERROR || 
                         error.severity === ErrorSeverity.CRITICAL;

    this.toastCallback({
      title: isDestructive ? 'Error' : 'Notice',
      description: this.getUserMessage(error),
      variant: isDestructive ? 'destructive' : 'default',
      duration: isDestructive ? 5000 : 3000
    });
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions for common scenarios
export const handleError = (error: unknown, context?: string, userInfo?: { id?: string; email?: string }) => 
  errorHandler.handle(error, context, userInfo);

export const handleAsyncError = <T>(
  operation: () => Promise<T>,
  context?: string,
  userInfo?: { id?: string; email?: string }
) => errorHandler.handleAsync(operation, context, userInfo);

export const handleValidationError = (errors: Record<string, string[]> | string, context?: string) =>
  errorHandler.handleValidation(errors, context);

export const getUserErrorMessage = (error: unknown) => 
  errorHandler.getUserMessage(error);

// Hook for React components to integrate with toast system
export const useErrorHandler = () => {
  return {
    handle: handleError,
    handleAsync: handleAsyncError,
    handleValidation: handleValidationError,
    getUserMessage: getUserErrorMessage,
    setToastCallback: errorHandler.setToastCallback.bind(errorHandler)
  };
};