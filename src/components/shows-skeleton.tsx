import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ShowsSkeletonProps {
  count?: number;
  className?: string;
}

const ShowsSkeleton = ({
  count = 6,
  className = '',
}: ShowsSkeletonProps) => {
  return (
    <div className={cn("space-y-8 px-[4%] lg:px-12 py-8", className)}>
      {/* Hero Skeleton */}
      <div className="relative h-[60vh] w-full overflow-hidden rounded-3xl bg-white/5 animate-pulse">
        <div className="absolute bottom-12 left-12 space-y-4">
          <Skeleton className="h-12 w-64 bg-white/10" />
          <Skeleton className="h-6 w-96 bg-white/5" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 rounded-full bg-white/10" />
            <Skeleton className="h-12 w-32 rounded-full bg-white/5" />
          </div>
        </div>
      </div>

      {/* Row Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="aspect-video w-[320px] flex-shrink-0 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShowsSkeleton;
