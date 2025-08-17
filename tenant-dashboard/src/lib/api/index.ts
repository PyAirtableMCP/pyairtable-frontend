// Core API infrastructure
export { apiClient, ApiErrorImpl } from './client';
export { authApi, AuthUtils, TokenManager } from './auth';
export * from './types';
export * from './interceptors';

// API endpoints and hooks
export * from './endpoints';
export * from './hooks';

// Legacy API functions for backward compatibility
export { 
  tenantApi, 
  workspaceApi, 
  handleApiError 
} from '../api';

// Utility exports
export { isApiError, isPaginatedResponse, isValidationError } from './types';

// Main API instance as default export
export { api as default } from './endpoints';