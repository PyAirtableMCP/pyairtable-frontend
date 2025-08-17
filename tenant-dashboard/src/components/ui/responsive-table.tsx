"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column {
  key: string;
  label: string;
  accessor: string | ((row: any) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  mobileLabel?: string; // Custom label for mobile view
  priority?: "high" | "medium" | "low"; // Controls visibility on mobile
}

export interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  onRowClick?: (row: any, index: number) => void;
  className?: string;
  emptyMessage?: string;
  enableActions?: boolean;
  actions?: Array<{
    label: string;
    onClick: (row: any) => void;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

/**
 * Responsive table component that transforms into card-based layout on mobile
 * Features:
 * - Horizontal scrolling on small screens
 * - Card-based layout for mobile
 * - Touch-friendly interactions
 * - Configurable column priorities
 */
export function ResponsiveTable({
  data,
  columns,
  loading = false,
  onRowClick,
  className,
  emptyMessage = "No data available",
  enableActions = false,
  actions = [],
}: ResponsiveTableProps) {
  const { isMobile } = useResponsive();

  // Filter columns based on priority for mobile
  const visibleColumns = React.useMemo(() => {
    if (!isMobile) return columns;
    return columns.filter(col => col.priority !== "low");
  }, [columns, isMobile]);

  const renderCellContent = (column: Column, row: any) => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  // Mobile card layout
  const MobileCardView = () => (
    <div className="space-y-3">
      {data.map((row, index) => (
        <Card
          key={index}
          className={cn(
            "p-4 transition-colors",
            onRowClick && "cursor-pointer hover:bg-accent/50 active:bg-accent"
          )}
          onClick={() => onRowClick?.(row, index)}
        >
          <div className="space-y-3">
            {/* Primary info - high priority columns */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                {visibleColumns
                  .filter(col => col.priority === "high")
                  .map(column => (
                    <div key={column.key} className="space-y-1">
                      <div className="text-sm font-medium truncate">
                        {renderCellContent(column, row)}
                      </div>
                    </div>
                  ))}
              </div>
              {(enableActions || onRowClick) && (
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {enableActions && actions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, actionIndex) => (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                          >
                            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {onRowClick && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>

            {/* Secondary info - medium priority columns */}
            <div className="grid grid-cols-1 gap-2">
              {visibleColumns
                .filter(col => col.priority === "medium" || !col.priority)
                .map(column => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {column.mobileLabel || column.label}
                    </span>
                    <span className="text-sm">
                      {renderCellContent(column, row)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Desktop table layout
  const DesktopTableView = () => (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                    column.width && `w-${column.width}`
                  )}
                >
                  {column.label}
                </th>
              ))}
              {enableActions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "transition-colors hover:bg-muted/50",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 text-sm">
                    {renderCellContent(column, row)}
                  </td>
                ))}
                {enableActions && (
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, actionIndex) => (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                          >
                            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {isMobile ? (
          // Mobile loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Desktop loading skeleton
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4">
                        <div className="h-4 bg-muted rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {isMobile ? <MobileCardView /> : <DesktopTableView />}
    </div>
  );
}