/**
 * Reusable ErrorMessage UI Component
 * 
 * A flexible component for displaying error messages with consistent styling
 * and behavior across the application.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AppError, 
  ErrorSeverity, 
  isAppError,
  getUserErrorMessage
} from '@/lib/errors/error-handler';

// Error message variants
const errorMessageVariants = cva(
  'flex items-start gap-2 p-3 rounded-md border text-sm',
  {
    variants: {
      severity: {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800', 
        error: 'bg-red-50 border-red-200 text-red-800',
        critical: 'bg-red-100 border-red-300 text-red-900'
      },
      size: {
        sm: 'p-2 text-xs',
        default: 'p-3 text-sm',
        lg: 'p-4 text-base'
      }
    },
    defaultVariants: {
      severity: 'error',
      size: 'default'
    }
  }
);

// Icon mapping for severity levels
const SeverityIcons = {
  [ErrorSeverity.INFO]: Info,
  [ErrorSeverity.WARNING]: AlertCircle,
  [ErrorSeverity.ERROR]: XCircle,
  [ErrorSeverity.CRITICAL]: AlertTriangle
};

// Props for ErrorMessage component
export interface ErrorMessageProps extends VariantProps<typeof errorMessageVariants> {
  error?: unknown;
  message?: string;
  title?: string;
  className?: string;
  showIcon?: boolean;
  onDismiss?: () => void;
  field?: string;
}

/**
 * ErrorMessage Component
 * 
 * Displays error messages with appropriate styling based on severity.
 * Can accept either an AppError object or a plain string message.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  message,
  title,
  severity = 'error',
  size = 'default',
  className,
  showIcon = true,
  onDismiss,
  field
}) => {
  // Determine the error details
  const errorDetails = React.useMemo(() => {
    if (isAppError(error)) {
      return {
        message: getUserErrorMessage(error),
        severity: error.severity,
        field: error.field
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        severity: ErrorSeverity.ERROR,
        field: undefined
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        severity: ErrorSeverity.ERROR,
        field: undefined
      };
    }

    if (message) {
      return {
        message,
        severity: severity as ErrorSeverity,
        field
      };
    }

    return null;
  }, [error, message, severity, field]);

  // Don't render if no error to display
  if (!errorDetails) {
    return null;
  }

  // Use error's severity if available, otherwise fall back to prop
  const finalSeverity = errorDetails.severity || (severity as ErrorSeverity);
  const Icon = SeverityIcons[finalSeverity];

  return (
    <Alert 
      className={cn(
        errorMessageVariants({ severity: finalSeverity, size }), 
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-medium mb-1">
            {title}
          </div>
        )}
        
        <AlertDescription className="break-words">
          {errorDetails.field && (
            <span className="font-medium">{errorDetails.field}: </span>
          )}
          {errorDetails.message}
        </AlertDescription>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-current hover:text-opacity-75 focus:outline-none"
          aria-label="Dismiss error"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};

/**
 * Field-specific error message component
 * 
 * Optimized for form field validation errors
 */
export interface FieldErrorProps {
  error?: unknown;
  message?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  message,
  className
}) => {
  const errorMessage = React.useMemo(() => {
    if (isAppError(error)) {
      return getUserErrorMessage(error);
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return message;
  }, [error, message]);

  if (!errorMessage) {
    return null;
  }

  return (
    <p className={cn('text-xs text-red-600 mt-1', className)}>
      {errorMessage}
    </p>
  );
};

/**
 * Multiple errors display component
 * 
 * For displaying a list of related errors
 */
export interface ErrorListProps {
  errors: unknown[];
  title?: string;
  className?: string;
  maxErrors?: number;
  showSeverityIcons?: boolean;
}

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  title = 'Errors',
  className,
  maxErrors = 5,
  showSeverityIcons = true
}) => {
  const validErrors = errors.filter(Boolean).slice(0, maxErrors);
  
  if (validErrors.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h4 className="text-sm font-medium text-red-800">
          {title}
        </h4>
      )}
      
      <div className="space-y-1">
        {validErrors.map((error, index) => (
          <ErrorMessage
            key={index}
            error={error}
            size="sm"
            showIcon={showSeverityIcons}
            className="mb-1 last:mb-0"
          />
        ))}
        
        {errors.length > maxErrors && (
          <p className="text-xs text-red-600 italic">
            ... and {errors.length - maxErrors} more error(s)
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Hook for managing error state in components
 */
export const useErrorState = (initialError?: unknown) => {
  const [error, setError] = React.useState<unknown>(initialError);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const handleError = React.useCallback((newError: unknown) => {
    setError(newError);
  }, []);
  
  return {
    error,
    setError: handleError,
    clearError,
    hasError: !!error
  };
};

export default ErrorMessage;