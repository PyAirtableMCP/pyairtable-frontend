"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMetrics } from "@/hooks/useMetrics";
import { ServiceStatus } from "./ServiceStatus";
import { MetricsChart } from "./MetricsChart";
import { AlertsPanel } from "./AlertsPanel";
import { MetricCard } from "./MetricCard";

interface MetricsDashboardProps {
  className?: string;
}

export function MetricsDashboard({ className }: MetricsDashboardProps) {
  const { data, isLoading, error, refetch } = useMetrics();
  
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("", className)}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Metrics</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Unable to fetch system metrics. Please check your connection and try again.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metricsData = data?.data;
  const performanceData = metricsData?.performance || [];
  const systemHealth = metricsData?.system;

  // Calculate current performance averages
  const currentPerf = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
  const avgPerf = performanceData.reduce((acc, curr) => ({
    cpu: acc.cpu + curr.cpu,
    memory: acc.memory + curr.memory,
    disk: acc.disk + curr.disk,
  }), { cpu: 0, memory: 0, disk: 0 });
  
  if (performanceData.length > 0) {
    avgPerf.cpu /= performanceData.length;
    avgPerf.memory /= performanceData.length;
    avgPerf.disk /= performanceData.length;
  }

  // Prepare chart data
  const cpuData = performanceData.map(p => ({
    timestamp: p.timestamp,
    cpu: p.cpu,
    name: new Date(p.timestamp).toLocaleTimeString()
  }));

  const memoryData = performanceData.map(p => ({
    timestamp: p.timestamp,
    memory: p.memory,
    name: new Date(p.timestamp).toLocaleTimeString()
  }));

  const networkData = performanceData.map(p => ({
    timestamp: p.timestamp,
    inbound: p.network.in,
    outbound: p.network.out,
    name: new Date(p.timestamp).toLocaleTimeString()
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">System Metrics</h1>
          <p className="text-muted-foreground">
            Monitor system health, performance, and service status in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className="flex items-center space-x-1"
          >
            <Activity className="h-3 w-3" />
            <span>Live Data</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Current Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={currentPerf?.cpu || 0}
          format="percentage"
          change={currentPerf && avgPerf ? currentPerf.cpu - avgPerf.cpu : 0}
          changeType={currentPerf && avgPerf && currentPerf.cpu > avgPerf.cpu ? "increase" : "decrease"}
          description="Current utilization"
          icon={<Cpu className="h-4 w-4" />}
        />
        <MetricCard
          title="Memory Usage"
          value={currentPerf?.memory || 0}
          format="percentage"
          change={currentPerf && avgPerf ? currentPerf.memory - avgPerf.memory : 0}
          changeType={currentPerf && avgPerf && currentPerf.memory > avgPerf.memory ? "increase" : "decrease"}
          description="RAM utilization"
          icon={<Server className="h-4 w-4" />}
        />
        <MetricCard
          title="Disk Usage"
          value={currentPerf?.disk || 0}
          format="percentage"
          change={currentPerf && avgPerf ? currentPerf.disk - avgPerf.disk : 0}
          changeType={currentPerf && avgPerf && currentPerf.disk > avgPerf.disk ? "increase" : "decrease"}
          description="Storage utilization"
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricCard
          title="System Uptime"
          value={systemHealth?.uptime || 0}
          format="percentage"
          description="Overall availability"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricsChart
          title="CPU Usage"
          description="CPU utilization over the last 24 hours"
          data={cpuData}
          type="area"
          dataKey="cpu"
          xAxisKey="name"
          color="#3b82f6"
          formatValue={(value) => `${value.toFixed(1)}%`}
          badge="24h"
        />
        <MetricsChart
          title="Memory Usage"
          description="Memory utilization over the last 24 hours"
          data={memoryData}
          type="line"
          dataKey="memory"
          xAxisKey="name"
          color="#10b981"
          formatValue={(value) => `${value.toFixed(1)}%`}
          badge="24h"
        />
      </div>

      {/* Network and Services */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MetricsChart
            title="Network Traffic"
            description="Inbound and outbound network traffic"
            data={networkData.map(d => ({ ...d, inbound: d.inbound, outbound: d.outbound }))}
            type="area"
            dataKey="inbound"
            xAxisKey="name"
            color="#8b5cf6"
            formatValue={(value) => `${(value / 1024 / 1024).toFixed(1)} MB/s`}
            badge="Real-time"
          />
        </div>
        <ServiceStatus />
      </div>

      {/* Alerts Panel */}
      <AlertsPanel maxItems={6} />
    </div>
  );
}