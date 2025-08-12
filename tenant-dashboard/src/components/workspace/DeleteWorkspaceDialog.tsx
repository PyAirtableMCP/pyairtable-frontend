"use client";

import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Workspace } from "@/types";
import { ErrorMessage, FieldError, useErrorState } from "@/components/ui/ErrorMessage";
import { useErrorHandler } from "@/lib/errors/error-handler";

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  onConfirmDelete: () => Promise<void>;
  loading?: boolean;
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onConfirmDelete,
  loading = false,
}: DeleteWorkspaceDialogProps) {
  const [confirmationText, setConfirmationText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { error, setError, clearError } = useErrorState();
  const errorHandler = useErrorHandler();

  const isConfirmed = confirmationText === workspace?.name;

  React.useEffect(() => {
    if (!open) {
      setConfirmationText("");
      setIsSubmitting(false);
      clearError();
    }
  }, [open, clearError]);

  const handleDelete = async () => {
    if (!isConfirmed || !workspace) return;

    clearError();
    setIsSubmitting(true);
    try {
      await onConfirmDelete();
      onOpenChange(false);
    } catch (err) {
      const handledError = errorHandler.handle(err, 'delete-workspace');
      setError(handledError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onOpenChange(false);
    }
  };

  if (!workspace) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Workspace
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Display */}
          <ErrorMessage error={error} onDismiss={clearError} />

          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <div className="font-medium text-red-900">
                  This action cannot be undone
                </div>
                <div className="text-sm text-red-800">
                  Deleting this workspace will permanently remove all data including:
                </div>
                <ul className="text-sm text-red-800 space-y-1 ml-2">
                  <li>• All tables and records</li>
                  <li>• Member access and permissions</li>
                  <li>• Templates and configurations</li>
                  <li>• Activity history and logs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Workspace Info */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-3 mb-2">
              {workspace.icon && (
                <span className="text-xl">{workspace.icon}</span>
              )}
              <div>
                <div className="font-medium">{workspace.name}</div>
                {workspace.description && (
                  <div className="text-sm text-gray-600">{workspace.description}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                {workspace.members?.length || 0} members
              </Badge>
              <Badge variant="outline">
                {workspace.tables?.length || 0} tables
              </Badge>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>{workspace.name}</strong> to confirm deletion
            </Label>
            <Input
              id="confirmation"
              placeholder={workspace.name}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              disabled={isSubmitting || loading}
            />
            <FieldError 
              message={confirmationText && !isConfirmed ? "Text doesn't match the workspace name" : undefined}
            />
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
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isSubmitting || loading}
            className="min-w-24"
          >
            {(isSubmitting || loading) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}