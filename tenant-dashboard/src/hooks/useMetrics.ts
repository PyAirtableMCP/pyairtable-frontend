import { useApiQuery } from './useApi';
import { queryKeys } from '@/lib/api/types';

// System metrics interfaces
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastCheck: string;
}

export interface ServiceMetrics {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  uptime: number;
  errorRate: number;
  lastCheck: string;
}

export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  timestamp: string;
}

export interface MetricsData {
  system: SystemHealth;
  services: ServiceMetrics[];
  performance: PerformanceMetrics[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

// REAL API implementation - NO MOCKING!
import { apiClient } from '@/lib/api/client';

const metricsApi = {
  getSystemMetrics: async (): Promise<{ data: MetricsData }> => {
    // REAL API CALL - connects to http://localhost:8000/api/v1/metrics/system
    const response = await apiClient.get<MetricsData>('/metrics/system');
    if (!response.data) {
      throw new Error('Backend service unavailable at http://localhost:8000. DevOps agent needed.');
    }
    return response;
  },
};

// Custom hook for metrics data with real-time updates
export function useMetrics(refreshInterval = 30000) {
  return useApiQuery(
    queryKeys.systemMetrics(),
    metricsApi.getSystemMetrics,
    {
      staleTime: 5000, // Data considered stale after 5 seconds
      refetchInterval: refreshInterval, // Auto-refresh every 30 seconds
      refetchIntervalInBackground: true,
      retry: 2,
    }
  );
}

// Hook for individual service status
export function useServiceStatus(serviceId: string) {
  const { data, isLoading, error } = useMetrics();
  
  const service = data?.data.services.find(s => s.id === serviceId);
  
  return {
    service,
    isLoading,
    error,
  };
}

// Hook for system alerts with filtering
export function useAlerts(filters?: { 
  type?: Alert['type'][];
  severity?: Alert['severity'][];
  acknowledged?: boolean;
}) {
  const { data, isLoading, error } = useMetrics();
  
  let alerts = data?.data.alerts || [];
  
  if (filters) {
    if (filters.type) {
      alerts = alerts.filter(alert => filters.type!.includes(alert.type));
    }
    if (filters.severity) {
      alerts = alerts.filter(alert => filters.severity!.includes(alert.severity));
    }
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
    }
  }
  
  return {
    alerts,
    isLoading,
    error,
  };
}