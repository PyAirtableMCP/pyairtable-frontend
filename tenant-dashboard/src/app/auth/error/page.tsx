"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "Unable to sign in. Please try again.",
  Signin: "Try signing in with a different account.",
  OAuthSignin: "Try signing in with a different account.",
  OAuthCallback: "Try signing in with a different account.",
  OAuthCreateAccount: "Try signing in with a different account.",
  EmailCreateAccount: "Try signing in with a different account.",
  Callback: "Try signing in with a different account.",
  OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "Check your email for the sign in link.",
  CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "Please sign in to access this page.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as keyof typeof errorMessages;

  const getErrorMessage = () => {
    return errorMessages[error] || errorMessages.Default;
  };

  const getErrorDetails = () => {
    switch (error) {
      case "CredentialsSignin":
        return "The email or password you entered is incorrect. Please check your credentials and try again.";
      case "AccessDenied":
        return "Your account may not have the necessary permissions, or your account may be inactive.";
      case "Configuration":
        return "This is likely a temporary issue. Please try again in a few moments.";
      case "OAuthAccountNotLinked":
        return "It looks like you've previously signed in with a different method. Please use the same sign-in method you used before.";
      default:
        return "If this problem persists, please contact support for assistance.";
    }
  };

  const getRetryAction = () => {
    switch (error) {
      case "CredentialsSignin":
        return {
          text: "Try Again",
          href: "/auth/login",
        };
      case "OAuthAccountNotLinked":
        return {
          text: "Sign In with Original Account",
          href: "/auth/login",
        };
      default:
        return {
          text: "Back to Sign In",
          href: "/auth/login",
        };
    }
  };

  const retryAction = getRetryAction();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {getErrorMessage()}
              </AlertDescription>
            </Alert>

            <div className="text-sm text-gray-600">
              <p>{getErrorDetails()}</p>
            </div>

            <div className="flex flex-col space-y-3">
              <Button asChild className="w-full">
                <Link href={retryAction.href}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {retryAction.text}
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Need help?{" "}
                <Link 
                  href="/contact" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Contact Support
                </Link>
              </p>
            </div>

            {process.env.NODE_ENV === "development" && error && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md">
                <p className="text-xs font-mono text-gray-600">
                  Debug: Error code "{error}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}