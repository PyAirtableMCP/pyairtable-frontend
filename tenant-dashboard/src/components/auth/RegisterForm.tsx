"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { useInputValidation } from "@/lib/hooks/useInputValidation";

// Registration form validation schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { validateEmail, validatePassword, sanitizeInput } = useInputValidation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedEmail = watch("email", "");
  const watchedPassword = watch("password", "");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validateEmail(value);
    
    setValidationErrors(prev => ({
      ...prev,
      email: validation.isValid ? "" : validation.errors[0] || ""
    }));
    
    setValue("email", validation.sanitizedValue);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validatePassword(value);
    
    setValidationErrors(prev => ({
      ...prev,
      password: validation.isValid ? "" : validation.errors[0] || ""
    }));
    
    setValue("password", validation.sanitizedValue);
  };

  const handleNameChange = (field: 'firstName' | 'lastName') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = sanitizeInput(value, { 
      stripHtml: true, 
      preventScripts: true, 
      maxLength: 50,
      allowedChars: /^[a-zA-Z\s'-]+$/
    });
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? "" : validation.errors[0] || ""
    }));
    
    setValue(field, validation.sanitizedValue);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    // Final validation before submission
    const emailValidation = validateEmail(data.email);
    const passwordValidation = validatePassword(data.password);
    const firstNameValidation = sanitizeInput(data.firstName, { stripHtml: true, preventScripts: true });
    const lastNameValidation = sanitizeInput(data.lastName, { stripHtml: true, preventScripts: true });

    if (!emailValidation.isValid || !passwordValidation.isValid || 
        !firstNameValidation.isValid || !lastNameValidation.isValid) {
      setValidationErrors({
        email: emailValidation.isValid ? "" : emailValidation.errors[0] || "",
        password: passwordValidation.isValid ? "" : passwordValidation.errors[0] || "",
        firstName: firstNameValidation.isValid ? "" : firstNameValidation.errors[0] || "",
        lastName: lastNameValidation.isValid ? "" : lastNameValidation.errors[0] || ""
      });
      return;
    }

    try {
      setIsLoading(true);

      console.log("🔐 Starting registration with:", { 
        email: emailValidation.sanitizedValue,
        firstName: firstNameValidation.sanitizedValue,
        lastName: lastNameValidation.sanitizedValue
      });

      const response = await fetch("http://localhost:8082/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailValidation.sanitizedValue,
          password: passwordValidation.sanitizedValue,
          first_name: firstNameValidation.sanitizedValue,
          last_name: lastNameValidation.sanitizedValue,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(errorData.detail || errorData.message || "Registration failed");
      }

      const result = await response.json();
      console.log("🔐 Registration successful:", result);
      
      setSuccess("Registration successful! You can now sign in with your credentials.");
      onSuccess?.();
    } catch (error) {
      console.error("Registration error:", error);
      const message = error instanceof Error ? error.message : "Registration failed";
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Sign up for your PyAirtable account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("firstName")}
                  type="text"
                  placeholder="First name"
                  className="pl-9"
                  disabled={isLoading}
                  onChange={handleNameChange('firstName')}
                />
              </div>
              {(errors.firstName || validationErrors.firstName) && (
                <p className="text-sm text-destructive">
                  {errors.firstName?.message || validationErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("lastName")}
                  type="text"
                  placeholder="Last name"
                  className="pl-9"
                  disabled={isLoading}
                  onChange={handleNameChange('lastName')}
                />
              </div>
              {(errors.lastName || validationErrors.lastName) && (
                <p className="text-sm text-destructive">
                  {errors.lastName?.message || validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                className="pl-9"
                disabled={isLoading}
                onChange={handleEmailChange}
              />
            </div>
            {(errors.email || validationErrors.email) && (
              <p className="text-sm text-destructive">
                {errors.email?.message || validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("password")}
                type="password"
                placeholder="Create password (min 8 chars)"
                className="pl-9"
                disabled={isLoading}
                onChange={handlePasswordChange}
              />
            </div>
            {(errors.password || validationErrors.password) && (
              <p className="text-sm text-destructive">
                {errors.password?.message || validationErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("confirmPassword")}
                type="password"
                placeholder="Confirm password"
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}