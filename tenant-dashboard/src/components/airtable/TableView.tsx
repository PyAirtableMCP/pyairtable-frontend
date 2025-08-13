"use client"

import * as React from "react"
import { useAirtableStore } from "@/stores/airtableStore"
import { airtableClient } from "@/lib/airtable-client"
import { DataTable } from "@/components/design-system/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Edit, Trash, Eye, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "react-hot-toast"
import type { AirtableRecord } from "@/lib/airtable-client"
import type { ColumnDef } from "@tanstack/react-table"

interface TableViewProps {
  onEditRecord: (record: AirtableRecord) => void
}

export function TableView({ onEditRecord }: TableViewProps) {
  const {
    selectedBase,
    selectedTable,
    records,
    isLoading,
    error,
    searchTerm,
    filterOptions,
    hasMore,
    offset,
    setRecords,
    addRecords,
    deleteRecord,
    setIsLoading,
    setError,
    setOffset,
  } = useAirtableStore()

  const [loadingMore, setLoadingMore] = React.useState(false)
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set())

  // Load records when table is selected
  React.useEffect(() => {
    if (selectedBase && selectedTable) {
      loadRecords(true)
    }
  }, [selectedBase, selectedTable, searchTerm, filterOptions])

  const loadRecords = async (reset = false) => {
    if (!selectedBase || !selectedTable) return

    const isInitialLoad = reset || !records.length
    if (isInitialLoad) {
      setIsLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const filterByFormula = searchTerm 
        ? `FIND(LOWER("${searchTerm}"), LOWER(CONCATENATE(${selectedTable.fields?.map(f => `{${f.name}}`).join(', ') || ''})))` 
        : undefined

      const response = await airtableClient.listRecords(
        selectedBase.id,
        selectedTable.id,
        {
          maxRecords: 100,
          offset: reset ? undefined : offset,
          filterByFormula,
          ...filterOptions,
        }
      )

      if (reset) {
        setRecords(response.records, response.hasMore)
      } else {
        addRecords(response.records)
      }
      
      setOffset(response.offset)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load records'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedBase || !selectedTable) return

    setDeletingIds(prev => new Set(prev).add(recordId))
    
    try {
      await airtableClient.deleteRecords(selectedBase.id, selectedTable.id, [recordId])
      deleteRecord(recordId)
      toast.success('Record deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete record'
      toast.error(message)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(recordId)
        return next
      })
    }
  }

  const handleExportData = () => {
    if (!records.length) {
      toast.error('No data to export')
      return
    }

    try {
      const csvData = convertToCSV(records, selectedTable?.fields || [])
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedTable?.name || 'data'}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  const convertToCSV = (records: AirtableRecord[], fields: any[]) => {
    const headers = fields.map(field => field.name).join(',')
    const rows = records.map(record => 
      fields.map(field => {
        const value = record.fields[field.name]
        if (value == null) return ''
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
        if (Array.isArray(value)) return `"${value.join(', ')}"`
        return value.toString()
      }).join(',')
    )
    return [headers, ...rows].join('\n')
  }

  // Generate columns dynamically based on table schema
  const columns: ColumnDef<AirtableRecord>[] = React.useMemo(() => {
    if (!selectedTable?.fields) return []

    const fieldColumns: ColumnDef<AirtableRecord>[] = selectedTable.fields
      .slice(0, 5) // Limit to first 5 fields to keep table manageable
      .map((field) => ({
        accessorKey: `fields.${field.name}`,
        header: field.name,
        cell: ({ row }) => {
          const value = row.original.fields[field.name]
          if (value == null) return <span className="text-muted-foreground">-</span>
          
          if (Array.isArray(value)) {
            return (
              <div className="flex flex-wrap gap-1">
                {value.slice(0, 3).map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item.toString()}
                  </Badge>
                ))}
                {value.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{value.length - 3} more
                  </Badge>
                )}
              </div>
            )
          }
          
          if (typeof value === 'string' && value.length > 50) {
            return (
              <span className="truncate block max-w-[200px]" title={value}>
                {value}
              </span>
            )
          }
          
          return <span>{value.toString()}</span>
        },
      }))

    // Actions column
    const actionsColumn: ColumnDef<AirtableRecord> = {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const record = row.original
        const isDeleting = deletingIds.has(record.id)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditRecord(record)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // Open record in modal view
                toast.info('Record view not implemented yet')
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteRecord(record.id)}
                className="text-destructive"
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }

    return [...fieldColumns, actionsColumn]
  }, [selectedTable, deletingIds, onEditRecord])

  if (!selectedBase || !selectedTable) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Select a table to view records</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedTable.name}</CardTitle>
              <CardDescription>
                {selectedTable.description || 'Airtable records and data'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {records.length} record{records.length !== 1 ? 's' : ''}
              </Badge>
              {hasMore && (
                <Badge variant="secondary">More available</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={!records.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={isLoading}
        error={error}
        onRefresh={() => loadRecords(true)}
        onExport={handleExportData}
        searchPlaceholder="Search records..."
        enableVirtualization={true}
        enableFiltering={true}
        enableColumnVisibility={true}
        enablePagination={false}
      />

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => loadRecords()}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>Loading...</>
            ) : (
              <>Load More Records</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}