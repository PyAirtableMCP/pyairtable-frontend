'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading page...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
}

export function SectionLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}

export function InlineLoader({ message }: PageLoaderProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {message && (
        <span className="text-sm text-muted-foreground">
          {message}
        </span>
      )}
    </div>
  );
}