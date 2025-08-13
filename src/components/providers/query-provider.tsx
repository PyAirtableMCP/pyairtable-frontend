"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"
import { auth } from "@/lib/api/auth"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error: any) => {
              // Don't retry on auth errors
              if (error?.message?.includes("401") || error?.message?.includes("403")) {
                return false
              }
              // Don't retry on client errors (4xx)
              if (error?.message?.match(/^4\d\d/)) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
            networkMode: "online",
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on auth or client errors
              if (error?.message?.match(/^4\d\d/)) {
                return false
              }
              // Retry once for network errors
              return failureCount < 1
            },
            retryDelay: 1000,
            networkMode: "online",
            onError: (error: any) => {
              // Handle auth errors globally
              if (error?.message?.includes("401")) {
                auth.logout()
                // Optionally redirect to login
                if (typeof window !== "undefined") {
                  window.location.href = "/login"
                }
              }
              console.error("Mutation error:", error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
{process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}