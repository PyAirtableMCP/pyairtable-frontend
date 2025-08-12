'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { User } from '@/types'

interface ProfileFormProps {
  user: User
  onUpdate: (user: Partial<User>) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    timezone: user.timezone,
    theme: user.preferences.theme,
    dateFormat: user.preferences.dateFormat,
    timeFormat: user.preferences.timeFormat,
    language: user.preferences.language,
    emailNotifications: user.preferences.notifications.email,
    pushNotifications: user.preferences.notifications.push
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timezone: user.timezone,
      theme: user.preferences.theme,
      dateFormat: user.preferences.dateFormat,
      timeFormat: user.preferences.timeFormat,
      language: user.preferences.language,
      emailNotifications: user.preferences.notifications.email,
      pushNotifications: user.preferences.notifications.push
    })
  }, [user])

  // Handle theme changes and apply to localStorage
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setFormData(prev => ({ ...prev, theme }))
    localStorage.setItem('theme', theme)
    
    // Apply theme immediately
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update user data
      const updatedUser: Partial<User> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        timezone: formData.timezone,
        preferences: {
          ...user.preferences,
          theme: formData.theme,
          dateFormat: formData.dateFormat,
          timeFormat: formData.timeFormat,
          language: formData.language,
          notifications: {
            ...user.preferences.notifications,
            email: formData.emailNotifications,
            push: formData.pushNotifications
          }
        }
      }
      
      onUpdate(updatedUser)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timezone: user.timezone,
      theme: user.preferences.theme,
      dateFormat: user.preferences.dateFormat,
      timeFormat: user.preferences.timeFormat,
      language: user.preferences.language,
      emailNotifications: user.preferences.notifications.email,
      pushNotifications: user.preferences.notifications.push
    })
    setErrors({})
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">First Name</Label>
            <p className="text-sm text-muted-foreground">{user.firstName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Last Name</Label>
            <p className="text-sm text-muted-foreground">{user.lastName}</p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Timezone</Label>
            <p className="text-sm text-muted-foreground">{user.timezone}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Theme</Label>
            <p className="text-sm text-muted-foreground capitalize">{user.preferences.theme}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Date Format</Label>
            <p className="text-sm text-muted-foreground">{user.preferences.dateFormat}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Time Format</Label>
            <p className="text-sm text-muted-foreground">{user.preferences.timeFormat}</p>
          </div>
        </div>

        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            error={!!errors.firstName}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            error={!!errors.lastName}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={!!errors.email}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              <SelectItem value="Europe/London">London</SelectItem>
              <SelectItem value="Europe/Paris">Paris</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={formData.theme}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFormat">Date Format</Label>
          <Select
            value={formData.dateFormat}
            onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
              <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
              <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeFormat">Time Format</Label>
          <Select
            value={formData.timeFormat}
            onValueChange={(value) => setFormData(prev => ({ ...prev, timeFormat: value as '12h' | '24h' }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12 Hour</SelectItem>
              <SelectItem value="24h">24 Hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Notification Preferences</Label>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="emailNotifications" className="text-sm font-medium">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={formData.emailNotifications}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, emailNotifications: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pushNotifications" className="text-sm font-medium">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive push notifications in your browser
            </p>
          </div>
          <Switch
            id="pushNotifications"
            checked={formData.pushNotifications}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, pushNotifications: checked }))
            }
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}