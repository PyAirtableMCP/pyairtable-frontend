"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useInputValidation } from "@/lib/hooks/useInputValidation";
import { ErrorMessage, FieldError, useErrorState } from "@/components/ui/ErrorMessage";
import { useErrorHandler, ValidationError } from "@/lib/errors/error-handler";
import { AuthErrorDisplay, useAuthError } from "@/components/auth/AuthErrorDisplay";
import { authApi } from "@/lib/api/auth";
import toast from "react-hot-toast";

// Forgot password form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
}

export function ForgotPasswordForm({ onSuccess, onError }: ForgotPasswordFormProps) {
  const { error: generalError, setError, clearError } = useErrorState();
  const { error: authError, handleError: handleAuthError, clearError: clearAuthError } = useAuthError();
  const [validationErrors, setValidationErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { validateEmail } = useInputValidation();
  const errorHandler = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const watchedEmail = watch("email", "");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validateEmail(value);
    
    setValidationErrors(prev => ({
      ...prev,
      email: validation.isValid ? undefined : validation.errors[0]
    }));
    
    // Update form with sanitized value
    setValue("email", validation.sanitizedValue);
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearError();
    clearAuthError();
    setValidationErrors({});
    setIsLoading(true);

    // Final validation before submission
    const emailValidation = validateEmail(data.email);

    if (!emailValidation.isValid) {
      setValidationErrors({
        email: emailValidation.errors[0]
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.requestPasswordReset({
        email: emailValidation.sanitizedValue
      });

      if (response.success) {
        setIsSuccess(true);
        setSubmittedEmail(emailValidation.sanitizedValue);
        toast.success("Password reset instructions sent to your email");
        onSuccess?.(emailValidation.sanitizedValue);
      } else {
        throw new Error("Failed to send password reset email");
      }
    } catch (err: any) {
      console.error("Password reset request error:", err);
      const errorMessage = err?.message || "Failed to send password reset email. Please try again.";
      handleAuthError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setIsSuccess(false);
    setSubmittedEmail("");
  };

  if (isSuccess) {
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
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription className="text-sm">
            We've sent password reset instructions to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              If you don't see the email in your inbox, check your spam folder.
            </p>
            <p>
              The reset link will expire in 1 hour for security reasons.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
            >
              Send to different email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-4 md:p-6">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription className="text-sm">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthErrorDisplay 
            error={authError} 
            onDismiss={clearAuthError}
            onRetry={() => {
              clearAuthError();
            }}
          />
          <ErrorMessage error={generalError} onDismiss={clearError} />

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              mobileOptimized={true}
              {...register("email")}
              onChange={handleEmailChange}
              disabled={isLoading}
              aria-invalid={!!(errors.email || validationErrors.email)}
            />
            <FieldError 
              error={errors.email || new ValidationError(validationErrors.email || '', 'email')}
              message={errors.email?.message || validationErrors.email}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Sending reset link..." : "Send reset link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}