"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
// Temporarily disabled: import { PostHogProvider } from "./posthog-provider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { PWAPrompts, ConnectionStatus } from "@/components/pwa/PWAPrompts";
import { PerformanceProvider } from "@/components/performance/PerformanceProvider";
import { WebSocketProvider } from "@/lib/realtime/WebSocketProvider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/providers/ThemeProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Additional error handling if needed
        console.error("Root error boundary triggered:", error, errorInfo);
      }}
    >
      <ThemeProvider>
        <SessionProvider>
          <PerformanceProvider>
            <WebSocketProvider>
            {/* Temporarily disabled: <PostHogProvider> */}
              <QueryProvider>
                {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "hsl(var(--background))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                  },
                  success: {
                    iconTheme: {
                      primary: "hsl(var(--primary))",
                      secondary: "hsl(var(--primary-foreground))",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "hsl(var(--destructive))",
                      secondary: "hsl(var(--destructive-foreground))",
                    },
                  },
                }}
              />
            
                {/* PWA Components */}
                <ConnectionStatus />
                <PWAPrompts showInstallBanner={true} autoShowInstallDialog={false} />
              </QueryProvider>
            {/* Temporarily disabled: </PostHogProvider> */}
            </WebSocketProvider>
          </PerformanceProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}