'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { ApiKeyManager } from '@/components/profile/ApiKeyManager'
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm'
import { User } from '@/types'

// Mock user data - replace with actual data from auth context
const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  avatar: undefined,
  timezone: 'America/New_York',
  locale: 'en-US',
  emailVerified: true,
  phoneNumber: undefined,
  phoneVerified: false,
  twoFactorEnabled: false,
  lastLogin: '2024-08-12T10:00:00Z',
  loginCount: 25,
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false,
      inApp: true,
      digest: 'weekly',
      categories: {}
    },
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    language: 'en'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-08-12T10:00:00Z'
}

export default function ProfilePage() {
  const [user, setUser] = useState<User>(mockUser)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const handleUserUpdate = (updatedUser: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
    // In real app, make API call to update user
    console.log('User updated:', updatedUser)
  }

  const handlePasswordChangeSuccess = () => {
    console.log('Password changed successfully')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} onUpdate={handleUserUpdate} />
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card>
          <CardHeader>
            <CardTitle>Airtable Integration</CardTitle>
            <CardDescription>
              Manage your Airtable API key and test your connection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeyManager />
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Last changed: Never
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change Password
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                  </p>
                </div>
                <button className="text-sm text-primary hover:underline">
                  {user.twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and statistics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Account Created:</span>
                <p className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="font-medium">Last Login:</span>
                <p className="text-muted-foreground">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <span className="font-medium">Total Logins:</span>
                <p className="text-muted-foreground">{user.loginCount}</p>
              </div>
              <div>
                <span className="font-medium">Email Verified:</span>
                <p className="text-muted-foreground">
                  {user.emailVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>
          <PasswordChangeForm 
            onClose={() => setShowPasswordDialog(false)}
            onSuccess={handlePasswordChangeSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}