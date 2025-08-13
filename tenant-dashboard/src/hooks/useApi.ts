import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions, 
  UseMutationOptions,
  UseInfiniteQueryOptions,
  useInfiniteQuery
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { authApi, AuthUtils } from "@/lib/api/auth";
import { tenantApi, workspaceApi } from "@/lib/api";
import { 
  queryKeys, 
  mutationKeys, 
  ApiResponse, 
  PaginatedResponse, 
  FilterOptions,
  QueryFunction,
  MutationFunction,
  PaginatedQueryFunction
} from "@/lib/api/types";
import type { 
  Tenant, 
  User, 
  Workspace, 
  TenantMember,
  ApiError
} from "@/types";

// Generic API hooks
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: QueryFunction<T>,
  options?: Omit<UseQueryOptions<ApiResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function useApiMutation<T, V = any>(
  mutationKey: readonly unknown[],
  mutationFn: MutationFunction<T, V>,
  options?: Omit<UseMutationOptions<ApiResponse<T>, Error, V>, 'mutationKey' | 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey,
    mutationFn,
    onError: (error) => {
      console.error(`Mutation ${mutationKey.join('.')} failed:`, error);
      
      // Show error toast
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    },
    ...options,
  });
}

export function usePaginatedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: PaginatedQueryFunction<T>,
  options?: Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function useInfiniteApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<PaginatedResponse<T>>,
  options?: Omit<UseInfiniteQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) => 
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
    ...options,
  });
}

// Auth hooks
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const userQuery = useApiQuery(
    queryKeys.authUser(),
    () => authApi.getProfile(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if ((error as any)?.status === 401 || (error as any)?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    }
  );

  const loginMutation = useApiMutation(
    mutationKeys.login,
    authApi.login,
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.authUser(), data);
        toast.success('Welcome back!');
        router.push('/dashboard');
      },
      onError: (error) => {
        toast.error('Invalid credentials. Please try again.');
      },
    }
  );

  const logoutMutation = useApiMutation(
    mutationKeys.logout,
    authApi.logout,
    {
      onSuccess: () => {
        queryClient.clear();
        AuthUtils.logout();
        toast.success('You have been logged out');
        router.push('/auth/login');
      },
    }
  );

  const registerMutation = useApiMutation(
    mutationKeys.register,
    authApi.register,
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.authUser(), data);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      },
    }
  );

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

// Tenant hooks
export function useTenant() {
  return useApiQuery(
    queryKeys.tenantCurrent(),
    tenantApi.getCurrent,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useTenantUsage() {
  return useApiQuery(
    queryKeys.tenantUsage(),
    tenantApi.getUsage,
    {
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
}

export function useTenantMembers(filters?: FilterOptions) {
  return usePaginatedQuery(
    queryKeys.tenantMembers(filters),
    () => tenantApi.getMembers(filters)
  );
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    mutationKeys.updateTenant,
    tenantApi.update,
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.tenantCurrent(), data);
        queryClient.invalidateQueries({ queryKey: queryKeys.tenant });
        toast.success('Tenant updated successfully');
      },
    }
  );
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    mutationKeys.inviteMember,
    tenantApi.inviteMember,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantMembers() });
        toast.success('Invitation sent successfully');
      },
    }
  );
}

// Workspace hooks
export function useWorkspaces() {
  return useApiQuery(
    queryKeys.workspaceAll(),
    workspaceApi.getAll
  );
}

export function useWorkspace(id: string, enabled = true) {
  return useApiQuery(
    queryKeys.workspaceById(id),
    () => workspaceApi.getById(id),
    { enabled }
  );
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    mutationKeys.createWorkspaceStandalone,
    workspaceApi.create,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
        toast.success('Workspace created successfully');
      },
    }
  );
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    mutationKeys.updateWorkspace,
    ({ id, ...data }: { id: string; name?: string; description?: string }) => 
      workspaceApi.update(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.setQueryData(queryKeys.workspaceById(variables.id), data);
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
        toast.success('Workspace updated successfully');
      },
    }
  );
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    mutationKeys.deleteWorkspace,
    workspaceApi.delete,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
        toast.success('Workspace deleted successfully');
      },
    }
  );
}

// File upload hook with progress
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
      return apiClient.upload(endpoint, file, additionalData, onProgress);
    },
    onError: (error) => {
      toast.error('File upload failed');
    },
    onSuccess: () => {
      toast.success('File uploaded successfully');
    },
  });
}

// Optimistic updates helper
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

// Error handling hook
export function useApiError() {
  const router = useRouter();

  return {
    handleError: (error: unknown) => {
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        
        switch (apiError.code) {
          case 'UNAUTHORIZED':
            toast.error('Your session has expired. Please log in again.');
            router.push('/auth/login');
            break;
          case 'FORBIDDEN':
            toast.error('You do not have permission to perform this action.');
            break;
          case 'RATE_LIMITED':
            toast.error('Too many requests. Please try again later.');
            break;
          case 'NETWORK_ERROR':
            toast.error('Network error. Please check your connection.');
            break;
          default:
            toast.error(apiError.message || 'An unexpected error occurred.');
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred.');
      }
    },
  };
}

// Real-time data sync hook
export function useRealtimeSync(queryKey: readonly unknown[], enabled = true) {
  const queryClient = useQueryClient();

  // This would integrate with WebSocket connections
  // Implementation depends on your WebSocket setup
  const invalidateQuery = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return { invalidateQuery };
}

// Bulk operations hook
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
    onError: (error) => {
      toast.error(`Bulk operations failed: ${error.message}`);
    },
  });
}