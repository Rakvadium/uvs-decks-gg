import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CommunityTierListsPageEmptyStateProps {
  action?: ReactNode;
  message: string;
}

export function CommunityTierListsPageEmptyState({
  action,
  message,
}: CommunityTierListsPageEmptyStateProps) {
  return (
    <Card className="border-dashed border-border/60 bg-card/65">
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
        {action ?? (
          <Button variant="outline" asChild>
            <Link href="/community">Back to Community</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
