import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityTierListsPageLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-border/60 bg-card/70">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((__, cardIndex) => (
                <Skeleton key={cardIndex} className="aspect-[2.5/3.5] rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
