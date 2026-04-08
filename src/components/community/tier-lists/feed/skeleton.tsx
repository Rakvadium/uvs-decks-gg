import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TierListFeedSkeletonProps {
  compact: boolean;
}

export function TierListFeedSkeleton({ compact }: TierListFeedSkeletonProps) {
  return (
    <div className={compact ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>
      {Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((__, cardIndex) => (
                <Skeleton key={cardIndex} className="aspect-[2.5/3.5] rounded-lg" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
