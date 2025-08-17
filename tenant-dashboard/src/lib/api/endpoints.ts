import { apiClient } from './client';

// Local API client for Next.js routes to avoid CORS issues
class LocalApiClient {
  async get<T>(endpoint: string): Promise<{ data: T }> {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }
}

const localApiClient = new LocalApiClient();
import { authApi } from './auth';
import { ApiResponse, PaginatedResponse, FilterOptions } from '@/types';
import type { 
  Tenant, 
  User, 
  Workspace, 
  TenantMember,
  WorkspaceMember,
  ActivityLog,
  AuditLog,
  BillingInfo,
  Invoice,
  ApiKey,
  Webhook,
  TenantSettings,
  TenantUsage,
  Session,
  DataExport
} from '@/types';

// ===== TENANT ENDPOINTS =====
export const tenantEndpoints = {
  // Core tenant operations
  getCurrent: (): Promise<ApiResponse<Tenant>> =>
    localApiClient.get('/api/tenant/current'),

  update: (data: Partial<Tenant>): Promise<ApiResponse<Tenant>> =>
    apiClient.put('/tenant', data),

  delete: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete('/tenant'),

  // Usage and analytics
  getUsage: (period?: 'current' | 'previous' | 'year'): Promise<ApiResponse<TenantUsage>> =>
    apiClient.get('/tenant/usage', period ? { period } : undefined),

  getUsageHistory: (filters?: FilterOptions): Promise<PaginatedResponse<any>> =>
    apiClient.getMany('/tenant/usage/history', filters),

  // Member management
  getMembers: (filters?: FilterOptions): Promise<PaginatedResponse<TenantMember>> =>
    apiClient.getMany('/tenant/members', filters),

  getMember: (memberId: string): Promise<ApiResponse<TenantMember>> =>
    apiClient.get(`/tenant/members/${memberId}`),

  inviteMember: (data: { email: string; role: string; message?: string }): Promise<ApiResponse<TenantMember>> =>
    apiClient.post('/tenant/members/invite', data),

  updateMemberRole: (memberId: string, data: { role: string }): Promise<ApiResponse<TenantMember>> =>
    apiClient.put(`/tenant/members/${memberId}/role`, data),

  removeMember: (memberId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/tenant/members/${memberId}`),

  resendInvitation: (memberId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.post(`/tenant/members/${memberId}/resend-invite`),

  // Workspace management
  getWorkspaces: (filters?: FilterOptions): Promise<PaginatedResponse<Workspace>> =>
    apiClient.getMany('/tenant/workspaces', filters),

  createWorkspace: (data: { name: string; description?: string; visibility?: 'private' | 'team' | 'tenant' }): Promise<ApiResponse<Workspace>> =>
    apiClient.post('/tenant/workspaces', data),

  // Settings
  getSettings: (): Promise<ApiResponse<TenantSettings>> =>
    apiClient.get('/tenant/settings'),

  updateSettings: (data: Partial<TenantSettings>): Promise<ApiResponse<TenantSettings>> =>
    apiClient.put('/tenant/settings', data),

  // Billing
  getBilling: (): Promise<ApiResponse<BillingInfo>> =>
    apiClient.get('/tenant/billing'),

  updateBilling: (data: Partial<BillingInfo>): Promise<ApiResponse<BillingInfo>> =>
    apiClient.put('/tenant/billing', data),

  getInvoices: (filters?: FilterOptions): Promise<PaginatedResponse<Invoice>> =>
    apiClient.getMany('/tenant/billing/invoices', filters),

  downloadInvoice: (invoiceId: string): Promise<Blob> =>
    apiClient.get(`/tenant/billing/invoices/${invoiceId}/download`),

  // API Keys
  getApiKeys: (): Promise<ApiResponse<ApiKey[]>> =>
    apiClient.get('/tenant/api-keys'),

  createApiKey: (data: { name: string; permissions: string[]; expiresAt?: string }): Promise<ApiResponse<ApiKey>> =>
    apiClient.post('/tenant/api-keys', data),

  updateApiKey: (keyId: string, data: { name?: string; permissions?: string[] }): Promise<ApiResponse<ApiKey>> =>
    apiClient.put(`/tenant/api-keys/${keyId}`, data),

  revokeApiKey: (keyId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/tenant/api-keys/${keyId}`),

  // Webhooks
  getWebhooks: (): Promise<ApiResponse<Webhook[]>> =>
    apiClient.get('/tenant/webhooks'),

  createWebhook: (data: { name: string; url: string; events: string[]; secret?: string }): Promise<ApiResponse<Webhook>> =>
    apiClient.post('/tenant/webhooks', data),

  updateWebhook: (webhookId: string, data: Partial<Webhook>): Promise<ApiResponse<Webhook>> =>
    apiClient.put(`/tenant/webhooks/${webhookId}`, data),

  deleteWebhook: (webhookId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/tenant/webhooks/${webhookId}`),

  testWebhook: (webhookId: string): Promise<ApiResponse<{ success: boolean; response: any }>> =>
    apiClient.post(`/tenant/webhooks/${webhookId}/test`),

  // Activity and audit logs
  getActivityLogs: (filters?: FilterOptions): Promise<PaginatedResponse<ActivityLog>> =>
    apiClient.getMany('/tenant/activity', filters),

  getAuditLogs: (filters?: FilterOptions): Promise<PaginatedResponse<AuditLog>> =>
    apiClient.getMany('/tenant/audit', filters),

  // Data export
  requestDataExport: (type: 'full' | 'partial', format: 'json' | 'csv' | 'excel'): Promise<ApiResponse<DataExport>> =>
    apiClient.post('/tenant/export', { type, format }),

  getDataExports: (): Promise<ApiResponse<DataExport[]>> =>
    apiClient.get('/tenant/exports'),

  downloadDataExport: (exportId: string): Promise<Blob> =>
    apiClient.get(`/tenant/exports/${exportId}/download`),

  // Sessions
  getSessions: (): Promise<ApiResponse<Session[]>> =>
    apiClient.get('/tenant/sessions'),

  revokeSession: (sessionId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/tenant/sessions/${sessionId}`),

  revokeAllSessions: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete('/tenant/sessions/all'),
};

