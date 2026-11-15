import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function NoCardsFound() {
  return (
    <EmptyState
      variant="page"
      icon={Search}
      title="No cards found"
      description="Try adjusting your search query or filters to find what you're looking for."
    />
  );
}
