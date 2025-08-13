"use client"

import * as React from "react"
import { useAirtableStore } from "@/stores/airtableStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, Table, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AirtableBase, AirtableTable } from "@/lib/airtable-client"

export function BaseList() {
  const {
    bases,
    selectedBase,
    selectedTable,
    tables,
    isLoading,
    setSelectedBase,
    setSelectedTable,
  } = useAirtableStore()

  const handleBaseSelect = (base: AirtableBase) => {
    if (selectedBase?.id === base.id) {
      // Collapse if clicking the same base
      setSelectedBase(null)
    } else {
      setSelectedBase(base)
    }
  }

  const handleTableSelect = (table: AirtableTable) => {
    setSelectedTable(table)
  }

  if (isLoading && !bases.length) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  if (!bases.length) {
    return (
      <div className="p-4 text-center">
        <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No bases found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="p-2 space-y-1">
        {bases.map((base) => (
          <div key={base.id} className="space-y-1">
            {/* Base Item */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBaseSelect(base)}
              className={cn(
                "w-full justify-start text-left h-auto p-2",
                selectedBase?.id === base.id && "bg-muted"
              )}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {selectedBase?.id === base.id ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{base.name}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {base.permissionLevel}
                    </Badge>
                  </div>
                </div>
              </div>
            </Button>

            {/* Tables List (when base is expanded) */}
            {selectedBase?.id === base.id && (
              <div className="ml-6 space-y-1">
                {isLoading && !tables.length ? (
                  <div className="space-y-1">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-2 p-2">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : tables.length > 0 ? (
                  tables.map((table) => (
                    <Button
                      key={table.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTableSelect(table)}
                      className={cn(
                        "w-full justify-start text-left h-auto p-2",
                        selectedTable?.id === table.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Table className="h-3 w-3 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{table.name}</div>
                          {table.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {table.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {table.fields?.length || 0} fields
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {table.views?.length || 0} views
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No tables found
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}