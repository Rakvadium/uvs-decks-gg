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
    return (
      <span className={cn("flex size-full items-center justify-center", className)}>
        <UserIcon className="size-5" />
      </span>
    );
  }

  return (
    <span className={cn("relative block size-full overflow-hidden rounded-[inherit]", className)}>
      <Image
        src={startingCharacter.imageUrl}
        alt={startingCharacter.name}
        fill
        sizes="36px"
        className="object-cover object-top"
      />
    </span>
  );
}

export function ActiveDeckHeader() {
  const { activeDeck, isLoading } = useActiveDeck();

  if (isLoading) {
    return <span className="chrome-label-case text-xs text-muted-foreground">Loading deck</span>;
  }

  const label = activeDeck?.name ?? "Active Deck";

  return (
    <h3
      className="chrome-heading-case truncate text-[13px] font-bold text-primary [filter:var(--chrome-shell-deck-label-drop-shadow)]"
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
