"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/dashboard/data-table"
import { useAirtableBases, useAirtableTables, useAirtableRecords } from "@/lib/queries/airtable-queries"
import { useAirtableStore } from "@/store/airtable-store"
import {
  Database,
  Table,
  Search,
  Plus,
  RefreshCcw,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AirtableWorkspace() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const {
    selectedBase,
    selectedTable,
    selectBase,
    selectTable
  } = useAirtableStore()

  const { data: bases, isLoading: basesLoading } = useAirtableBases()
  const { data: tables, isLoading: tablesLoading } = useAirtableTables(selectedBase?.id || "")
  const { data: records, isLoading: recordsLoading } = useAirtableRecords(selectedTable?.id || "")

  const filteredBases = bases?.filter(base =>
    base.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Airtable Workspace</h2>
          <p className="text-muted-foreground">
            Manage your Airtable bases, tables, and records
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Record
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Bases Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Bases
            </CardTitle>
            <CardDescription>
              Select a base to explore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Bases List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {basesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))
                  ) : filteredBases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No bases found</p>
                    </div>
                  ) : (
                    filteredBases.map((base) => (
                      <Button
                        key={base.id}
                        variant={selectedBase?.id === base.id ? "default" : "ghost"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => selectBase(base)}
                      >
                        <div className="flex-1 text-left">
                          <div className="font-medium truncate">{base.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {base.permissionLevel}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedBase ? (
            <Card>
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Select a Base</h3>
                  <p className="text-muted-foreground">
                    Choose a base from the sidebar to view its tables and records
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Base Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        {selectedBase.name}
                      </CardTitle>
                      <CardDescription>
                        Base ID: {selectedBase.id}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {selectedBase.permissionLevel}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Tables and Records */}
              <Tabs defaultValue="tables" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="tables" className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Tables ({tables?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="records" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Records {selectedTable && `(${records?.length || 0})`}
                  </TabsTrigger>
                </TabsList>

                {/* Tables Tab */}
                <TabsContent value="tables">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tables</CardTitle>
                      <CardDescription>
                        Tables in {selectedBase.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {tablesLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                          ))}
                        </div>
                      ) : !tables || tables.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Table className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No tables found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tables.map((table) => (
                            <Card
                              key={table.id}
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-accent",
                                selectedTable?.id === table.id && "border-primary bg-accent"
                              )}
                              onClick={() => selectTable(table)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Table className="w-5 h-5 text-primary" />
                                    <div>
                                      <h4 className="font-medium">{table.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {table.fields?.length || 0} fields • {table.views?.length || 0} views
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Records Tab */}
                <TabsContent value="records">
                  {!selectedTable ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                          <Table className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                          <h4 className="font-medium mb-1">Select a Table</h4>
                          <p className="text-sm text-muted-foreground">
                            Choose a table to view its records
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{selectedTable.name} Records</CardTitle>
                            <CardDescription>
                              {records?.length || 0} records found
                            </CardDescription>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Filter className="w-4 h-4 mr-2" />
                              Filter
                            </Button>
                            <Button variant="outline" size="sm">
                              <RefreshCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {recordsLoading ? (
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          <DataTable 
                            data={records || []}
                            columns={selectedTable.fields || []}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  )
}