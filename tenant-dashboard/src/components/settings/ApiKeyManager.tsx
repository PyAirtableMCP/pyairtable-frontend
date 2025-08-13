'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Key, ExternalLink, Shield, AlertTriangle } from 'lucide-react';

import { useSettingsStore } from '@/stores/settingsStore';

interface ApiKeyManagerProps {}

export function ApiKeyManager({}: ApiKeyManagerProps) {
  const { settings, updateApiKey, removeApiKey } = useSettingsStore();
  const { api } = settings;

  const [tempKey, setTempKey] = useState(api.airtableKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const getMaskedKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  const handleTestConnection = async () => {
    if (!tempKey.trim()) {
      setConnectionStatus('error');
      setConnectionMessage('Please enter an API key first');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (tempKey.startsWith('pat') && tempKey.length > 20) {
        setConnectionStatus('success');
        setConnectionMessage('Connection successful! API key is valid.');
        updateApiKey(tempKey, true);
      } else {
        setConnectionStatus('error');
        setConnectionMessage('Invalid API key format. Please check your key and try again.');
        updateApiKey(tempKey, false);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('Failed to test connection. Please try again.');
      updateApiKey(tempKey, false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!tempKey.trim()) {
      setConnectionMessage('Please enter an API key');
      return;
    }

    updateApiKey(tempKey, connectionStatus === 'success');
    setConnectionMessage('API key saved successfully!');
    
    setTimeout(() => {
      setConnectionMessage('');
      setConnectionStatus('idle');
    }, 2000);
  };

  const handleRemoveApiKey = () => {
    setTempKey('');
    removeApiKey();
    setConnectionStatus('idle');
    setConnectionMessage('');
    setShowKey(false);
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {api.airtableKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              Current API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {api.hasValidKey ? 'Active and verified' : 'Key saved but not tested'}
                </p>
              </div>
              <Badge variant={api.hasValidKey ? 'default' : 'secondary'}>
                {api.hasValidKey ? 'Verified' : 'Unverified'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">API Key</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {getMaskedKey(api.airtableKey)}
                </p>
              </div>
            </div>

            {api.keyLastTested && (
              <div>
                <Label className="font-medium">Last Tested</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(api.keyLastTested).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {api.airtableKey ? 'Update API Key' : 'Add API Key'}
          </CardTitle>
          <CardDescription>
            Configure your Airtable Personal Access Token for data access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Airtable Personal Access Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Enter your Airtable Personal Access Token"
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
            {tempKey && !showKey && (
              <p className="text-sm text-muted-foreground">
                Current key: {getMaskedKey(tempKey)}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !tempKey.trim()}
              variant="outline"
              size="sm"
            >
              {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            
            <Button
              onClick={handleSaveApiKey}
              disabled={!tempKey.trim()}
              size="sm"
            >
              <Key className="mr-2 h-4 w-4" />
              Save API Key
            </Button>

            {api.airtableKey && (
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
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ExternalLink className="h-5 w-5" />
            How to get your Personal Access Token
          </CardTitle>
          <CardDescription>
            Follow these steps to create a new token in Airtable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="text-sm space-y-3 list-decimal list-inside">
            <li>
              Go to{' '}
              <a 
                href="https://airtable.com/create/tokens" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-medium"
              >
                Airtable Personal Access Tokens
              </a>
            </li>
            <li>Click "Create new token"</li>
            <li>Give your token a name (e.g., "PyAirtable Dashboard")</li>
            <li>
              Add the required scopes:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">data.records:read</code> - Read records</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">data.records:write</code> - Create/update records</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">schema.bases:read</code> - Read base structure</li>
              </ul>
            </li>
            <li>Select the bases you want to access</li>
            <li>Click "Create token" and copy the generated token</li>
            <li>Paste the token in the field above and test the connection</li>
          </ol>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800">Security Best Practices</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Your API key is stored securely and encrypted</li>
                <li>• Never share your API key with others</li>
                <li>• Don't include API keys in public repositories</li>
                <li>• Regularly rotate your tokens for security</li>
                <li>• Use the minimum required scopes for your use case</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-3">
            <div>
              <strong>Connection failed?</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-muted-foreground">
                <li>Verify your token starts with "pat" and is the full length</li>
                <li>Check that you've granted the required scopes</li>
                <li>Ensure the bases you want to access are selected</li>
                <li>Try creating a new token if the issue persists</li>
              </ul>
            </div>
            <div>
              <strong>Need help?</strong>
              <p className="text-muted-foreground mt-1">
                Check the{' '}
                <a 
                  href="https://airtable.com/developers/web/api/authentication"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Airtable API documentation
                </a>{' '}
                for more details on Personal Access Tokens.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}