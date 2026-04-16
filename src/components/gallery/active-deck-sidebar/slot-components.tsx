import Image from "next/image";
import { ChevronRight, UserIcon } from "lucide-react";
import { SidebarFooter } from "@/components/shell";
import { useCardData } from "@/lib/universus/card-data-provider";
import { cn } from "@/lib/utils";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useCardIdMap } from "@/hooks/useCardIdMap";

export function ActiveDeckIcon({ className }: { className?: string }) {
  const { activeDeck } = useActiveDeck();
  const { cards } = useCardData();
  const cardIdMap = useCardIdMap(cards);
  const startingCharacterId = activeDeck?.startingCharacterId;
  const startingCharacter = startingCharacterId ? cardIdMap.get(startingCharacterId) ?? null : null;

  if (!startingCharacter?.imageUrl) {
    return <UserIcon className={className} />;
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image
        src={startingCharacter.imageUrl}
        alt={startingCharacter.name}
        fill
        sizes="40px"
        className="object-cover object-top"
      />
    </div>
  );
}

export function ActiveDeckHeader() {
  const { activeDeck, isLoading } = useActiveDeck();

  if (isLoading) {
    return <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Loading deck</span>;
  }

  const label = activeDeck?.name ?? "Active Deck";

  return (
    <h3
      className="truncate font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary [filter:var(--chrome-shell-deck-label-drop-shadow)]"
      title={label}
    >
      {label}
    </h3>
  );
}

export function ActiveDeckFooter() {
  const { activeDeck } = useActiveDeck();

  if (!activeDeck) return null;

  return (
    <SidebarFooter
      align="end"
      primaryAction={{
        label: "Open Deck Details",
        href: `/decks/${activeDeck._id}`,
        icon: ChevronRight,
        iconPosition: "right",
      }}
    />
  );
}
