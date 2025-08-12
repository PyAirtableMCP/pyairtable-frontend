"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Workspace } from "@/types";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWorkspace: (data: WorkspaceFormData) => Promise<void>;
  onUpdateWorkspace?: (id: string, data: WorkspaceFormData) => Promise<void>;
  workspace?: Workspace | null;
  loading?: boolean;
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  visibility?: "private" | "team" | "tenant";
  icon?: string;
  color?: string;
}

const WORKSPACE_ICONS = [
  "📁", "📊", "💼", "🔬", "🎨", "🚀", "⚡", "🏗️", "📝", "💡",
  "🎯", "🔥", "⭐", "🌟", "✨", "🎪", "🎨", "🎭", "🎪", "🎨"
];

const WORKSPACE_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#6366F1"
];

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreateWorkspace,
  onUpdateWorkspace,
  workspace,
  loading = false,
}: CreateWorkspaceDialogProps) {
  const isEditing = !!workspace;
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormData>({
    defaultValues: {
      name: workspace?.name || "",
      description: workspace?.description || "",
      visibility: workspace?.visibility || "team",
      icon: workspace?.icon || "📁",
      color: workspace?.color || "#3B82F6",
    },
  });

  const selectedIcon = watch("icon");
  const selectedColor = watch("color");

  React.useEffect(() => {
    if (workspace && isEditing) {
      reset({
        name: workspace.name,
        description: workspace.description || "",
        visibility: workspace.visibility,
        icon: workspace.icon || "📁",
        color: workspace.color || "#3B82F6",
      });
    } else if (!isEditing) {
      reset({
        name: "",
        description: "",
        visibility: "team",
        icon: "📁",
        color: "#3B82F6",
      });
    }
  }, [workspace, isEditing, reset]);

  const onSubmit = async (data: WorkspaceFormData) => {
    try {
      if (isEditing && workspace && onUpdateWorkspace) {
        await onUpdateWorkspace(workspace.id, data);
      } else {
        await onCreateWorkspace(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving workspace:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Workspace" : "Create New Workspace"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Icon and Color Selection */}
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-5 gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                  {WORKSPACE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setValue("icon", icon)}
                      className={`p-2 rounded text-lg hover:bg-gray-100 ${
                        selectedIcon === icon ? "bg-blue-100 ring-2 ring-blue-500" : ""
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue("color", color)}
                      className={`w-8 h-8 rounded-full ${
                        selectedColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <span className="text-2xl">{selectedIcon}</span>
              <div>
                <div 
                  className="font-medium"
                  style={{ color: selectedColor }}
                >
                  {watch("name") || "Workspace Name"}
                </div>
                <div className="text-sm text-gray-600">Preview</div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter workspace name"
                {...register("name", {
                  required: "Workspace name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                  maxLength: {
                    value: 50,
                    message: "Name must be less than 50 characters",
                  },
                })}
                error={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your workspace (optional)"
                rows={3}
                {...register("description", {
                  maxLength: {
                    value: 500,
                    message: "Description must be less than 500 characters",
                  },
                })}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={watch("visibility")}
                onValueChange={(value) => setValue("visibility", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Private</span>
                      <span className="text-sm text-gray-500">Only you can see this</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="team">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Team</span>
                      <span className="text-sm text-gray-500">Team members can see this</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tenant">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Organization</span>
                      <span className="text-sm text-gray-500">Everyone in organization can see</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="min-w-24"
            >
              {(isSubmitting || loading) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}