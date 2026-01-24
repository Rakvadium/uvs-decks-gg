export const IMAGE_BASE_URL = "https://www.uvsdecks.gg/storage/v1/object/public/tcgdecks/universus";

export type UniversusSymbol =
  | "air"
  | "all"
  | "chaos"
  | "death"
  | "earth"
  | "evil"
  | "fire"
  | "good"
  | "life"
  | "order"
  | "void"
  | "water"
  | "infinity";

export type UniversusCardType =
  | "Character"
  | "Attack"
  | "Action"
  | "Asset"
  | "Foundation"
  | "Backup"
  | "Token";

export type UniversusZone = "high" | "mid" | "low";

export type KeywordCategory = "ability" | "trait" | "character";

export type KeywordTiming = "response" | "enhance" | "blitz" | "static" | "form";

export interface KeywordDefinition {
  name: string;
  category: KeywordCategory;
  description?: string;
  timing?: KeywordTiming;
}

export type UniversusRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Super Rare"
  | "Ultra Rare"
  | "Promo"
  | "Character";

export interface UniversusAttack {
  zone: UniversusZone;
  speed: number;
  damage: number;
}

export interface UniversusBlock {
  zone: UniversusZone;
  modifier: number;
}

export interface UniversusAbility {
  timing: string;
  cost?: string;
  text: string;
  restrictions?: string;
}

export interface UniversusLegality {
  Standard?: boolean;
  Heroic?: boolean;
  Retro?: boolean;
}

export interface UniversusCardMetadata {
  [key: string]: unknown;
  abilities?: UniversusAbility[];
  symbols?: string[];
  attuned?: string[];
  attack?: UniversusAttack;
  block?: UniversusBlock;
  difficulty?: number;
  control?: number;
  handSize?: number;
  health?: number;
  stamina?: number;
  legality?: UniversusLegality;
}

export interface UniversusRawAbility {
  timing: string;
  cost?: string;
  effect: string;
  restrictions?: string;
}

export interface UniversusRawAttack {
  zone: string;
  speed: number;
  damage: number;
}

export interface UniversusRawBlock {
  zone: string;
  modifier: string | number;
}

export interface UniversusRawBack {
  id: string;
  name: string;
  image?: string;
  type: string;
  text?: string;
  setCode?: string;
  number?: string;
  keywords?: string[];
  abilities?: UniversusRawAbility[];
  attack?: UniversusRawAttack;
  stamina?: number;
}

export interface UniversusRawCard {
  id: string;
  name: string;
  image?: string;
  type: string;
  text?: string;
  setCode: string;
  number: string;
  rarity?: string;
  difficulty?: number;
  checkValue?: number;
  keywords?: string[];
  symbols?: string[];
  attuned?: string[];
  handSize?: number;
  health?: number;
  stamina?: number;
  attack?: UniversusRawAttack;
  block?: UniversusRawBlock;
  abilities?: UniversusRawAbility[];
  back?: UniversusRawBack;
  legality?: UniversusLegality;
  setNumber?: number;
}

export type UniversusAttunedSymbol = 
  | "attuned-air"
  | "attuned-all"
  | "attuned-chaos"
  | "attuned-death"
  | "attuned-earth"
  | "attuned-evil"
  | "attuned-fire"
  | "attuned-good"
  | "attuned-life"
  | "attuned-order"
  | "attuned-void"
  | "attuned-water";

export interface FormatDefinition {
  key: string;
  name: string;
  isDefault?: boolean;
  subFormats?: { key: string; name: string }[];
}

export interface IdentityDefinition {
  key: string;
  name: string;
  iconUrl?: string;
  isUniversal?: boolean;
}

export interface DeckValidationConfig {
  requiresStartingCharacter: boolean;
  startingCharacterType: string;
  requiresIdentity: boolean;
}

export const UNIVERSUS_CARD_TYPES: UniversusCardType[] = [
  "Character",
  "Attack",
  "Action",
  "Asset",
  "Foundation",
  "Backup",
  "Token",
];

export const UNIVERSUS_ZONES: UniversusZone[] = ["high", "mid", "low"];

export const UNIVERSUS_SYMBOLS: UniversusSymbol[] = [
  "air",
  "chaos",
  "death",
  "earth",
  "evil",
  "fire",
  "good",
  "life",
  "order",
  "void",
  "water",
  "infinity",
  "all",
];

export const UNIVERSUS_FILTER_SYMBOLS: UniversusSymbol[] = [
  "air",
  "all",
  "chaos",
  "death",
  "earth",
  "evil",
  "fire",
  "good",
  "life",
  "order",
  "void",
  "water",
];

