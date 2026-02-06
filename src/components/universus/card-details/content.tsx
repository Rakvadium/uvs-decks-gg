import type { CachedCard } from "@/lib/universus";
import { cn } from "@/lib/utils";
import { CardDetailsAttackStatsSection } from "./attack-stats-section";
import { CardDetailsContentProvider } from "./content-context";
import { CardDetailsCopyLimitSection } from "./copy-limit-section";
import { CardDetailsGeneralStatsSection } from "./general-stats-section";
import { CardDetailsKeywordsSection } from "./keywords-section";
import { CardDetailsMetaSection } from "./meta-section";
import { CardDetailsTextSection } from "./card-text-section";
import { CardDetailsTitleSection } from "./title-section";

interface CardDetailsContentProps {
  card: CachedCard;
  className?: string;
}

export function CardDetailsContent({ card, className }: CardDetailsContentProps) {
  return (
    <CardDetailsContentProvider card={card}>
      <div className={cn("flex-1 space-y-6 overflow-y-auto p-6", className)}>
        <CardDetailsTitleSection />
        <CardDetailsGeneralStatsSection />
        <CardDetailsAttackStatsSection />
        <CardDetailsKeywordsSection />
        <CardDetailsTextSection />
        <CardDetailsCopyLimitSection />
        <CardDetailsMetaSection />
      </div>
    </CardDetailsContentProvider>
  );
}
