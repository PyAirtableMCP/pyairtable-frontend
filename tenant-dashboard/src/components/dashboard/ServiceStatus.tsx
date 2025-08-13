"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Zap,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMetrics, type ServiceMetrics } from "@/hooks/useMetrics";

interface ServiceStatusProps {
  className?: string;
}

const getStatusIcon = (status: ServiceMetrics['status']) => {
  switch (status) {
    case 'online':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'degraded':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'offline':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: ServiceMetrics['status']) => {
  switch (status) {
    case 'online':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'offline':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatUptime = (uptime: number) => {
  return `${uptime.toFixed(2)}%`;
};

const formatResponseTime = (responseTime: number) => {
  if (responseTime < 1000) {
    return `${responseTime}ms`;
  }
  return `${(responseTime / 1000).toFixed(1)}s`;
};

const formatErrorRate = (errorRate: number) => {
  if (errorRate < 0.01) {
    return `< 0.01%`;
  }
  return `${(errorRate * 100).toFixed(2)}%`;
};

export function ServiceStatus({ className }: ServiceStatusProps) {
  const { data, isLoading, error, refetch } = useMetrics();
  
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load service status</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const services = data?.data.services || [];
  const systemStatus = data?.data.system;
  
  const overallHealth = services.every(s => s.status === 'online') 
    ? 'healthy' 
    : services.some(s => s.status === 'offline') 
    ? 'unhealthy' 
    : 'degraded';
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Service Status</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={cn(
              overallHealth === 'healthy' && 'border-green-200 bg-green-50 text-green-700',
              overallHealth === 'degraded' && 'border-yellow-200 bg-yellow-50 text-yellow-700',
              overallHealth === 'unhealthy' && 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            System {overallHealth}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <div>
                <h4 className="text-sm font-medium">{service.name}</h4>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{formatUptime(service.uptime)} uptime</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>{formatResponseTime(service.responseTime)}</span>
                  </div>
                  {service.errorRate > 0 && (
                    <span className="text-red-500">{formatErrorRate(service.errorRate)} errors</span>
                  )}
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn("capitalize text-xs", getStatusColor(service.status))}
            >
              {service.status}
            </Badge>
          </div>
        ))}
        
        {systemStatus && (
          <div className="pt-2 mt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall System Uptime</span>
              <span className="font-medium">{formatUptime(systemStatus.uptime)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Last Updated</span>
              <span>{new Date(systemStatus.lastCheck).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}