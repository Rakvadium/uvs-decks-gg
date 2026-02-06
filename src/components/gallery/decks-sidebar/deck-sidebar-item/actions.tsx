import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeckSidebarItemContext } from "./context";

export function DeckSidebarItemActions() {
  const { deck, handleSetActive, isActive, isOwner } = useDeckSidebarItemContext();

  return (
    <div className="flex items-center justify-between gap-3">
      {isOwner ? (
        <Button
          variant={isActive ? "secondary" : "outline"}
          size="sm"
          className="h-7 px-2 text-[10px] font-mono"
          onClick={handleSetActive}
        >
          {isActive ? <Check className="h-3 w-3" /> : null}
          {isActive ? "Active" : "Set Active"}
        </Button>
      ) : (
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
          Creator only
        </span>
      )}

      <Link
        href={`/decks/${deck._id}`}
        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
      >
        Open
      </Link>
    </div>
  );
}
