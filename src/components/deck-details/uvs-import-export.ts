import type { Id } from "../../../convex/_generated/dataModel";
import type { CachedCard } from "@/lib/universus/card-store";

export const SIDEBAR_SIDEBOARD_LIMIT = 10;

type UvsUltraSection = "character" | "foundation" | "attack" | "asset" | "action" | "backup" | "side";
export type UvsUltraDeckLine = { name: string; quantity: number; type?: (typeof UVS_MAIN_TYPE_ORDER)[number] };
export type ParsedUvsUltraDeck = {
  character: UvsUltraDeckLine | null;
  main: UvsUltraDeckLine[];
  side: UvsUltraDeckLine[];
};

export const UVS_MAIN_TYPE_ORDER = ["Foundation", "Attack", "Asset", "Action", "Backup"] as const;
const UVS_HEADING_BY_TYPE: Record<(typeof UVS_MAIN_TYPE_ORDER)[number], string> = {
  Foundation: "Foundation",
  Attack: "Attack",
  Asset: "Asset",
  Action: "Action",
  Backup: "Backup",
};

function normalizeCardLookupKey(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseUvsUltraDeck(text: string): ParsedUvsUltraDeck {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");
  let activeSection: UvsUltraSection | null = null;
  let character: UvsUltraDeckLine | null = null;
  const main: UvsUltraDeckLine[] = [];
  const side: UvsUltraDeckLine[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^\[b\](.+?)\[\/b\]$/i);
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase().replace(/[^a-z]/g, "");
      if (heading === "character") {
        activeSection = "character";
      } else if (heading === "foundation") {
        activeSection = "foundation";
      } else if (heading === "attack") {
        activeSection = "attack";
      } else if (heading === "asset") {
        activeSection = "asset";
      } else if (heading === "action") {
        activeSection = "action";
      } else if (heading === "backup") {
        activeSection = "backup";
      } else if (heading === "side" || heading === "sideboard") {
        activeSection = "side";
      } else {
        activeSection = null;
      }
      continue;
    }

    const cardLineMatch = line.match(/^(\d+)\s+(.+)$/);
    if (!cardLineMatch || !activeSection) continue;

    const quantity = Number.parseInt(cardLineMatch[1], 10);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const name = cardLineMatch[2].trim();
    if (!name) continue;

    if (activeSection === "character") {
      if (!character) {
        character = { name, quantity };
      }
      continue;
    }

    const entry = { name, quantity };
    if (activeSection === "side") {
      side.push(entry);
    } else {
      main.push(entry);
    }
  }

  return { character, main, side };
}

export function sumLineEntries(entries: UvsUltraDeckLine[]) {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    counts[entry.name] = (counts[entry.name] ?? 0) + entry.quantity;
  }
  return counts;
}

export function formatUvsUltraDeckExport(params: {
  character: CachedCard | null;
  main: UvsUltraDeckLine[];
  side: UvsUltraDeckLine[];
}) {
  const { character, main, side } = params;
  const lines: string[] = [];
  const groups = new Map<(typeof UVS_MAIN_TYPE_ORDER)[number], UvsUltraDeckLine[]>();
  for (const type of UVS_MAIN_TYPE_ORDER) {
    groups.set(type, []);
  }
  for (const entry of main) {
    if (entry.type && groups.has(entry.type)) {
      groups.get(entry.type)?.push(entry);
    }
  }

  lines.push("[b]Character[/b]");
  if (character) {
    lines.push(`1 ${character.name}`);
  }
  lines.push("");

  for (const type of UVS_MAIN_TYPE_ORDER) {
    lines.push(`[b]${UVS_HEADING_BY_TYPE[type]}[/b]`);
    const group = [...(groups.get(type) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of group) {
      lines.push(`${entry.quantity} ${entry.name}`);
    }
    lines.push("");
  }

  lines.push("[b]Side[/b]");
  for (const entry of [...side].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`${entry.quantity} ${entry.name}`);
  }

  return lines.join("\n").trimEnd();
}

export function buildCardNameIndex(cards: CachedCard[]) {
  const exact = new Map<string, CachedCard[]>();
  const normalized = new Map<string, CachedCard[]>();

  for (const card of cards) {
    if (card.isFrontFace === false) continue;

    const exactKey = card.name.trim().toLowerCase();
    const exactList = exact.get(exactKey) ?? [];
    exactList.push(card);
    exact.set(exactKey, exactList);

    const normalizedKey = normalizeCardLookupKey(card.name);
    const normalizedList = normalized.get(normalizedKey) ?? [];
    normalizedList.push(card);
    normalized.set(normalizedKey, normalizedList);
  }

  return { exact, normalized };
}

export function findCardByName(name: string, index: ReturnType<typeof buildCardNameIndex>): CachedCard | null {
  const exactKey = name.trim().toLowerCase();
  const exact = index.exact.get(exactKey);
  if (exact && exact.length > 0) return exact[0];

  const normalizedKey = normalizeCardLookupKey(name);
  const normalized = index.normalized.get(normalizedKey);
  if (normalized && normalized.length > 0) return normalized[0];

  return null;
}

export function incrementCount(record: Record<string, number>, cardId: string, quantity: number) {
  record[cardId] = (record[cardId] ?? 0) + quantity;
}

export function sumQuantities(quantities: Record<string, number>) {
  return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
}

export function toCardId(card: CachedCard): Id<"cards"> {
  return card._id as Id<"cards">;
}
