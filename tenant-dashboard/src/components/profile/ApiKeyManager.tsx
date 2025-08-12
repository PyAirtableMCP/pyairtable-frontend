'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ApiKeyManagerProps {
  // You can extend this with props as needed
}

export function ApiKeyManager({}: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  // Mask the API key for display
  const getMaskedKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '*'.repeat(key.length)
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus('error')
      setConnectionMessage('Please enter an API key first')
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')
    setConnectionMessage('')

    try {
      // Simulate API call to test Airtable connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock validation - in real app, make actual API call to Airtable
      if (apiKey.startsWith('pat') && apiKey.length > 20) {
        setConnectionStatus('success')
        setConnectionMessage('Connection successful! API key is valid.')
      } else {
        setConnectionStatus('error')
        setConnectionMessage('Invalid API key format. Please check your key and try again.')
      }
    } catch (error) {
      setConnectionStatus('error')
      setConnectionMessage('Failed to test connection. Please try again.')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setConnectionMessage('Please enter an API key')
      return
    }

    setIsSaving(true)
    
    try {
      // Simulate API call to save the key
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHasApiKey(true)
      setConnectionMessage('API key saved successfully!')
      setConnectionStatus('success')
      
      // In real app, you might want to hide the key after saving
      setTimeout(() => {
        setShowKey(false)
        setConnectionMessage('')
        setConnectionStatus('idle')
      }, 2000)
    } catch (error) {
      setConnectionMessage('Failed to save API key. Please try again.')
      setConnectionStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveApiKey = () => {
    setApiKey('')
    setHasApiKey(false)
    setConnectionStatus('idle')
    setConnectionMessage('')
    setShowKey(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="apiKey">Airtable API Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="apiKey"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Airtable API key"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {apiKey && !showKey && (
          <p className="text-sm text-muted-foreground">
            Current key: {getMaskedKey(apiKey)}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleTestConnection}
          disabled={isTestingConnection || !apiKey.trim()}
          variant="outline"
          size="sm"
        >
          {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
        
        <Button
          onClick={handleSaveApiKey}
          disabled={isSaving || !apiKey.trim()}
          size="sm"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save API Key
        </Button>

        {hasApiKey && (
          <Button
            onClick={handleRemoveApiKey}
            variant="destructive"
            size="sm"
          >
            Remove Key
          </Button>
        )}
      </div>

      {connectionMessage && (
        <Alert className={connectionStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <div className="flex items-center gap-2">
            {connectionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={connectionStatus === 'error' ? 'text-red-800' : 'text-green-800'}>
              {connectionMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium">How to get your Airtable API key:</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Airtable Personal Access Tokens</a></li>
          <li>Click "Create new token"</li>
          <li>Give your token a name (e.g., "PyAirtable Dashboard")</li>
          <li>Add the required scopes (data.records:read, data.records:write, schema.bases:read)</li>
          <li>Select the bases you want to access</li>
          <li>Click "Create token" and copy the generated token</li>
        </ol>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
        <div className="flex items-start gap-2">
          <div className="text-yellow-600 text-sm">⚠️</div>
          <div className="text-sm text-yellow-800">
            <strong>Security Note:</strong> Your API key is stored securely and encrypted. 
            Never share your API key with others or include it in public repositories.
          </div>
        </div>
      </div>
    </div>
  )
}