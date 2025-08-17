"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ErrorMessage, useErrorState } from "@/components/ui/ErrorMessage";
import { AuthErrorDisplay, useAuthError } from "@/components/auth/AuthErrorDisplay";
import { authApi } from "@/lib/api/auth";
import toast from "react-hot-toast";

interface EmailVerificationFormProps {
  token?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  mode?: 'verify' | 'resend';
}

export function EmailVerificationForm({ token, onSuccess, onError, mode = 'verify' }: EmailVerificationFormProps) {
  const router = useRouter();
  const { error: generalError, setError, clearError } = useErrorState();
  const { error: authError, handleError: handleAuthError, clearError: clearAuthError } = useAuthError();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'failed' | 'expired'>('pending');

  // Auto-verify on mount if token is provided
  useEffect(() => {
    if (token && mode === 'verify') {
      handleVerifyEmail(token);
    }
  }, [token, mode]);

  const handleVerifyEmail = async (verificationToken: string) => {
    setVerificationStatus('verifying');
    setIsLoading(true);
    clearError();
    clearAuthError();

    try {
      const response = await authApi.verifyEmail(verificationToken);

      if (response.success) {
        setVerificationStatus('success');
        setIsSuccess(true);
        toast.success("Email verified successfully!");
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/dashboard");
          }
        }, 2000);
      } else {
        throw new Error("Failed to verify email");
      }
    } catch (err: any) {
      console.error("Email verification error:", err);
      setVerificationStatus('failed');
      
      let errorMessage = err?.message || "Failed to verify email. Please try again.";
      
      // Handle specific error cases
      if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
        setVerificationStatus('expired');
        errorMessage = "This verification link has expired or is invalid. Please request a new verification email.";
      }
      
      handleAuthError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendLoading(true);
    clearError();
    clearAuthError();

    try {
      const response = await authApi.requestEmailVerification();

      if (response.success) {
        toast.success("Verification email sent! Please check your inbox.");
        setVerificationStatus('pending');
      } else {
        throw new Error("Failed to send verification email");
      }
    } catch (err: any) {
      console.error("Resend verification error:", err);
      const errorMessage = err?.message || "Failed to send verification email. Please try again.";
      handleAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResendLoading(false);
    }
  };

  // Success state
  if (isSuccess && verificationStatus === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto p-4 md:p-6">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">Email verified!</CardTitle>
          <CardDescription className="text-sm">
            Your email has been successfully verified. You now have full access to your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Expired/Invalid token state
  if (verificationStatus === 'expired' || (verificationStatus === 'failed' && token)) {
    return (
      <Card className="w-full max-w-md mx-auto p-4 md:p-6">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">Link expired</CardTitle>
          <CardDescription className="text-sm">
            This verification link has expired or is invalid.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <AuthErrorDisplay 
            error={authError} 
            onDismiss={clearAuthError}
          />
          
          <p className="text-sm text-muted-foreground text-center">
            Click the button below to receive a new verification email.
          </p>
          
          <Button
            type="button"
            className="w-full"
            onClick={handleResendVerification}
            loading={isResendLoading}
            disabled={isResendLoading}
          >
            {isResendLoading ? "Sending..." : "Send new verification email"}
          </Button>
          
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => router.push("/auth/login")}
            >
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state (verifying)
  if (verificationStatus === 'verifying') {
    return (
      <Card className="w-full max-w-md mx-auto p-4 md:p-6">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <CardTitle className="text-xl">Verifying your email...</CardTitle>
          <CardDescription className="text-sm">
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Default state (resend mode or awaiting verification)
  return (
    <Card className="w-full max-w-md mx-auto p-4 md:p-6">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <CardTitle className="text-xl">Verify your email</CardTitle>
        <CardDescription className="text-sm">
          {mode === 'resend' 
            ? "We need to verify your email address to complete your account setup."
            : "Check your email for a verification link."
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <AuthErrorDisplay 
          error={authError} 
          onDismiss={clearAuthError}
        />
        <ErrorMessage error={generalError} onDismiss={clearError} />
        
        <div className="text-sm text-muted-foreground space-y-2 text-center">
          <p>
            We've sent a verification link to your email address. Click the link in the email to verify your account.
          </p>
          <p>
            If you don't see the email, check your spam folder.
          </p>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleResendVerification}
          loading={isResendLoading}
          disabled={isResendLoading}
        >
          {isResendLoading ? "Sending..." : "Resend verification email"}
        </Button>
        
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => router.push("/auth/login")}
          >
            Back to sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}