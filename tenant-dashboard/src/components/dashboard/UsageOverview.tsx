"use client";

import React, { memo, useMemo } from "react";
import { UsageChart } from "./UsageChart";
import { UsageProgress } from "./UsageProgress";
import { ActivityFeed } from "./ActivityFeed";
import { useTenant, useTenantUsage, useTenantActivityLogs } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageOverviewProps {
  className?: string;
}

export const UsageOverview = memo(function UsageOverview({ 
  className 
}: UsageOverviewProps) {
  const { data: tenant } = useTenant();
  const { 
    data: usage, 
    isLoading: usageLoading, 
    error: usageError 
  } = useTenantUsage();
  
  const { 
    data: activityData, 
    isLoading: activityLoading,
    error: activityError
  } = useTenantActivityLogs({ 
    pagination: { page: 1, limit: 6 },
    sort: { field: "timestamp", direction: "desc" }
  });

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (!usage?.chartData) return null;

    return {
      apiUsage: usage.chartData.apiCalls || [],
      storageGrowth: usage.chartData.storage || [],
    };
  }, [usage?.chartData]);

  // Memoize usage items for progress component
  const usageItems = useMemo(() => {
    if (!tenant || !usage) return [];

    return [
      {
        name: "Team Members",
        current: usage.users || 0,
        limit: tenant.plan?.limits?.users || 0,
        description: "Users in your organization",
      },
      {
        name: "Workspaces",
        current: usage.workspaces || 0,
        limit: tenant.plan?.limits?.workspaces || 0,
        description: "Active workspaces",
      },
      {
        name: "Storage",
        current: usage.storage || 0,
        limit: tenant.plan?.limits?.storage || 0,
        format: "bytes" as const,
        description: "Files and data storage",
      },
      {
        name: "API Calls",
        current: usage.apiCalls || 0,
        limit: tenant.plan?.limits?.apiCalls || 0,
        description: "This month",
      },
    ];
  }, [tenant, usage]);

  const activities = activityData?.data || [];
  const isLoading = usageLoading || activityLoading;
  const hasError = usageError || activityError;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Charts loading */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>

        {/* Usage and Activity loading */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-3">
            <Skeleton className="h-4 w-[100px]" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-4 w-[120px]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load usage data. {usageError?.message || activityError?.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Charts */}
      {chartData && (
        <div className="grid gap-6 md:grid-cols-2">
          <UsageChart
            title="API Usage Trend"
            description="Daily API calls over the last 7 days"
            data={chartData.apiUsage}
            type="area"
            color="#3b82f6"
            format="number"
            badge="This Month"
          />
          <UsageChart
            title="Storage Growth"
            description="Storage usage over time"
            data={chartData.storageGrowth}
            type="line"
            color="#10b981"
            format="bytes"
            badge="All Time"
          />
        </div>
      )}

      {/* Usage Limits and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UsageProgress
            title="Current Usage"
            items={usageItems}
          />
        </div>
        
        <div className="lg:col-span-2">
          <ActivityFeed 
            activities={activities}
            maxItems={6}
            onViewAll={() => window.location.href = "/security/audit"}
          />
        </div>
      </div>
    </div>
  );
});