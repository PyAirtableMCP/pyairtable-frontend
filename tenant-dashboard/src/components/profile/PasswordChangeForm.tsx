'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

interface PasswordChangeFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export function PasswordChangeForm({ onClose, onSuccess }: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const validatePassword = (password: string) => {
    const errors = []
    if (password.length < 8) {
      errors.push('At least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least one lowercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('At least one number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('At least one special character')
    }
    return errors
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate current password
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else {
      const passwordErrors = validatePassword(formData.newPassword)
      if (passwordErrors.length > 0) {
        newErrors.newPassword = `Password must have: ${passwordErrors.join(', ')}`
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Check if new password is different from current
    if (formData.currentPassword === formData.newPassword && formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
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
    setMessage('')
    
    try {
      // Simulate API call to change password
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock validation of current password
      if (formData.currentPassword !== 'current123') {
        setMessageType('error')
        setMessage('Current password is incorrect')
        return
      }
      
      // Success
      setMessageType('success')
      setMessage('Password changed successfully!')
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Call success callback and close after delay
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
      
    } catch (error) {
      setMessageType('error')
      setMessage('Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' }
    
    const errors = validatePassword(password)
    const strength = Math.max(0, 5 - errors.length)
    
    const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['', 'text-red-600', 'text-red-500', 'text-yellow-500', 'text-blue-500', 'text-green-600']
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength]
    }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password *</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            error={!!errors.currentPassword}
            placeholder="Enter your current password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-600">{errors.currentPassword}</p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password *</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            error={!!errors.newPassword}
            placeholder="Enter your new password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.newPassword && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 w-full rounded ${
                    level <= passwordStrength.strength
                      ? level <= 2
                        ? 'bg-red-500'
                        : level <= 3
                        ? 'bg-yellow-500'
                        : level <= 4
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            {passwordStrength.label && (
              <p className={`text-xs ${passwordStrength.color}`}>
                Password strength: {passwordStrength.label}
              </p>
            )}
          </div>
        )}
        
        {errors.newPassword && (
          <p className="text-sm text-red-600">{errors.newPassword}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            error={!!errors.confirmPassword}
            placeholder="Confirm your new password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Message */}
      {message && (
        <Alert className={messageType === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <div className="flex items-center gap-2">
            {messageType === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {messageType === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={messageType === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Password Requirements */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• At least 8 characters long</li>
          <li>• At least one uppercase letter (A-Z)</li>
          <li>• At least one lowercase letter (a-z)</li>
          <li>• At least one number (0-9)</li>
          <li>• At least one special character (!@#$%^&*)</li>
        </ul>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading}>
          Change Password
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}