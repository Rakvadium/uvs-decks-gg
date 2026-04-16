import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import { CardDetailsContentProvider } from "./content-context";
import { CardDetailsCopyLimitSection } from "./copy-limit-section";
import { CardDetailsMetaSection } from "./meta-section";
import {
  CardDetailsReadoutPanel,
  CardDetailsReadoutSurface,
} from "./readout-panel";

interface CardDetailsContentProps {
  card: CachedCard;
  className?: string;
}

export function CardDetailsContent({ card, className }: CardDetailsContentProps) {
  return (
    <CardDetailsContentProvider card={card}>
      <CardDetailsReadoutSurface className={cn("flex-1", className)}>
        <CardDetailsReadoutPanel />
        <div className="relative z-[1] space-y-4 px-5 pb-6 md:px-8 md:pb-7 lg:px-9">
          <CardDetailsCopyLimitSection />
          <CardDetailsMetaSection />
        </div>
      </CardDetailsReadoutSurface>
    </CardDetailsContentProvider>
  );
}
