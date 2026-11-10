import { useGameModule } from "@/games/game-context";
import { ColorsSection, TagsSection } from "./facet-sections";
import { FormatTypeRaritySection } from "./format-type-rarity-section";
import { KeywordsSection } from "./keywords-section";
import { GalleryFilterDialogMobileViewSection } from "./mobile-view-section";
import { SetSection } from "./set-section";
import { StatsSection } from "./stats-section";
import { SymbolsSection } from "./symbols-section";

export function GalleryFilterDialogBody() {
  const { facets } = useGameModule().filters;

  return (
    <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <GalleryFilterDialogMobileViewSection />
      <div className="mt-3 grid grid-cols-1 gap-3 md:mt-0 md:grid-cols-2 md:gap-4">
        <div className="space-y-3 md:space-y-4">
          <FormatTypeRaritySection />
          {facets.symbols ? <SymbolsSection /> : null}
          <ColorsSection />
          <SetSection />
        </div>

        <div className="space-y-3 md:space-y-4">
          {facets.keywords ? <KeywordsSection /> : null}
          <TagsSection />
          <StatsSection />
        </div>
      </div>
    </div>
  );
}
