"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

// Simplified login form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface SimpleLoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SimpleLoginForm({ onSuccess, onError }: SimpleLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Simple login attempt:", { email: data.email, password: "***" });

      // Use NextAuth signIn with credentials (no custom validation)
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("🔐 NextAuth result:", result);

      if (result?.error) {
        const errorMessage = result.error === "CredentialsSignin" 
          ? "Invalid email or password. Please try again."
          : result.error === "AccessDenied"
          ? "Access denied. Please contact your administrator."
          : "Authentication failed. Please try again.";
        
        setError(errorMessage);
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
          // Redirect to callbackUrl or default to dashboard
          router.push(callbackUrl);
        }
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
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

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              disabled={isLoading}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              disabled={isLoading}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Test credentials: admin@test.com / admin123</p>
        </div>
      </form>
    </Card>
  );
}