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

// Mock API functions (in real app, these would call actual endpoints)
const mockMetricsApi = {
  getSystemMetrics: async (): Promise<{ data: MetricsData }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date().toISOString();
    
    return {
      data: {
        system: {
          status: 'healthy',
          uptime: 99.9,
          lastCheck: now,
        },
        services: [
          {
            id: 'api',
            name: 'API Gateway',
            status: 'online',
            responseTime: 45,
            uptime: 99.95,
            errorRate: 0.001,
            lastCheck: now,
          },
          {
            id: 'database',
            name: 'Database',
            status: 'online',
            responseTime: 12,
            uptime: 99.99,
            errorRate: 0,
            lastCheck: now,
          },
          {
            id: 'cache',
            name: 'Redis Cache',
            status: 'degraded',
            responseTime: 120,
            uptime: 98.5,
            errorRate: 0.05,
            lastCheck: now,
          },
          {
            id: 'auth',
            name: 'Auth Service',
            status: 'online',
            responseTime: 32,
            uptime: 99.8,
            errorRate: 0.002,
            lastCheck: now,
          },
        ],
        performance: Array.from({ length: 24 }, (_, i) => ({
          cpu: 20 + Math.random() * 60,
          memory: 30 + Math.random() * 50,
          disk: 15 + Math.random() * 25,
          network: {
            in: Math.random() * 100,
            out: Math.random() * 80,
          },
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        })),
        alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'High Memory Usage',
            message: 'Memory usage is approaching 85% threshold on server-01',
            severity: 'medium',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            acknowledged: false,
            source: 'monitoring',
          },
          {
            id: '2',
            type: 'info',
            title: 'Scheduled Maintenance',
            message: 'Database maintenance scheduled for 2:00 AM UTC tomorrow',
            severity: 'low',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            acknowledged: true,
            source: 'system',
          },
        ],
      },
    };
  },
};

// Custom hook for metrics data with real-time updates
export function useMetrics(refreshInterval = 30000) {
  return useApiQuery(
    queryKeys.systemMetrics(),
    mockMetricsApi.getSystemMetrics,
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