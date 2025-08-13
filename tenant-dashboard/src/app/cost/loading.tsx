import { Skeleton } from '@/components/loading/Skeleton';
import { GridSkeleton } from '@/components/loading/DataTable';

export default function CostLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Skeleton variant="text" height="2rem" width="200px" />
        <Skeleton variant="text" height="1rem" width="350px" className="mt-2" />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" height="0.875rem" width="80px" />
              <Skeleton variant="circular" height="24px" width="24px" />
            </div>
            <Skeleton variant="text" height="2rem" width="120px" />
            <Skeleton variant="text" height="0.875rem" width="150px" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-lg border p-6">
        <Skeleton variant="text" height="1.5rem" width="180px" className="mb-4" />
        <Skeleton variant="rectangular" height="350px" />
      </div>

      {/* Table */}
      <div className="rounded-lg border p-6">
        <Skeleton variant="text" height="1.5rem" width="150px" className="mb-4" />
        <GridSkeleton items={4} columns={2} />
      </div>
    </div>
  );
}