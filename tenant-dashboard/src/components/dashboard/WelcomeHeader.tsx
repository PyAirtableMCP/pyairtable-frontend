"use client";

import React, { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/hooks/useTenant";
import { Calendar, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeHeaderProps {
  className?: string;
}

function WelcomeHeader({ 
  className 
}: WelcomeHeaderProps) {
  const { data: tenant, isLoading } = useTenant();

  // Memoize formatted date to prevent recreation
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Memoize time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-[120px]" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {tenant ? (
            <>
              Here&apos;s what&apos;s happening with{" "}
              <span className="font-medium">{tenant.name}</span> today.
            </>
          ) : (
            "Here&apos;s what&apos;s happening today."
          )}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{formattedDate}</span>
        </Badge>
        
        {tenant?.members && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span className="text-xs">
              {tenant.members.length} member{tenant.members.length !== 1 ? "s" : ""}
            </span>
          </Badge>
        )}
        
        {tenant?.plan && (
          <Badge 
            variant="secondary" 
            className="flex items-center space-x-1 capitalize"
          >
            <span className="text-xs font-medium">
              {tenant.plan.tier} Plan
            </span>
          </Badge>
        )}
      </div>
    </div>
  );
}

const MemoizedWelcomeHeader = memo(WelcomeHeader);
MemoizedWelcomeHeader.displayName = 'WelcomeHeader';
export default MemoizedWelcomeHeader;