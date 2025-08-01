import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { gatewayClient } from "@/lib/api-client"
import { SystemStatus, DashboardMetrics, UsageStatistics, CostEntry } from "@/types"

// Query Keys
export const systemKeys = {
  all: ["system"] as const,
  status: () => [...systemKeys.all, "status"] as const,
  metrics: () => [...systemKeys.all, "metrics"] as const,
  usage: () => [...systemKeys.all, "usage"] as const,
  costs: () => [...systemKeys.all, "costs"] as const,
  health: () => [...systemKeys.all, "health"] as const,
}

// System Status Hook
export function useSystemStatus() {
  return useQuery({
    queryKey: systemKeys.status(),
    queryFn: async () => {
      const response = await gatewayClient.get("/system/status")
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch system status")
      }
      return response.data as SystemStatus[]
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Dashboard Metrics Hook
export function useDashboardMetrics() {
  return useQuery({
    queryKey: systemKeys.metrics(),
    queryFn: async () => {
      const response = await gatewayClient.get("/system/metrics")
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch dashboard metrics")
      }
      return response.data as DashboardMetrics
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Usage Statistics Hook
export function useUsageStatistics(timeRange: "day" | "week" | "month" = "week") {
  return useQuery({
    queryKey: [...systemKeys.usage(), timeRange],
    queryFn: async () => {
      const response = await gatewayClient.get(`/system/usage?range=${timeRange}`)
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch usage statistics")
      }
      return response.data as UsageStatistics
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Cost Tracking Hook
export function useCostEntries(timeRange: "day" | "week" | "month" = "month") {
  return useQuery({
    queryKey: [...systemKeys.costs(), timeRange],
    queryFn: async () => {
      const response = await gatewayClient.get(`/system/costs?range=${timeRange}`)
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch cost entries")
      }
      return response.data as CostEntry[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Health Check Hook
export function useHealthCheck() {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: async () => {
      const response = await gatewayClient.get("/health")
      if (!response.success) {
        throw new Error(response.error || "Health check failed")
      }
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// System Action Mutations
export function useRestartServices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (services?: string[]) => {
      const response = await gatewayClient.post("/system/restart", { services })
      if (!response.success) {
        throw new Error(response.error || "Failed to restart services")
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate system queries after restart
      queryClient.invalidateQueries({ queryKey: systemKeys.status() })
      queryClient.invalidateQueries({ queryKey: systemKeys.health() })
    },
  })
}

export function useClearCache() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await gatewayClient.post("/system/cache/clear")
      if (!response.success) {
        throw new Error(response.error || "Failed to clear cache")
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate all queries after cache clear
      queryClient.invalidateQueries()
    },
  })
}

export function useExportMetrics() {
  return useMutation({
    mutationFn: async (format: "json" | "csv" = "json") => {
      const response = await gatewayClient.get(`/system/export?format=${format}`)
      if (!response.success) {
        throw new Error(response.error || "Failed to export metrics")
      }
      return response.data
    },
  })
}

// Real-time System Monitoring
export function useSystemMonitoring() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [...systemKeys.all, "monitoring"],
    queryFn: async () => {
      // This would connect to a WebSocket or SSE endpoint
      // For now, we'll return a placeholder
      return {
        connected: true,
        uptime: Date.now(),
        lastUpdate: new Date(),
      }
    },
    enabled: false, // Enable when implementing real-time features
  })
}