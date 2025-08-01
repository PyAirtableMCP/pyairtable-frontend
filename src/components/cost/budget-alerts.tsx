"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, XCircle, Bell, Settings } from "lucide-react"
import { BudgetAlert } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface BudgetAlertsProps {
  alerts: BudgetAlert[]
}

export function BudgetAlerts({ alerts }: BudgetAlertsProps) {
  const getAlertIcon = (type: BudgetAlert["type"]) => {
    switch (type) {
      case "critical":
        return XCircle
      case "warning":
        return AlertTriangle
      case "info":
        return Info
      default:
        return Bell
    }
  }

  const getAlertColor = (type: BudgetAlert["type"]) => {
    switch (type) {
      case "critical":
        return "destructive"
      case "warning":
        return "default"
      case "info":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Budget Alerts</CardTitle>
            <CardDescription>
              Real-time notifications about your spending and usage
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No active alerts</p>
              <p className="text-sm">You&apos;re within your budget limits</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      alert.type === "critical" ? "text-red-500" :
                      alert.type === "warning" ? "text-yellow-500" :
                      "text-blue-500"
                    }`} />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getAlertColor(alert.type) as any}>
                          {alert.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Threshold: {alert.threshold}%
                        </span>
                        <span>
                          Current: ${alert.currentAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      Dismiss
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Settings</CardTitle>
          <CardDescription>
            Configure when you want to receive budget notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Warning Threshold</label>
              <div className="flex items-center gap-2">
                <Badge variant="default">25%</Badge>
                <span className="text-sm text-muted-foreground">of budget</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Critical Threshold</label>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">80%</Badge>
                <span className="text-sm text-muted-foreground">of budget</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Limit</label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">$50</Badge>
                <span className="text-sm text-muted-foreground">per day</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm">
              Edit Thresholds
            </Button>
            <Button variant="outline" size="sm">
              Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}