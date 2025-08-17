"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatCurrency, formatBytes } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  format?: "number" | "currency" | "percentage" | "bytes";
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function MetricCard({
  title,
  value,
  change,
  changeType,
  format = "number",
  description,
  icon,
  className,
  size = "md",
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    
    switch (format) {
      case "currency":
        return formatCurrency(val);
      case "percentage":
        return `${val}%`;
      case "bytes":
        return formatBytes(val);
      default:
        return formatNumber(val);
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-3 w-3" />;
      case "decrease":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600 bg-green-50";
      case "decrease":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const cardSizes = {
    sm: "p-3 md:p-4",
    md: "p-4 md:p-6",
    lg: "p-6 md:p-8",
  };

  const titleSizes = {
    sm: "text-xs md:text-sm",
    md: "text-sm md:text-base",
    lg: "text-base md:text-lg",
  };

  const valueSizes = {
    sm: "text-lg md:text-xl",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
  };

  return (
    <Card className={cn("relative overflow-hidden touch-manipulation", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", cardSizes[size])}>
        <CardTitle className={cn("font-medium text-muted-foreground truncate", titleSizes[size])}>
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground flex-shrink-0 ml-2">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("pb-3", cardSizes[size], "pt-0")}>
        <div className="space-y-2 md:space-y-3">
          <div data-testid="metric-value" className={cn("font-bold tracking-tight break-words", valueSizes[size])}>
            {formatValue(value)}
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            {change !== undefined && (
              <Badge
                data-testid="metric-trend"
                variant="secondary"
                className={cn(
                  "flex items-center space-x-1 text-xs px-2 py-1 flex-shrink-0",
                  getChangeColor()
                )}
              >
                {getChangeIcon()}
                <span>{Math.abs(change)}%</span>
              </Badge>
            )}
            
            {description && (
              <p data-testid="metric-status" className="text-xs text-muted-foreground text-right md:text-left flex-1 min-w-0 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedMetricCard = React.memo(MetricCard);
MemoizedMetricCard.displayName = 'MetricCard';
export default MemoizedMetricCard;