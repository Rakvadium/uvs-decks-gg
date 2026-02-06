import { FormatTypeRaritySection } from "./format-type-rarity-section";
import { KeywordsSection } from "./keywords-section";
import { SetSection } from "./set-section";
import { StatsSection } from "./stats-section";
import { SymbolsSection } from "./symbols-section";

export function GalleryFilterDialogBody() {
  return (
    <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <FormatTypeRaritySection />
          <SymbolsSection />
          <SetSection />
        </div>

        <div className="space-y-4">
          <KeywordsSection />
          <StatsSection />
        </div>
      </div>
    </div>
  );
}
