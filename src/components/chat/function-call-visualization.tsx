"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FunctionCall } from "@/types"
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Database,
  Search,
  FileText,
  BarChart
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FunctionCallVisualizationProps {
  functionCall: FunctionCall
}

const getCategoryIcon = (name: string) => {
  if (name.toLowerCase().includes("search")) return Search
  if (name.toLowerCase().includes("table") || name.toLowerCase().includes("base")) return Database
  if (name.toLowerCase().includes("record")) return FileText
  if (name.toLowerCase().includes("analyze") || name.toLowerCase().includes("chart")) return BarChart
  return Zap
}

const getProgressValue = (status: string) => {
  switch (status) {
    case "pending": return 0
    case "executing": return 50
    case "completed": return 100
    case "error": return 100
    default: return 0
  }
}

export function FunctionCallVisualization({ functionCall }: FunctionCallVisualizationProps) {
  const Icon = getCategoryIcon(functionCall.name)
  const progressValue = getProgressValue(functionCall.status)

  const getStatusColor = () => {
    switch (functionCall.status) {
      case "pending":
        return "text-yellow-500"
      case "executing":
        return "text-blue-500"
      case "completed":
        return "text-green-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = () => {
    switch (functionCall.status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "executing":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "error":
        return <XCircle className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              
              <div>
                <h4 className="font-medium text-sm">{functionCall.name}</h4>
                <p className="text-xs text-muted-foreground">
                  MCP Tool Execution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getStatusColor())}
              >
                {getStatusIcon()}
                <span className="ml-1 capitalize">{functionCall.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Progress Bar */}
          <div className="mb-3">
            <Progress 
              value={progressValue} 
              className={cn(
                "h-2",
                functionCall.status === "error" && "bg-red-100 dark:bg-red-900/20"
              )}
            />
          </div>

          {/* Execution Details */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {functionCall.status === "executing" && "Processing request..."}
              {functionCall.status === "completed" && "Execution completed"}
              {functionCall.status === "error" && "Execution failed"}
              {functionCall.status === "pending" && "Queued for execution"}
            </span>
            
            {functionCall.executionTime && (
              <span>{functionCall.executionTime}ms</span>
            )}
          </div>

          {/* Parameters Preview */}
          {Object.keys(functionCall.parameters).length > 0 && (
            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
              <div className="font-medium mb-1">Parameters:</div>
              <div className="space-y-1">
                {Object.entries(functionCall.parameters).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="truncate">
                      {typeof value === "string" 
                        ? value.slice(0, 50) + (value.length > 50 ? "..." : "")
                        : JSON.stringify(value).slice(0, 50)
                      }
                    </span>
                  </div>
                ))}
                {Object.keys(functionCall.parameters).length > 3 && (
                  <div className="text-muted-foreground">
                    +{Object.keys(functionCall.parameters).length - 3} more parameters
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}