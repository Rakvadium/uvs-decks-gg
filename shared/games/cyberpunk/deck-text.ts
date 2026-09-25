/**
 * Cyberpunk TCG plain-text deck lists.
 *
 * Export:
 *   Legends
 *   1 <legend>        (setup order)
 *
 *   Deck
 *   3 <card>          (Unit, Gear, Program, then other types; by name within a type)
 *
 * Import is lenient: `3 Name`, `3x Name`, `Name x3`; headings `Legends`, `Deck` / `Main`,
 * `Side` / `Sideboard` (optionally `[b]…[/b]`, `#`, trailing `:` or a count like `Deck (40)`).
 * Unknown headings / lines are ignored (following lines stay in the current section); lines
 * before any heading are main deck.
 */
import type { DeckTextFormatParams, DeckTextLine, ParsedDeckText } from "../deck";
import { CYBERPUNK_CARD_TYPE_ORDER } from "./card-types";

type Section = "legends" | "main" | "side";

const HEADINGS: Record<string, Section> = {
  legend: "legends",
  legends: "legends",
  deck: "main",
  main: "main",
  maindeck: "main",
  side: "side",
  sideboard: "side",
};

function headingSection(line: string): Section | null {
  const key = line
    .replace(/\[\/?b\]/gi, "")
    .replace(/\(\s*\d+\s*\)\s*$/, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return HEADINGS[key] ?? null;
}

function parseCardLine(line: string): DeckTextLine | null {
  const leading = line.match(/^(\d+)[xX×]?\s+(.+)$/);
  const trailing = leading ? null : line.match(/^(.+?)\s+[xX×]\s*(\d+)$/);
  const quantityRaw = leading?.[1] ?? trailing?.[2];
  const nameRaw = leading?.[2] ?? trailing?.[1];
  if (quantityRaw === undefined || nameRaw === undefined) return null;
  const quantity = Number.parseInt(quantityRaw, 10);
  const name = nameRaw.trim();
  if (!Number.isFinite(quantity) || quantity <= 0 || !name) return null;
  return { name, quantity };
}

export function parseCyberpunkDeckText(text: string): ParsedDeckText {
  const setupCards: DeckTextLine[] = [];
  const main: DeckTextLine[] = [];
  const side: DeckTextLine[] = [];
  let section: Section = "main";

  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim().replace(/^#+\s*/, "").replace(/:$/, "").trim();
    if (!line) continue;

    const heading = headingSection(line);
    if (heading) {
      section = heading;
      continue;
    }

    const entry = parseCardLine(line);
    if (!entry) continue;
    if (section === "legends") setupCards.push(entry);
    else if (section === "side") side.push(entry);
    else main.push(entry);
  }

  return { character: null, setupCards, main, side };
}

const TYPE_RANK = new Map<string, number>(CYBERPUNK_CARD_TYPE_ORDER.map((type, index) => [type.toLowerCase(), index]));

function typeRank(type: string | undefined): number {
  return TYPE_RANK.get(type?.trim().toLowerCase() ?? "") ?? CYBERPUNK_CARD_TYPE_ORDER.length;
}

export function formatCyberpunkDeckText(params: DeckTextFormatParams): string {
  const lines: string[] = ["Legends"];
  for (const legend of params.setupCards ?? []) {
    lines.push(`1 ${legend.name}`);
  }
  lines.push("", "Deck");
  const main = [...params.main].sort(
    (a, b) => typeRank(a.type) - typeRank(b.type) || a.name.localeCompare(b.name),
  );
  for (const entry of main) {
    lines.push(`${entry.quantity} ${entry.name}`);
  }
  if (params.side.length > 0) {
    lines.push("", "Sideboard");
    for (const entry of [...params.side].sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(`${entry.quantity} ${entry.name}`);
    }
  }
  return lines.join("\n").trimEnd();
}
