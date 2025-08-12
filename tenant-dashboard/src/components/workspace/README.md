# Workspace Dashboard Components

This directory contains all components for the workspace management dashboard.

## Components

### WorkspaceList
- Displays all workspaces in a responsive grid
- Includes search functionality
- Shows workspace cards with basic info and actions
- Handles empty states and loading states

### WorkspaceDetails
- Shows detailed view of a single workspace
- Displays workspace metadata, members, tables, and settings
- Includes member management functionality
- Responsive layout with sidebar for members and settings

### CreateWorkspaceDialog
- Modal for creating new workspaces or editing existing ones
- Includes form validation
- Icon and color picker
- Visibility settings

### AddMemberDialog
- Modal for adding members to a workspace
- Email input with validation
- Role selection
- Shows role descriptions

### DeleteWorkspaceDialog
- Confirmation dialog for deleting workspaces
- Requires typing workspace name to confirm
- Shows data that will be lost
- Destructive action styling

## API Integration

All components use the `workspaceApi` from `@/lib/api.ts` to communicate with the workspace service running on port 8003.

## Features

- ✅ Responsive design (mobile-first)
- ✅ Loading states and skeletons  
- ✅ Error handling and validation
- ✅ Search and filtering
- ✅ Member management
- ✅ Workspace CRUD operations
- ✅ Accessible UI with proper ARIA labels
- ✅ Keyboard navigation support

## Usage

```tsx
import { WorkspaceList, CreateWorkspaceDialog } from '@/components/workspace';

// The main workspace page integrates all components
// See: src/app/workspaces/page.tsx
```

## Responsive Breakpoints

- `sm`: 640px+ (2-column grid)
- `lg`: 1024px+ (3-column grid) 
- `xl`: 1280px+ (4-column grid)

The design adapts gracefully from mobile to desktop with appropriate spacing and sizing adjustments.