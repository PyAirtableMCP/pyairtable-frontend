"use client";

import React from "react";
import {
  Users,
  Calendar,
  Settings,
  Trash2,
  Edit,
  Plus,
  UserPlus,
  Crown,
  Shield,
  Eye,
  UserCheck,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Workspace, WorkspaceMember } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface WorkspaceDetailsProps {
  workspace: Workspace;
  onEditWorkspace: () => void;
  onDeleteWorkspace: () => void;
  onAddMember: () => void;
  onUpdateMemberRole: (member: WorkspaceMember, newRole: string) => void;
  onRemoveMember: (member: WorkspaceMember) => void;
  currentUserId: string;
  canManageMembers: boolean;
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
}

export function WorkspaceDetails({
  workspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
  currentUserId,
  canManageMembers,
  canEditWorkspace,
  canDeleteWorkspace,
}: WorkspaceDetailsProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "editor":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-500" />;
      case "commenter":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "editor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "commenter":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "deleted":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "private":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "team":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "tenant":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const canUpdateRole = (member: WorkspaceMember) => {
    return canManageMembers && member.userId !== currentUserId;
  };

  const canRemove = (member: WorkspaceMember) => {
    return canManageMembers && member.userId !== currentUserId && member.role !== "owner";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {workspace.icon && (
              <span className="text-3xl">{workspace.icon}</span>
            )}
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: workspace.color }}
              >
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-gray-600 mt-1">{workspace.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditWorkspace && (
            <Button variant="outline" onClick={onEditWorkspace}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canDeleteWorkspace && (
            <Button variant="destructive" onClick={onDeleteWorkspace}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Status and Metadata */}
      <div className="flex flex-wrap gap-4">
        <Badge className={getStatusColor(workspace.status)}>
          {workspace.status}
        </Badge>
        <Badge className={getVisibilityColor(workspace.visibility)}>
          {workspace.visibility}
        </Badge>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{workspace.members?.length || 0} members</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            Created {formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workspace.tables && workspace.tables.length > 0 ? (
                <div className="space-y-3">
                  {workspace.tables.map((table) => (
                    <div
                      key={table.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{table.name}</h4>
                        {table.description && (
                          <p className="text-sm text-gray-600">{table.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500 mt-1">
                          <span>{table.recordCount} records</span>
                          <span>{table.fieldCount} fields</span>
                          <span>{table.viewCount} views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No tables yet</h3>
                  <p className="text-gray-500">
                    Tables will appear here when they're added to this workspace
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Templates */}
          {workspace.templates && workspace.templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {workspace.templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">{template.category}</span>
                        <span className="text-sm text-gray-500">
                          Used {template.usageCount} times
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members ({workspace.members?.length || 0})
                </CardTitle>
                {canManageMembers && (
                  <Button size="sm" onClick={onAddMember}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {workspace.members && workspace.members.length > 0 ? (
                <div className="space-y-3">
                  {workspace.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>
                            {member.user.firstName[0]}
                            {member.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {member.user.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRoleColor(member.role)}`}
                        >
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </Badge>
                        {(canUpdateRole(member) || canRemove(member)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdateRole(member) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateMemberRole(member, "owner")}
                                    disabled={member.role === "owner"}
                                  >
                                    Make Owner
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateMemberRole(member, "editor")}
                                    disabled={member.role === "editor"}
                                  >
                                    Make Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateMemberRole(member, "commenter")}
                                    disabled={member.role === "commenter"}
                                  >
                                    Make Commenter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onUpdateMemberRole(member, "viewer")}
                                    disabled={member.role === "viewer"}
                                  >
                                    Make Viewer
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canRemove(member) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => onRemoveMember(member)}
                                    className="text-red-600"
                                  >
                                    Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No members yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workspace Settings */}
          {workspace.settings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Guest Access</span>
                  <Badge variant={workspace.settings.allowGuestAccess ? "default" : "secondary"}>
                    {workspace.settings.allowGuestAccess ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Comments</span>
                  <Badge variant={workspace.settings.enableComments ? "default" : "secondary"}>
                    {workspace.settings.enableComments ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Version History</span>
                  <Badge variant={workspace.settings.enableVersionHistory ? "default" : "secondary"}>
                    {workspace.settings.enableVersionHistory ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Export</span>
                  <Badge variant={workspace.settings.allowExport ? "default" : "secondary"}>
                    {workspace.settings.allowExport ? "Allowed" : "Restricted"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Retention</span>
                  <span className="text-sm text-gray-600">
                    {workspace.settings.dataRetentionDays} days
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Stats */}
          {workspace.usage && (
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Records</span>
                  <span className="text-sm font-medium">{workspace.usage.records.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage</span>
                  <span className="text-sm font-medium">
                    {(workspace.usage.storage / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Calls</span>
                  <span className="text-sm font-medium">{workspace.usage.apiCalls.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Last updated {formatDistanceToNow(new Date(workspace.usage.lastCalculated), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}