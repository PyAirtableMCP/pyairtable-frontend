"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Bell,
  BellOff,
  X,
  Filter,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, type Alert } from "@/hooks/useMetrics";
import { formatDistanceToNow } from "date-fns";

interface AlertsPanelProps {
  maxItems?: number;
  showFilters?: boolean;
  className?: string;
}

const getAlertIcon = (type: Alert['type'], severity: Alert['severity']) => {
  const iconClass = "h-4 w-4";
  
  switch (type) {
    case 'error':
      return <AlertCircle className={cn(iconClass, "text-red-500")} />;
    case 'warning':
      return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
    case 'info':
      return <Info className={cn(iconClass, "text-blue-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-gray-500")} />;
  }
};

const getSeverityColor = (severity: Alert['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeColor = (type: Alert['type']) => {
  switch (type) {
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export function AlertsPanel({ 
  maxItems = 10, 
  showFilters = true, 
  className 
}: AlertsPanelProps) {
  const [filters, setFilters] = useState<{
    acknowledged?: boolean;
    type?: Alert['type'][];
    severity?: Alert['severity'][];
  }>({
    acknowledged: false, // Show unacknowledged by default
  });

  const { alerts, isLoading, error } = useAlerts(filters);
  
  const displayedAlerts = alerts.slice(0, maxItems);
  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  const toggleFilter = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev] === value ? undefined : value
    }));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    // In a real app, this would call an API to acknowledge the alert
    console.log('Acknowledging alert:', alertId);
  };

  const handleDismissAlert = (alertId: string) => {
    // In a real app, this would call an API to dismiss the alert
    console.log('Dismissing alert:', alertId);
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base">System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base">System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-base">System Alerts</CardTitle>
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="h-5 px-2 text-xs">
              {unacknowledgedCount}
            </Badge>
          )}
        </div>
        {showFilters && (
          <div className="flex items-center space-x-1">
            <Button
              variant={filters.acknowledged === false ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleFilter('acknowledged', false)}
              className="h-7 px-2 text-xs"
            >
              <Bell className="h-3 w-3 mr-1" />
              Active
            </Button>
            <Button
              variant={filters.acknowledged === true ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleFilter('acknowledged', true)}
              className="h-7 px-2 text-xs"
            >
              <BellOff className="h-3 w-3 mr-1" />
              Acked
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alerts to display</p>
            <p className="text-xs text-muted-foreground mt-1">All systems operating normally</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border",
                    getTypeColor(alert.type),
                    alert.acknowledged && "opacity-60"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  <div className="flex-grow min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {alert.title}
                      </h4>
                      <div className="flex items-center space-x-1 ml-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs capitalize", getSeverityColor(alert.severity))}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                        <span className="text-xs">•</span>
                        <span className="capitalize">{alert.source}</span>
                      </div>
                      {!alert.acknowledged && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="h-6 px-2 text-xs hover:bg-background/80"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissAlert(alert.id)}
                            className="h-6 px-2 text-xs hover:bg-background/80"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {alerts.length > maxItems && (
          <div className="pt-3 mt-3 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all {alerts.length} alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}