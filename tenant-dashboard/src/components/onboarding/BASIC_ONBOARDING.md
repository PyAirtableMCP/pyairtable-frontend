# Basic User Onboarding Flow (PYAIR-303)

A simplified 3-step onboarding process designed to get new users up and running quickly with PyAirtable.

## Overview

The Basic Onboarding Flow provides a streamlined user experience focused on the essential setup steps:

1. **Profile Setup** - Collect user's name, company, and role
2. **Airtable Connection** - Connect user's Airtable account and select a base
3. **Template Selection** - Choose a workspace template to get started

## Components

### Core Components

#### `BasicOnboarding.tsx`
Main orchestrator component that manages the overall flow state and navigation.

**Features:**
- Progress tracking with visual stepper
- Form validation and error handling
- Auto-save of progress
- Loading states and animations
- Completion handling

#### `OnboardingStepper.tsx`
Visual progress indicator showing current step and completion status.

**Features:**
- Animated step transitions
- Completed step indicators
- Responsive design
- Accessible navigation

#### `ProfileSetupForm.tsx`
First step form for collecting user profile information.

**Features:**
- Name, company, and role validation
- Role suggestions with quick selection
- Real-time form validation
- Profile preview

#### `AirtableConnectionForm.tsx`
Second step for connecting user's Airtable account.

**Features:**
- Personal Access Token validation
- Real-time connection testing
- Base discovery and selection
- Secure token handling
- Comprehensive error handling

#### `TemplateSelectionForm.tsx`
Final step for selecting a workspace template.

**Features:**
- Multiple template categories
- Template difficulty indicators
- Popular template badges
- Feature previews
- Template recommendations

### Utility Components

#### `LoadingState.tsx`
Reusable loading component with animated indicators.

#### `OnboardingErrorBoundary.tsx`
Error handling component with retry and support options.

## Design System

### Visual Design Principles

- **Clean and Modern**: Minimalist design focusing on content
- **Progressive Disclosure**: Information revealed step by step
- **Consistent Spacing**: 8px base unit with systematic spacing scale
- **Accessible Colors**: WCAG AA compliant color ratios

### Color Palette
```css
Primary: Blue (#0066CC) - CTAs, progress, focus states
Secondary: Purple (#7C3AED) - Accents, templates
Success: Green (#059669) - Completions, validations
Warning: Yellow (#F59E0B) - Cautions, intermediate states
Error: Red (#DC2626) - Errors, destructive actions
```

### Typography
- **Headings**: Semibold weight, clear hierarchy
- **Body Text**: Regular weight, optimal line height (1.5)
- **Labels**: Medium weight, semantic color usage

### Component States

#### Buttons
- **Default**: Clean background with subtle border
- **Hover**: Gentle elevation and color shift
- **Active**: Pressed state with scale animation
- **Loading**: Spinner with disabled state
- **Disabled**: Reduced opacity and no interactions

#### Form Fields
- **Default**: Clean border, comfortable padding
- **Focus**: Primary color border with ring
- **Error**: Red border with error message
- **Success**: Green accent for valid inputs

#### Cards
- **Default**: White background, subtle shadow
- **Hover**: Slight elevation increase
- **Active/Selected**: Primary border with background tint

## User Experience Features

### Animations and Transitions

All animations use Framer Motion for smooth, performant transitions:

```typescript
// Step transitions
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
transition={{ duration: 0.3 }}
```

### Form Validation

Real-time validation using React Hook Form + Zod:
- Input validation on change
- Visual feedback for errors
- Accessibility compliance

### Error Handling

Comprehensive error handling strategy:
- Graceful degradation
- User-friendly error messages
- Retry mechanisms
- Support integration

### Loading States

Multiple loading patterns:
- Global loading for navigation
- Component-level loading for actions
- Progressive loading for data fetching

## Accessibility

### Keyboard Navigation
- Full keyboard support for all interactions
- Logical tab order
- Escape key handling

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content

### Visual Accessibility
- High contrast colors (WCAG AA)
- Focus indicators
- Reduced motion support

## Mobile Experience

### Responsive Design
- Mobile-first approach
- Touch-friendly interface (44px minimum touch targets)
- Optimized layouts for small screens

### Progressive Web App
- Offline capability preparation
- Fast loading performance
- Native app-like experience

## API Integration

### Endpoints Used

#### `POST /api/onboarding/complete`
Saves onboarding completion data:
```typescript
{
  type: 'basic',
  data: OnboardingData,
  completedAt: string
}
```

#### `POST /api/airtable/validate`
Validates Personal Access Token:
```typescript
{ token: string }
```

#### `POST /api/airtable/bases`
Retrieves available Airtable bases:
```typescript
{ token: string }
```

### Error Handling
- Network error recovery
- API validation errors
- User-friendly error messages

## Performance

### Optimization Strategies
- Code splitting for reduced bundle size
- Lazy loading of non-critical components
- Optimized re-renders with React.memo
- Efficient form state management

### Loading Performance
- Skeleton loading states
- Progressive enhancement
- Critical resource prioritization

## Testing Strategy

### Unit Tests
- Component rendering
- Form validation logic
- State management
- Error scenarios

### Integration Tests
- Complete flow testing
- API integration
- Cross-browser compatibility

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation

## Usage Examples

### Basic Implementation
```typescript
import { BasicOnboarding } from '@/components/onboarding'

export default function OnboardingPage() {
  return <BasicOnboarding />
}
```

### Custom Integration
```typescript
import { 
  ProfileSetupForm, 
  AirtableConnectionForm, 
  TemplateSelectionForm 
} from '@/components/onboarding'

// Use individual components for custom flows
```

## Configuration

### Environment Variables
```bash
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=your_app_url
DATABASE_URL=your_database_url
```

### Feature Flags
- `ENABLE_COMPREHENSIVE_ONBOARDING`: Toggle between basic/comprehensive
- `SHOW_TEMPLATE_PREVIEWS`: Enable template preview features
- `ENABLE_PROGRESS_SAVING`: Auto-save user progress

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

### Planned Features
- Template customization
- Bulk base import
- Team invitation flow
- Advanced workspace setup
- Integration marketplace

### Performance Improvements
- Service worker integration
- Advanced caching strategies
- Bundle optimization
- CDN integration

## Troubleshooting

### Common Issues

1. **API Token Validation Fails**
   - Verify token format
   - Check Airtable permissions
   - Ensure network connectivity

2. **Base Loading Issues**
   - Confirm base permissions
   - Check API limits
   - Validate token scope

3. **Form Validation Errors**
   - Check input formats
   - Verify required fields
   - Review validation schemas

### Debug Mode

Enable debug logging:
```typescript
localStorage.setItem('debug', 'onboarding:*')
```

## Support

- Documentation: [docs.pyairtable.com](https://docs.pyairtable.com)
- Community: [Discord](https://discord.gg/pyairtable)
- Support: [support@pyairtable.com](mailto:support@pyairtable.com)

---

**Built with ❤️ for the PyAirtable community**