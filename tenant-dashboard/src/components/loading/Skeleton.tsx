'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  );
}

export function SkeletonText({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="1rem"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 space-y-3', className)}>
      <Skeleton variant="rounded" height="12rem" />
      <div className="space-y-2">
        <Skeleton variant="text" height="1.5rem" width="60%" />
        <Skeleton variant="text" height="1rem" />
        <Skeleton variant="text" height="1rem" />
        <Skeleton variant="text" height="1rem" width="80%" />
      </div>
    </div>
  );
}