// Re-export types from main types file for API-specific usage
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  FilterOptions,
  SortOption,
  PaginationOptions,
  Pagination,
  ResponseMeta,
  ValidationError,
} from "@/types";

// Additional API-specific types
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
  onUploadProgress?: (progress: number) => void;
  onDownloadProgress?: (progress: number) => void;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Query key factories for React Query
export const queryKeys = {
  // Auth queries
  auth: ['auth'] as const,
  authUser: () => [...queryKeys.auth, 'user'] as const,
  authSessions: () => [...queryKeys.auth, 'sessions'] as const,

  // Tenant queries
  tenant: ['tenant'] as const,
  tenantCurrent: () => [...queryKeys.tenant, 'current'] as const,
  tenantUsage: () => [...queryKeys.tenant, 'usage'] as const,
  tenantMembers: (filters?: FilterOptions) => [...queryKeys.tenant, 'members', filters] as const,
  tenantWorkspaces: (filters?: FilterOptions) => [...queryKeys.tenant, 'workspaces', filters] as const,
  tenantBilling: () => [...queryKeys.tenant, 'billing'] as const,
  tenantInvoices: (filters?: FilterOptions) => [...queryKeys.tenant, 'invoices', filters] as const,
  tenantSettings: () => [...queryKeys.tenant, 'settings'] as const,
  tenantApiKeys: () => [...queryKeys.tenant, 'api-keys'] as const,
  tenantWebhooks: () => [...queryKeys.tenant, 'webhooks'] as const,
  tenantAuditLogs: (filters?: FilterOptions) => [...queryKeys.tenant, 'audit', filters] as const,
  tenantActivityLogs: (filters?: FilterOptions) => [...queryKeys.tenant, 'activity', filters] as const,

  // Workspace queries
  workspace: ['workspace'] as const,
  workspaceAll: () => [...queryKeys.workspace, 'all'] as const,
  workspaceById: (id: string) => [...queryKeys.workspace, 'detail', id] as const,
  workspaceMembers: (id: string) => [...queryKeys.workspace, 'members', id] as const,

  // Airtable queries
  airtable: ['airtable'] as const,
  airtableBases: () => [...queryKeys.airtable, 'bases'] as const,
  airtableBase: (baseId: string) => [...queryKeys.airtable, 'base', baseId] as const,
  airtableTable: (baseId: string, tableId: string) => [...queryKeys.airtable, 'table', baseId, tableId] as const,
  airtableRecords: (baseId: string, tableId: string, filters?: FilterOptions) => 
    [...queryKeys.airtable, 'records', baseId, tableId, filters] as const,

  // Analytics queries
  analytics: ['analytics'] as const,
  analyticsUsage: (period?: string) => [...queryKeys.analytics, 'usage', period] as const,
  analyticsPerformance: (period?: string) => [...queryKeys.analytics, 'performance', period] as const,
  analyticsReports: (type: string, period?: string) => [...queryKeys.analytics, 'reports', type, period] as const,

  // System metrics queries
  systemMetrics: () => ['system', 'metrics'] as const,
} as const;

