"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Clock,
  Globe,
  Download
} from "lucide-react"

const mockSessions = [
  {
    id: "1",
    device: "Chrome on macOS",
    location: "San Francisco, CA",
    lastActive: "Active now",
    current: true
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "San Francisco, CA", 
    lastActive: "2 hours ago",
    current: false
  },
  {
    id: "3",
    device: "Firefox on Windows",
    location: "New York, NY",
    lastActive: "Yesterday",
    current: false
  }
]

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Authentication & Access
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input 
              id="current-password" 
              type="password"
              placeholder="Enter current password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              type="password"
              placeholder="Enter new password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              type="password"
              placeholder="Confirm new password"
            />
          </div>
          
          <Button>Update Password</Button>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys & Tokens
          </CardTitle>
          <CardDescription>
            Manage API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Production API Key</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  pk_••••••••••••••••••••••••••••••••
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created on January 15, 2024 • Last used 2 hours ago
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  Regenerate
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  Revoke
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Development API Key</span>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  pk_••••••••••••••••••••••••••••••••
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created on December 10, 2023 • Never used
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  Activate
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  Delete
                </Button>
              </div>
            </div>
          </div>
          
          <Button variant="outline">
            <Key className="w-4 h-4 mr-2" />
            Generate New API Key
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Monitor and manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{session.device}</span>
                  {session.current && (
                    <Badge variant="default">Current Session</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.location} • {session.lastActive}
                </div>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="text-red-600">
                  Revoke
                </Button>
              )}
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            Revoke All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Data Encryption</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt sensitive data at rest and in transit
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out after inactivity
              </p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified of new login attempts
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Suspicious Activity Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert on unusual account activity
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Security Audit Log
          </CardTitle>
          <CardDescription>
            Recent security-related activities on your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Successful login</div>
                <div className="text-xs text-muted-foreground">
                  Chrome on macOS • San Francisco, CA • 2 hours ago
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded">
              <Key className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">API key regenerated</div>
                <div className="text-xs text-muted-foreground">
                  Production API Key • Yesterday at 3:24 PM
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Failed login attempt</div>
                <div className="text-xs text-muted-foreground">
                  Unknown device • London, UK • 3 days ago
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Full Audit Log
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Emergency Actions</CardTitle>
          <CardDescription>
            Emergency security actions - use with caution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-red-600">Revoke All API Keys</Label>
              <p className="text-sm text-muted-foreground">
                Immediately revoke all API keys and tokens
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Revoke All
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-red-600">Log Out All Sessions</Label>
              <p className="text-sm text-muted-foreground">
                Force logout from all devices and sessions
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Log Out All
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-red-600">Suspend Account</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily suspend account access
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Suspend
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}