export const UNIVERSUS_ATTUNED_SYMBOLS: UniversusAttunedSymbol[] = [
  "attuned-air",
  "attuned-all",
  "attuned-chaos",
  "attuned-death",
  "attuned-earth",
  "attuned-evil",
  "attuned-fire",
  "attuned-good",
  "attuned-life",
  "attuned-order",
  "attuned-void",
  "attuned-water",
];

export const UNIVERSUS_KEYWORD_ABILITIES: KeywordDefinition[] = [
  {
    name: "Breaker",
    category: "ability",
    timing: "response",
    description: "Response: After you block with this card, your rival's next check to play a card gets -X. X equals the rating of the Breaker keyword granting this ability.",
  },
  {
    name: "Combo",
    category: "ability",
    timing: "form",
    description: "Combo-restricted abilities on this card are only playable if the printed properties of the directly preceding card(s) in the card pool match the requirement(s) of a Combo keyword on this card, in order.",
  },
  {
    name: "Deflect",
    category: "ability",
    timing: "response",
    description: "Response [Hand] Add this card to the card pool: Before the damage step of a rival attack, that attack gets -X damage. X equals the rating of the Deflect keyword granting this ability. Only 1 Deflect ability can be played per attack.",
  },
  {
    name: "Desperation",
    category: "ability",
    timing: "form",
    description: "While you are at desperation, this card's difficulty is X. X equals the rating of the Desperation keyword granting this ability.",
  },
  {
    name: "Echo",
    category: "ability",
    timing: "response",
    description: "Response Discard 1 momentum: After this attack resolves, you may play it as your next form. If you do, after it resolves, flip it.",
  },
  {
    name: "Elusive",
    category: "ability",
    timing: "form",
    description: "This backup cannot be attacked by a rival's first attack each turn.",
  },
  {
    name: "EX",
    category: "ability",
    timing: "enhance",
    description: "Enhance Discard 1 or more momentum: This attack gets +X speed for each card used to pay the cost of this ability. X equals the rating of the EX keyword granting this ability.",
  },
  {
    name: "Flash",
    category: "ability",
    timing: "form",
    description: "Skip this attack's Enhance Step.",
  },
  {
    name: "Frenzy",
    category: "ability",
    timing: "blitz",
    description: "Blitz: This attack gets +1 speed and +1 damage for each attack that has been blocked this turn.",
  },
  {
    name: "Powerful",
    category: "ability",
    timing: "enhance",
    description: "Enhance Discard 1 or more momentum: This attack gets +X damage for each card used to pay the cost of this ability. X equals the rating of the Powerful keyword granting this ability.",
  },
  {
    name: "Safe",
    category: "ability",
    timing: "form",
    description: "Attacks cannot be played as a reversal to this attack.",
  },
  {
    name: "Shift",
    category: "ability",
    timing: "form",
    description: "As this card clears from your card pool during your End Phase, if you played it, you may build it transformed (opposite side up).",
  },
  {
    name: "Stun",
    category: "ability",
    timing: "enhance",
    description: "Enhance: Your rival commits X foundations. X equals the rating of the Stun keyword granting this ability.",
  },
  {
    name: "Terrain",
    category: "ability",
    timing: "form",
    description: "After this card is added to your stage, destroy all other terrain cards.",
  },
  {
    name: "Tension",
    category: "ability",
    timing: "blitz",
    description: "Blitz: Add 1 Roman Cancel token to your momentum.",
  },
  {
    name: "Throw",
    category: "ability",
    timing: "form",
    description: "If this attack is completely blocked, it deals half damage (rounded up) during the Damage Step.",
  },
  {
    name: "Unique",
    category: "ability",
    timing: "form",
    description: "While this card is in your stage, if there are 2 or more copies of it in your stage, sacrifice the copy that was most recently added.",
  },
];

export const UNIVERSUS_KEYWORD_TRAITS: KeywordDefinition[] = [
  { name: "Ally", category: "trait" },
  { name: "Armor", category: "trait" },
  { name: "Charge", category: "trait" },
  { name: "Diplomacy", category: "trait" },
  { name: "Doopler", category: "trait" },
  { name: "Fury", category: "trait" },
  { name: "Kick", category: "trait" },
  { name: "Pizza", category: "trait" },
  { name: "Punch", category: "trait" },
  { name: "Ranged", category: "trait" },
  { name: "Scheme", category: "trait" },
  { name: "Ship", category: "trait" },
  { name: "Slam", category: "trait" },
  { name: "Spell", category: "trait" },
  { name: "Taunt", category: "trait" },
  { name: "Tech", category: "trait" },
  { name: "Titan", category: "trait" },
  { name: "Vestige", category: "trait" },
  { name: "Weapon", category: "trait" },
  { name: "XP", category: "trait" },
];

