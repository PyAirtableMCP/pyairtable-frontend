'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { airtableClient, AirtableTableSummary } from '@/lib/airtable-client'
import { useAuth } from '@/lib/auth/auth-context'

export default function BaseDetailsPage() {
  const { user, isLoading: authLoading, isAuthenticated, getAccessToken } = useAuth()
  const router = useRouter()
  const params = useParams()
  const baseId = params.baseId as string

  const [tables, setTables] = useState<AirtableTableSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [baseName, setBaseName] = useState<string>('')

  useEffect(() => {
    if (authLoading) return // Still loading
    if (!isAuthenticated) {
      router.push('/auth/login') // Redirect to login if not authenticated
      return
    }

    // Fetch tables when authenticated
    if (baseId) {
      fetchTables()
    }
  }, [authLoading, isAuthenticated, router, baseId])

  const fetchTables = async () => {
    if (!isAuthenticated || !baseId) return

    setLoading(true)
    setError(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      console.log('Fetching tables for base:', baseId)
      const fetchedTables = await airtableClient.listTables(baseId, accessToken)
      console.log('Fetched tables:', fetchedTables)
      setTables(fetchedTables)
      
      // Try to get the base name from the URL or set a default
      setBaseName(baseId.substring(0, 17) + '...') // Truncated base ID as fallback
    } catch (err) {
      console.error('Error fetching tables:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tables')
    } finally {
      setLoading(false)
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
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Base Details</h1>
              <p className="text-gray-600 mt-2">
                Base ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{baseId}</span>
              </p>
            </div>
            <button
              onClick={fetchTables}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading tables:</p>
            <p>{error}</p>
            <div className="mt-3">
              <button
                onClick={fetchTables}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading tables...</p>
          </div>
        )}

        {/* Tables List */}
        {!loading && !error && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tables ({tables.length})
            </h2>
            
            {tables.length === 0 ? (
              <div className="text-center py-8">
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
                  <p className="text-gray-500">
                    This base doesn't contain any accessible tables or you don't have permission to view them.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <div 
                    key={table.id} 
                    onClick={() => router.push(`/dashboard/base/${baseId}/table/${table.id}`)}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6l2 2h6a2 2 0 012 2v1" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-50 px-2 py-1 rounded text-xs">
                      {table.id}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {typeof table.recordCount === 'number' ? (
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">{table.recordCount.toLocaleString()}</span> records
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Record count unavailable</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/base/${baseId}/table/${table.id}`)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Records
                        </button>
                        <a
                          href={`https://airtable.com/${baseId}/${table.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Open in Airtable
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Debug info for testing */}
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h3>
          <pre className="text-xs text-gray-600">
            Base ID: {baseId}
            User: {user?.email}
            Tables Count: {tables.length}
            Authenticated: {isAuthenticated ? 'Yes' : 'No'}
          </pre>
        </div>
      </div>
    </div>
  )
}