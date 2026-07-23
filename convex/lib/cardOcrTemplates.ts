export const UNIVERSUS_OCR_CARD_TYPES = [
  "Character",
  "Attack",
  "Action",
  "Asset",
  "Foundation",
  "Arena",
  "Backup",
  "Token",
] as const;

export type CardOcrType = (typeof UNIVERSUS_OCR_CARD_TYPES)[number];

export type CardOcrField =
  | "name"
  | "type"
  | "rarity"
  | "difficulty"
  | "control"
  | "speed"
  | "damage"
  | "blockModifier"
  | "handSize"
  | "health"
  | "stamina"
  | "attackZone"
  | "blockZone"
  | "keywords"
  | "text";

export type CardOcrTemplate = {
  type: CardOcrType;
  aliases: string[];
  statFields: CardOcrField[];
  textStartSignals: string[];
  textStopSignals: string[];
  keywordSignals: string[];
};

const COMMON_TEXT_START_SIGNALS = [
  "enhance",
  "response",
  "form",
  "static",
  "first form",
  "commit",
  "destroy",
  "once per turn",
];

const COMMON_TEXT_STOP_SIGNALS = [
  "illustrated by",
  "illus.",
  "©",
  "universus",
  "uvs games",
];

export const CARD_OCR_TEMPLATES: Record<CardOcrType, CardOcrTemplate> = {
  Character: {
    type: "Character",
    aliases: ["character", "char"],
    statFields: ["difficulty", "control", "handSize", "health"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["ranged", "weapon", "punch", "kick", "throws", "ally"],
  },
  Attack: {
    type: "Attack",
    aliases: ["attack"],
    statFields: ["difficulty", "control", "speed", "damage", "blockModifier"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["ranged", "weapon", "punch", "kick", "throw", "fury", "slam", "multiple", "stun", "powerful", "ex"],
  },
  Action: {
    type: "Action",
    aliases: ["action"],
    statFields: ["difficulty", "control", "blockModifier"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["enhance", "response", "form"],
  },
  Asset: {
    type: "Asset",
    aliases: ["asset"],
    statFields: ["difficulty", "control", "blockModifier"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["item", "weapon", "unique"],
  },
  Foundation: {
    type: "Foundation",
    aliases: ["foundation"],
    statFields: ["difficulty", "control", "blockModifier"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["foundation", "enhance", "response", "form"],
  },
  Arena: {
    type: "Arena",
    aliases: ["arena"],
    statFields: ["difficulty", "control", "blockModifier"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["arena", "enhance", "response", "form"],
  },
  Backup: {
    type: "Backup",
    aliases: ["backup"],
    statFields: ["difficulty", "control", "blockModifier"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["backup", "enhance", "response", "form"],
  },
  Token: {
    type: "Token",
    aliases: ["token"],
    statFields: ["difficulty", "control", "speed", "damage", "stamina"],
    textStartSignals: COMMON_TEXT_START_SIGNALS,
    textStopSignals: COMMON_TEXT_STOP_SIGNALS,
    keywordSignals: ["token"],
  },
};

export function getCardOcrTemplate(type: string | undefined): CardOcrTemplate | null {
  if (!type) return null;
  const normalized = type.trim().toLowerCase();
  return (
    UNIVERSUS_OCR_CARD_TYPES.map((cardType) => CARD_OCR_TEMPLATES[cardType]).find(
      (template) =>
        template.type.toLowerCase() === normalized ||
        template.aliases.some((alias) => alias.toLowerCase() === normalized)
    ) ?? null
  );
}
