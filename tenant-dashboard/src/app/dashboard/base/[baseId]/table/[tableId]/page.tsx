'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { airtableClient, AirtableRecord } from '@/lib/airtable-client'
import { useAuth } from '@/lib/auth/auth-context'
import { useInputValidation } from '@/lib/hooks/useInputValidation'
import { CriticalPageErrorBoundary } from '@/lib/components/PageErrorBoundary'

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
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // CRUD states
  const [editingCell, setEditingCell] = useState<{recordId: string, fieldName: string} | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRecordFields, setNewRecordFields] = useState<Record<string, any>>({})
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [crudLoading, setCrudLoading] = useState(false)

  const recordsPerPage = 10

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

  // Filter records based on search query (debounced for performance)
  const filteredRecords = useMemo(() => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const validation = validateSearchInput(rawValue)
    
    if (!validation.isValid) {
      setSearchError(validation.errors[0])
    } else {
      setSearchError(null)
    }
    
    // Reset pagination when searching
    setCurrentPage(1)
    setOffset('')
    
    // Always use sanitized value
    setSearchQuery(validation.sanitizedValue)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchError(null)
    setCurrentPage(1)
    setOffset('')
  }

  const handleNextPage = async () => {
    if (!hasMore || !offset) return // No next page available
    setCurrentPage(prev => prev + 1)
    await fetchRecords(offset)
  }

  const handlePreviousPage = async () => {
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

  const handlePageInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement
      const pageNumber = parseInt(target.value)
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
        setRecords(prev => [response.records[0], ...prev])
        setTotalRecords(prev => prev + 1)
        setIsCreateModalOpen(false)
        setNewRecordFields({})
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
              <h1 className="text-3xl font-bold text-gray-900">Table Records</h1>
              <p className="text-gray-600 mt-2">
                Table: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{tableId}</span>
              </p>
              <p className="text-gray-600 mt-1">
                {searchQuery && debouncedSearchQuery === searchQuery ? (
                  <>
                    Showing {Math.min(recordsPerPage, filteredRecords.length)} of {filteredRecords.length} filtered records
                    <span className="text-gray-500 ml-1">({totalRecords.toLocaleString()} total)</span>
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

        {/* Search Section */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 max-w-md">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  title="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-600 whitespace-nowrap">
              {searchQuery ? (
                debouncedSearchQuery === searchQuery ? (
                  `${filteredRecords.length} result${filteredRecords.length !== 1 ? 's' : ''} found`
                ) : (
                  'Searching...'
                )
              ) : (
                `${records.length} record${records.length !== 1 ? 's' : ''}`
              )}
            </div>
          </div>
          
          {/* Search Error */}
          {searchError && (
            <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md max-w-md">
              Search validation error: {searchError}
            </div>
          )}
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
                      <th key={fieldName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {fieldName}
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
                  {filteredRecords.map((record) => (
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
        {!loading && !error && records.length > 0 && totalRecords > recordsPerPage && !searchQuery && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
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
                    max={Math.ceil(totalRecords / recordsPerPage)}
                    defaultValue={currentPage}
                    onKeyDown={handlePageInput}
                    className="w-16 text-center"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-600">
                    of {Math.ceil(totalRecords / recordsPerPage)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!hasMore || !offset || loading}
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
                <span>Total: {totalRecords.toLocaleString()}</span>
              </div>
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