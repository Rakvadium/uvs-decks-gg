import Image from "next/image";
import { ChevronRight, Zap } from "lucide-react";
import { SidebarFooter } from "@/components/shell";
import { useCardData } from "@/lib/universus/card-data-provider";
import { cn } from "@/lib/utils";
import { useActiveDeck } from "@/providers/ActiveDeckProvider";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useGameModule } from "@/games/game-context";

export function ActiveDeckIcon({ className }: { className?: string }) {
  const { activeDeck } = useActiveDeck();
  const { cards } = useCardData();
  const cardIdMap = useCardIdMap(cards);
  const gameDeck = useGameModule().deck;
  const startingCharacterId = gameDeck.setupPreviewCardId(gameDeck.normalizeSetup(activeDeck));
  const startingCharacter = startingCharacterId ? cardIdMap.get(startingCharacterId) ?? null : null;

  if (!startingCharacter?.imageUrl) {
    return (
      <span className={cn("flex size-full items-center justify-center", className)}>
        <Zap className="size-5" />
      </span>
    );
  }

  return (
    <span className={cn("relative block size-full overflow-hidden rounded-[inherit]", className)}>
      <Image
        src={startingCharacter.imageUrl}
        alt={startingCharacter.name}
        fill
        sizes="56px"
        className="object-cover object-top"
      />
    </span>
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
