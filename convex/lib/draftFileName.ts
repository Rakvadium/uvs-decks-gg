import { isFileNameRarityCode, printedRarityLabel } from "./printedRarity";

export type DraftFileNameFields = {
  setCode?: string;
  collectorNumber?: string;
  rarity?: string;
  isVariant?: boolean;
  name?: string;
};

function splitCompactName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parses official scan names like "SF621-003-UR-PsychoPower.png" or "FT01-001-CH-R-CanaAlberonaCardslinger.png". */
export function draftFieldsFromFileName(fileName: string): DraftFileNameFields {
  const base = fileName.replace(/\.[^.]+$/, "");
  const parts = base.split("-").filter(Boolean);
  const fields: DraftFileNameFields = {};
  if (parts.length >= 2) {
    fields.setCode = parts[0];
    fields.collectorNumber = parts[1];
  }
  const rarityIndex = parts.findIndex((part, index) => index >= 2 && isFileNameRarityCode(part));
  if (rarityIndex < 0) {
    if (parts.length > 2) {
      fields.name = splitCompactName(parts.slice(2).join(" "));
    }
    return fields;
  }
  let rarityEnd = rarityIndex + 1;
  let rarityCode = parts[rarityIndex];
  const next = parts[rarityEnd];
  if (rarityCode.toUpperCase() === "CH" && next && next.toUpperCase() !== "CH" && isFileNameRarityCode(next)) {
    rarityCode = `CH-${next}`;
    rarityEnd += 1;
  }
  fields.rarity = printedRarityLabel(rarityCode);
  fields.isVariant = parts.some((part) => part.toUpperCase() === "ALT");
  const nameParts = parts.slice(rarityEnd).filter((part) => part.toUpperCase() !== "ALT");
  if (nameParts.length > 0) {
    fields.name = splitCompactName(nameParts.join(" "));
  }
  return fields;
}
