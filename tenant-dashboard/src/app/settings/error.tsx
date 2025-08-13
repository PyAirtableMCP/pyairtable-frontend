'use client';

import RouteErrorBoundary from '@/components/error/RouteErrorBoundary';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary error={error} reset={reset} />;
}