// Mutation keys for React Query
export const mutationKeys = {
  // Auth mutations
  login: ['auth', 'login'] as const,
  register: ['auth', 'register'] as const,
  logout: ['auth', 'logout'] as const,
  refreshToken: ['auth', 'refresh'] as const,
  changePassword: ['auth', 'change-password'] as const,
  resetPassword: ['auth', 'reset-password'] as const,
  verifyEmail: ['auth', 'verify-email'] as const,
  setupTwoFactor: ['auth', 'setup-2fa'] as const,
  verifyTwoFactor: ['auth', 'verify-2fa'] as const,

  // Tenant mutations
  updateTenant: ['tenant', 'update'] as const,
  inviteMember: ['tenant', 'invite-member'] as const,
  updateMemberRole: ['tenant', 'update-member-role'] as const,
  removeMember: ['tenant', 'remove-member'] as const,
  createWorkspace: ['tenant', 'create-workspace'] as const,
  updateBilling: ['tenant', 'update-billing'] as const,
  updateSettings: ['tenant', 'update-settings'] as const,
  createApiKey: ['tenant', 'create-api-key'] as const,
  revokeApiKey: ['tenant', 'revoke-api-key'] as const,
  createWebhook: ['tenant', 'create-webhook'] as const,
  updateWebhook: ['tenant', 'update-webhook'] as const,
  deleteWebhook: ['tenant', 'delete-webhook'] as const,

  // Workspace mutations
  createWorkspaceStandalone: ['workspace', 'create'] as const,
  updateWorkspace: ['workspace', 'update'] as const,
  deleteWorkspace: ['workspace', 'delete'] as const,
  addWorkspaceMember: ['workspace', 'add-member'] as const,
  removeWorkspaceMember: ['workspace', 'remove-member'] as const,
  updateWorkspaceMemberRole: ['workspace', 'update-member-role'] as const,

  // Airtable mutations
  createAirtableBase: ['airtable', 'create-base'] as const,
  updateAirtableBase: ['airtable', 'update-base'] as const,
  deleteAirtableBase: ['airtable', 'delete-base'] as const,
  createAirtableRecord: ['airtable', 'create-record'] as const,
  updateAirtableRecord: ['airtable', 'update-record'] as const,
  deleteAirtableRecord: ['airtable', 'delete-record'] as const,
  bulkUpdateRecords: ['airtable', 'bulk-update'] as const,
  bulkDeleteRecords: ['airtable', 'bulk-delete'] as const,

  // File mutations
  uploadFile: ['file', 'upload'] as const,
  deleteFile: ['file', 'delete'] as const,
} as const;

// Error handling types
export interface ApiErrorContext {
  endpoint: string;
  method: HttpMethod;
  requestData?: any;
  timestamp: string;
  userAgent: string;
  userId?: string;
  tenantId?: string;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  factor: number;
  maxDelay: number;
  shouldRetry: (error: any) => boolean;
}

// Request/Response interceptor types
export interface RequestInterceptor {
  onRequest?: (config: RequestInit & { url: string }) => RequestInit & { url: string };
  onRequestError?: (error: any) => Promise<any>;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onResponseError?: (error: any) => Promise<any>;
}

// WebSocket types for real-time features
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

export interface RealtimeEvent {
  type: 'create' | 'update' | 'delete' | 'sync';
  resource: string;
  resourceId: string;
  data: any;
  userId?: string;
  timestamp: string;
}

// Cache configuration types
export interface CacheConfig {
  staleTime: number;
  cacheTime: number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
  refetchInterval?: number;
}

// Optimistic update types
export interface OptimisticUpdate<T> {
  type: 'add' | 'update' | 'remove';
  data: T;
  rollback: () => void;
}

// Background sync types
export interface SyncConfig {
  enabled: boolean;
  interval: number;
  retryOnFailure: boolean;
  conflictResolution: 'client' | 'server' | 'manual';
}

// Export utility type helpers
export type QueryKey = readonly unknown[];
export type MutationKey = readonly unknown[];

// Generic API operation types
export type QueryFunction<T> = () => Promise<ApiResponse<T>>;
export type QueryFunctionWithParams<T, P = any> = (params: P) => Promise<ApiResponse<T>>;
export type PaginatedQueryFunction<T> = (params?: FilterOptions) => Promise<PaginatedResponse<T>>;
export type MutationFunction<T, V = any> = (variables: V) => Promise<ApiResponse<T>>;

// Status types for UI components
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
export type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'reconnecting';

// Export type guards
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
};

export const isValidationError = (error: any): error is ValidationError => {
  return error && typeof error === 'object' && 'field' in error && 'message' in error;
};

export const isPaginatedResponse = <T>(response: any): response is PaginatedResponse<T> => {
  return response && typeof response === 'object' && 'data' in response && 'pagination' in response;
};