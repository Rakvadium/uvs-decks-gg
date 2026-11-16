import Link from "next/link";
import type { ReactNode } from "react";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface CommunityTierListsPageEmptyStateProps {
  action?: ReactNode;
  message: string;
}

export function CommunityTierListsPageEmptyState({
  action,
  message,
}: CommunityTierListsPageEmptyStateProps) {
  return (
    <EmptyState
      variant="page"
      icon={ListOrdered}
      title={message}
      action={
        action ?? (
          <Button variant="outline" asChild>
            <Link href="/community">Back to Community</Link>
          </Button>
        )
      }
    />
  );
}