export const UNIVERSUS_CHARACTER_TRAITS: KeywordDefinition[] = [
  { name: "1-A", category: "character" },
  { name: "1-B", category: "character" },
  { name: "Big 3", category: "character" },
  { name: "Brawler", category: "character" },
  { name: "Champion", category: "character" },
  { name: "E-Rank", category: "character" },
  { name: "Ensign", category: "character" },
  { name: "Garrison", category: "character" },
  { name: "Giant", category: "character" },
  { name: "Healer", category: "character" },
  { name: "Hunter", category: "character" },
  { name: "Inventor", category: "character" },
  { name: "My Hero Academia: League of Villains", category: "character" },
  { name: "Lurkers", category: "character" },
  { name: "Mighty Nein", category: "character" },
  { name: "Military Police Brigade", category: "character" },
  { name: "Monster", category: "character" },
  { name: "Mutant", category: "character" },
  { name: "Nomu", category: "character" },
  { name: "Pirate", category: "character" },
  { name: "Pro Hero", category: "character" },
  { name: "Samurai", category: "character" },
  { name: "Scout", category: "character" },
  { name: "Shie Hassaikai", category: "character" },
  { name: "Shiketsu", category: "character" },
  { name: "Student", category: "character" },
  { name: "Survey Corps", category: "character" },
  { name: "Teacher", category: "character" },
  { name: "Team Masho", category: "character" },
  { name: "Team Rokuyokai", category: "character" },
  { name: "Team Toguro", category: "character" },
  { name: "Team Urameshi", category: "character" },
  { name: "Team Uraotogi", category: "character" },
  { name: "Thief", category: "character" },
  { name: "Titan", category: "character" },
  { name: "Vampire", category: "character" },
  { name: "Villain", category: "character" },
  { name: "Vox Machina", category: "character" },
  { name: "Warrior", category: "character" },
];

export const UNIVERSUS_ALL_KEYWORDS: KeywordDefinition[] = [
  ...UNIVERSUS_KEYWORD_ABILITIES,
  ...UNIVERSUS_KEYWORD_TRAITS,
  ...UNIVERSUS_CHARACTER_TRAITS,
];

export const UNIVERSUS_KEYWORDS = UNIVERSUS_ALL_KEYWORDS.map(k => k.name);

export const UNIVERSUS_SYMBOL_DISPLAY: Record<UniversusSymbol, string> = {
  air: "Air",
  all: "All",
  chaos: "Chaos",
  death: "Death",
  earth: "Earth",
  evil: "Evil",
  fire: "Fire",
  good: "Good",
  life: "Life",
  order: "Order",
  void: "Void",
  water: "Water",
  infinity: "Infinity",
};

