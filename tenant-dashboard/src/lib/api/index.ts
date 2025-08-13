// Re-export the enhanced API client
export { apiClient, ApiErrorImpl } from './client';

// Re-export auth utilities
export { authApi, AuthUtils, TokenManager } from './auth';

// Re-export types
export * from './types';

// Re-export existing API functions from the main api.ts file
export { 
  tenantApi, 
  workspaceApi, 
  handleApiError 
} from '../api';

// Additional utility exports for convenience
export { isApiError, isPaginatedResponse, isValidationError } from './types';