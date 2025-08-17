"use client";

import React, { memo } from "react";
import WelcomeHeader from "./WelcomeHeader";
import { MetricsSummary } from "./MetricsSummary";
import { UsageOverview } from "./UsageOverview";
import QuickActions from "./QuickActions";
import { PlanUpgrade } from "./PlanUpgrade";
import { useTenant } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  className?: string;
}

export const DashboardOverview = memo(function DashboardOverview({ 
  className 
}: DashboardOverviewProps) {
  const { 
    data: tenant, 
    isLoading, 
    error 
  } = useTenant();

  // Loading state - show skeleton for entire dashboard
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Welcome header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-[120px]" />
            <Skeleton className="h-6 w-[80px]" />
          </div>
        </div>

        {/* Metrics skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>
          ))}
        </div>

        {/* Usage overview skeleton */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[400px]" />
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px]" />
            </div>
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-[120px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Main dashboard with modular components
  return (
    <div className={cn("space-y-6", className)}>
      <WelcomeHeader />
      <MetricsSummary />
      <UsageOverview />
      <QuickActions />
      <PlanUpgrade />
    </div>
  );
});