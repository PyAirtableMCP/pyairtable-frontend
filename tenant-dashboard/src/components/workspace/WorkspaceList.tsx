"use client";

import React from "react";
import { Plus, FolderOpen, Users, Calendar, MoreHorizontal, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Workspace } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface WorkspaceListProps {
  workspaces: Workspace[];
  loading?: boolean;
  onCreateWorkspace: () => void;
  onViewWorkspace: (workspace: Workspace) => void;
  onEditWorkspace: (workspace: Workspace) => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function WorkspaceList({
  workspaces,
  loading = false,
  onCreateWorkspace,
  onViewWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  searchQuery,
  onSearchChange,
}: WorkspaceListProps) {
  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Search skeleton */}
        <div className="h-10 w-full max-w-md bg-gray-200 rounded animate-pulse" />

        {/* Workspace cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-gray-600 mt-1">
            Manage your workspaces and collaborate with your team
          </p>
        </div>
        <Button onClick={onCreateWorkspace} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Empty state */}
      {filteredWorkspaces.length === 0 && !loading && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No workspaces found" : "No workspaces yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Create your first workspace to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateWorkspace}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          )}
        </div>
      )}

      {/* Workspace Grid */}
      {filteredWorkspaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorkspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewWorkspace(workspace)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {workspace.icon && (
                        <span className="text-lg">{workspace.icon}</span>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {workspace.name}
                      </h3>
                    </div>
                    {workspace.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewWorkspace(workspace);
                        }}
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWorkspace(workspace);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteWorkspace(workspace);
                        }}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status and Visibility Badges */}
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(workspace.status)}>
                      {workspace.status}
                    </Badge>
                    <Badge className={getVisibilityColor(workspace.visibility)}>
                      {workspace.visibility}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{workspace.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(new Date(workspace.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Tables count */}
                  {workspace.tables && workspace.tables.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {workspace.tables.length} table{workspace.tables.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredWorkspaces.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
        </div>
      )}
    </div>
  );
}