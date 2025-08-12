"use client"

import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingStateProps {
  message?: string
  submessage?: string
}

export function LoadingState({ 
  message = "Loading...", 
  submessage = "Please wait while we set things up" 
}: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
          >
            <Loader2 className="h-8 w-8 text-blue-600" />
          </motion.div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {message}
          </h2>
          
          <p className="text-sm text-gray-600">
            {submessage}
          </p>
          
          {/* Animated dots */}
          <div className="flex justify-center mt-4 space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}