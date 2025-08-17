"use client";

import React from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useTenant } from "@/lib/api/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Tenant } from "@/types";

// Dynamic imports for code splitting - optimizes initial page load
const MainLayout = dynamic(() => import("@/components/layout/MainLayout").then(mod => ({ default: mod.MainLayout })), {
  loading: () => <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const DashboardOverview = dynamic(() => import("@/components/dashboard/DashboardOverview").then(mod => ({ default: mod.DashboardOverview })), {
  loading: () => <div className="p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

// Note: Mock data removed - now using real API calls via React Query hooks

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-96">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium mb-2">Loading Dashboard</h3>
          <p className="text-sm text-muted-foreground text-center">
            Fetching your organization data...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <strong>Unable to load dashboard</strong>
              <br />
              {error.message}
              <br />
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { status } = useSession();
  const authLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const { data: tenantResponse, isLoading, error } = useTenant();
  
  // Extract tenant data from API response
  const tenant = tenantResponse?.data;
  
  // Feature flags for progressive disclosure
  const showAdvancedMetrics = false; // useFeatureFlag("advanced-metrics", false);
  const showBillingSection = false; // useFeatureFlag("billing-controls", false);
  
  // Show loading state while auth or data is loading
  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  // Handle errors
  if (error) {
    return <ErrorState error={error as Error} />;
  }

  if (!tenant) {
    return <ErrorState error={new Error("No tenant data available")} />;
  }

  // For demo purposes, redirect to chat interface as main landing page
  if (typeof window !== 'undefined') {
    window.location.href = '/chat';
    return null;
  }

  return (
    <MainLayout>
      <DashboardOverview 
        tenant={tenant} 
        showAdvancedMetrics={showAdvancedMetrics}
        showBillingSection={showBillingSection}
      />
    </MainLayout>
  );
}