# Centralized Error Handling System

This error handling system provides consistent error management across the application, addressing DEBT-801 requirements.

## Features

- **Standardized Error Types**: Consistent error classes with severity levels
- **Centralized Processing**: Single point for error logging, reporting, and user notifications
- **User-Friendly Messages**: Automatic mapping from technical errors to user-friendly text
- **Integration Support**: Works seamlessly with Sentry, analytics, and toast notifications
- **Reusable Components**: Drop-in UI components for consistent error display

## Quick Start

```typescript
// In a component
import { useErrorHandler, ErrorMessage, FieldError } from '@/lib/errors';

function MyComponent() {
  const { error, setError, clearError } = useErrorState();
  const errorHandler = useErrorHandler();

  const handleOperation = async () => {
    try {
      await someAsyncOperation();
    } catch (err) {
      const handledError = errorHandler.handle(err, 'my-component');
      setError(handledError);
    }
  };

  return (
    <div>
      <ErrorMessage error={error} onDismiss={clearError} />
      {/* Your component content */}
    </div>
  );
}
```

## Error Types

- `AppError`: Base error class with severity levels
- `ValidationError`: For form and input validation
- `NetworkError`: For API and network issues  
- `PermissionError`: For authorization issues

## Components

- `ErrorMessage`: Primary error display with severity styling
- `FieldError`: Field-specific validation errors
- `ErrorList`: Display multiple related errors

## Integration Points

- **Sentry**: Automatic error reporting with context
- **Analytics**: Error tracking with PostHog
- **Console Logging**: Development debugging
- **Toast Notifications**: User-facing error alerts

## File Structure

```
src/lib/errors/
├── error-types.ts      # Error classes and types
├── error-handler.ts    # Centralized handler utility
└── README.md          # This documentation

src/components/ui/
└── ErrorMessage.tsx    # Reusable UI components
```