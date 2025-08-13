"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { useCostHistory } from "@/hooks/useCostData";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import { TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react";

interface UsageChartProps {
  className?: string;
}

export function UsageChart({ className }: UsageChartProps) {
  const [timeframe, setTimeframe] = useState("30");
  const [chartType, setChartType] = useState("line");
  const [metricType, setMetricType] = useState("cost");
  
  const { data: costHistory, isLoading, isError } = useCostHistory(parseInt(timeframe));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !costHistory) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load usage data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for charts
  const chartData = costHistory.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    timestamp: item.date,
    cost: item.cost,
    usage: item.usage,
    apiCost: item.breakdown.find(b => b.category === 'API')?.cost || 0,
    computeCost: item.breakdown.find(b => b.category === 'Compute')?.cost || 0,
  }));

  // Calculate summary metrics
  const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0);
  const totalUsage = chartData.reduce((sum, item) => sum + item.usage, 0);
  const avgDailyCost = totalCost / chartData.length;
  const avgDailyUsage = totalUsage / chartData.length;

  // Calculate trends
  const costTrend = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].cost - chartData[0].cost) / chartData[0].cost) * 100
    : 0;
  
  const usageTrend = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].usage - chartData[0].usage) / chartData[0].usage) * 100
    : 0;

  const getChartConfig = () => {
    switch (metricType) {
      case "cost":
        return {
          title: "Cost Trends",
          description: `Daily cost over the last ${timeframe} days`,
          dataKey: "cost",
          color: "#ef4444", // red
          formatValue: (value: number) => formatCurrency(value),
        };
      case "usage":
        return {
          title: "API Usage Trends",
          description: `Daily API requests over the last ${timeframe} days`,
          dataKey: "usage",
          color: "#3b82f6", // blue
          formatValue: (value: number) => formatNumber(value),
        };
      case "breakdown":
        return {
          title: "Cost Breakdown",
          description: "API vs Compute costs",
          dataKey: "apiCost",
          color: "#10b981", // green
          formatValue: (value: number) => formatCurrency(value),
        };
      default:
        return {
          title: "Metrics",
          description: "",
          dataKey: "cost",
          color: "#3b82f6",
          formatValue: (value: number) => value.toString(),
        };
    }
  };

  const chartConfig = getChartConfig();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Usage Analytics</h3>
          <p className="text-muted-foreground text-sm">
            Track your usage patterns and cost trends over time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cost">Cost</SelectItem>
              <SelectItem value="usage">API Usage</SelectItem>
              <SelectItem value="breakdown">Breakdown</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className={`h-3 w-3 mr-1 ${costTrend >= 0 ? 'text-red-500' : 'text-green-500'}`} />
              <span className={costTrend >= 0 ? 'text-red-500' : 'text-green-500'}>
                {Math.abs(costTrend).toFixed(1)}% vs first day
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-xl font-bold">{formatNumber(totalUsage)}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className={`h-3 w-3 mr-1 ${usageTrend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={usageTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(usageTrend).toFixed(1)}% vs first day
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Cost</p>
                <p className="text-xl font-bold">{formatCurrency(avgDailyCost)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Per day average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Usage</p>
                <p className="text-xl font-bold">{formatNumber(avgDailyUsage)}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requests per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <MetricsChart
        title={chartConfig.title}
        description={chartConfig.description}
        data={chartData}
        type={chartType as any}
        dataKey={chartConfig.dataKey}
        xAxisKey="date"
        color={chartConfig.color}
        height={350}
        formatValue={chartConfig.formatValue}
        badge={`${timeframe} days`}
      />

      {/* Additional Charts for Breakdown View */}
      {metricType === "breakdown" && (
        <div className="grid gap-6 md:grid-cols-2">
          <MetricsChart
            title="API Costs"
            description="Daily API usage costs"
            data={chartData}
            type={chartType as any}
            dataKey="apiCost"
            xAxisKey="date"
            color="#10b981"
            height={250}
            formatValue={(value) => formatCurrency(value)}
          />
          
          <MetricsChart
            title="Compute Costs"
            description="Daily compute costs"
            data={chartData}
            type={chartType as any}
            dataKey="computeCost"
            xAxisKey="date"
            color="#f59e0b"
            height={250}
            formatValue={(value) => formatCurrency(value)}
          />
        </div>
      )}
    </div>
  );
}