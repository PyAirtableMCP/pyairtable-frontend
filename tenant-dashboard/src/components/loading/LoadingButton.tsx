'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        'relative',
        loading && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
      {loading && loadingText && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pl-6">
          {loadingText}
        </span>
      )}
    </Button>
  );
}