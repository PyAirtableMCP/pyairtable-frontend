'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { airtableClient, AirtableRecord } from '@/lib/airtable-client'
import { useAuth } from '@/lib/auth/auth-context'
import { useInputValidation } from '@/lib/hooks/useInputValidation'
import { CriticalPageErrorBoundary } from '@/lib/components/PageErrorBoundary'
import { useRealtimeEvents } from '@/lib/hooks/useWebSocket'
import { Badge } from '@/components/ui/badge'
import { AdvancedSearch, FilterCondition, SortCondition } from '@/components/table/AdvancedSearch'
import { downloadCSV, downloadExcel, exportRecordsWithProgress } from '@/lib/utils/export'

// Dynamic imports for UI components to reduce initial bundle size
const Input = dynamic(() => import('@/components/ui/input').then(mod => ({ default: mod.Input })))
const Button = dynamic(() => import('@/components/ui/button').then(mod => ({ default: mod.Button })))

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function TableRecordsPageContent() {
  const { user, isLoading: authLoading, isAuthenticated, getAccessToken } = useAuth()
  const router = useRouter()
  const params = useParams()
  const baseId = params.baseId as string
  const tableId = params.tableId as string
  const { validateSearchInput } = useInputValidation()

  // WebSocket real-time events
  const {
    isConnected: wsConnected,
    events: wsEvents,
    userPresence,
    sendMessage,
  } = useRealtimeEvents(tableId)

  const [records, setRecords] = useState<AirtableRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string>('')
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [offset, setOffset] = useState<string>('')
  const [hasMore, setHasMore] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([])
  const [sortCondition, setSortCondition] = useState<SortCondition | null>(null)
  const [filteredCurrentPage, setFilteredCurrentPage] = useState(1)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // CRUD states
  const [editingCell, setEditingCell] = useState<{recordId: string, fieldName: string} | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRecordFields, setNewRecordFields] = useState<Record<string, any>>({})
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [crudLoading, setCrudLoading] = useState(false)

  // Export states
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  const recordsPerPage = 10

  // Handle WebSocket events for real-time updates
  useEffect(() => {
    const latestEvent = wsEvents[wsEvents.length - 1];
    if (!latestEvent) return;

    switch (latestEvent.type) {
      case 'record:created':
        const newRecord = latestEvent.payload?.data;
        if (newRecord && newRecord.id && latestEvent.payload?.tableId === tableId) {
          setRecords(prev => {
            // Check if record already exists to avoid duplicates
            const exists = prev.some(r => r.id === newRecord.id);
            if (!exists) {
              return [newRecord, ...prev];
            }
            return prev;
          });
          setTotalRecords(prev => prev + 1);
        }
        break;

      case 'record:updated':
        const updatedRecord = latestEvent.payload?.data;
        if (updatedRecord && updatedRecord.id && latestEvent.payload?.tableId === tableId) {
          setRecords(prev => 
            prev.map(record => 
              record.id === updatedRecord.id 
                ? { ...record, ...updatedRecord, lastModified: new Date().toISOString() }
                : record
            )
          );
        }
        break;

      case 'record:deleted':
        const deletedRecordId = latestEvent.payload?.recordId;
        if (deletedRecordId && latestEvent.payload?.tableId === tableId) {
          setRecords(prev => prev.filter(record => record.id !== deletedRecordId));
          setTotalRecords(prev => prev - 1);
        }
        break;
    }
  }, [wsEvents, tableId]);

  // Mock data fallback
  const mockRecords: AirtableRecord[] = [
    {
      id: 'rec123',
      fields: { 'Name': 'Sample Record 1', 'Status': 'Active', 'Count': 42 },
      createdTime: '2024-01-01T10:00:00.000Z',
      lastModified: '2024-01-01T10:00:00.000Z'
    },
    {
      id: 'rec456',
      fields: { 'Name': 'Sample Record 2', 'Status': 'Inactive', 'Count': 15 },
      createdTime: '2024-01-02T10:00:00.000Z',
      lastModified: '2024-01-02T10:00:00.000Z'
    }
  ]

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (baseId && tableId) {
      fetchRecords()
    }
  }, [authLoading, isAuthenticated, router, baseId, tableId])

  const fetchRecords = async (pageOffset?: string) => {
    if (!isAuthenticated || !baseId || !tableId) return

    setLoading(true)
    setError(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      console.log('Fetching records for table:', tableId, 'in base:', baseId, 'page:', currentPage)
      const response = await airtableClient.listRecords(baseId, tableId, {
        maxRecords: recordsPerPage,
        pageSize: recordsPerPage,
        offset: pageOffset || offset
      })
      
      setRecords(response.records)
      setTotalRecords(response.total)
      setOffset(response.offset || '')
      setHasMore(response.hasMore || false)
      setTableName(tableId.substring(0, 15) + '...') // Fallback table name
    } catch (err) {
      console.error('Error fetching records:', err)
      console.log('Using mock data fallback')
      setError('API failed, showing mock data')
      setRecords(mockRecords)
      setTotalRecords(mockRecords.length)
      setTableName('Sample Table')
    } finally {
      setLoading(false)
    }
  }

  const getFieldNames = (): string[] => {
    if (records.length === 0) return []
    const allFields = new Set<string>()
    records.forEach(record => {
      Object.keys(record.fields).forEach(field => allFields.add(field))
    })
    return Array.from(allFields).slice(0, 5) // Limit to 5 columns
  }

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Apply search query filter
  const searchFilteredRecords = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return records
    
    const query = debouncedSearchQuery.toLowerCase()
    return records.filter(record => {
      // Search in record ID
      if (record.id.toLowerCase().includes(query)) return true
      
      // Search in all field values
      return Object.values(record.fields).some(value => {
        const stringValue = formatFieldValue(value).toLowerCase()
        return stringValue.includes(query)
      })
    })
  }, [records, debouncedSearchQuery])

  // Apply advanced filters
  const filteredRecords = useMemo(() => {
    let result = searchFilteredRecords

    // Apply advanced filters
    const validFilters = activeFilters.filter(f => f.value.trim() !== '')
    if (validFilters.length > 0) {
      result = result.filter(record => {
        return validFilters.every((filter, index) => {
          const fieldValue = formatFieldValue(record.fields[filter.field])
          const filterValue = filter.value.toLowerCase()
          const recordValue = fieldValue.toLowerCase()

          let matches = false
          switch (filter.operator) {
            case 'contains':
              matches = recordValue.includes(filterValue)
              break
            case 'equals':
              matches = recordValue === filterValue
              break
            case 'not_equals':
              matches = recordValue !== filterValue
              break
            case 'starts_with':
              matches = recordValue.startsWith(filterValue)
              break
            case 'ends_with':
              matches = recordValue.endsWith(filterValue)
              break
            case 'is_empty':
              matches = !fieldValue || fieldValue.trim() === ''
              break
            case 'is_not_empty':
              matches = fieldValue && fieldValue.trim() !== ''
              break
            case 'greater_than':
              const numValue = parseFloat(fieldValue)
              const numFilter = parseFloat(filter.value)
              matches = !isNaN(numValue) && !isNaN(numFilter) && numValue > numFilter
              break
            case 'less_than':
              const numValue2 = parseFloat(fieldValue)
              const numFilter2 = parseFloat(filter.value)
              matches = !isNaN(numValue2) && !isNaN(numFilter2) && numValue2 < numFilter2
              break
            default:
              matches = recordValue.includes(filterValue)
          }

          // Handle logical operators for multiple filters
          if (index === 0) return matches
          
          const previousResult = validFilters.slice(0, index).every((prevFilter, prevIndex) => {
            // This is a simplified evaluation - in a real implementation, 
            // you'd want proper boolean expression parsing
            return true // placeholder
          })

          return filter.logicalOperator === 'OR' ? (previousResult || matches) : matches
        })
      })
    }

    // Apply sorting
    if (sortCondition) {
      result = [...result].sort((a, b) => {
        const aValue = formatFieldValue(a.fields[sortCondition.field])
        const bValue = formatFieldValue(b.fields[sortCondition.field])
        
        // Try numeric comparison first
        const aNum = parseFloat(aValue)
        const bNum = parseFloat(bValue)
        
        let comparison = 0
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum
        } else {
          // String comparison
          comparison = aValue.localeCompare(bValue)
        }
        
        return sortCondition.direction === 'desc' ? -comparison : comparison
      })
    }

    return result
  }, [searchFilteredRecords, activeFilters, sortCondition])

  // Paginate filtered results for display
  const paginatedRecords = useMemo(() => {
    const isFiltered = searchQuery || activeFilters.length > 0 || sortCondition
    const currentPageToUse = isFiltered ? filteredCurrentPage : currentPage
    const recordsToUse = isFiltered ? filteredRecords : records
    
    if (isFiltered) {
      // Client-side pagination for filtered results
      const startIndex = (currentPageToUse - 1) * recordsPerPage
      const endIndex = startIndex + recordsPerPage
      return recordsToUse.slice(startIndex, endIndex)
    } else {
      // Server-side pagination for unfiltered results
      return recordsToUse
    }
  }, [filteredRecords, records, searchQuery, activeFilters, sortCondition, filteredCurrentPage, currentPage, recordsPerPage])

  const handleSearch = (query: string) => {
    const validation = validateSearchInput(query)
    
    if (!validation.isValid) {
      setSearchError(validation.errors[0])
    } else {
      setSearchError(null)
    }
    
    // Reset pagination when searching
    setCurrentPage(1)
    setFilteredCurrentPage(1)
    setOffset('')
    
    // Always use sanitized value
    setSearchQuery(validation.sanitizedValue)
  }

  const handleFiltersChange = (filters: FilterCondition[]) => {
    setActiveFilters(filters)
    // Reset pagination when filters change
    setCurrentPage(1)
    setFilteredCurrentPage(1)
    setOffset('')
  }

  const handleSortChange = (sort: SortCondition | null) => {
    setSortCondition(sort)
    // Reset pagination when sort changes
    setCurrentPage(1)
    setFilteredCurrentPage(1)
    setOffset('')
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchError(null)
    setActiveFilters([])
    setSortCondition(null)
    setCurrentPage(1)
    setFilteredCurrentPage(1)
    setOffset('')
  }

  const handleNextPage = async () => {
    const isFiltered = searchQuery || activeFilters.length > 0 || sortCondition
    
    if (isFiltered) {
      // Client-side pagination for filtered results
      const maxPages = Math.ceil(filteredRecords.length / recordsPerPage)
      if (filteredCurrentPage < maxPages) {
        setFilteredCurrentPage(prev => prev + 1)
      }
    } else {
      // Server-side pagination for unfiltered results
      if (!hasMore || !offset) return // No next page available
      setCurrentPage(prev => prev + 1)
      await fetchRecords(offset)
    }
  }

  const handlePreviousPage = async () => {
    const isFiltered = searchQuery || activeFilters.length > 0 || sortCondition
    
    if (isFiltered) {
      // Client-side pagination for filtered results
      if (filteredCurrentPage > 1) {
        setFilteredCurrentPage(prev => prev - 1)
      }
    } else {
      // Server-side pagination for unfiltered results
      if (currentPage <= 1) return
      setCurrentPage(prev => prev - 1)
      // For previous page, we need to recalculate - for simplicity, let's reset to page 1 for now
      if (currentPage === 2) {
        setOffset('')
        await fetchRecords('')
      } else {
        // This would require storing page offsets - simplified approach for now
        setCurrentPage(1)
        setOffset('')
        await fetchRecords('')
      }
    }
  }

  const handlePageInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement
      const pageNumber = parseInt(target.value)
      const isFiltered = searchQuery || activeFilters.length > 0 || sortCondition
      
      if (isFiltered) {
        // Client-side pagination for filtered results
        const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
        const currentPageToUse = filteredCurrentPage
        
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPageToUse) {
          setFilteredCurrentPage(pageNumber)
        } else {
          target.value = currentPageToUse.toString()
        }
      } else {
        // Server-side pagination for unfiltered results
        const totalPages = Math.ceil(totalRecords / recordsPerPage)
        
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
          if (pageNumber === 1) {
            setCurrentPage(1)
            setOffset('')
            await fetchRecords('')
          } else {
            // For simplicity, we'll just show a message for now
            alert('Direct page navigation coming soon. Use Next/Previous for now.')
            target.value = currentPage.toString()
          }
        } else {
          target.value = currentPage.toString()
        }
      }
    }
  }

  // CRUD Operations
  const handleCreateRecord = async () => {
    if (!isAuthenticated || !baseId || !tableId) return
    
    setCrudLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('No access token available')

      // Create record with only non-empty fields
      const fieldsToCreate = Object.entries(newRecordFields)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

      if (Object.keys(fieldsToCreate).length === 0) {
        alert('Please fill in at least one field')
        return
      }

      const response = await airtableClient.createRecords(baseId, tableId, [fieldsToCreate], true)
      
      // Optimistic update - add new record to current records
      if (response.records && response.records.length > 0) {
        const newRecord = response.records[0];
        setRecords(prev => [newRecord, ...prev])
        setTotalRecords(prev => prev + 1)
        setIsCreateModalOpen(false)
        setNewRecordFields({})

        // Broadcast WebSocket event
        if (wsConnected) {
          sendMessage('record:created', {
            tableId,
            recordId: newRecord.id,
            data: newRecord
          });
        }
      }
    } catch (err) {
      console.error('Error creating record:', err)
      alert('Failed to create record: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setCrudLoading(false)
    }
  }

  const handleUpdateRecord = async (recordId: string, fieldName: string, newValue: string) => {
    if (!isAuthenticated || !baseId || !tableId) return
    
    setCrudLoading(true)
    const originalRecord = records.find(r => r.id === recordId)
    if (!originalRecord) return

    // Optimistic update
    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, fields: { ...record.fields, [fieldName]: newValue } }
        : record
    ))

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('No access token available')

      await airtableClient.updateRecords(baseId, tableId, [
        { id: recordId, [fieldName]: newValue }
      ], true)

      // Broadcast WebSocket event
      if (wsConnected) {
        const updatedRecord = records.find(r => r.id === recordId);
        if (updatedRecord) {
          sendMessage('record:updated', {
            tableId,
            recordId,
            data: {
              ...updatedRecord,
              fields: { ...updatedRecord.fields, [fieldName]: newValue }
            }
          });
        }
      }
    } catch (err) {
      console.error('Error updating record:', err)
      // Rollback on error
      setRecords(prev => prev.map(record => 
        record.id === recordId ? originalRecord : record
      ))
      alert('Failed to update record: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setCrudLoading(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!isAuthenticated || !baseId || !tableId) return
    
    setDeletingRecordId(recordId)
    
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      setDeletingRecordId(null)
      return
    }

    setCrudLoading(true)
    const originalRecords = [...records]
    
    // Optimistic update - remove record
    setRecords(prev => prev.filter(record => record.id !== recordId))
    setTotalRecords(prev => prev - 1)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('No access token available')

      await airtableClient.deleteRecords(baseId, tableId, [recordId])

      // Broadcast WebSocket event
      if (wsConnected) {
        sendMessage('record:deleted', {
          tableId,
          recordId
        });
      }
    } catch (err) {
      console.error('Error deleting record:', err)
      // Rollback on error
      setRecords(originalRecords)
      setTotalRecords(prev => prev + 1)
      alert('Failed to delete record: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setCrudLoading(false)
      setDeletingRecordId(null)
    }
  }

  const handleCellDoubleClick = (recordId: string, fieldName: string, currentValue: any) => {
    setEditingCell({ recordId, fieldName })
    setEditingValue(formatFieldValue(currentValue))
  }

  const handleCellEdit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingCell) {
      await handleUpdateRecord(editingCell.recordId, editingCell.fieldName, editingValue)
      setEditingCell(null)
      setEditingValue('')
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditingValue('')
    }
  }

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true)
    setExportProgress(0)
    setShowExportDropdown(false)
    
    try {
      // Determine which records to export (filtered or all)
      const recordsToExport = (searchQuery || activeFilters.length > 0 || sortCondition) 
        ? filteredRecords 
        : records
      
      if (recordsToExport.length === 0) {
        alert('No records to export')
        return
      }

      const exportOptions = {
        tableName: tableName || tableId,
        includeMetadata: true,
        onProgress: (progress: number) => setExportProgress(progress)
      }

      await exportRecordsWithProgress(recordsToExport, format, exportOptions)
      
      // Show success message briefly
      setTimeout(() => {
        setExportProgress(100)
        setTimeout(() => {
          setIsExporting(false)
          setExportProgress(0)
        }, 1000)
      }, 100)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleCSVExport = () => handleExport('csv')
  const handleExcelExport = () => handleExport('excel')

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const fieldNames = getFieldNames()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push(`/dashboard/base/${baseId}`)}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Base</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Table Records</h1>
                <Badge 
                  variant={wsConnected ? "default" : "destructive"}
                  className={wsConnected ? "bg-green-100 text-green-800" : ""}
                >
                  {wsConnected ? "Live" : "Offline"}
                </Badge>
                {userPresence.length > 1 && (
                  <Badge variant="outline">
                    {userPresence.length - 1} other user{userPresence.length - 1 !== 1 ? 's' : ''} viewing
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mt-2">
                Table: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{tableId}</span>
                {wsConnected && (
                  <span className="ml-2 text-sm text-green-600">● Real-time updates enabled</span>
                )}
              </p>
              <p className="text-gray-600 mt-1">
                {(searchQuery || activeFilters.length > 0 || sortCondition) && debouncedSearchQuery === searchQuery ? (
                  <>
                    Showing {Math.min(recordsPerPage, filteredRecords.length)} of {filteredRecords.length} filtered records
                    <span className="text-gray-500 ml-1">({totalRecords.toLocaleString()} total)</span>
                    {activeFilters.length > 0 && (
                      <span className="text-blue-600 ml-2 text-sm">
                        • {activeFilters.filter(f => f.value.trim() !== '').length} filter{activeFilters.filter(f => f.value.trim() !== '').length !== 1 ? 's' : ''} applied
                      </span>
                    )}
                    {sortCondition && (
                      <span className="text-purple-600 ml-2 text-sm">
                        • Sorted by {sortCondition.field}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Showing {Math.min(recordsPerPage, records.length)} of {totalRecords.toLocaleString()} records
                    {totalRecords > recordsPerPage && (
                      <span className="text-blue-600 ml-2 text-sm">
                        (Page {currentPage} of {Math.ceil(totalRecords / recordsPerPage)})
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={isExporting || records.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exporting... {Math.round(exportProgress)}%</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                
                {/* Dropdown Menu */}
                {showExportDropdown && !isExporting && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowExportDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          Export Format
                        </div>
                        <button
                          onClick={handleCSVExport}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Export as CSV</span>
                        </button>
                        <button
                          onClick={handleExcelExport}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                          <span>Export as Excel</span>
                        </button>
                        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                          {(searchQuery || activeFilters.length > 0 || sortCondition) ? (
                            <>Filtered results: {filteredRecords.length} records</>
                          ) : (
                            <>All records: {records.length} records</>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={crudLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Record</span>
              </button>
              <button
                onClick={fetchRecords}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Search Section */}
        <div className="mb-6">
          <AdvancedSearch
            fieldNames={fieldNames}
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />
          
          {/* Search Error */}
          {searchError && (
            <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md max-w-md">
              Search validation error: {searchError}
            </div>
          )}
          
          {/* Results Summary */}
          <div className="mt-3 text-sm text-gray-600">
            {searchQuery || activeFilters.length > 0 || sortCondition ? (
              debouncedSearchQuery === searchQuery ? (
                <>Showing {filteredRecords.length} of {records.length} records</>
              ) : (
                'Searching...'
              )
            ) : (
              `${records.length} record${records.length !== 1 ? 's' : ''} total`
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading records...</p>
          </div>
        )}

        {/* Records Table */}
        {!loading && records.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record ID
                    </th>
                    {fieldNames.map((fieldName) => (
                      <th 
                        key={fieldName} 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          const newDirection = sortCondition?.field === fieldName && sortCondition.direction === 'asc' ? 'desc' : 'asc'
                          handleSortChange({ field: fieldName, direction: newDirection })
                        }}
                        title={`Click to sort by ${fieldName}`}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{fieldName}</span>
                          {sortCondition?.field === fieldName && (
                            <span className="text-blue-600">
                              {sortCondition.direction === 'asc' ? (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {record.id}
                      </td>
                      {fieldNames.map((fieldName) => (
                        <td 
                          key={fieldName} 
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer hover:bg-gray-50"
                          onDoubleClick={() => handleCellDoubleClick(record.id, fieldName, record.fields[fieldName])}
                          title="Double-click to edit"
                        >
                          {editingCell?.recordId === record.id && editingCell?.fieldName === fieldName ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleCellEdit}
                              onBlur={() => {
                                setEditingCell(null)
                                setEditingValue('')
                              }}
                              className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            formatFieldValue(record.fields[fieldName])
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.createdTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            disabled={crudLoading || deletingRecordId === record.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete record"
                          >
                            {deletingRecordId === record.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-500">
                This table doesn't contain any records or you don't have permission to view them.
              </p>
            </div>
          </div>
        )}

        {/* No Search Results State */}
        {!loading && records.length > 0 && filteredRecords.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching records</h3>
              <p className="text-gray-500 mb-4">
                No records match your search query "{searchQuery}".
              </p>
              <Button variant="outline" onClick={handleClearSearch}>
                Clear search
              </Button>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && records.length > 0 && (
          // Show pagination for unfiltered results (server-side pagination)
          (!searchQuery && !activeFilters.length && !sortCondition && totalRecords > recordsPerPage) ||
          // Show pagination for filtered results (client-side pagination)
          ((searchQuery || activeFilters.length > 0 || sortCondition) && filteredRecords.length > recordsPerPage)
        ) && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {(() => {
                const isFiltered = searchQuery || activeFilters.length > 0 || sortCondition
                const currentPageToUse = isFiltered ? filteredCurrentPage : currentPage
                const totalRecordsToUse = isFiltered ? filteredRecords.length : totalRecords
                const totalPages = Math.ceil(totalRecordsToUse / recordsPerPage)
                const isFirstPage = currentPageToUse === 1
                const isLastPage = isFiltered ? currentPageToUse >= totalPages : (!hasMore || !offset)
                
                return (
                  <>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={handlePreviousPage}
                        disabled={isFirstPage || loading}
                        className="flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous</span>
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Page</span>
                        <Input
                          type="number"
                          min="1"
                          max={totalPages}
                          defaultValue={currentPageToUse}
                          onKeyDown={handlePageInput}
                          className="w-16 text-center"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-600">
                          of {totalPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={isLastPage || loading}
                        className="flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Records per page: {recordsPerPage}</span>
                      <span className="text-gray-400">|</span>
                      {isFiltered ? (
                        <>
                          <span>Filtered: {totalRecordsToUse.toLocaleString()}</span>
                          <span className="text-gray-400">|</span>
                          <span>Total: {totalRecords.toLocaleString()}</span>
                        </>
                      ) : (
                        <span>Total: {totalRecords.toLocaleString()}</span>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
            
            {loading && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading next page...
              </div>
            )}
          </div>
        )}

        {/* Create Record Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create New Record</h2>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setNewRecordFields({})
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {fieldNames.map((fieldName) => (
                  <div key={fieldName}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {fieldName}
                    </label>
                    <input
                      type="text"
                      value={newRecordFields[fieldName] || ''}
                      onChange={(e) => setNewRecordFields(prev => ({ 
                        ...prev, 
                        [fieldName]: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter ${fieldName}...`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setNewRecordFields({})
                  }}
                  disabled={crudLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRecord}
                  disabled={crudLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {crudLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TableRecordsPage() {
  return (
    <CriticalPageErrorBoundary pageName="Table Records">
      <TableRecordsPageContent />
    </CriticalPageErrorBoundary>
  )
}