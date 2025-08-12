'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { airtableClient, AirtableBase } from '@/lib/airtable-client'
import { useAuth } from '@/lib/auth/auth-context'

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated, getAccessToken } = useAuth()
  const router = useRouter()
  const [bases, setBases] = useState<AirtableBase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return // Still loading
    if (!isAuthenticated) {
      router.push('/auth/login') // Redirect to login if not authenticated
      return
    }

    // Fetch Airtable bases when authenticated
    fetchBases()
  }, [authLoading, isAuthenticated, router])

  const fetchBases = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    setError(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      console.log('Fetching Airtable bases with token:', accessToken.substring(0, 20) + '...')
      const fetchedBases = await airtableClient.listBases(accessToken)
      console.log('Fetched bases:', fetchedBases)
      setBases(fetchedBases)
    } catch (err) {
      console.error('Error fetching bases:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bases')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.email}!
          </p>
        </div>

        {/* Airtable Bases Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Your Airtable Bases</h2>
            <button
              onClick={fetchBases}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold">Error loading bases:</p>
              <p>{error}</p>
              {error.includes('Missing user context') || error.includes('401') || error.includes('Unauthorized') ? (
                <div className="mt-2 text-sm">
                  <p className="mb-1">This might be because:</p>
                  <ul className="list-disc ml-5">
                    <li>No Airtable token is configured for your account</li>
                    <li>Your Airtable token has expired</li>
                    <li>You need to connect your Airtable account first</li>
                  </ul>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={fetchBases}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Try Again
                    </button>
                    <a href="/onboarding" className="px-3 py-1 border border-red-600 text-red-600 text-sm rounded hover:bg-red-50">
                      Account Setup
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <button
                    onClick={fetchBases}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && !error && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading your Airtable bases...</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bases.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="max-w-md mx-auto">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4 4 4M7 7l4 4-4 4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Airtable bases found</h3>
                    <p className="text-gray-500 mb-4">
                      Your Airtable integration is connected, but no bases are accessible. This might be because:
                    </p>
                    <ul className="text-left text-sm text-gray-600 mb-4 space-y-1">
                      <li>• You don't have any bases in your Airtable account</li>
                      <li>• Your Airtable token doesn't have permission to access bases</li>
                      <li>• The bases are in a different Airtable workspace</li>
                    </ul>
                    <div className="space-y-2">
                      <a
                        href="https://airtable.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Open Airtable
                      </a>
                      <p className="text-xs text-gray-500">
                        <a href="/onboarding" className="text-blue-600 hover:text-blue-800 underline">
                          Reconfigure your Airtable connection
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                bases.map((base) => (
                  <div key={base.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{base.name}</h3>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {base.permissionLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-50 px-2 py-1 rounded text-xs">
                      {base.id}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Connected</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`https://airtable.com/${base.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Open in Airtable
                        </a>
                        <Link 
                          href={`/dashboard/base/${base.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Other dashboard sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <p className="text-gray-600">Dashboard overview content</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-600">Analytics content</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a
                href="/chat"
                className="block text-blue-600 hover:text-blue-800"
              >
                Go to Chat
              </a>
              <a
                href="/auth/register"
                className="block text-blue-600 hover:text-blue-800"
              >
                User Management
              </a>
            </div>
          </div>
        </div>

        {/* Debug info for testing */}
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h3>
          <pre className="text-xs text-gray-600">
            User: {user?.email}
            User ID: {user?.id}
            Active: {user?.is_active ? 'Yes' : 'No'}
            Authenticated: {isAuthenticated ? 'Yes' : 'No'}
            Bases Count: {bases.length}
          </pre>
        </div>
      </div>
    </div>
  )
}