export const UNIVERSUS_SYMBOL_COLORS: Record<UniversusSymbol, { bg: string; text: string; border: string }> = {
  air: { bg: "bg-sky-500/10", text: "text-sky-500", border: "border-sky-500" },
  all: { bg: "bg-gradient-to-r from-purple-500/10 to-pink-500/10", text: "text-purple-500", border: "border-purple-500" },
  chaos: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500" },
  death: { bg: "bg-slate-900/10", text: "text-slate-900 dark:text-slate-100", border: "border-slate-900" },
  earth: { bg: "bg-amber-600/10", text: "text-amber-600", border: "border-amber-600" },
  evil: { bg: "bg-purple-900/10", text: "text-purple-900 dark:text-purple-300", border: "border-purple-900" },
  fire: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500" },
  good: { bg: "bg-yellow-400/10", text: "text-yellow-600", border: "border-yellow-400" },
  life: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500" },
  order: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500" },
  void: { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500" },
  water: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500" },
  infinity: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500" },
};

export const UNIVERSUS_COLORS = {
  FOUNDATION: '#7D8D97',
  CHARACTER: '#8C498D',
  BACKUP: '#CD1181',
  ACTION: '#0081C9',
  ASSET: '#009956',
  ATTACK: '#F1841B',
  ENHANCE: '#F1841B',
  RESPONSE: '#009956',
  BLITZ: '#CD1181',
  FORM: '#0081C9',
  HIGH: '#E40D17',
  MID: '#FA9F09',
  LOW: '#FFE103',
} as const;

export const KEYWORD_TIMING_COLORS: Record<KeywordTiming, string> = {
  response: UNIVERSUS_COLORS.RESPONSE,
  enhance: UNIVERSUS_COLORS.ENHANCE,
  blitz: UNIVERSUS_COLORS.BLITZ,
  static: UNIVERSUS_COLORS.FOUNDATION,
  form: UNIVERSUS_COLORS.FORM,
};

export const UNIVERSUS_TYPE_ICONS: Record<UniversusCardType, string> = {
  Character: "user",
  Attack: "sword",
  Action: "clapperboard",
  Asset: "package",
  Foundation: "landmark",
  Backup: "shield",
  Token: "square",
};

export const UNIVERSUS_FORMATS: FormatDefinition[] = [
  {
    key: "standard",
    name: "Standard",
    isDefault: true,
    subFormats: [
      { key: "future-standard", name: "Future Standard" },
    ],
  },
  {
    key: "heroic",
    name: "Heroic",
    subFormats: [
      { key: "future-heroic", name: "Future Heroic" },
    ],
  },
  {
    key: "retro",
    name: "Retro",
    subFormats: [
      { key: "future-retro", name: "Future Retro" },
    ],
  },
];

export const UNIVERSUS_IDENTITIES: IdentityDefinition[] = [
  { key: "air", name: "Air" },
  { key: "all", name: "All" },
  { key: "chaos", name: "Chaos" },
  { key: "death", name: "Death" },
  { key: "earth", name: "Earth" },
  { key: "evil", name: "Evil" },
  { key: "fire", name: "Fire" },
  { key: "good", name: "Good" },
  { key: "life", name: "Life" },
  { key: "order", name: "Order" },
  { key: "void", name: "Void" },
  { key: "water", name: "Water" },
  { key: "infinity", name: "Infinity", isUniversal: true },
];

export const UNIVERSUS_DECK_VALIDATION: DeckValidationConfig = {
  requiresStartingCharacter: true,
  startingCharacterType: "Character",
  requiresIdentity: true,
};

export const UNIVERSUS_RARITY_MAPPING: Record<string, string> = {
  Common: "Common",
  Uncommon: "Uncommon",
  Rare: "Rare",
  "Super Rare": "Super Rare",
  Ultra: "Ultra Rare",
  Promo: "Promo",
  Champion: "Champion",
};

export const UNIVERSUS_CONFIG = {
  name: "UniVersus",
  description: "The UniVersus Trading Card Game",
  imageBaseUrl: IMAGE_BASE_URL,
  theme: {
    primary: "220 90% 56%",
    secondary: "262 83% 58%",
    accent: "142 76% 36%",
  },
  terminology: {
    card: "Card",
    cards: "Cards",
    deck: "Deck",
    decks: "Decks",
    collection: "Collection",
    set: "Set",
    sets: "Sets",
    rarities: {
      common: "Common",
      uncommon: "Uncommon",
      rare: "Rare",
      superRare: "Super Rare",
      ultraRare: "Ultra Rare",
      promo: "Promo",
      champion: "Champion",
    },
    formats: {
      standard: "Standard",
      heroic: "Heroic",
      retro: "Retro",
    },
    resources: {
      difficulty: "Difficulty",
      control: "Control",
      speed: "Speed",
      damage: "Damage",
      block: "Block Modifier",
      handSize: "Hand Size",
      health: "Health",
      stamina: "Stamina",
    },
  },
  formats: UNIVERSUS_FORMATS,
  identities: UNIVERSUS_IDENTITIES,
  deckValidation: UNIVERSUS_DECK_VALIDATION,
  keywords: UNIVERSUS_ALL_KEYWORDS,
  cardTypes: UNIVERSUS_CARD_TYPES,
  zones: UNIVERSUS_ZONES,
  symbols: UNIVERSUS_SYMBOLS,
  symbolColors: UNIVERSUS_SYMBOL_COLORS,
  symbolDisplay: UNIVERSUS_SYMBOL_DISPLAY,
  colors: UNIVERSUS_COLORS,
  rarityMapping: UNIVERSUS_RARITY_MAPPING,
} as const;

export function getKeywordDefinition(keyword: string): KeywordDefinition | undefined {
  const baseName = keyword.split(/[\s:]+/)[0];
  return UNIVERSUS_ALL_KEYWORDS.find(
    k => k.name.toLowerCase() === baseName.toLowerCase()
  );
}

export function getKeywordsByCategory(category: KeywordCategory): KeywordDefinition[] {
  return UNIVERSUS_ALL_KEYWORDS.filter(k => k.category === category);
}

export function getKeywordTimingColor(keyword: string): string {
  const definition = getKeywordDefinition(keyword);
  if (definition?.timing) {
    return KEYWORD_TIMING_COLORS[definition.timing];
  }
  return UNIVERSUS_COLORS.FORM;
}

export function getSymbolColor(symbol: string): { bg: string; text: string; border: string } {
  const normalized = symbol.toLowerCase() as UniversusSymbol;
  return UNIVERSUS_SYMBOL_COLORS[normalized] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-muted" };
}

export function formatUniversusCardType(type?: string): UniversusCardType | undefined {
  if (!type) return undefined;
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (["Character", "Attack", "Action", "Asset", "Foundation", "Backup", "Token"].includes(normalized)) {
    return normalized as UniversusCardType;
  }
  return type as UniversusCardType;
}
