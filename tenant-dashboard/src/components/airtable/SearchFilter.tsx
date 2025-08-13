"use client"

import * as React from "react"
import { useAirtableStore } from "@/stores/airtableStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X, RotateCcw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function SearchFilter() {
  const {
    selectedTable,
    searchTerm,
    filterOptions,
    setSearchTerm,
    setFilterOptions,
    clearFilters,
  } = useAirtableStore()

  const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm)
  const [showFilters, setShowFilters] = React.useState(false)
  const [tempFilters, setTempFilters] = React.useState(filterOptions)

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchTerm, setSearchTerm])

  const handleApplyFilters = () => {
    setFilterOptions(tempFilters)
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    setTempFilters({})
    setLocalSearchTerm('')
    clearFilters()
    setShowFilters(false)
  }

  const getFilterableFields = () => {
    if (!selectedTable?.fields) return []
    
    // Return fields that are suitable for filtering
    return selectedTable.fields.filter(field => 
      ['singleLineText', 'multilineText', 'email', 'url', 'phoneNumber', 'singleSelect', 'multipleSelects'].includes(field.type)
    )
  }

  const activeFiltersCount = Object.keys(filterOptions).filter(key => filterOptions[key]).length
  const hasActiveFilters = localSearchTerm || activeFiltersCount > 0

  if (!selectedTable) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10"
            />
            {localSearchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalSearchTerm('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter Button */}
          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTempFilters({})}
                    disabled={Object.keys(tempFilters).length === 0}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {getFilterableFields().length > 0 ? (
                  <div className="space-y-3">
                    {getFilterableFields().slice(0, 2).map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-sm font-medium">{field.name}</Label>
                        <Input
                          placeholder={`Filter by ${field.name}`}
                          value={tempFilters[field.name] || ''}
                          onChange={(e) =>
                            setTempFilters(prev => ({
                              ...prev,
                              [field.name]: e.target.value || undefined
                            }))
                          }
                        />
                      </div>
                    ))}

                    {getFilterableFields().length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        Showing first 2 filterable fields. Use search for more filtering.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No filterable fields available.
                  </p>
                )}

                <DropdownMenuSeparator />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleApplyFilters}>
                    Apply
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(localSearchTerm || activeFiltersCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {localSearchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{localSearchTerm}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalSearchTerm('')}
                  className="ml-1 h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {Object.entries(filterOptions).map(([key, value]) => 
              value ? (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {value}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterOptions({ ...filterOptions, [key]: undefined })}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ) : null
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}