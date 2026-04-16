import { ToggleBadgeRow } from "./badge-toggle-row";
import { useGalleryFilterDialogContext } from "../context";

export function TypeRow({ hideLabel = false }: { hideLabel?: boolean } = {}) {
  const { filters, meta, toggleStringFilter } = useGalleryFilterDialogContext();
  const types = meta.uniqueValues?.types ?? [];

  return (
    <ToggleBadgeRow
      label="Type"
      options={types}
      isSelected={(type) => filters.type?.includes(type) ?? false}
      onToggle={(type) => toggleStringFilter("type", type)}
      topAligned
      hideLabel={hideLabel}
    />
  );
}
