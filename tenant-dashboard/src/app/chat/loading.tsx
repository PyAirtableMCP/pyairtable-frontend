import { Skeleton } from '@/components/loading/Skeleton';

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r p-4 space-y-2">
        <Skeleton variant="rounded" height="2.5rem" />
        <div className="space-y-1 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height="2rem" />
          ))}
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] ${i % 2 === 0 ? 'order-2' : 'order-1'}`}>
                <Skeleton variant="rounded" height="3rem" width="100%" />
              </div>
            </div>
          ))}
        </div>

        {/* Input area skeleton */}
        <div className="border-t p-4">
          <Skeleton variant="rounded" height="3rem" />
        </div>
      </div>
    </div>
  );
}