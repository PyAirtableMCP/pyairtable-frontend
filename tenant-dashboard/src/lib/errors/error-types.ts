/**
 * Centralized Error Type Definitions
 * 
 * This module defines standardized error types and severity levels
 * to ensure consistent error handling across the application.
 */

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning', 
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Standard error codes for common scenarios
export enum ErrorCode {
  // Network & API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED', 
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business logic errors
  OPERATION_FAILED = 'OPERATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

// Base interface for all application errors
export interface BaseError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  field?: string;
  requestId?: string;
}

// Standard error class implementing BaseError
export class AppError extends Error implements BaseError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly field?: string;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>,
    field?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
    this.field = field;
    this.requestId = requestId;

    // Maintains proper stack trace for V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  // Convert to plain object for logging/serialization
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      field: this.field,
      requestId: this.requestId,
      stack: this.stack
    };
  }
}

// Validation-specific error class
export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    context?: Record<string, any>
  ) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message,
      ErrorSeverity.WARNING,
      context,
      field
    );
    this.name = 'ValidationError';
  }
}

// Network/API-specific error class
export class NetworkError extends AppError {
  constructor(
    message: string,
    statusCode?: number,
    requestId?: string,
    context?: Record<string, any>
  ) {
    const severity = statusCode && statusCode >= 500 
      ? ErrorSeverity.CRITICAL 
      : ErrorSeverity.ERROR;

    super(
      ErrorCode.NETWORK_ERROR,
      message,
      severity,
      { ...context, statusCode },
      undefined,
      requestId
    );
    this.name = 'NetworkError';
  }
}

// Permission-specific error class
export class PermissionError extends AppError {
  constructor(
    message: string = 'You do not have permission to perform this action',
    context?: Record<string, any>
  ) {
    super(
      ErrorCode.PERMISSION_DENIED,
      message,
      ErrorSeverity.WARNING,
      context
    );
    this.name = 'PermissionError';
  }
}

// Type guard functions
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isValidationError = (error: any): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: any): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isPermissionError = (error: any): error is PermissionError => {
  return error instanceof PermissionError;
};

// User-friendly error message mapping
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ErrorCode.API_ERROR]: 'A server error occurred. Please try again later.',
  [ErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.REQUIRED_FIELD]: 'This field is required.',
  [ErrorCode.INVALID_FORMAT]: 'Please enter a valid value.',
  [ErrorCode.OPERATION_FAILED]: 'The operation could not be completed. Please try again.',
  [ErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  [ErrorCode.RESOURCE_CONFLICT]: 'This resource is currently being used and cannot be modified.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.CONFIGURATION_ERROR]: 'A configuration error occurred. Please contact support.'
};