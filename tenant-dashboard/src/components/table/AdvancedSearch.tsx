'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Bookmark,
} from 'lucide-react'

// Types for search and filter functionality
export interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string
  logicalOperator?: 'AND' | 'OR'
}

export interface SortCondition {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterPreset {
  id: string
  name: string
  filters: FilterCondition[]
  sort?: SortCondition
  createdAt: Date
}

export interface AdvancedSearchProps {
  fieldNames: string[]
  onFiltersChange: (filters: FilterCondition[]) => void
  onSortChange: (sort: SortCondition | null) => void
  onSearch: (query: string) => void
  searchQuery?: string
  className?: string
}

// Available filter operators
const OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
]

export function AdvancedSearch({
  fieldNames,
  onFiltersChange,
  onSortChange,
  onSearch,
  searchQuery = '',
  className = '',
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [sort, setSort] = useState<SortCondition | null>(null)
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const [showPresetInput, setShowPresetInput] = useState(false)

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('table-filter-presets')
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets)
        setPresets(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        })))
      } catch (error) {
        console.error('Error loading filter presets:', error)
      }
    }
  }, [])

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('table-filter-presets', JSON.stringify(presets))
  }, [presets])

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Notify parent of sort changes
  useEffect(() => {
    onSortChange(sort)
  }, [sort, onSortChange])

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: Date.now().toString(),
      field: fieldNames[0] || '',
      operator: 'contains',
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined,
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ))
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id))
  }

  const clearAllFilters = () => {
    setFilters([])
    setSort(null)
    onSearch('')
  }

  const savePreset = () => {
    if (!presetName.trim()) return

    const preset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: [...filters],
      sort: sort ? { ...sort } : undefined,
      createdAt: new Date(),
    }

    setPresets([preset, ...presets])
    setPresetName('')
    setShowPresetInput(false)
  }

  const loadPreset = (preset: FilterPreset) => {
    setFilters([...preset.filters])
    if (preset.sort) {
      setSort({ ...preset.sort })
    } else {
      setSort(null)
    }
    setIsExpanded(true)
  }

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id))
  }

  const hasActiveFilters = filters.length > 0 || sort !== null || searchQuery.length > 0

  const activeFilterCount = useMemo(() => {
    return filters.filter(f => f.value.trim() !== '').length + (sort ? 1 : 0)
  }, [filters, sort])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar and Controls */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Sort Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort by</label>
            <div className="flex items-center space-x-2">
              <Select
                value={sort?.field || ''}
                onValueChange={(field) => {
                  if (field) {
                    setSort({ field, direction: sort?.direction || 'asc' })
                  } else {
                    setSort(null)
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No sorting</SelectItem>
                  {fieldNames.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {sort && (
                <Select
                  value={sort.direction}
                  onValueChange={(direction: 'asc' | 'desc') => {
                    if (sort) {
                      setSort({ ...sort, direction })
                    }
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Filters</label>
              <Button
                variant="outline"
                size="sm"
                onClick={addFilter}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add filter
              </Button>
            </div>

            {filters.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                No filters applied. Click "Add filter" to create one.
              </p>
            )}

            {filters.map((filter, index) => (
              <div key={filter.id} className="space-y-2 p-3 bg-white border border-gray-200 rounded-lg">
                {index > 0 && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Select
                      value={filter.logicalOperator || 'AND'}
                      onValueChange={(value: 'AND' | 'OR') => 
                        updateFilter(filter.id, { logicalOperator: value })
                      }
                    >
                      <SelectTrigger className="w-16 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {/* Field Selector */}
                  <Select
                    value={filter.field}
                    onValueChange={(field) => updateFilter(filter.id, { field })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldNames.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator Selector */}
                  <Select
                    value={filter.operator}
                    onValueChange={(operator) => updateFilter(filter.id, { operator })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value Input */}
                  {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                    <Input
                      placeholder="Enter value"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      className="flex-1"
                    />
                  )}

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Presets Section */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Filter Presets</label>
              {(filters.length > 0 || sort) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresetInput(!showPresetInput)}
                  className="text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save preset
                </Button>
              )}
            </div>

            {showPresetInput && (
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      savePreset()
                    } else if (e.key === 'Escape') {
                      setShowPresetInput(false)
                      setPresetName('')
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPresetInput(false)
                    setPresetName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {presets.length > 0 && (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-sm">
                    <button
                      onClick={() => loadPreset(preset)}
                      className="flex items-center space-x-2 flex-1 text-left hover:text-blue-600"
                    >
                      <Bookmark className="h-3 w-3" />
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-gray-500 text-xs">
                        ({preset.filters.length} filter{preset.filters.length !== 1 ? 's' : ''})
                        {preset.sort && ', sorted'}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePreset(preset.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {(filters.some(f => f.value.trim() !== '') || sort) && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {sort && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>Sort: {sort.field} ({sort.direction})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSort(null)}
                className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters
            .filter(f => f.value.trim() !== '')
            .map((filter) => (
              <Badge key={filter.id} variant="outline" className="flex items-center space-x-1">
                <span>
                  {filter.field} {OPERATORS.find(op => op.value === filter.operator)?.label.toLowerCase()} 
                  {!['is_empty', 'is_not_empty'].includes(filter.operator) && ` "${filter.value}"`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                  className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
        </div>
      )}
    </div>
  )
}