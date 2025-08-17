"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">JWT Authentication Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Authentication Status</h2>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>

          {user && (
            <div>
              <h2 className="text-lg font-semibold">User Information</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => refreshAuth()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Auth
            </button>
            
            {isAuthenticated && <LogoutButton />}
          </div>

          {!isAuthenticated && (
            <div>
              <a
                href="/auth/login"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}