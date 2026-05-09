import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TierListFeedSkeletonProps {
  compact: boolean;
}

export function TierListFeedSkeleton({ compact }: TierListFeedSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
        <Card key={index} className="border-border/60 bg-card/75">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-16 rounded-none" />
                <Skeleton className="h-5 w-24 rounded-none" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((__, cardIndex) => (
                <Skeleton key={cardIndex} className="aspect-[2.5/3.5] rounded-lg" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-28 rounded-none" />
              <Skeleton className="h-5 w-32 rounded-none" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
