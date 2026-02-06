import { FormatRow } from "./format-row";
import { RarityRow } from "./rarity-row";
import { TypeRow } from "./type-row";

export function FormatTypeRaritySection() {
  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
      <FormatRow />
      <TypeRow />
      <RarityRow />
    </div>
  );
}
