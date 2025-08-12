"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle, LucideIcon } from "lucide-react"

export interface StepperStep {
  id: number
  title: string
  description: string
  icon: LucideIcon
}

interface OnboardingStepperProps {
  steps: StepperStep[]
  currentStep: number
  completedSteps: number[]
}

export function OnboardingStepper({ steps, currentStep, completedSteps }: OnboardingStepperProps) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center space-x-4 md:space-x-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = currentStep === stepNumber
          const isCompleted = completedSteps.includes(stepNumber)
          const isUpcoming = stepNumber > currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                    {
                      "border-green-500 bg-green-500 text-white": isCompleted,
                      "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25": isActive,
                      "border-gray-300 bg-white text-gray-400": isUpcoming,
                    }
                  )}
                  whileHover={{ scale: isUpcoming ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                  
                  {/* Active step pulse animation */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors",
                      {
                        "text-green-600": isCompleted,
                        "text-blue-600": isActive,
                        "text-gray-400": isUpcoming,
                      }
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-xs transition-colors hidden md:block",
                      {
                        "text-green-500": isCompleted,
                        "text-blue-500": isActive,
                        "text-gray-400": isUpcoming,
                      }
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex items-center">
                  <motion.div
                    className={cn(
                      "h-0.5 w-16 md:w-24 transition-colors duration-500",
                      {
                        "bg-green-500": stepNumber < currentStep,
                        "bg-blue-500": stepNumber === currentStep,
                        "bg-gray-300": stepNumber > currentStep,
                      }
                    )}
                    initial={{ scaleX: 0 }}
                    animate={{ 
                      scaleX: stepNumber < currentStep ? 1 : stepNumber === currentStep ? 0.5 : 0 
                    }}
                    transition={{ duration: 0.5, delay: stepNumber < currentStep ? 0.2 : 0 }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}