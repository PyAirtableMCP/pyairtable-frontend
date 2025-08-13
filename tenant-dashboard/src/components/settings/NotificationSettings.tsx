'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, MessageSquare, CreditCard, Shield, Zap, Calendar } from 'lucide-react';

import { useSettingsStore } from '@/stores/settingsStore';

interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const { settings, updateNotifications } = useSettingsStore();
  const { notifications } = settings;

  const handleEmailToggle = (key: keyof typeof notifications.email, value: boolean) => {
    updateNotifications({
      email: {
        ...notifications.email,
        [key]: value,
      },
    });
  };

  const handlePushToggle = (key: keyof typeof notifications.push, value: boolean) => {
    updateNotifications({
      push: {
        ...notifications.push,
        [key]: value,
      },
    });
  };

  const handleDigestChange = (value: typeof notifications.digest) => {
    updateNotifications({ digest: value });
  };

  return (
    <div className="space-y-8">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Control which emails you receive from us
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="email-enabled"
                checked={notifications.email.enabled}
                onCheckedChange={(value) => handleEmailToggle('enabled', value)}
              />
              <div>
                <Label htmlFor="email-enabled" className="font-medium cursor-pointer">
                  Enable email notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Master toggle for all email notifications
                </p>
              </div>
            </div>
            <Badge variant={notifications.email.enabled ? 'default' : 'secondary'}>
              {notifications.email.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between opacity-100">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Security alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Login attempts, password changes, and security events
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.email.security}
                onCheckedChange={(value) => handleEmailToggle('security', value)}
                disabled={!notifications.email.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Billing updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Invoices, payment confirmations, and billing changes
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.email.billing}
                onCheckedChange={(value) => handleEmailToggle('billing', value)}
                disabled={!notifications.email.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Product updates</Label>
                  <p className="text-sm text-muted-foreground">
                    New features, improvements, and system maintenance
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.email.updates}
                onCheckedChange={(value) => handleEmailToggle('updates', value)}
                disabled={!notifications.email.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Marketing communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Tips, case studies, and promotional content
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.email.marketing}
                onCheckedChange={(value) => handleEmailToggle('marketing', value)}
                disabled={!notifications.email.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get notified about important activity in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="push-enabled"
                checked={notifications.push.enabled}
                onCheckedChange={(value) => handlePushToggle('enabled', value)}
              />
              <div>
                <Label htmlFor="push-enabled" className="font-medium cursor-pointer">
                  Enable push notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in your browser
                </p>
              </div>
            </div>
            <Badge variant={notifications.push.enabled ? 'default' : 'secondary'}>
              {notifications.push.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Mentions and replies</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone mentions you or replies to your comment
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.push.mentions}
                onCheckedChange={(value) => handlePushToggle('mentions', value)}
                disabled={!notifications.push.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Comments and activity</Label>
                  <p className="text-sm text-muted-foreground">
                    New comments on items you're watching
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.push.comments}
                onCheckedChange={(value) => handlePushToggle('comments', value)}
                disabled={!notifications.push.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">System updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Important system notifications and alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications.push.updates}
                onCheckedChange={(value) => handlePushToggle('updates', value)}
                disabled={!notifications.push.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Email Digest
          </CardTitle>
          <CardDescription>
            Get a summary of your activity via email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Digest frequency</Label>
              <p className="text-sm text-muted-foreground mb-3">
                How often would you like to receive activity summaries?
              </p>
              <Select value={notifications.digest} onValueChange={handleDigestChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Your digest settings</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notifications.digest === 'never' && (
                      'You won\'t receive email digests'
                    )}
                    {notifications.digest === 'daily' && (
                      'You\'ll receive a daily summary of your activity every morning'
                    )}
                    {notifications.digest === 'weekly' && (
                      'You\'ll receive a weekly summary every Monday morning'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Summary</CardTitle>
          <CardDescription>
            Your current notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Email notifications</Label>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Overall status:</span>
                  <Badge variant={notifications.email.enabled ? 'default' : 'secondary'}>
                    {notifications.email.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {notifications.email.enabled && (
                  <>
                    <div className="flex justify-between">
                      <span>Security alerts:</span>
                      <span>{notifications.email.security ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing updates:</span>
                      <span>{notifications.email.billing ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Product updates:</span>
                      <span>{notifications.email.updates ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marketing:</span>
                      <span>{notifications.email.marketing ? 'On' : 'Off'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Push notifications</Label>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Overall status:</span>
                  <Badge variant={notifications.push.enabled ? 'default' : 'secondary'}>
                    {notifications.push.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {notifications.push.enabled && (
                  <>
                    <div className="flex justify-between">
                      <span>Mentions:</span>
                      <span>{notifications.push.mentions ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comments:</span>
                      <span>{notifications.push.comments ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System updates:</span>
                      <span>{notifications.push.updates ? 'On' : 'Off'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Email digest:</span>
                  <Badge variant="outline" className="capitalize">
                    {notifications.digest}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}