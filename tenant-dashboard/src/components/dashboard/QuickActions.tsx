"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { 
  Users, 
  FolderOpen, 
  Activity,
  CreditCard,
  Settings,
  Key,
  FileText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  permission?: string;
  condition?: (tenant: any) => boolean;
}

interface QuickActionsProps {
  className?: string;
  maxActions?: number;
}

function QuickActions({ 
  className,
  maxActions = 8 
}: QuickActionsProps) {
  const { data: tenant } = useTenant();

  // Memoize actions to prevent recreation on every render
  const allActions = useMemo((): QuickAction[] => [
    {
      title: "Invite Team Member",
      description: "Add someone to your organization",
      href: "/team/invitations",
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500",
      permission: "members:invite",
    },
    {
      title: "Create Workspace",
      description: "Start a new project workspace",
      href: "/workspaces/new",
      icon: <FolderOpen className="h-5 w-5" />,
      color: "bg-green-500",
      permission: "workspaces:create",
    },
    {
      title: "View Usage",
      description: "Check your current usage limits",
      href: "/billing/usage",
      icon: <Activity className="h-5 w-5" />,
      color: "bg-purple-500",
    },
    {
      title: "Billing Settings",
      description: "Manage your subscription",
      href: "/billing",
      icon: <CreditCard className="h-5 w-5" />,
      color: "bg-orange-500",
      permission: "billing:manage",
    },
    {
      title: "Organization Settings",
      description: "Configure your organization",
      href: "/settings/organization",
      icon: <Settings className="h-5 w-5" />,
      color: "bg-gray-500",
      permission: "settings:manage",
    },
    {
      title: "API Keys",
      description: "Manage API access tokens",
      href: "/settings/api-keys",
      icon: <Key className="h-5 w-5" />,
      color: "bg-indigo-500",
      permission: "api:manage",
    },
    {
      title: "Audit Logs",
      description: "Review security activity",
      href: "/security/audit",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-red-500",
      permission: "audit:view",
    },
    {
      title: "Export Data",
      description: "Download your organization data",
      href: "/settings/export",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-teal-500",
      permission: "data:export",
    },
  ], []);

  // Filter actions based on user permissions and conditions
  const availableActions = useMemo(() => {
    if (!tenant) return [];

    return allActions
      .filter(action => {
        // Check permission if specified
        if (action.permission && tenant.currentUser?.permissions) {
          return tenant.currentUser.permissions.includes(action.permission);
        }
        
        // Check condition if specified
        if (action.condition) {
          return action.condition(tenant);
        }
        
        return true;
      })
      .slice(0, maxActions);
  }, [tenant, allActions, maxActions]);

  const handleActionClick = (href: string) => {
    window.location.href = href;
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {availableActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-accent transition-colors"
              onClick={() => handleActionClick(action.href)}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                action.color
              )}>
                {action.icon}
              </div>
              <div className="text-left">
                <h3 className="font-medium text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedQuickActions = memo(QuickActions);
MemoizedQuickActions.displayName = 'QuickActions';
export default MemoizedQuickActions;