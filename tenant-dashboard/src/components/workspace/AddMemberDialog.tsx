"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Loader2, Users, Mail } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (data: AddMemberFormData) => Promise<void>;
  loading?: boolean;
}

export interface AddMemberFormData {
  email: string;
  role: "owner" | "editor" | "commenter" | "viewer";
}

const ROLES = [
  {
    value: "owner",
    label: "Owner",
    description: "Full access and workspace management",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can create, edit, and delete content",
  },
  {
    value: "commenter",
    label: "Commenter",
    description: "Can view and comment on content",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Can only view content",
  },
];

export function AddMemberDialog({
  open,
  onOpenChange,
  onAddMember,
  loading = false,
}: AddMemberDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberFormData>({
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  const selectedRole = watch("role");

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: AddMemberFormData) => {
    try {
      await onAddMember(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding member:", error);
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
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Add Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter member's email"
                  className="pl-10"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  })}
                  error={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue("role", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-sm text-gray-500">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Preview */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-900">
                Selected Role: {ROLES.find(r => r.value === selectedRole)?.label}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {ROLES.find(r => r.value === selectedRole)?.description}
              </div>
            </div>

            {/* Note */}
            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-md border border-blue-200">
              <strong>Note:</strong> The member will receive an invitation email to join this workspace.
              They must accept the invitation to gain access.
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
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}