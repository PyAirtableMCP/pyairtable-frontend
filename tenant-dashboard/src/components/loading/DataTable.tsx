'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            {showHeader && (
              <thead className="border-b bg-muted/50">
                <tr>
                  {Array.from({ length: columns }).map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <Skeleton
                        variant="text"
                        height="1rem"
                        width={`${60 + Math.random() * 40}%`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <Skeleton
                        variant="text"
                        height="1rem"
                        width={`${40 + Math.random() * 60}%`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({
  items = 6,
  columns = 3,
  className,
}: {
  items?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton variant="rounded" height="8rem" />
          <Skeleton variant="text" height="1.25rem" width="70%" />
          <div className="space-y-1">
            <Skeleton variant="text" height="0.875rem" />
            <Skeleton variant="text" height="0.875rem" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}