"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { useModelCosts } from "@/hooks/useCostData";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpDown
} from "lucide-react";

interface ModelComparisonProps {
  className?: string;
}

export function ModelComparison({ className }: ModelComparisonProps) {
  const [sortBy, setSortBy] = useState("totalCost");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [chartMetric, setChartMetric] = useState("totalCost");
  
  const { data: modelCosts, isLoading, isError } = useModelCosts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !modelCosts) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load model comparison data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort models based on selected criteria
  const sortedModels = [...modelCosts].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] as number;
    const bValue = b[sortBy as keyof typeof b] as number;
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  // Calculate totals and averages
  const totalCost = modelCosts.reduce((sum, model) => sum + model.totalCost, 0);
  const totalCalls = modelCosts.reduce((sum, model) => sum + model.totalCalls, 0);
  const avgResponseTime = modelCosts.reduce((sum, model) => sum + model.avgResponseTime * model.totalCalls, 0) / totalCalls;
  const avgSuccessRate = modelCosts.reduce((sum, model) => sum + model.successRate * model.totalCalls, 0) / totalCalls;

  // Chart data for model comparison
  const chartData = modelCosts.map((model) => ({
    model: model.modelName,
    totalCost: model.totalCost,
    totalCalls: model.totalCalls,
    avgResponseTime: model.avgResponseTime,
    successRate: model.successRate,
    costPerCall: model.totalCalls > 0 ? model.totalCost / model.totalCalls : 0,
  }));

  const getChartConfig = () => {
    switch (chartMetric) {
      case "totalCost":
        return {
          title: "Total Cost by Model",
          dataKey: "totalCost",
          color: "#ef4444",
          formatValue: formatCurrency,
        };
      case "totalCalls":
        return {
          title: "API Calls by Model",
          dataKey: "totalCalls",
          color: "#3b82f6",
          formatValue: formatNumber,
        };
      case "avgResponseTime":
        return {
          title: "Average Response Time",
          dataKey: "avgResponseTime",
          color: "#f59e0b",
          formatValue: (value: number) => `${value.toFixed(2)}s`,
        };
      case "costPerCall":
        return {
          title: "Cost per API Call",
          dataKey: "costPerCall",
          color: "#10b981",
          formatValue: (value: number) => formatCurrency(value),
        };
      default:
        return {
          title: "Model Metrics",
          dataKey: "totalCost",
          color: "#3b82f6",
          formatValue: (value: number) => value.toString(),
        };
    }
  };

  const chartConfig = getChartConfig();

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return "bg-green-100 text-green-800";
      case "anthropic":
        return "bg-purple-100 text-purple-800";
      case "google":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Model Cost Comparison</h3>
          <p className="text-muted-foreground text-sm">
            Compare performance and costs across different AI models
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalCost">Total Cost</SelectItem>
              <SelectItem value="totalCalls">API Calls</SelectItem>
              <SelectItem value="avgResponseTime">Response Time</SelectItem>
              <SelectItem value="successRate">Success Rate</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-xl font-bold">{formatNumber(totalCalls)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-xl font-bold">{avgResponseTime.toFixed(2)}s</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Success</p>
                <p className="text-xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Model Performance</CardTitle>
          <Select value={chartMetric} onValueChange={setChartMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalCost">Total Cost</SelectItem>
              <SelectItem value="totalCalls">API Calls</SelectItem>
              <SelectItem value="avgResponseTime">Response Time</SelectItem>
              <SelectItem value="costPerCall">Cost per Call</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <MetricsChart
            title={chartConfig.title}
            data={chartData}
            type="bar"
            dataKey={chartConfig.dataKey}
            xAxisKey="model"
            color={chartConfig.color}
            height={300}
            formatValue={chartConfig.formatValue}
          />
        </CardContent>
      </Card>

      {/* Model Details */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Model Details</h4>
        
        {sortedModels.map((model) => {
          const costPerCall = model.totalCalls > 0 ? model.totalCost / model.totalCalls : 0;
          const costShare = totalCost > 0 ? (model.totalCost / totalCost) * 100 : 0;
          
          return (
            <Card key={model.modelId}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h5 className="font-medium text-lg">{model.modelName}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getProviderColor(model.provider)}>
                          {model.provider}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {costShare.toFixed(1)}% of total spend
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(model.totalCost)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(costPerCall)} per call
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">API Calls</span>
                    </div>
                    <div className="text-lg font-medium">{formatNumber(model.totalCalls)}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Response Time</span>
                    </div>
                    <div className="text-lg font-medium">{model.avgResponseTime.toFixed(2)}s</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-medium">{model.successRate.toFixed(1)}%</div>
                      <Progress value={model.successRate} className="w-16 h-2" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Pricing</span>
                    </div>
                    <div className="text-sm">
                      <div>In: {formatCurrency(model.inputCost)}/1K tokens</div>
                      <div>Out: {formatCurrency(model.outputCost)}/1K tokens</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}