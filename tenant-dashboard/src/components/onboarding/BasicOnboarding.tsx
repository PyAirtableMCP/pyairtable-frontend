"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  ArrowLeft,
  User,
  Database,
  Layout,
  CheckCircle,
  Loader2
} from "lucide-react"
import toast from "react-hot-toast"
import { OnboardingStepper } from "./OnboardingStepper"
import { ProfileSetupForm } from "./ProfileSetupForm"
import { AirtableConnectionForm } from "./AirtableConnectionForm"
import { TemplateSelectionForm } from "./TemplateSelectionForm"
import { LoadingState } from "./LoadingState"
import { OnboardingErrorBoundary } from "./OnboardingErrorBoundary"

export interface OnboardingData {
  profile: {
    name: string
    company: string
    role: string
  }
  airtable: {
    apiKey: string
    selectedBaseId: string
    selectedBaseName: string
  }
  template: {
    templateId: string
    templateName: string
  }
}

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Profile Setup",
    description: "Tell us about yourself",
    icon: User
  },
  {
    id: 2,
    title: "Connect Airtable",
    description: "Link your Airtable base",
    icon: Database
  },
  {
    id: 3,
    title: "Choose Template",
    description: "Select your workspace template",
    icon: Layout
  }
]

export default function BasicOnboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: {
      name: session?.user?.name || "",
      company: "",
      role: ""
    },
    airtable: {
      apiKey: "",
      selectedBaseId: "",
      selectedBaseName: ""
    },
    template: {
      templateId: "",
      templateName: ""
    }
  })

  // Loading state while checking authentication
  if (status === "loading") {
    return (
      <LoadingState 
        message="Checking authentication..." 
        submessage="Please wait while we verify your account" 
      />
    )
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/login")
    return null
  }

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const updateData = (step: keyof OnboardingData, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }))
  }

  const completeOnboarding = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'basic',
          data: onboardingData,
          completedAt: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to complete onboarding")
      }

      toast.success("Welcome to PyAirtable! Your workspace is ready.", {
        duration: 4000
      })
      
      router.push("/dashboard?onboarding=completed")
      router.refresh()
    } catch (error) {
      console.error("Onboarding completion error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      toast.error("Failed to complete onboarding. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStepComponent = () => {
    const baseProps = {
      onNext: nextStep,
      onPrev: prevStep,
      isLoading,
      error,
      setError
    }

    switch (currentStep) {
      case 1:
        return (
          <ProfileSetupForm
            data={onboardingData.profile}
            onUpdate={(data) => updateData('profile', data)}
            {...baseProps}
          />
        )
      
      case 2:
        return (
          <AirtableConnectionForm
            data={onboardingData.airtable}
            onUpdate={(data) => updateData('airtable', data)}
            {...baseProps}
          />
        )
      
      case 3:
        return (
          <TemplateSelectionForm
            data={onboardingData.template}
            onUpdate={(data) => updateData('template', data)}
            onComplete={completeOnboarding}
            isCompleting={isLoading}
            {...baseProps}
          />
        )
      
      default:
        return null
    }
  }

  const getProgress = () => (currentStep / ONBOARDING_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome to PyAirtable
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Let's get you set up in just 3 simple steps
            </p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-4">
              <Progress 
                value={getProgress()} 
                className="h-2"
                indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Step {currentStep} of {ONBOARDING_STEPS.length}</span>
                <span>{Math.round(getProgress())}% complete</span>
              </div>
            </div>
          </motion.div>

          {/* Stepper */}
          <OnboardingStepper 
            steps={ONBOARDING_STEPS}
            currentStep={currentStep}
            completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
          />

          {/* Current Step Content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {getCurrentStepComponent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step Info */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {React.createElement(ONBOARDING_STEPS[currentStep - 1].icon, { className: "h-3 w-3" })}
                {ONBOARDING_STEPS[currentStep - 1].title}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {ONBOARDING_STEPS[currentStep - 1].description}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}