"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useInputValidation } from "@/lib/hooks/useInputValidation";
import { ErrorMessage, FieldError, useErrorState } from "@/components/ui/ErrorMessage";
import { useErrorHandler, ValidationError } from "@/lib/errors/error-handler";
import { AuthErrorDisplay, useAuthError } from "@/components/auth/AuthErrorDisplay";
import { authApi, AuthUtils } from "@/lib/api/auth";
import toast from "react-hot-toast";

// Reset password form validation schema
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ResetPasswordForm({ token, onSuccess, onError }: ResetPasswordFormProps) {
  const router = useRouter();
  const { error: generalError, setError, clearError } = useErrorState();
  const { error: authError, handleError: handleAuthError, clearError: clearAuthError } = useAuthError();
  const [validationErrors, setValidationErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
    isValid: boolean;
  } | null>(null);
  const { validatePassword } = useInputValidation();
  const errorHandler = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchedPassword = watch("newPassword", "");
  const watchedConfirmPassword = watch("confirmPassword", "");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validatePassword(value);
    const strength = AuthUtils.validatePasswordStrength(value);
    
    setPasswordStrength(strength);
    setValidationErrors(prev => ({
      ...prev,
      newPassword: validation.isValid ? undefined : validation.errors[0]
    }));
    
    // Update form with sanitized value
    setValue("newPassword", validation.sanitizedValue);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validatePassword(value);
    
    setValidationErrors(prev => ({
      ...prev,
      confirmPassword: validation.isValid ? undefined : validation.errors[0]
    }));
    
    // Update form with sanitized value
    setValue("confirmPassword", validation.sanitizedValue);
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    clearError();
    clearAuthError();
    setValidationErrors({});
    setIsLoading(true);

    // Final validation before submission
    const passwordValidation = validatePassword(data.newPassword);
    const confirmPasswordValidation = validatePassword(data.confirmPassword);

    if (!passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      setValidationErrors({
        newPassword: passwordValidation.isValid ? undefined : passwordValidation.errors[0],
        confirmPassword: confirmPasswordValidation.isValid ? undefined : confirmPasswordValidation.errors[0]
      });
      setIsLoading(false);
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      setValidationErrors({
        confirmPassword: "Passwords don't match"
      });
      setIsLoading(false);
      return;
    }

    // Check password strength
    const strength = AuthUtils.validatePasswordStrength(data.newPassword);
    if (!strength.isValid) {
      setValidationErrors({
        newPassword: strength.feedback[0]
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.confirmPasswordReset({
        token,
        newPassword: passwordValidation.sanitizedValue,
        confirmPassword: confirmPasswordValidation.sanitizedValue,
      });

      if (response.success) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/auth/login");
          }
        }, 2000);
      } else {
        throw new Error("Failed to reset password");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      const errorMessage = err?.message || "Failed to reset password. Please try again.";
      
      // Handle specific error cases
      if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
        handleAuthError("This reset link has expired or is invalid. Please request a new password reset.");
      } else {
        handleAuthError(errorMessage);
      }
      
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
          <CardTitle className="text-xl">Password reset successful</CardTitle>
          <CardDescription className="text-sm">
            Your password has been successfully reset. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Redirecting to sign in page...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-4 md:p-6">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription className="text-sm">
          Enter your new password below
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
            <label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              mobileOptimized={true}
              {...register("newPassword")}
              onChange={handlePasswordChange}
              disabled={isLoading}
              aria-invalid={!!(errors.newPassword || validationErrors.newPassword)}
            />
            <FieldError 
              error={errors.newPassword || new ValidationError(validationErrors.newPassword || '', 'newPassword')}
              message={errors.newPassword?.message || validationErrors.newPassword}
            />
            
            {/* Password strength indicator */}
            {passwordStrength && watchedPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.score <= 2
                          ? 'bg-red-500'
                          : passwordStrength.score <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength.score <= 2
                      ? 'Weak'
                      : passwordStrength.score <= 3
                      ? 'Medium'
                      : 'Strong'}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {passwordStrength.feedback.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              mobileOptimized={true}
              {...register("confirmPassword")}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
              aria-invalid={!!(errors.confirmPassword || validationErrors.confirmPassword)}
            />
            <FieldError 
              error={errors.confirmPassword || new ValidationError(validationErrors.confirmPassword || '', 'confirmPassword')}
              message={errors.confirmPassword?.message || validationErrors.confirmPassword}
            />
            
            {/* Password match indicator */}
            {watchedPassword && watchedConfirmPassword && (
              <div className="flex items-center space-x-1 text-xs">
                {watchedPassword === watchedConfirmPassword ? (
                  <>
                    <svg
                      className="w-4 h-4 text-green-600"
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
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-red-500">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Resetting password..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}