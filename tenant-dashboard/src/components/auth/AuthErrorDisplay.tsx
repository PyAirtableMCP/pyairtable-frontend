"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Mail, Shield, X } from "lucide-react";

interface AuthErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AuthErrorDisplay({ error, onRetry, onDismiss, className }: AuthErrorDisplayProps) {
  if (!error) return null;

  const getErrorDetails = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes("invalid") || lowerError.includes("incorrect") || lowerError.includes("credentials")) {
      return {
        icon: <Shield className="h-4 w-4" />,
        title: "Invalid Credentials",
        description: "The email or password you entered is incorrect. Please check your credentials and try again.",
        suggestion: "Make sure you're using the correct email address and password.",
        canRetry: true,
      };
    }

    if (lowerError.includes("network") || lowerError.includes("connection") || lowerError.includes("timeout")) {
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        title: "Connection Error",
        description: "Unable to connect to the authentication service. Please check your internet connection.",
        suggestion: "Try again in a few moments or check your network connection.",
        canRetry: true,
      };
    }

    if (lowerError.includes("rate") || lowerError.includes("too many")) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        title: "Too Many Attempts",
        description: "Too many failed sign-in attempts. Please wait before trying again.",
        suggestion: "Wait a few minutes before attempting to sign in again.",
        canRetry: false,
      };
    }

    if (lowerError.includes("email") || lowerError.includes("verification")) {
      return {
        icon: <Mail className="h-4 w-4" />,
        title: "Email Verification Required",
        description: "Please check your email and click the verification link before signing in.",
        suggestion: "Don't see the email? Check your spam folder or request a new verification email.",
        canRetry: false,
      };
    }

    if (lowerError.includes("access") || lowerError.includes("permission") || lowerError.includes("denied")) {
      return {
        icon: <Shield className="h-4 w-4" />,
        title: "Access Denied",
        description: "You don't have permission to access this application.",
        suggestion: "Contact your administrator if you believe this is an error.",
        canRetry: false,
      };
    }

    // Default error
    return {
      icon: <AlertCircle className="h-4 w-4" />,
      title: "Authentication Failed",
      description: errorMessage,
      suggestion: "Please try again or contact support if the problem persists.",
      canRetry: true,
    };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <Alert variant="destructive" className={className}>
      <div className="flex">
        <div className="flex-shrink-0">
          {errorDetails.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{errorDetails.title}</h3>
          <AlertDescription className="mt-1 text-sm">
            {errorDetails.description}
          </AlertDescription>
          {errorDetails.suggestion && (
            <p className="mt-2 text-xs text-muted-foreground">
              {errorDetails.suggestion}
            </p>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {errorDetails.canRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

// Hook for managing auth errors
export function useAuthError() {
  const [error, setError] = React.useState<string | null>(null);

  const handleError = React.useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === "string") {
      setError(err);
    } else {
      setError("An unexpected error occurred during authentication");
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
    // Return a function that can be called to retry the operation
    return () => {};
  }, []);

  return {
    error,
    handleError,
    clearError,
    retry,
  };
}