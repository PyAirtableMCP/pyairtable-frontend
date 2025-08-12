"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceList } from "@/components/workspace/WorkspaceList";
import { WorkspaceDetails } from "@/components/workspace/WorkspaceDetails";
import { CreateWorkspaceDialog, WorkspaceFormData } from "@/components/workspace/CreateWorkspaceDialog";
import { AddMemberDialog, AddMemberFormData } from "@/components/workspace/AddMemberDialog";
import { DeleteWorkspaceDialog } from "@/components/workspace/DeleteWorkspaceDialog";
import { workspaceApi } from "@/lib/api";
import { Workspace, WorkspaceMember } from "@/types";

export default function WorkspacesPage() {
  const router = useRouter();
  
  // State management
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<Workspace | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [view, setView] = React.useState<"list" | "details">("list");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingWorkspace, setEditingWorkspace] = React.useState<Workspace | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = React.useState<Workspace | null>(null);

  // Loading states
  const [actionLoading, setActionLoading] = React.useState(false);

  // Mock current user ID (in real app, this would come from auth context)
  const currentUserId = "current-user-id";

  // Load workspaces on mount
  React.useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspaceApi.getAll();
      
      // Handle different response formats
      const workspacesData = response.data || response;
      setWorkspaces(Array.isArray(workspacesData) ? workspacesData : []);
    } catch (error) {
      console.error("Error loading workspaces:", error);
      toast.error("Failed to load workspaces");
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedWorkspace = async () => {
    if (!selectedWorkspace) return;
    
    try {
      const response = await workspaceApi.getById(selectedWorkspace.id);
      const workspaceData = response.data || response;
      setSelectedWorkspace(workspaceData);
      
      // Also update the workspace in the list
      setWorkspaces(prev => prev.map(w => 
        w.id === workspaceData.id ? workspaceData : w
      ));
    } catch (error) {
      console.error("Error refreshing workspace:", error);
      toast.error("Failed to refresh workspace details");
    }
  };

  const handleCreateWorkspace = async (data: WorkspaceFormData) => {
    try {
      setActionLoading(true);
      const response = await workspaceApi.create(data);
      const newWorkspace = response.data || response;
      
      setWorkspaces(prev => [newWorkspace, ...prev]);
      toast.success("Workspace created successfully");
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateWorkspace = async (id: string, data: WorkspaceFormData) => {
    try {
      setActionLoading(true);
      const response = await workspaceApi.update(id, data);
      const updatedWorkspace = response.data || response;
      
      setWorkspaces(prev => prev.map(w => 
        w.id === id ? updatedWorkspace : w
      ));
      
      if (selectedWorkspace?.id === id) {
        setSelectedWorkspace(updatedWorkspace);
      }
      
      toast.success("Workspace updated successfully");
      setEditingWorkspace(null);
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("Failed to update workspace");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    
    try {
      setActionLoading(true);
      await workspaceApi.delete(workspaceToDelete.id);
      
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceToDelete.id));
      
      if (selectedWorkspace?.id === workspaceToDelete.id) {
        setSelectedWorkspace(null);
        setView("list");
      }
      
      toast.success("Workspace deleted successfully");
      setDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (data: AddMemberFormData) => {
    if (!selectedWorkspace) return;
    
    try {
      setActionLoading(true);
      // In a real app, this would likely return user data or send an invitation
      await workspaceApi.addMember(selectedWorkspace.id, {
        userId: data.email, // In real app, this would resolve to actual user ID
        role: data.role,
      });
      
      toast.success("Member invitation sent successfully");
      setAddMemberDialogOpen(false);
      
      // Refresh workspace to get updated member list
      await refreshSelectedWorkspace();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMemberRole = async (member: WorkspaceMember, newRole: string) => {
    if (!selectedWorkspace) return;
    
    try {
      await workspaceApi.updateMemberRole(selectedWorkspace.id, member.userId, { role: newRole });
      toast.success("Member role updated successfully");
      
      // Refresh workspace to get updated member list
      await refreshSelectedWorkspace();
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Failed to update member role");
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!selectedWorkspace) return;
    
    try {
      await workspaceApi.removeMember(selectedWorkspace.id, member.userId);
      toast.success("Member removed successfully");
      
      // Refresh workspace to get updated member list
      await refreshSelectedWorkspace();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleViewWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setView("details");
  };

  const handleBackToList = () => {
    setSelectedWorkspace(null);
    setView("list");
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setCreateDialogOpen(true);
  };

  const handleDeleteClick = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setDeleteDialogOpen(true);
  };

  // Permissions (in real app, these would be based on user roles)
  const canManageMembers = true;
  const canEditWorkspace = true;
  const canDeleteWorkspace = true;

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button when in details view */}
      {view === "details" && selectedWorkspace && (
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspaces
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {view === "list" ? (
          <WorkspaceList
            workspaces={workspaces}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateWorkspace={() => {
              setEditingWorkspace(null);
              setCreateDialogOpen(true);
            }}
            onViewWorkspace={handleViewWorkspace}
            onEditWorkspace={handleEditWorkspace}
            onDeleteWorkspace={handleDeleteClick}
          />
        ) : (
          selectedWorkspace && (
            <div className="h-full overflow-y-auto">
              <WorkspaceDetails
                workspace={selectedWorkspace}
                currentUserId={currentUserId}
                canManageMembers={canManageMembers}
                canEditWorkspace={canEditWorkspace}
                canDeleteWorkspace={canDeleteWorkspace}
                onEditWorkspace={() => handleEditWorkspace(selectedWorkspace)}
                onDeleteWorkspace={() => handleDeleteClick(selectedWorkspace)}
                onAddMember={() => setAddMemberDialogOpen(true)}
                onUpdateMemberRole={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          )
        )}
      </div>

      {/* Dialogs */}
      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspace={editingWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        loading={actionLoading}
      />

      <AddMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        onAddMember={handleAddMember}
        loading={actionLoading}
      />

      <DeleteWorkspaceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workspace={workspaceToDelete}
        onConfirmDelete={handleDeleteWorkspace}
        loading={actionLoading}
      />
    </div>
  );
}