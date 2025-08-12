'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { airtableClient, AirtableRecord } from '@/lib/airtable-client'
import { useAuth } from '@/lib/auth/auth-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

export default function TableRecordsPage() {
  const { user, isLoading: authLoading, isAuthenticated, getAccessToken } = useAuth()
  const router = useRouter()
  const params = useParams()
  const baseId = params.baseId as string
  const tableId = params.tableId as string

  const [records, setRecords] = useState<AirtableRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string>('')
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

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

  const fetchRecords = async () => {
    if (!isAuthenticated || !baseId || !tableId) return

    setLoading(true)
    setError(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      console.log('Fetching records for table:', tableId, 'in base:', baseId)
      const response = await airtableClient.listRecords(baseId, tableId, {
        maxRecords: 10, // Limit to first 10 records
        pageSize: 10
      })
      
      setRecords(response.records)
      setTotalRecords(response.total)
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

  const handleClearSearch = () => {
    setSearchQuery('')
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
                    Showing {Math.min(10, filteredRecords.length)} of {filteredRecords.length} filtered records
                    <span className="text-gray-500 ml-1">({totalRecords.toLocaleString()} total)</span>
                  </>
                ) : (
                  <>
                    Showing {Math.min(10, records.length)} of {totalRecords.toLocaleString()} records
                    {totalRecords > 10 && (
                      <span className="text-blue-600 ml-2 text-sm">(pagination coming soon)</span>
                    )}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {record.id}
                      </td>
                      {fieldNames.map((fieldName) => (
                        <td key={fieldName} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFieldValue(record.fields[fieldName])}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.createdTime).toLocaleDateString()}
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

        {/* Pagination Info */}
        {!loading && !error && displayedRecords.length > 0 && totalRecords > 10 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Page 1 of {Math.ceil(totalRecords / 10)}
              </div>
              <div className="flex items-center space-x-2">
                <span>Records per page: 10</span>
                <span className="text-gray-400">|</span>
                <span>Total: {totalRecords.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Note: Currently showing first 10 records. Full pagination controls coming in next sprint.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}