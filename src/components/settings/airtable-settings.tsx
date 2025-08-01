"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Database, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Plus,
  Trash2,
  ExternalLink,
  Settings
} from "lucide-react"

const mockConnections = [
  {
    id: "1",
    name: "Production Workspace",
    baseId: "appXYZ123",
    status: "connected",
    lastSync: "2 minutes ago",
    tablesCount: 12,
    recordsCount: 5420
  },
  {
    id: "2", 
    name: "Development Base",
    baseId: "appABC456",
    status: "connected",
    lastSync: "1 hour ago",
    tablesCount: 8,
    recordsCount: 1250
  },
  {
    id: "3",
    name: "Archive Base",
    baseId: "appDEF789",
    status: "error",
    lastSync: "Failed",
    tablesCount: 15,
    recordsCount: 8900
  }
]

export function AirtableSettings() {
  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure your Airtable API access and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Personal Access Token</Label>
            <div className="flex gap-2">
              <Input 
                id="api-key" 
                type="password"
                placeholder="pat••••••••••••••••••••"
                defaultValue="pat1234567890abcdef"
              />
              <Button variant="outline" size="sm">
                Test Connection
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Personal Access Token is encrypted and stored securely.{" "}
              <a href="#" className="text-primary hover:underline">
                Learn how to create one
              </a>
            </p>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                API Connection Active
              </span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connected Bases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connected Bases
          </CardTitle>
          <CardDescription>
            Manage your Airtable base connections and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockConnections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{connection.name}</h4>
                  <Badge 
                    variant={connection.status === "connected" ? "default" : "destructive"}
                  >
                    {connection.status === "connected" ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {connection.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium">Base ID</div>
                    <div className="font-mono text-xs">{connection.baseId}</div>
                  </div>
                  <div>
                    <div className="font-medium">Tables</div>
                    <div>{connection.tablesCount}</div>
                  </div>
                  <div>
                    <div className="font-medium">Records</div>
                    <div>{connection.recordsCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Last Sync</div>
                    <div>{connection.lastSync}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Connect New Base
          </Button>
        </CardContent>
      </Card>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Settings</CardTitle>
          <CardDescription>
            Configure default behavior for Airtable operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Base</Label>
            <Select defaultValue="production">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production Workspace</SelectItem>
                <SelectItem value="development">Development Base</SelectItem>
                <SelectItem value="archive">Archive Base</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Default Table</Label>
            <Select defaultValue="main">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Table</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Default View</Label>
            <Select defaultValue="grid">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="gallery">Gallery View</SelectItem>
                <SelectItem value="calendar">Calendar View</SelectItem>
                <SelectItem value="kanban">Kanban View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync & Performance</CardTitle>
          <CardDescription>
            Configure data synchronization and performance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync data changes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="space-y-2">
            <Label>Sync Interval</Label>
            <Select defaultValue="5">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Every minute</SelectItem>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Batch Size</Label>
            <Select defaultValue="100">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 records</SelectItem>
                <SelectItem value="50">50 records</SelectItem>
                <SelectItem value="100">100 records</SelectItem>
                <SelectItem value="200">200 records</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Cache Results</Label>
              <p className="text-sm text-muted-foreground">
                Cache frequently accessed data
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="space-y-2">
            <Label>Cache Duration</Label>
            <Select defaultValue="300">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="900">15 minutes</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions & Security</CardTitle>
          <CardDescription>
            Configure access permissions and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Read Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow reading data from Airtable
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Write Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow creating and updating records
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Delete Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow deleting records (use with caution)
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Schema Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow modifying table structure and fields
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}