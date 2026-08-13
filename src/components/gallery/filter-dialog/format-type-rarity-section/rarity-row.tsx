import { ToggleBadgeRow } from "./badge-toggle-row";
import { useGalleryFilterDialogContext } from "../context";
import {
  rarityFilterSelected,
  toggleCanonicalRarityFilter,
} from "@/lib/universus/rarity";

export function RarityRow({ hideLabel = false }: { hideLabel?: boolean } = {}) {
  const { filters, meta, actions } = useGalleryFilterDialogContext();
  const rarities = meta.uniqueValues?.rarities ?? [];

  return (
    <ToggleBadgeRow
      label="Rarity"
      options={rarities}
      isSelected={(rarity) => rarityFilterSelected(filters.rarity, rarity)}
      onToggle={(rarity) => {
        actions.updateFilter(
          "rarity",
          toggleCanonicalRarityFilter(filters.rarity, rarity)
        );
      }}
      topAligned
      hideLabel={hideLabel}
    />
  );
}
