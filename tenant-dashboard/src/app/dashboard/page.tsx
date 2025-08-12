'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { airtableClient, AirtableBase } from '@/lib/airtable-client'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bases, setBases] = useState<AirtableBase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/auth/login') // Redirect to login if not authenticated
      return
    }

    // Fetch Airtable bases when session is available
    if (session?.accessToken) {
      fetchBases()
    }
  }, [session, status, router])

  const fetchBases = async () => {
    if (!session?.accessToken) return

    setLoading(true)
    setError(null)

    try {
      console.log('Fetching Airtable bases with token:', session.accessToken.substring(0, 20) + '...')
      const fetchedBases = await airtableClient.listBases(session.accessToken)
      console.log('Fetched bases:', fetchedBases)
      setBases(fetchedBases)
    } catch (err) {
      console.error('Error fetching bases:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bases')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user?.email}!
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
                  <p className="text-gray-500">No Airtable bases found. Make sure you have access to some bases in your Airtable account.</p>
                </div>
              ) : (
                bases.map((base) => (
                  <div key={base.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{base.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">ID: {base.id}</p>
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {base.permissionLevel}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
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
            User: {session.user?.email}
            Role: {session.user?.role}
            Tenant: {session.user?.tenantId}
            Token: {session.accessToken ? `${session.accessToken.substring(0, 20)}...` : 'No token'}
            Bases Count: {bases.length}
          </pre>
        </div>
      </div>
    </div>
  )
}