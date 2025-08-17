"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm";
import { Card, CardContent } from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mode = searchParams.get("mode") as 'verify' | 'resend' || 'verify';

  return <EmailVerificationForm token={token || undefined} mode={mode} />;
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <Suspense
          fallback={
            <Card className="w-full max-w-md mx-auto p-4 md:p-6">
              <CardContent className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          }
        >
          <VerifyEmailContent />
        </Suspense>
        
        <div className="text-center text-sm space-y-2">
          <div>
            Already verified?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
          <div>
            Need help?{" "}
            <Link
              href="/auth/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              Reset password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}