"use client";

import React from "react";
import { initPerformanceMonitoring } from "@/lib/performance";

interface PerformanceProviderProps {
  children: React.ReactNode;
}

/**
 * Performance monitoring provider - initializes Web Vitals tracking
 * and other performance monitoring features
 */
export function PerformanceProvider({ children }: PerformanceProviderProps) {
  React.useEffect(() => {
    // Initialize performance monitoring on mount
    initPerformanceMonitoring();
    
    // Report long tasks (tasks that take longer than 50ms)
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration}ms`, entry);
              
              // Send to analytics in production
              if (process.env.NODE_ENV === 'production' && (window as any).posthog) {
                (window as any).posthog.capture('long_task', {
                  duration: entry.duration,
                  startTime: entry.startTime,
                });
              }
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        
        // Cleanup observer on unmount
        return () => {
          longTaskObserver.disconnect();
        };
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }, []);

  return <>{children}</>;
}