// ===== WORKSPACE ENDPOINTS =====
export const workspaceEndpoints = {
  // Core workspace operations
  getAll: (): Promise<ApiResponse<Workspace[]>> =>
    apiClient.get('/workspaces'),

  getById: (id: string): Promise<ApiResponse<Workspace>> =>
    apiClient.get(`/workspaces/${id}`),

  create: (data: { name: string; description?: string; visibility?: 'private' | 'team' | 'tenant' }): Promise<ApiResponse<Workspace>> =>
    apiClient.post('/workspaces', data),

  update: (id: string, data: { name?: string; description?: string; visibility?: 'private' | 'team' | 'tenant' }): Promise<ApiResponse<Workspace>> =>
    apiClient.put(`/workspaces/${id}`, data),

  delete: (id: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/workspaces/${id}`),

  archive: (id: string): Promise<ApiResponse<Workspace>> =>
    apiClient.put(`/workspaces/${id}/archive`),

  restore: (id: string): Promise<ApiResponse<Workspace>> =>
    apiClient.put(`/workspaces/${id}/restore`),

  // Member management
  getMembers: (workspaceId: string): Promise<ApiResponse<WorkspaceMember[]>> =>
    apiClient.get(`/workspaces/${workspaceId}/members`),

  addMember: (workspaceId: string, data: { userId: string; role: 'owner' | 'editor' | 'commenter' | 'viewer' }): Promise<ApiResponse<WorkspaceMember>> =>
    apiClient.post(`/workspaces/${workspaceId}/members`, data),

  updateMemberRole: (workspaceId: string, userId: string, data: { role: 'owner' | 'editor' | 'commenter' | 'viewer' }): Promise<ApiResponse<WorkspaceMember>> =>
    apiClient.put(`/workspaces/${workspaceId}/members/${userId}`, data),

  removeMember: (workspaceId: string, userId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),

  // Tables and data
  getTables: (workspaceId: string): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/workspaces/${workspaceId}/tables`),

  getTable: (workspaceId: string, tableId: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/workspaces/${workspaceId}/tables/${tableId}`),

  createTable: (workspaceId: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.post(`/workspaces/${workspaceId}/tables`, data),

  updateTable: (workspaceId: string, tableId: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/workspaces/${workspaceId}/tables/${tableId}`, data),

  deleteTable: (workspaceId: string, tableId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/workspaces/${workspaceId}/tables/${tableId}`),

  // Records
  getRecords: (workspaceId: string, tableId: string, filters?: FilterOptions): Promise<PaginatedResponse<any>> =>
    apiClient.getMany(`/workspaces/${workspaceId}/tables/${tableId}/records`, filters),

  getRecord: (workspaceId: string, tableId: string, recordId: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/workspaces/${workspaceId}/tables/${tableId}/records/${recordId}`),

  createRecord: (workspaceId: string, tableId: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.post(`/workspaces/${workspaceId}/tables/${tableId}/records`, data),

  updateRecord: (workspaceId: string, tableId: string, recordId: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/workspaces/${workspaceId}/tables/${tableId}/records/${recordId}`, data),

  deleteRecord: (workspaceId: string, tableId: string, recordId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/workspaces/${workspaceId}/tables/${tableId}/records/${recordId}`),

  bulkCreateRecords: (workspaceId: string, tableId: string, data: { records: any[] }): Promise<ApiResponse<any[]>> =>
    apiClient.post(`/workspaces/${workspaceId}/tables/${tableId}/records/bulk`, data),

  bulkUpdateRecords: (workspaceId: string, tableId: string, data: { records: any[] }): Promise<ApiResponse<any[]>> =>
    apiClient.put(`/workspaces/${workspaceId}/tables/${tableId}/records/bulk`, data),

  bulkDeleteRecords: (workspaceId: string, tableId: string, data: { recordIds: string[] }): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/workspaces/${workspaceId}/tables/${tableId}/records/bulk`, data),

  // Templates
  getTemplates: (workspaceId: string): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/workspaces/${workspaceId}/templates`),

  createTemplate: (workspaceId: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.post(`/workspaces/${workspaceId}/templates`, data),

  applyTemplate: (workspaceId: string, templateId: string): Promise<ApiResponse<any>> =>
    apiClient.post(`/workspaces/${workspaceId}/templates/${templateId}/apply`),
};

// ===== USER/PROFILE ENDPOINTS =====
export const userEndpoints = {
  // Profile management
  getProfile: (): Promise<ApiResponse<User>> =>
    apiClient.get('/user/profile'),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put('/user/profile', data),

  uploadAvatar: (file: File): Promise<ApiResponse<{ avatarUrl: string }>> =>
    apiClient.upload('/user/avatar', file),

  deleteAvatar: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete('/user/avatar'),

  // Preferences
  getPreferences: (): Promise<ApiResponse<any>> =>
    apiClient.get('/user/preferences'),

  updatePreferences: (data: any): Promise<ApiResponse<any>> =>
    apiClient.put('/user/preferences', data),

  // Notifications
  getNotifications: (filters?: FilterOptions): Promise<PaginatedResponse<any>> =>
    apiClient.getMany('/user/notifications', filters),

  markNotificationRead: (notificationId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.put(`/user/notifications/${notificationId}/read`),

  markAllNotificationsRead: (): Promise<ApiResponse<{ message: string }>> =>
    apiClient.put('/user/notifications/read-all'),

  deleteNotification: (notificationId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/user/notifications/${notificationId}`),
};

// ===== ANALYTICS ENDPOINTS =====
export const analyticsEndpoints = {
  // Usage analytics
  getUsageMetrics: (period?: string): Promise<ApiResponse<any>> =>
    apiClient.get('/analytics/usage', period ? { period } : undefined),

  getPerformanceMetrics: (period?: string): Promise<ApiResponse<any>> =>
    apiClient.get('/analytics/performance', period ? { period } : undefined),

  // Custom reports
  getReports: (): Promise<ApiResponse<any[]>> =>
    apiClient.get('/analytics/reports'),

  createReport: (data: any): Promise<ApiResponse<any>> =>
    apiClient.post('/analytics/reports', data),

  getReport: (reportId: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/analytics/reports/${reportId}`),

  updateReport: (reportId: string, data: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/analytics/reports/${reportId}`, data),

  deleteReport: (reportId: string): Promise<ApiResponse<{ message: string }>> =>
    apiClient.delete(`/analytics/reports/${reportId}`),

  generateReport: (reportId: string, params?: any): Promise<ApiResponse<any>> =>
    apiClient.post(`/analytics/reports/${reportId}/generate`, params),
};

// ===== SYSTEM ENDPOINTS =====
export const systemEndpoints = {
  // Health and status
  getHealth: (): Promise<ApiResponse<{ status: string; services: any[] }>> =>
    apiClient.get('/system/health'),

  getStatus: (): Promise<ApiResponse<{ version: string; uptime: number; environment: string }>> =>
    apiClient.get('/system/status'),

  // Metrics
  getMetrics: (): Promise<ApiResponse<any>> =>
    apiClient.get('/system/metrics'),

  // Configuration
  getConfig: (): Promise<ApiResponse<any>> =>
    apiClient.get('/system/config'),
};

// Export all endpoints as a unified API
export const api = {
  auth: authApi,
  tenant: tenantEndpoints,
  workspace: workspaceEndpoints,
  user: userEndpoints,
  analytics: analyticsEndpoints,
  system: systemEndpoints,
};

export default api;