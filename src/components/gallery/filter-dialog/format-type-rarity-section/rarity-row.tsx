import { ToggleBadgeRow } from "./badge-toggle-row";
import { useGalleryFilterDialogContext } from "../context";

export function RarityRow() {
  const { filters, meta, toggleStringFilter } = useGalleryFilterDialogContext();
  const rarities = meta.uniqueValues?.rarities ?? [];

  return (
    <ToggleBadgeRow
      label="Rarity"
      options={rarities}
      isSelected={(rarity) => filters.rarity?.includes(rarity) ?? false}
      onToggle={(rarity) => toggleStringFilter("rarity", rarity)}
      topAligned
    />
  );
}
