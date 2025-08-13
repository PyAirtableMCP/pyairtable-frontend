"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useBudgetAlerts, useCostData } from "@/hooks/useCostData";
import { formatCurrency } from "@/lib/utils";
import { 
  AlertTriangle, 
  Plus, 
  Settings, 
  Bell,
  BellOff,
  Trash2,
  Target,
  DollarSign,
  Percent
} from "lucide-react";

interface BudgetAlertsProps {
  className?: string;
}

export function BudgetAlerts({ className }: BudgetAlertsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<string | null>(null);
  const [newAlert, setNewAlert] = useState({
    name: "",
    threshold: "",
    type: "fixed" as "fixed" | "percentage",
    period: "monthly" as "daily" | "weekly" | "monthly",
    notifications: ["email"] as string[],
  });

  const { data: budgetAlerts, isLoading } = useBudgetAlerts();
  const { data: costData } = useCostData();

  const handleCreateAlert = () => {
    // This would call the API to create a new alert
    console.log("Creating alert:", newAlert);
    setShowCreateDialog(false);
    setNewAlert({
      name: "",
      threshold: "",
      type: "fixed",
      period: "monthly",
      notifications: ["email"],
    });
  };

  const handleToggleAlert = (alertId: string, isActive: boolean) => {
    // This would call the API to toggle the alert
    console.log(`Toggling alert ${alertId} to ${isActive}`);
  };

  const handleDeleteAlert = (alertId: string) => {
    // This would call the API to delete the alert
    console.log(`Deleting alert ${alertId}`);
  };

  const calculateProgress = (alert: any) => {
    if (!costData) return 0;
    
    if (alert.type === "percentage") {
      const total = alert.period === "monthly" ? costData.projectedCost : costData.totalCost;
      return Math.min((alert.currentSpend / total) * 100, 100);
    } else {
      return Math.min((alert.currentSpend / alert.threshold) * 100, 100);
    }
  };

  const getAlertStatus = (alert: any) => {
    const progress = calculateProgress(alert);
    if (progress >= 95) return "critical";
    if (progress >= 80) return "warning";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Budget Alerts</h3>
          <p className="text-muted-foreground text-sm">
            Set up alerts to monitor your spending and avoid surprises
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Budget Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Alert Name</label>
                <Input
                  placeholder="e.g., Monthly Budget Limit"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Threshold</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Period</label>
                <Select value={newAlert.period} onValueChange={(value) => setNewAlert({ ...newAlert, period: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAlert} disabled={!newAlert.name || !newAlert.threshold}>
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {budgetAlerts?.map((alert) => {
          const progress = calculateProgress(alert);
          const status = getAlertStatus(alert);
          
          return (
            <Card key={alert.id} className={`border-l-4 ${getStatusColor(status).split(' ')[2]}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Alert Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{alert.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(status)}
                        >
                          {status === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={(checked) => handleToggleAlert(alert.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress and Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Current Spend: {formatCurrency(alert.currentSpend)}
                        </span>
                        <span className="font-medium">
                          {alert.type === "percentage" 
                            ? `${alert.threshold}% of budget`
                            : `${formatCurrency(alert.threshold)} limit`
                          }
                        </span>
                      </div>
                      
                      <Progress 
                        value={progress} 
                        className={`h-2 ${
                          status === "critical" ? "[&>div]:bg-red-500" :
                          status === "warning" ? "[&>div]:bg-orange-500" :
                          "[&>div]:bg-green-500"
                        }`}
                      />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(1)}% of threshold</span>
                        <span className="capitalize">{alert.period} budget</span>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        {alert.isActive ? (
                          <Bell className="h-4 w-4 text-green-500" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {alert.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {alert.notifications.join(", ")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {alert.type === "percentage" ? (
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground capitalize">
                          {alert.type} threshold
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!budgetAlerts || budgetAlerts.length === 0) && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No budget alerts set up</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first budget alert to monitor spending and get notified when you approach your limits.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}