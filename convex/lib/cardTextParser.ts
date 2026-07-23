import {
  CARD_OCR_TEMPLATES,
  UNIVERSUS_OCR_CARD_TYPES,
  getCardOcrTemplate,
  type CardOcrTemplate,
  type CardOcrType,
} from "./cardOcrTemplates";

export type ParsedCardDraft = {
  oracleId?: string;
  name?: string;
  type?: string;
  rarity?: string;
  difficulty?: number;
  control?: number;
  speed?: number;
  damage?: number;
  blockModifier?: number;
  handSize?: number;
  health?: number;
  stamina?: number;
  attackZone?: string;
  blockZone?: string;
  text?: string;
  keywords?: string;
  symbols?: string;
  copyLimit?: number;
  isFrontFace?: boolean;
  isVariant?: boolean;
};

export type CardTextParseResult = {
  draft: ParsedCardDraft;
  detectedType?: CardOcrType;
  parseWarnings: string[];
};

const RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Super Rare",
  "Ultra Rare",
  "Promo",
  "Champion",
  "Character",
] as const;

const TIMING_PATTERN = /\b(Enhance|Response|Form|Static|First Form|Blitz)\b\s*:?\s*/gi;
const NUMBER_PATTERN = /[-+]?\d+/g;

function normalizeLines(rawText: string): string[] {
  return rawText
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function normalizeZone(value: string): "high" | "mid" | "low" | undefined {
  const normalized = value.toLowerCase();
  if (/\b(high|hi)\b/.test(normalized)) return "high";
  if (/\b(mid|middle)\b/.test(normalized)) return "mid";
  if (/\b(low|lo)\b/.test(normalized)) return "low";
  return undefined;
}

function firstNumber(line: string): number | undefined {
  const match = line.match(/[-+]?\d+/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compactText(value: string): string {
  return value
    .replace(/\s+\|\s+/g, "|")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function titleCaseLikelyName(line: string): boolean {
  if (line.length < 2 || line.length > 80) return false;
  if (/[{}[\]<>]/.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (TIMING_PATTERN.test(line)) return false;
  TIMING_PATTERN.lastIndex = 0;
  const lower = line.toLowerCase();
  if (UNIVERSUS_OCR_CARD_TYPES.some((type) => lower === type.toLowerCase())) return false;
  if (RARITIES.some((rarity) => lower === rarity.toLowerCase())) return false;
  return /[A-Za-z]/.test(line);
}

function detectRarity(lines: string[]): string | undefined {
  for (const line of lines) {
    const lower = line.toLowerCase();
    const rarity = RARITIES.find((candidate) => lower.includes(candidate.toLowerCase()));
    if (rarity) return rarity;
  }
  return undefined;
}

export function detectCardType(rawText: string): CardOcrType | undefined {
  const normalized = rawText.toLowerCase();
  for (const type of UNIVERSUS_OCR_CARD_TYPES) {
    const template = CARD_OCR_TEMPLATES[type];
    if (
      normalized.includes(type.toLowerCase()) ||
      template.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
    ) {
      return type;
    }
  }
  return undefined;
}

function detectName(lines: string[], detectedType?: CardOcrType): string | undefined {
  const typeIndex = detectedType
    ? lines.findIndex((line) => line.toLowerCase().includes(detectedType.toLowerCase()))
    : -1;
  const candidates = typeIndex > 0 ? lines.slice(0, typeIndex) : lines.slice(0, 8);
  return candidates.find(titleCaseLikelyName) ?? lines.slice(0, 5).find(titleCaseLikelyName);
}

function assignLabeledNumber(
  draft: ParsedCardDraft,
  lowerLine: string,
  line: string,
  consumedFields: Set<keyof ParsedCardDraft>
) {
  const labelMap: Array<[keyof ParsedCardDraft, RegExp]> = [
    ["difficulty", /\b(difficulty|diff)\b/],
    ["control", /\b(control|check)\b/],
    ["speed", /\b(speed)\b/],
    ["damage", /\b(damage)\b/],
    ["blockModifier", /\b(block|block modifier)\b/],
    ["handSize", /\b(hand|hand size)\b/],
    ["health", /\b(health|life)\b/],
    ["stamina", /\b(stamina)\b/],
  ];
  for (const [field, pattern] of labelMap) {
    if (!pattern.test(lowerLine) || consumedFields.has(field)) continue;
    const value = firstNumber(line);
    if (value === undefined) continue;
    if (field === "difficulty") draft.difficulty = value;
    if (field === "control") draft.control = value;
    if (field === "speed") draft.speed = value;
    if (field === "damage") draft.damage = value;
    if (field === "blockModifier") draft.blockModifier = value;
    if (field === "handSize") draft.handSize = value;
    if (field === "health") draft.health = value;
    if (field === "stamina") draft.stamina = value;
    consumedFields.add(field);
  }
}

function assignSequentialStats(
  draft: ParsedCardDraft,
  template: CardOcrTemplate,
  lines: string[],
  consumedFields: Set<keyof ParsedCardDraft>
) {
  const numbers = lines
    .slice(0, 12)
    .flatMap((line) => Array.from(line.matchAll(NUMBER_PATTERN)).map((match) => Number(match[0])))
    .filter((value) => Number.isFinite(value));
  let index = 0;
  for (const field of template.statFields) {
    const key = field as keyof ParsedCardDraft;
    if (consumedFields.has(key)) continue;
    const value = numbers[index];
    index += 1;
    if (value === undefined) continue;
    if (
      field === "difficulty" ||
      field === "control" ||
      field === "speed" ||
      field === "damage" ||
      field === "blockModifier" ||
      field === "handSize" ||
      field === "health" ||
      field === "stamina"
    ) {
      draft[field] = value;
      consumedFields.add(key);
    }
  }
}

function detectZones(draft: ParsedCardDraft, lines: string[]) {
  for (const line of lines) {
    const lower = line.toLowerCase();
    const zone = normalizeZone(line);
    if (!zone) continue;
    if (lower.includes("attack") || lower.includes("zone")) {
      draft.attackZone ??= zone;
    }
    if (lower.includes("block")) {
      draft.blockZone ??= zone;
    }
  }
}

function detectKeywords(template: CardOcrTemplate, lines: string[]): string | undefined {
  const matches = new Set<string>();
  for (const line of lines.slice(0, 18)) {
    const lower = line.toLowerCase();
    for (const signal of template.keywordSignals) {
      if (lower.includes(signal.toLowerCase())) {
        matches.add(signal.replace(/\b\w/g, (char) => char.toUpperCase()));
      }
    }
  }
  return matches.size > 0 ? Array.from(matches).join("|") : undefined;
}

function textLines(template: CardOcrTemplate, lines: string[]): string[] {
  const startIndex = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return template.textStartSignals.some((signal) => lower.includes(signal.toLowerCase()));
  });
  const body = startIndex >= 0 ? lines.slice(startIndex) : lines.slice(Math.min(8, lines.length));
  const stopIndex = body.findIndex((line) => {
    const lower = line.toLowerCase();
    return template.textStopSignals.some((signal) => lower.includes(signal.toLowerCase()));
  });
  return stopIndex >= 0 ? body.slice(0, stopIndex) : body;
}

function formatRulesText(lines: string[]): string | undefined {
  const joined = lines.join(" ");
  const withSeparators = joined.replace(TIMING_PATTERN, (_match, timing: string) => {
    return `|${timing}: `;
  });
  const cleaned = compactText(withSeparators.replace(/^\|/, ""));
  return cleaned.length > 0 ? cleaned : undefined;
}

export function parseCardText(
  rawText: string,
  templateArg?: CardOcrTemplate | string | null
): CardTextParseResult {
  const lines = normalizeLines(rawText);
  const detectedType =
    typeof templateArg === "string"
      ? getCardOcrTemplate(templateArg)?.type
      : templateArg?.type ?? detectCardType(rawText);
  const template = detectedType ? CARD_OCR_TEMPLATES[detectedType] : null;
  const parseWarnings: string[] = [];
  const draft: ParsedCardDraft = {
    isFrontFace: true,
    isVariant: false,
    symbols: "",
  };

  if (lines.length === 0) {
    return {
      draft,
      detectedType,
      parseWarnings: ["No OCR text was returned"],
    };
  }

  if (detectedType) {
    draft.type = detectedType;
  } else {
    parseWarnings.push("Could not detect card type");
  }

  const name = detectName(lines, detectedType);
  if (name) {
    draft.name = name;
  } else {
    parseWarnings.push("Could not detect card name");
  }

  const rarity = detectRarity(lines);
  if (rarity) {
    draft.rarity = rarity;
  }

  if (template) {
    const consumedFields = new Set<keyof ParsedCardDraft>();
    for (const line of lines) {
      assignLabeledNumber(draft, line.toLowerCase(), line, consumedFields);
    }
    assignSequentialStats(draft, template, lines, consumedFields);
    detectZones(draft, lines);
    draft.keywords = detectKeywords(template, lines);
    draft.text = formatRulesText(textLines(template, lines));
  }

  if (!draft.text) {
    parseWarnings.push("Could not detect rules text");
  }

  return {
    draft,
    detectedType,
    parseWarnings,
  };
}
