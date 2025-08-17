"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MetricsChartProps {
  title: string;
  description?: string;
  data: any[];
  type: 'line' | 'area' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  colors?: string[]; // For pie charts
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  formatValue?: (value: any) => string;
  formatXAxis?: (value: any) => string;
  badge?: string;
  className?: string;
}

const defaultColors = [
  'hsl(var(--primary))', // primary theme color
  'hsl(142 71% 45%)', // green
  'hsl(48 96% 53%)', // yellow
  'hsl(0 84% 60%)', // red
  'hsl(262 83% 58%)', // purple
  'hsl(189 94% 43%)', // cyan
  'hsl(25 95% 53%)', // orange
  'hsl(84 81% 44%)', // lime
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const formatTime = (timestamp: string) => {
  return format(new Date(timestamp), 'HH:mm');
};

const CustomTooltip = ({ 
  active, 
  payload, 
  label, 
  formatValue, 
  formatXAxis 
}: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
      <p className="text-sm font-medium text-popover-foreground">
        {formatXAxis ? formatXAxis(label) : label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm text-popover-foreground" style={{ color: entry.color }}>
          {entry.name}: {formatValue ? formatValue(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

export function MetricsChart({
  title,
  description,
  data,
  type,
  dataKey,
  xAxisKey = 'timestamp',
  color = 'hsl(var(--primary))',
  colors = defaultColors,
  height = 300,
  showGrid = true,
  showTooltip = true,
  formatValue,
  formatXAxis,
  badge,
  className
}: MetricsChartProps) {
  
  const getFormattedValue = (value: any) => {
    if (formatValue) return formatValue(value);
    if (typeof value === 'number') {
      // Auto-detect format based on value
      if (value > 1000000 && value < 10000000000) {
        return formatBytes(value); // Likely bytes
      } else if (value >= 0 && value <= 100) {
        return formatPercentage(value); // Likely percentage
      }
      return formatNumber(value);
    }
    return value;
  };

  const getFormattedXAxis = (value: any) => {
    if (formatXAxis) return formatXAxis(value);
    if (typeof value === 'string' && value.includes('T')) {
      return formatTime(value); // ISO timestamp
    }
    return value;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      width: '100%',
      height,
    };

    const axisProps = {
      dataKey: xAxisKey,
      tick: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
      axisLine: { stroke: 'hsl(var(--border))' },
      tickLine: { stroke: 'hsl(var(--border))' },
      tickFormatter: getFormattedXAxis,
    };

    const tooltipProps = showTooltip ? {
      content: (props: any) => (
        <CustomTooltip 
          {...props} 
          formatValue={getFormattedValue}
          formatXAxis={getFormattedXAxis}
        />
      )
    } : undefined;

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis {...axisProps} />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={getFormattedValue}
            />
            {showTooltip && <Tooltip {...tooltipProps} />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5, fill: color }}
            />
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis {...axisProps} />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={getFormattedValue}
            />
            {showTooltip && <Tooltip {...tooltipProps} />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.2}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis {...axisProps} />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={getFormattedValue}
            />
            {showTooltip && <Tooltip {...tooltipProps} />}
            <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart {...commonProps}>
            {showTooltip && <Tooltip {...tooltipProps} />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey={dataKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {badge && (
          <Badge variant="outline" className="text-xs">
            {badge}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}