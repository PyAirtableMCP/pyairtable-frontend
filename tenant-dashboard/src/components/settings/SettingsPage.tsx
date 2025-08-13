'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, User, Bell, Key, Palette, Shield, Save, RotateCcw } from 'lucide-react';

import { useSettingsStore } from '@/stores/settingsStore';
import { ProfileSettings } from './ProfileSettings';
import { ApiKeyManager } from './ApiKeyManager';
import { NotificationSettings } from './NotificationSettings';
import { AppearanceSettings } from './AppearanceSettings';

interface SettingsPageProps {}

export function SettingsPage({}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('profile');
  const {
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    saveSettings,
    loadSettings,
    resetToDefaults,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings().catch(console.error);
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const sections = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your personal information',
      icon: User,
    },
    {
      id: 'api',
      title: 'API Configuration',
      description: 'Configure your Airtable API access',
      icon: Key,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control how you receive updates',
      icon: Bell,
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel',
      icon: Palette,
    },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'api':
        return <ApiKeyManager />;
      case 'notifications':
        return <NotificationSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and configuration
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved changes
            </Badge>
          )}
          {lastSaved && !hasUnsavedChanges && (
            <p className="text-sm text-muted-foreground">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>You have unsaved changes</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={resetToDefaults}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>Choose a category</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => !section.disabled && setActiveSection(section.id)}
                    disabled={section.disabled}
                    className={`
                      w-full text-left px-4 py-3 rounded-none border-r-2 transition-colors
                      ${
                        activeSection === section.id
                          ? 'bg-muted border-primary text-primary'
                          : 'border-transparent hover:bg-muted/50'
                      }
                      ${section.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {section.description}
                        </div>
                      </div>
                      {section.disabled && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          Soon
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const section = sections.find(s => s.id === activeSection);
                  const Icon = section?.icon;
                  return Icon ? <Icon className="h-5 w-5" /> : null;
                })()}
                {sections.find(s => s.id === activeSection)?.title}
              </CardTitle>
              <CardDescription>
                {sections.find(s => s.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {renderActiveSection()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}