"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, Zap, Target } from "lucide-react"

// Mock data - replace with real API calls
const mockMetrics = [
  {
    label: "GPT-4 Usage",
    value: 65,
    cost: "$82.30",
    color: "bg-blue-500",
    icon: BarChart3
  },
  {
    label: "Response Time",
    value: 78,
    cost: "1.2s avg",
    color: "bg-green-500",
    icon: Clock
  },
  {
    label: "Function Calls",
    value: 42,
    cost: "2,847 calls",
    color: "bg-purple-500",
    icon: Zap
  },
  {
    label: "Success Rate",
    value: 98,
    cost: "99.2%",
    color: "bg-emerald-500",
    icon: Target
  }
]

const modelUsage = [
  { model: "GPT-4", percentage: 65, cost: 82.30, calls: 1247 },
  { model: "GPT-3.5 Turbo", percentage: 28, cost: 31.20, calls: 3421 },
  { model: "Claude-3", percentage: 7, cost: 14.00, calls: 892 }
]

export function UsageMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Metrics</CardTitle>
        <CardDescription>
          Real-time performance and usage statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {mockMetrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <span className="text-sm font-semibold">{metric.cost}</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Model Distribution</h4>
          <div className="space-y-3">
            {modelUsage.map((model) => (
              <div key={model.model} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        model.model === "GPT-4" ? "bg-blue-500" :
                        model.model === "GPT-3.5 Turbo" ? "bg-green-500" :
                        "bg-purple-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{model.model}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {model.percentage}%
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    ${model.cost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {model.calls.toLocaleString()} calls
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}