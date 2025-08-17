'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Monitor, Sun, Moon } from 'lucide-react';

export function ThemeValidator() {
  const { theme, systemTheme, resolvedTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [persistenceTest, setPersistenceTest] = useState<'testing' | 'success' | 'failed'>('testing');

  useEffect(() => {
    setMounted(true);
    
    // Test localStorage persistence
    try {
      const testKey = 'theme-persistence-test';
      const testValue = 'test-' + Date.now();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        setPersistenceTest('success');
      } else {
        setPersistenceTest('failed');
      }
    } catch (error) {
      setPersistenceTest('failed');
    }
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Theme Validator...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'light': return <Sun className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const validationItems = [
    {
      name: 'Theme Provider Mounted',
      status: mounted ? 'success' : 'failed',
      description: 'next-themes provider is properly initialized'
    },
    {
      name: 'Available Themes',
      status: themes.length > 0 ? 'success' : 'failed',
      description: `${themes.length} themes available: ${themes.join(', ')}`
    },
    {
      name: 'System Theme Detection',
      status: systemTheme ? 'success' : 'testing',
      description: systemTheme ? `System prefers: ${systemTheme}` : 'Detecting system preference...'
    },
    {
      name: 'Theme Resolution',
      status: resolvedTheme ? 'success' : 'failed',
      description: resolvedTheme ? `Resolved theme: ${resolvedTheme}` : 'Theme not resolved'
    },
    {
      name: 'localStorage Persistence',
      status: persistenceTest,
      description: persistenceTest === 'success' 
        ? 'Theme preferences can be persisted' 
        : persistenceTest === 'failed'
        ? 'localStorage not available'
        : 'Testing persistence...'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Dark Mode Implementation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Theme Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getThemeIcon(theme || 'system')}
              <span className="font-medium">Current Theme:</span>
            </div>
            <Badge variant="outline">
              {theme || 'system'}
            </Badge>
          </div>

          {/* Validation Results */}
          <div className="space-y-3">
            {validationItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {item.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                    {item.status === 'testing' && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{item.description}</p>
                </div>
                <Badge 
                  variant={item.status === 'success' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}
                  className="ml-2"
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Theme Classes Detection */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2">CSS Classes Applied:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              </Badge>
              {Array.from(document.documentElement.classList)
                .filter(cls => cls !== 'dark' && cls !== 'light')
                .map(cls => (
                  <Badge key={cls} variant="outline" className="text-xs">
                    {cls}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}