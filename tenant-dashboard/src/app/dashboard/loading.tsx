import { SectionLoader } from '@/components/loading/PageLoader';
import { Skeleton } from '@/components/loading/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton variant="text" height="2rem" width="200px" />
        <Skeleton variant="rounded" height="2.5rem" width="120px" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2">
            <Skeleton variant="text" height="1rem" width="60%" />
            <Skeleton variant="text" height="2rem" width="40%" />
            <Skeleton variant="text" height="0.875rem" width="80%" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border p-6">
        <Skeleton variant="text" height="1.5rem" width="150px" className="mb-4" />
        <Skeleton variant="rectangular" height="300px" />
      </div>
    </div>
  );
}