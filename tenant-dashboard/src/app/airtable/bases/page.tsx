'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { airtableClient, AirtableBase } from '@/lib/airtable-client'
import { useAirtableStore } from '@/stores/airtableStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Database, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function BaseExplorerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user
  const authLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  const { bases, setBases, setSelectedBase, clearSelection } = useAirtableStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return // Still loading
    if (!isAuthenticated) {
      router.push('/auth/login') // Redirect to login if not authenticated
      return
    }

    // Clear any previous selections and fetch bases
    clearSelection()
    fetchBases()
  }, [authLoading, isAuthenticated, router])

  const fetchBases = async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError(null)

    try {
      const accessToken = session?.accessToken
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      console.log('Fetching bases from Airtable Gateway...')
      const fetchedBases = await airtableClient.listBases(accessToken)
      console.log('Fetched bases:', fetchedBases)
      setBases(fetchedBases)
      
      if (fetchedBases.length === 0) {
        toast.info('No Airtable bases found. Make sure you have access to at least one base.')
      } else {
        toast.success(`Found ${fetchedBases.length} Airtable base${fetchedBases.length !== 1 ? 's' : ''}`)
      }
    } catch (err) {
      console.error('Error fetching bases:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bases'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBaseClick = (base: AirtableBase) => {
    setSelectedBase(base)
    router.push(`/dashboard/base/${base.id}`)
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
              <h1 className="text-3xl font-bold text-gray-900">Airtable Base Explorer</h1>
              <p className="text-gray-600 mt-2">
                Browse and explore your Airtable bases and their data
              </p>
            </div>
            <Button
              onClick={fetchBases}
              disabled={isLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Error loading bases:</p>
                  <p className="text-red-700 mt-1">{error}</p>
                  <div className="mt-3">
                    <Button
                      onClick={fetchBases}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Loading bases...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Bases Grid */}
        {!isLoading && !error && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Your Airtable Bases ({bases.length})
              </h2>
              <Badge variant="outline" className="text-sm">
                Connected to Airtable Gateway
              </Badge>
            </div>
            
            {bases.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bases found</h3>
                  <p className="text-gray-500 mb-4">
                    You don't have access to any Airtable bases, or they couldn't be loaded.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Make sure you have the correct Airtable permissions</p>
                    <p>• Check that the Airtable Gateway is running</p>
                    <p>• Verify your authentication tokens are valid</p>
                  </div>
                  <Button
                    onClick={fetchBases}
                    className="mt-4"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bases.map((base) => (
                  <Card 
                    key={base.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border border-gray-200"
                    onClick={() => handleBaseClick(base)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                              {base.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <Badge 
                                variant={base.permissionLevel === 'owner' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {base.permissionLevel}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3 font-mono bg-gray-50 px-2 py-1 rounded text-xs">
                        {base.id}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Click to explore tables and data
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBaseClick(base)
                          }}
                        >
                          View Tables
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <Card className="bg-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-600 font-mono">
{`User: ${user?.email || 'Not authenticated'}
Bases Count: ${bases.length}
Authenticated: ${isAuthenticated ? 'Yes' : 'No'}
Gateway URL: ${process.env.NEXT_PUBLIC_AIRTABLE_GATEWAY_URL || 'http://localhost:8002'}
Loading: ${isLoading ? 'Yes' : 'No'}
Error: ${error || 'None'}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}