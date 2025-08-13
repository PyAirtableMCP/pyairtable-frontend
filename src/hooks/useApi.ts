import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, airtableClient } from "@/lib/api/client"
import {
  ApiResponse,
  QueryKeys,
  AirtableBaseResponse,
  AirtableTableResponse,
  AirtableRecordResponse,
  ChatSessionResponse,
  ChatMessageResponse,
  UsageStatisticsResponse,
  DashboardMetricsResponse,
  SystemStatusResponse,
  UserSettingsResponse,
  MCPToolResponse,
  LoginRequest,
  LoginResponse,
  ChatMessageRequest,
  CreateRecordRequest,
  UpdateRecordRequest,
  UpdateSettingsRequest,
  PaginatedResponse,
} from "@/lib/api/types"

// Authentication Hooks
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>("/auth/login", credentials)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Login failed")
      }
      return response.data
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post("/auth/logout")
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await apiClient.post("/auth/refresh", { refreshToken })
      if (!response.success || !response.data) {
        throw new Error(response.error || "Token refresh failed")
      }
      return response.data
    },
  })
}

// Airtable Hooks
export function useAirtableBases() {
  return useQuery({
    queryKey: QueryKeys.bases,
    queryFn: async (): Promise<AirtableBaseResponse[]> => {
      const response = await airtableClient.get<AirtableBaseResponse[]>("/bases")
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch bases")
      }
      return response.data
    },
  })
}

export function useAirtableBase(baseId: string) {
  return useQuery({
    queryKey: QueryKeys.base(baseId),
    queryFn: async (): Promise<AirtableBaseResponse> => {
      const response = await airtableClient.get<AirtableBaseResponse>(`/bases/${baseId}`)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch base")
      }
      return response.data
    },
    enabled: !!baseId,
  })
}

export function useAirtableTables(baseId: string) {
  return useQuery({
    queryKey: QueryKeys.tables(baseId),
    queryFn: async (): Promise<AirtableTableResponse[]> => {
      const response = await airtableClient.get<AirtableTableResponse[]>(`/bases/${baseId}/tables`)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch tables")
      }
      return response.data
    },
    enabled: !!baseId,
  })
}

export function useAirtableRecords(
  baseId: string, 
  tableId: string, 
  params?: Record<string, any>
) {
  return useQuery({
    queryKey: QueryKeys.records(baseId, tableId, params),
    queryFn: async (): Promise<PaginatedResponse<AirtableRecordResponse>> => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value))
          }
        })
      }
      
      const endpoint = `/bases/${baseId}/tables/${tableId}/records${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`
      
      const response = await airtableClient.get<PaginatedResponse<AirtableRecordResponse>>(endpoint)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch records")
      }
      return response.data
    },
    enabled: !!baseId && !!tableId,
  })
}

export function useCreateRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateRecordRequest): Promise<AirtableRecordResponse> => {
      const response = await airtableClient.post<AirtableRecordResponse>(
        `/bases/${baseId}/tables/${tableId}/records`,
        data
      )
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to create record")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.records(baseId, tableId) })
    },
  })
}

export function useUpdateRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      recordId, 
      data 
    }: { 
      recordId: string
      data: UpdateRecordRequest 
    }): Promise<AirtableRecordResponse> => {
      const response = await airtableClient.patch<AirtableRecordResponse>(
        `/bases/${baseId}/tables/${tableId}/records/${recordId}`,
        data
      )
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to update record")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.records(baseId, tableId) })
    },
  })
}

export function useDeleteRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (recordId: string): Promise<void> => {
      const response = await airtableClient.delete(
        `/bases/${baseId}/tables/${tableId}/records/${recordId}`
      )
      if (!response.success) {
        throw new Error(response.error || "Failed to delete record")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.records(baseId, tableId) })
    },
  })
}

// Chat Hooks
export function useChatSessions() {
  return useQuery({
    queryKey: QueryKeys.sessions,
    queryFn: async (): Promise<ChatSessionResponse[]> => {
      const response = await apiClient.get<ChatSessionResponse[]>("/chat/sessions")
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch chat sessions")
      }
      return response.data
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (request: ChatMessageRequest): Promise<ChatMessageResponse> => {
      const response = await apiClient.post<ChatMessageResponse>("/chat/message", request)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to send message")
      }
      return response.data
    },
    onSuccess: (data) => {
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.sessions })
        queryClient.invalidateQueries({ queryKey: QueryKeys.messages(data.id) })
      }
    },
  })
}

// Usage Statistics Hooks
export function useUsageStatistics(timeframe?: string) {
  return useQuery({
    queryKey: QueryKeys.usage(timeframe),
    queryFn: async (): Promise<UsageStatisticsResponse> => {
      const endpoint = timeframe ? `/usage?timeframe=${timeframe}` : "/usage"
      const response = await apiClient.get<UsageStatisticsResponse>(endpoint)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch usage statistics")
      }
      return response.data
    },
  })
}

// Dashboard Hooks
export function useDashboardMetrics() {
  return useQuery({
    queryKey: QueryKeys.metrics,
    queryFn: async (): Promise<DashboardMetricsResponse> => {
      const response = await apiClient.get<DashboardMetricsResponse>("/dashboard/metrics")
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch dashboard metrics")
      }
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useSystemStatus() {
  return useQuery({
    queryKey: QueryKeys.systemStatus,
    queryFn: async (): Promise<SystemStatusResponse[]> => {
      const response = await apiClient.get<SystemStatusResponse[]>("/dashboard/status")
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch system status")
      }
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

// Settings Hooks
export function useSettings() {
  return useQuery({
    queryKey: QueryKeys.settings,
    queryFn: async (): Promise<UserSettingsResponse> => {
      const response = await apiClient.get<UserSettingsResponse>("/settings")
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch settings")
      }
      return response.data
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (settings: UpdateSettingsRequest): Promise<UserSettingsResponse> => {
      const response = await apiClient.patch<UserSettingsResponse>("/settings", settings)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to update settings")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.settings })
    },
  })
}

// MCP Tools Hooks
export function useMCPTools() {
  return useQuery({
    queryKey: QueryKeys.tools,
    queryFn: async (): Promise<MCPToolResponse[]> => {
      const response = await apiClient.get<MCPToolResponse[]>("/mcp/tools")
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch MCP tools")
      }
      return response.data
    },
  })
}