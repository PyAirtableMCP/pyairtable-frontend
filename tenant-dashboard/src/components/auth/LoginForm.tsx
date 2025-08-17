"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useInputValidation } from "@/lib/hooks/useInputValidation";
import { ErrorMessage, FieldError, useErrorState } from "@/components/ui/ErrorMessage";
import { useErrorHandler, ValidationError } from "@/lib/errors/error-handler";
import { AuthErrorDisplay, useAuthError } from "@/components/auth/AuthErrorDisplay";
import toast from "react-hot-toast";

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const router = useRouter();
  const { error: generalError, setError, clearError } = useErrorState();
  const { error: authError, handleError: handleAuthError, clearError: clearAuthError } = useAuthError();
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { validateEmail, validatePassword } = useInputValidation();
  const errorHandler = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const watchedEmail = watch("email", "");
  const watchedPassword = watch("password", "");

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validatePassword(value);
    
    setValidationErrors(prev => ({
      ...prev,
      password: validation.isValid ? undefined : validation.errors[0]
    }));
    
    // Update form with sanitized value
    setValue("password", validation.sanitizedValue);
  };

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    clearAuthError();
    setValidationErrors({});
    setIsLoading(true);

    // Final validation before submission
    const emailValidation = validateEmail(data.email);
    const passwordValidation = validatePassword(data.password);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setValidationErrors({
        email: emailValidation.isValid ? undefined : emailValidation.errors[0],
        password: passwordValidation.isValid ? undefined : passwordValidation.errors[0]
      });
      setIsLoading(false);
      return;
    }

    try {
      // Use NextAuth signIn with credentials
      const result = await signIn("credentials", {
        email: emailValidation.sanitizedValue,
        password: passwordValidation.sanitizedValue,
        redirect: false,
      });

      if (result?.error) {
        // Handle authentication errors with enhanced error handling
        const errorMessage = result.error === "CredentialsSignin" 
          ? "Invalid email or password. Please try again."
          : result.error === "AccessDenied"
          ? "Access denied. Please contact your administrator."
          : result.error === "Configuration"
          ? "Authentication service is temporarily unavailable. Please try again later."
          : "Authentication failed. Please try again.";
        
        handleAuthError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
      } else if (result?.ok) {
        // Login successful
        toast.success("Login successful! Redirecting...");
        
        // Wait for session to be established
        await getSession();
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Default redirect to dashboard
          router.push("/dashboard");
        }
      }
    } catch (err) {
      // Use centralized error handling for unexpected errors
      console.error("Unexpected login error:", err);
      const errorMessage = "An unexpected error occurred. Please try again.";
      handleAuthError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-4 md:p-6 min-h-0">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-center">Sign In</h1>
          <p className="text-sm text-muted-foreground text-center">
            Enter your credentials to access your account
          </p>
        </div>

        <AuthErrorDisplay 
          error={authError} 
          onDismiss={clearAuthError}
          onRetry={() => {
            clearAuthError();
            // Allow user to retry
          }}
          className="mb-4"
        />
        <ErrorMessage error={generalError} onDismiss={clearError} />

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
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

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              mobileOptimized={true}
              {...register("password")}
              onChange={handlePasswordChange}
              disabled={isLoading}
              aria-invalid={!!(errors.password || validationErrors.password)}
            />
            <FieldError 
              error={errors.password || new ValidationError(validationErrors.password || '', 'password')}
              message={errors.password?.message || validationErrors.password}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </Card>
  );
}