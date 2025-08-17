"use client";

import React, { memo, useMemo } from "react";
import MetricCard from "./MetricCard";
import { useTenant, useTenantUsage } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  FolderOpen, 
  HardDrive,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsSummaryProps {
  className?: string;
}

export const MetricsSummary = memo(function MetricsSummary({ 
  className 
}: MetricsSummaryProps) {
  const { 
    data: tenant, 
    isLoading: tenantLoading, 
    error: tenantError 
  } = useTenant();
  
  const { 
    data: usage, 
    isLoading: usageLoading, 
    error: usageError 
  } = useTenantUsage();

  // Memoize metrics calculation to avoid unnecessary re-renders
  const metrics = useMemo(() => {
    if (!tenant || !usage) return null;

    return [
      {
        title: "Team Members",
        value: tenant.members?.length || 0,
        change: usage.memberGrowth || 0,
        changeType: (usage.memberGrowth || 0) >= 0 ? "increase" : "decrease" as const,
        description: "vs last month",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Active Workspaces",
        value: usage.workspaces || 0,
        change: usage.workspaceGrowth || 0,
        changeType: (usage.workspaceGrowth || 0) >= 0 ? "increase" : "decrease" as const,
        description: "vs last month",
        icon: <FolderOpen className="h-4 w-4" />,
      },
      {
        title: "Storage Used",
        value: usage.storage || 0,
        format: "bytes" as const,
        change: usage.storageGrowth || 0,
        changeType: (usage.storageGrowth || 0) >= 0 ? "increase" : "decrease" as const,
        description: "vs last month",
        icon: <HardDrive className="h-4 w-4" />,
      },
      {
        title: "API Calls",
        value: usage.apiCalls || 0,
        change: usage.apiCallsGrowth || 0,
        changeType: (usage.apiCallsGrowth || 0) >= 0 ? "increase" : "decrease" as const,
        description: "this month",
        icon: <Zap className="h-4 w-4" />,
      },
    ];
  }, [tenant, usage]);

  const isLoading = tenantLoading || usageLoading;
  const hasError = tenantError || usageError;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 p-4 border rounded-lg">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[80px]" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load metrics. {tenantError?.message || usageError?.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!metrics) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No metrics data available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeType={metric.changeType}
          format={metric.format}
          description={metric.description}
          icon={metric.icon}
          size="md"
        />
      ))}
    </div>
  );
});

MetricsSummary.displayName = "MetricsSummary";