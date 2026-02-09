import { FormatTypeRaritySection } from "./format-type-rarity-section";
import { KeywordsSection } from "./keywords-section";
import { SetSection } from "./set-section";
import { StatsSection } from "./stats-section";
import { SymbolsSection } from "./symbols-section";

export function GalleryFilterDialogBody() {
  return (
    <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-3 md:space-y-4">
          <FormatTypeRaritySection />
          <SymbolsSection />
          <SetSection />
        </div>

        <div className="space-y-3 md:space-y-4">
          <KeywordsSection />
          <StatsSection />
        </div>
      </div>
    </div>
  );
}
