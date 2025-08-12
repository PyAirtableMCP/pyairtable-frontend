"use client"

import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft,
  MessageCircle,
  ExternalLink
} from "lucide-react"

interface OnboardingErrorBoundaryProps {
  error?: string | null
  onRetry?: () => void
  onGoBack?: () => void
  showSupport?: boolean
}

export function OnboardingErrorBoundary({
  error,
  onRetry,
  onGoBack,
  showSupport = true
}: OnboardingErrorBoundaryProps) {
  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <Card className="border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-900">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an error while setting up your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-2">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            {onGoBack && (
              <Button 
                onClick={onGoBack} 
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}
          </div>

          {showSupport && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Need help? Get in touch with our support team
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open('https://discord.gg/pyairtable', '_blank')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Join Discord Community
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open('mailto:support@pyairtable.com?subject=Onboarding Error', '_blank')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Email Support
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}