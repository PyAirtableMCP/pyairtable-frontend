"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Zap,
  BarChart3,
  Download,
  Settings,
  RefreshCw
} from "lucide-react"
import { CostChart } from "@/components/cost/cost-chart"
import { UsageMetrics } from "@/components/cost/usage-metrics"
import { BudgetAlerts } from "@/components/cost/budget-alerts"
import { ModelUsageBreakdown } from "@/components/cost/model-usage-breakdown"

// Mock data - replace with real API calls
const mockBudgetData = {
  current: 127.50,
  limit: 500.00,
  percentage: 25.5,
  trend: "up",
  change: 12.3
}

const mockStats = [
  {
    title: "Total Spent",
    value: "$127.50",
    change: "+12.3%",
    trend: "up" as const,
    icon: DollarSign,
    description: "This month"
  },
  {
    title: "Daily Average",
    value: "$4.12",
    change: "-2.1%",
    trend: "down" as const,
    icon: Calendar,
    description: "Last 30 days"
  },
  {
    title: "Total Tokens",
    value: "2.4M",
    change: "+18.7%",
    trend: "up" as const,
    icon: Zap,
    description: "This month"
  },
  {
    title: "API Calls",
    value: "12,847",
    change: "+5.2%",
    trend: "up" as const,
    icon: BarChart3,
    description: "This month"
  }
]

const mockAlerts = [
  {
    id: "1",
    type: "warning" as const,
    message: "You've reached 25% of your monthly budget",
    threshold: 25,
    currentAmount: 127.50,
    timestamp: new Date()
  },
  {
    id: "2",
    type: "info" as const,
    message: "GPT-4 usage increased by 15% this week",
    threshold: 15,
    currentAmount: 45.20,
    timestamp: new Date(Date.now() - 86400000)
  }
]

export default function CostTrackingPage() {
  return (
    <div className="flex flex-col min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Cost Tracking</h1>
          <p className="text-muted-foreground">
            Monitor your AI usage and budget in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>
              ${mockBudgetData.current.toFixed(2)} of ${mockBudgetData.limit.toFixed(2)} used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  ${mockBudgetData.current.toFixed(2)}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={mockBudgetData.trend === "up" ? "destructive" : "default"}>
                    {mockBudgetData.trend === "up" ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {mockBudgetData.change}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Budget Remaining</p>
                <p className="text-lg font-semibold">
                  ${(mockBudgetData.limit - mockBudgetData.current).toFixed(2)}
                </p>
              </div>
            </div>
            <Progress value={mockBudgetData.percentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{mockBudgetData.percentage.toFixed(1)}% used</span>
              <span>{(100 - mockBudgetData.percentage).toFixed(1)}% remaining</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {mockStats.map((stat, index) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Badge
                  variant={stat.trend === "up" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex-1"
      >
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostChart />
              <UsageMetrics />
            </div>
          </TabsContent>

          <TabsContent value="models" className="mt-6">
            <ModelUsageBreakdown />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <BudgetAlerts alerts={mockAlerts} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
                <CardDescription>
                  Detailed breakdown of your API usage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed usage history coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}