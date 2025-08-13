"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Using state-based tabs instead of Radix tabs component
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UsageChart } from "./UsageChart";
import { BudgetAlerts } from "./BudgetAlerts";
import { ModelComparison } from "./ModelComparison";
import { useCostSummary } from "@/hooks/useCostData";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Download,
  Calendar,
  CreditCard,
  BarChart3
} from "lucide-react";

interface CostDashboardProps {
  className?: string;
}

export function CostDashboard({ className }: CostDashboardProps) {
  const [period, setPeriod] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");
  const { costData, costHistory, budgetAlerts, modelCosts, isLoading, isError } = useCostSummary();

  const handleExportData = () => {
    if (!costData || !costHistory) return;
    
    const exportData = {
      summary: costData,
      history: costHistory,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cost Tracking</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !costData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Unable to load cost data</h3>
          <p className="text-muted-foreground">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  const activeAlerts = budgetAlerts?.filter(alert => alert.isActive) || [];
  const criticalAlerts = activeAlerts.filter(alert => {
    const threshold = alert.type === 'percentage' 
      ? (costData.totalCost / costData.projectedCost) * 100
      : alert.currentSpend;
    return threshold >= alert.threshold * 0.9; // 90% of threshold
  });

  const costTrend = costHistory && costHistory.length >= 2 
    ? ((costHistory[costHistory.length - 1].cost - costHistory[costHistory.length - 2].cost) / costHistory[costHistory.length - 2].cost) * 100
    : 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cost Tracking</h2>
          <p className="text-muted-foreground">
            Monitor usage and costs across your PyAirtable services
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-6">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Budget Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm">
                    <span className="text-orange-800">{alert.name}</span>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      {alert.type === 'percentage' ? `${Math.round((alert.currentSpend / costData.totalCost) * 100)}%` : formatCurrency(alert.currentSpend)} of {alert.type === 'percentage' ? `${alert.threshold}%` : formatCurrency(alert.threshold)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <MetricCard
          title="Current Spend"
          value={costData.totalCost}
          format="currency"
          change={Math.abs(costTrend)}
          changeType={costTrend >= 0 ? "increase" : "decrease"}
          description={`${period} total`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Projected Cost"
          value={costData.projectedCost}
          format="currency"
          description="End of period"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        
        <MetricCard
          title="API Requests"
          value={costData.usage.apiCalls}
          format="number"
          description="This period"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Active Budgets"
          value={activeAlerts.length}
          format="number"
          description={`${criticalAlerts.length} critical`}
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "usage", label: "Usage Trends" },
              { id: "budgets", label: "Budget Alerts" },
              { id: "models", label: "Model Comparison" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costData.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.category}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(item.usage)} {item.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.cost)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Compute Hours</div>
                      <div className="font-medium">{formatNumber(costData.usage.computeHours)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Storage Used</div>
                      <div className="font-medium">{(costData.usage.storage / (1024 ** 3)).toFixed(2)} GB</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Data Transfer</div>
                      <div className="font-medium">{(costData.usage.dataTransfer / (1024 ** 2)).toFixed(0)} MB</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Period</div>
                      <div className="font-medium capitalize">{period}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        )}

        {activeTab === "usage" && <UsageChart />}

        {activeTab === "budgets" && <BudgetAlerts />}

        {activeTab === "models" && <ModelComparison />}
      </div>
    </div>
  );
}