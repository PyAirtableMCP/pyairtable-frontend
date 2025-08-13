'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, Avatar as AvatarPrimitive } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Upload, Calendar, Globe, Mail } from 'lucide-react';

import { useSettingsStore } from '@/stores/settingsStore';

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

interface ProfileSettingsProps {}

export function ProfileSettings({}: ProfileSettingsProps) {
  const { settings, updateProfile } = useSettingsStore();
  const { profile } = settings;

  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: keyof typeof profile, value: string) => {
    updateProfile({ [field]: value });
  };

  const handleAvatarUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // In a real app, upload to your storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateProfile({ avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleAvatarUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleAvatarUpload(files[0]);
    }
  };

  const getInitials = () => {
    const first = profile.firstName.charAt(0).toUpperCase();
    const last = profile.lastName.charAt(0).toUpperCase();
    return `${first}${last}` || 'U';
  };

  return (
    <div className="space-y-8">
      {/* Profile Picture */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Profile Picture</Label>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center text-lg font-medium">
                  {getInitials()}
                </div>
              )}
            </Avatar>
            {profile.avatar && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => updateProfile({ avatar: undefined })}
              >
                ×
              </Badge>
            )}
          </div>

          <div
            className={`
              border-2 border-dashed rounded-lg p-6 flex-1 transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB
              </p>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-6">
        <Label className="text-base font-medium">Basic Information</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            This will be used for account notifications and login
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-6">
        <Label className="text-base font-medium">Preferences</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Timezone
            </Label>
            <Select
              value={profile.timezone}
              onValueChange={(value) => handleInputChange('timezone', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={profile.language}
              onValueChange={(value) => handleInputChange('language', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium">Profile Summary</h4>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              {profile.firstName || profile.lastName ? (
                <p>Name: {`${profile.firstName} ${profile.lastName}`.trim()}</p>
              ) : (
                <p className="text-orange-600">Name not set</p>
              )}
              {profile.email ? (
                <p>Email: {profile.email}</p>
              ) : (
                <p className="text-orange-600">Email not set</p>
              )}
              <p>
                Timezone: {timezones.find(tz => tz.value === profile.timezone)?.label}
              </p>
              <p>
                Language: {languages.find(lang => lang.value === profile.language)?.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}