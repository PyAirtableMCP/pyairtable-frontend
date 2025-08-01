"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useDashboardMetrics, useSystemStatus } from "@/lib/queries/system-queries"
import { formatCurrency } from "@/lib/utils"
import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DashboardOverview() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: systemStatus, isLoading: statusLoading } = useSystemStatus()

  const getHealthyServicesCount = () => {
    if (!systemStatus) return 0
    return systemStatus.filter(service => service.status === "healthy").length
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  const overviewCards = [
    {
      title: "Active Sessions",
      value: metrics?.activeSessions || 0,
      icon: MessageSquare,
      trend: "+12%",
      trendValue: 12,
      description: "Currently active chat sessions",
      color: "text-blue-600"
    },
    {
      title: "Total Queries",
      value: metrics?.totalQueries || 0,
      icon: BarChart3,
      trend: "+23%",
      trendValue: 23,
      description: "Queries processed today",
      color: "text-green-600"
    },
    {
      title: "Success Rate",
      value: `${((metrics?.successRate || 0) * 100).toFixed(1)}%`,
      icon: Zap,
      trend: "+0.2%",
      trendValue: 0.2,
      description: "Query success rate",
      color: "text-purple-600"
    },
    {
      title: "Avg Response Time",
      value: `${metrics?.averageResponseTime || 0}ms`,
      icon: Clock,
      trend: "-15ms",
      trendValue: -15,
      description: "Average response time",
      color: "text-orange-600"
    },
    {
      title: "Cost Today",
      value: formatCurrency(metrics?.costToday || 0),
      icon: DollarSign,
      trend: "+$2.34",
      trendValue: 2.34,
      description: "AI model usage cost",
      color: "text-red-600"
    },
    {
      title: "System Health",
      value: `${getHealthyServicesCount()}/${systemStatus?.length || 0}`,
      icon: Activity,
      trend: "100%",
      trendValue: 100,
      description: "Services operational",
      color: "text-emerald-600"
    }
  ]

  if (metricsLoading || statusLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2 animate-pulse" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {overviewCards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                {getTrendIcon(card.trendValue)}
                <span className={cn(
                  "text-xs font-medium",
                  card.trendValue > 0 && "text-green-600",
                  card.trendValue < 0 && "text-red-600",
                  card.trendValue === 0 && "text-muted-foreground"
                )}>
                  {card.trend}
                </span>
              </div>
            </div>

            {/* Progress bar for certain metrics */}
            {card.title === "Success Rate" && (
              <div className="mt-3">
                <Progress 
                  value={(metrics?.successRate || 0) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {card.title === "System Health" && (
              <div className="mt-3">
                <Progress 
                  value={(getHealthyServicesCount() / (systemStatus?.length || 1)) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}