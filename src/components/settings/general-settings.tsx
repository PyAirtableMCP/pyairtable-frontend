"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Monitor, User, Mail, Globe } from "lucide-react"

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Manage your profile information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Your name" defaultValue="PyAirtable User" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" defaultValue="user@pyairtable.com" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              placeholder="Tell us about yourself..."
              defaultValue="AI automation enthusiast working with Airtable data"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="public-profile" />
            <Label htmlFor="public-profile">Make profile public</Label>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Light
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Dark
              </Button>
              <Button variant="default" size="sm" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                System
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select defaultValue="en">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    English
                  </div>
                </SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="animations" defaultChecked />
            <Label htmlFor="animations">Enable animations</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="compact-mode" />
            <Label htmlFor="compact-mode">Compact mode</Label>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Preferences</CardTitle>
          <CardDescription>
            Configure your default workspace behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-view">Default View</Label>
            <Select defaultValue="dashboard">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="chat">Chat Interface</SelectItem>
                <SelectItem value="cost">Cost Tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sidebar">Sidebar Behavior</Label>
            <Select defaultValue="expanded">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">Always Expanded</SelectItem>
                <SelectItem value="collapsed">Always Collapsed</SelectItem>
                <SelectItem value="auto">Auto Hide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="auto-save" defaultChecked />
            <Label htmlFor="auto-save">Auto-save settings</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="keyboard-shortcuts" defaultChecked />
            <Label htmlFor="keyboard-shortcuts">Enable keyboard shortcuts</Label>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Control how your data is used and stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="analytics" defaultChecked />
            <Label htmlFor="analytics">
              <div>
                <div>Share usage analytics</div>
                <div className="text-sm text-muted-foreground">
                  Help us improve the platform by sharing anonymous usage data
                </div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="crash-reports" defaultChecked />
            <Label htmlFor="crash-reports">
              <div>
                <div>Send crash reports</div>
                <div className="text-sm text-muted-foreground">
                  Automatically send error reports to help us fix issues
                </div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="marketing" />
            <Label htmlFor="marketing">
              <div>
                <div>Marketing communications</div>
                <div className="text-sm text-muted-foreground">
                  Receive updates about new features and improvements
                </div>
              </div>
            </Label>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your data in a portable format
                </p>
              </div>
              <Button variant="outline" size="sm">
                Export Data
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}