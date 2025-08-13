"use client"

import * as React from "react"
import { useAirtableStore } from "@/stores/airtableStore"
import { airtableClient } from "@/lib/airtable-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database, Table, Plus } from "lucide-react"
import { BaseList } from "./BaseList"
import { TableView } from "./TableView"
import { RecordEditor } from "./RecordEditor"
import { SearchFilter } from "./SearchFilter"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

interface WorkspaceViewProps {
  className?: string
}

export function WorkspaceView({ className }: WorkspaceViewProps) {
  const {
    bases,
    selectedBase,
    selectedTable,
    tables,
    records,
    isLoading,
    error,
    setBases,
    setTables,
    setIsLoading,
    setError,
    clearSelection,
  } = useAirtableStore()

  const [showRecordEditor, setShowRecordEditor] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState(null)

  // Load bases on component mount
  React.useEffect(() => {
    loadBases()
  }, [])

  // Load tables when base is selected
  React.useEffect(() => {
    if (selectedBase) {
      loadTables(selectedBase.id)
    }
  }, [selectedBase])

  const loadBases = async () => {
    setIsLoading(true)
    try {
      const basesData = await airtableClient.listBases()
      setBases(basesData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bases'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTables = async (baseId: string) => {
    setIsLoading(true)
    try {
      const tablesData = await airtableClient.getBaseSchema(baseId)
      setTables(tablesData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tables'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    if (selectedBase && selectedTable) {
      // Refresh current view
      loadTables(selectedBase.id)
    } else if (selectedBase) {
      // Refresh tables
      loadTables(selectedBase.id)
    } else {
      // Refresh bases
      loadBases()
    }
  }

  const handleCreateRecord = () => {
    if (!selectedTable) {
      toast.error('Please select a table first')
      return
    }
    setEditingRecord(null)
    setShowRecordEditor(true)
  }

  const handleEditRecord = (record: any) => {
    setEditingRecord(record)
    setShowRecordEditor(true)
  }

  const handleCloseEditor = () => {
    setShowRecordEditor(false)
    setEditingRecord(null)
  }

  if (error && !bases.length) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>
              Unable to connect to Airtable. Please check your configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadBases} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Airtable Workspace</h1>
          <p className="text-muted-foreground">
            {selectedBase && selectedTable ? (
              `${selectedBase.name} / ${selectedTable.name}`
            ) : selectedBase ? (
              `${selectedBase.name} - Select a table`
            ) : (
              'Select a base to get started'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTable && (
            <Button onClick={handleCreateRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {(selectedBase || selectedTable) && (
            <Button variant="outline" onClick={clearSelection}>
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {selectedTable && (
        <SearchFilter />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Base/Table Navigation */}
        <div className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                {selectedBase ? 'Tables' : 'Bases'}
              </CardTitle>
              {selectedBase && (
                <CardDescription>{selectedBase.name}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <BaseList />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-9">
          {selectedTable ? (
            <TableView onEditRecord={handleEditRecord} />
          ) : selectedBase ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Select a Table
                </CardTitle>
                <CardDescription>
                  Choose a table from the sidebar to view and manage records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <Card 
                      key={table.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => useAirtableStore.getState().setSelectedTable(table)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{table.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {table.fields?.length || 0} fields
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Airtable Workspace</CardTitle>
                <CardDescription>
                  Connect to your Airtable bases and manage your data with ease
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Get Started</p>
                  <p className="text-muted-foreground mb-6">
                    Select a base from the sidebar to explore your tables and records
                  </p>
                  {!bases.length && !isLoading && (
                    <Button onClick={loadBases}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Load Bases
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Record Editor Modal */}
      {showRecordEditor && (
        <RecordEditor
          record={editingRecord}
          onClose={handleCloseEditor}
          onSave={() => {
            handleCloseEditor()
            // Refresh table data after saving
            if (selectedBase && selectedTable) {
              // This will be handled by the RecordEditor component
            }
          }}
        />
      )}
    </div>
  )
}