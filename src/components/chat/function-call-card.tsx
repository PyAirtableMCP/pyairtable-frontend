"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FunctionCall } from "@/types"
import { formatRelativeTime } from "@/lib/utils"
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Copy
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface FunctionCallCardProps {
  functionCall: FunctionCall
}

export const FunctionCallCard = memo(function FunctionCallCard({ 
  functionCall 
}: FunctionCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusIcon = () => {
    switch (functionCall.status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "executing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (functionCall.status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "executing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
    }
  }

  const copyParameters = () => {
    navigator.clipboard.writeText(JSON.stringify(functionCall.parameters, null, 2))
  }

  const copyResult = () => {
    if (functionCall.result) {
      navigator.clipboard.writeText(JSON.stringify(functionCall.result, null, 2))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-l-4 border-l-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{functionCall.name}</span>
              <Badge className={cn("text-xs", getStatusColor())}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{functionCall.status}</span>
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {functionCall.executionTime && (
            <div className="text-xs text-muted-foreground">
              Execution time: {functionCall.executionTime}ms
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Parameters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyParameters}
                    className="h-6 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(functionCall.parameters, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Result */}
              {functionCall.result && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Result</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyResult}
                      className="h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="bg-muted rounded-md p-3">
                    <pre className="text-xs overflow-x-auto">
                      {typeof functionCall.result === "string" 
                        ? functionCall.result
                        : JSON.stringify(functionCall.result, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {functionCall.status === "error" && functionCall.result && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {typeof functionCall.result === "string" 
                      ? functionCall.result 
                      : functionCall.result.error || "Unknown error"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
})