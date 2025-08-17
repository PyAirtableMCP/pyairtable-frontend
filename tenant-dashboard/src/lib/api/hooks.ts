import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions, 
  UseMutationOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { api } from './endpoints';
import { queryKeys, mutationKeys } from './types';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  FilterOptions,
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

// ===== AUTHENTICATION HOOKS =====
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: queryKeys.authUser(),
    queryFn: () => api.auth.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const loginMutation = useMutation({
    mutationKey: mutationKeys.login,
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.authUser(), data);
      toast.success('Welcome back!');
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Invalid credentials. Please try again.');
    },
  });

  const logoutMutation = useMutation({
    mutationKey: mutationKeys.logout,
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('You have been logged out');
      router.push('/auth/login');
    },
  });

  const registerMutation = useMutation({
    mutationKey: mutationKeys.register,
    mutationFn: api.auth.register,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.authUser(), data);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    },
  });

  return {
    user: userQuery.data?.data,
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    isAuthenticated: !!userQuery.data?.data && !userQuery.isError,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}

// ===== TENANT HOOKS =====
export function useTenant() {
  return useQuery({
    queryKey: queryKeys.tenantCurrent(),
    queryFn: api.tenant.getCurrent,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTenantUsage(period?: 'current' | 'previous' | 'year') {
  return useQuery({
    queryKey: queryKeys.tenantUsage(),
    queryFn: () => api.tenant.getUsage(period),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useTenantMembers(filters?: FilterOptions) {
  return useQuery({
    queryKey: queryKeys.tenantMembers(filters),
    queryFn: () => api.tenant.getMembers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTenantMember(memberId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.tenantMembers(), 'detail', memberId],
    queryFn: () => api.tenant.getMember(memberId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTenantWorkspaces(filters?: FilterOptions) {
  return useQuery({
    queryKey: queryKeys.tenantWorkspaces(filters),
    queryFn: () => api.tenant.getWorkspaces(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTenantSettings() {
  return useQuery({
    queryKey: queryKeys.tenantSettings(),
    queryFn: api.tenant.getSettings,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTenantBilling() {
  return useQuery({
    queryKey: queryKeys.tenantBilling(),
    queryFn: api.tenant.getBilling,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTenantInvoices(filters?: FilterOptions) {
  return useQuery({
    queryKey: queryKeys.tenantInvoices(filters),
    queryFn: () => api.tenant.getInvoices(filters),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTenantApiKeys() {
  return useQuery({
    queryKey: queryKeys.tenantApiKeys(),
    queryFn: api.tenant.getApiKeys,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTenantWebhooks() {
  return useQuery({
    queryKey: queryKeys.tenantWebhooks(),
    queryFn: api.tenant.getWebhooks,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTenantActivityLogs(filters?: FilterOptions) {
  return useQuery({
    queryKey: queryKeys.tenantActivityLogs(filters),
    queryFn: () => api.tenant.getActivityLogs(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTenantAuditLogs(filters?: FilterOptions) {
  return useQuery({
    queryKey: queryKeys.tenantAuditLogs(filters),
    queryFn: () => api.tenant.getAuditLogs(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useTenantSessions() {
  return useQuery({
    queryKey: [...queryKeys.tenant, 'sessions'],
    queryFn: api.tenant.getSessions,
    staleTime: 60 * 1000,
  });
}

// ===== TENANT MUTATIONS =====
export function useUpdateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.updateTenant,
    mutationFn: api.tenant.update,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenantCurrent(), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.tenant });
      toast.success('Tenant updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tenant');
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.inviteMember,
    mutationFn: api.tenant.inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantMembers() });
      toast.success('Invitation sent successfully');
    },
    onError: () => {
      toast.error('Failed to send invitation');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.updateMemberRole,
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.tenant.updateMemberRole(memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantMembers() });
      toast.success('Member role updated successfully');
    },
    onError: () => {
      toast.error('Failed to update member role');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.removeMember,
    mutationFn: api.tenant.removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantMembers() });
      toast.success('Member removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.updateSettings,
    mutationFn: api.tenant.updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenantSettings(), data);
      toast.success('Settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.createApiKey,
    mutationFn: api.tenant.createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantApiKeys() });
      toast.success('API key created successfully');
    },
    onError: () => {
      toast.error('Failed to create API key');
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.revokeApiKey,
    mutationFn: api.tenant.revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantApiKeys() });
      toast.success('API key revoked successfully');
    },
    onError: () => {
      toast.error('Failed to revoke API key');
    },
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.createWebhook,
    mutationFn: api.tenant.createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantWebhooks() });
      toast.success('Webhook created successfully');
    },
    onError: () => {
      toast.error('Failed to create webhook');
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.updateWebhook,
    mutationFn: ({ webhookId, data }: { webhookId: string; data: Partial<Webhook> }) =>
      api.tenant.updateWebhook(webhookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantWebhooks() });
      toast.success('Webhook updated successfully');
    },
    onError: () => {
      toast.error('Failed to update webhook');
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.deleteWebhook,
    mutationFn: api.tenant.deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantWebhooks() });
      toast.success('Webhook deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete webhook');
    },
  });
}

// ===== WORKSPACE HOOKS =====
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaceAll(),
    queryFn: api.workspace.getAll,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWorkspace(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workspaceById(id),
    queryFn: () => api.workspace.getById(id),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkspaceMembers(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workspaceMembers(workspaceId),
    queryFn: () => api.workspace.getMembers(workspaceId),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWorkspaceTables(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.workspace, 'tables', workspaceId],
    queryFn: () => api.workspace.getTables(workspaceId),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useWorkspaceTable(workspaceId: string, tableId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.airtableTable(workspaceId, tableId),
    queryFn: () => api.workspace.getTable(workspaceId, tableId),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useWorkspaceRecords(workspaceId: string, tableId: string, filters?: FilterOptions, enabled = true) {
  return useQuery({
    queryKey: queryKeys.airtableRecords(workspaceId, tableId, filters),
    queryFn: () => api.workspace.getRecords(workspaceId, tableId, filters),
    enabled,
    staleTime: 30 * 1000, // 30 seconds for real-time feel
  });
}

// ===== WORKSPACE MUTATIONS =====
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.createWorkspaceStandalone,
    mutationFn: api.workspace.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantWorkspaces() });
      toast.success('Workspace created successfully');
    },
    onError: () => {
      toast.error('Failed to create workspace');
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.updateWorkspace,
    mutationFn: ({ id, ...data }: { id: string } & Partial<Workspace>) => 
      api.workspace.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.workspaceById(variables.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      toast.success('Workspace updated successfully');
    },
    onError: () => {
      toast.error('Failed to update workspace');
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.deleteWorkspace,
    mutationFn: api.workspace.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenantWorkspaces() });
      toast.success('Workspace deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete workspace');
    },
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.addWorkspaceMember,
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role: string }) =>
      api.workspace.addMember(workspaceId, { userId, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(variables.workspaceId) });
      toast.success('Member added successfully');
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.removeWorkspaceMember,
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      api.workspace.removeMember(workspaceId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(variables.workspaceId) });
      toast.success('Member removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.createAirtableRecord,
    mutationFn: ({ workspaceId, tableId, data }: { workspaceId: string; tableId: string; data: any }) =>
      api.workspace.createRecord(workspaceId, tableId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.airtableRecords(variables.workspaceId, variables.tableId) 
      });
      toast.success('Record created successfully');
    },
    onError: () => {
      toast.error('Failed to create record');
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.updateAirtableRecord,
    mutationFn: ({ workspaceId, tableId, recordId, data }: { workspaceId: string; tableId: string; recordId: string; data: any }) =>
      api.workspace.updateRecord(workspaceId, tableId, recordId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.airtableRecords(variables.workspaceId, variables.tableId) 
      });
      toast.success('Record updated successfully');
    },
    onError: () => {
      toast.error('Failed to update record');
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: mutationKeys.deleteAirtableRecord,
    mutationFn: ({ workspaceId, tableId, recordId }: { workspaceId: string; tableId: string; recordId: string }) =>
      api.workspace.deleteRecord(workspaceId, tableId, recordId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.airtableRecords(variables.workspaceId, variables.tableId) 
      });
      toast.success('Record deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete record');
    },
  });
}

// ===== USER HOOKS =====
export function useUserProfile() {
  return useQuery({
    queryKey: [...queryKeys.auth, 'profile'],
    queryFn: api.user.getProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserNotifications(filters?: FilterOptions) {
  return useQuery({
    queryKey: [...queryKeys.auth, 'notifications', filters],
    queryFn: () => api.user.getNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds for notifications
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.user.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.auth, 'profile'], data);
      queryClient.setQueryData(queryKeys.authUser(), data);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}

// ===== ANALYTICS HOOKS =====
export function useUsageMetrics(period?: string) {
  return useQuery({
    queryKey: queryKeys.analyticsUsage(period),
    queryFn: () => api.analytics.getUsageMetrics(period),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePerformanceMetrics(period?: string) {
  return useQuery({
    queryKey: queryKeys.analyticsPerformance(period),
    queryFn: () => api.analytics.getPerformanceMetrics(period),
    staleTime: 5 * 60 * 1000,
  });
}

// ===== SYSTEM HOOKS =====
export function useSystemHealth() {
  return useQuery({
    queryKey: [...queryKeys.systemMetrics(), 'health'],
    queryFn: api.system.getHealth,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Check every minute
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: [...queryKeys.systemMetrics(), 'status'],
    queryFn: api.system.getStatus,
    staleTime: 5 * 60 * 1000,
  });
}

// ===== FILE UPLOAD HOOK =====
export function useFileUpload() {
  return useMutation({
    mutationFn: async ({ 
      endpoint, 
      file, 
      additionalData, 
      onProgress 
    }: {
      endpoint: string;
      file: File;
      additionalData?: Record<string, any>;
      onProgress?: (progress: number) => void;
    }) => {
      return api.tenant.uploadFile ? api.tenant.uploadFile(endpoint, file, additionalData, onProgress) : Promise.reject('Upload not implemented');
    },
    onError: () => {
      toast.error('File upload failed');
    },
    onSuccess: () => {
      toast.success('File uploaded successfully');
    },
  });
}

// ===== INFINITE QUERY HOOKS =====
export function useInfiniteActivityLogs(filters?: FilterOptions) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.tenantActivityLogs(filters), 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      api.tenant.getActivityLogs({ ...filters, pagination: { page: pageParam, limit: 20 } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 30 * 1000,
  });
}

export function useInfiniteRecords(workspaceId: string, tableId: string, filters?: FilterOptions) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.airtableRecords(workspaceId, tableId, filters), 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      api.workspace.getRecords(workspaceId, tableId, { ...filters, pagination: { page: pageParam, limit: 50 } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 30 * 1000,
  });
}

// ===== OPTIMISTIC UPDATE HELPERS =====
export function useOptimisticUpdate<T>(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  return {
    updateOptimistically: (updater: (oldData: T) => T) => {
      queryClient.setQueryData(queryKey, updater);
    },
    rollback: (previousData: T) => {
      queryClient.setQueryData(queryKey, previousData);
    },
  };
}

// ===== BULK OPERATIONS =====
export function useBulkOperations<T>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      operations,
      queryKey
    }: {
      operations: Array<() => Promise<any>>;
      queryKey: readonly unknown[];
    }) => {
      const results = await Promise.allSettled(operations.map(op => op()));
      const failures = results.filter((result): result is PromiseRejectedResult => 
        result.status === 'rejected'
      );
      
      if (failures.length > 0) {
        throw new Error(`${failures.length} operations failed`);
      }
      
      return results;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });
      toast.success('Bulk operations completed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Bulk operations failed: ${error.message}`);
    },
  });
}