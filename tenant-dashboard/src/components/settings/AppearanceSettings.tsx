'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeToggleInline } from '@/components/ui/ThemeToggle';
import { ThemeValidator } from '@/components/ui/ThemeValidator';
import { Palette, Monitor } from 'lucide-react';

export function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose how the interface appears to you. The system option will follow your device's theme preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggleInline />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Display
          </CardTitle>
          <CardDescription>
            Additional display preferences and accessibility options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">High contrast mode</div>
                <div className="text-sm text-muted-foreground">
                  Increases color contrast for better readability
                </div>
              </div>
              <div className="px-3 py-1 bg-muted rounded text-xs text-muted-foreground">
                Coming soon
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Compact mode</div>
                <div className="text-sm text-muted-foreground">
                  Reduces spacing for a more compact interface
                </div>
              </div>
              <div className="px-3 py-1 bg-muted rounded text-xs text-muted-foreground">
                Coming soon
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Motion preference</div>
                <div className="text-sm text-muted-foreground">
                  Reduce motion and animations
                </div>
              </div>
              <div className="px-3 py-1 bg-muted rounded text-xs text-muted-foreground">
                Coming soon
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Implementation Validator */}
      <ThemeValidator />
    </div>
  );
}