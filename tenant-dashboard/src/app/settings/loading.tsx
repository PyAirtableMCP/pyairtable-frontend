import { Skeleton } from '@/components/loading/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton variant="text" height="2rem" width="150px" />
        <Skeleton variant="text" height="1rem" width="300px" className="mt-2" />
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton variant="circular" height="40px" width="40px" />
              <div className="space-y-1">
                <Skeleton variant="text" height="1.25rem" width="120px" />
                <Skeleton variant="text" height="0.875rem" width="200px" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton variant="rounded" height="2.5rem" />
              <Skeleton variant="rounded" height="2.5rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}