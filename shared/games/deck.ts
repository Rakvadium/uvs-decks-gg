/**
 * Game-agnostic deck contracts implemented by each game module (`SharedGameModule.deck`).
 * Pure TS: safe to import from convex/ (relative path) and src/ (`@shared/*`).
 */
import type { CyberpunkDeckSetup, CyberpunkDeckSetupPatch } from "./cyberpunk/setup";
import type { UvsDeckSetup, UvsDeckSetupPatch } from "./uvs/setup";

// ---------------------------------------------------------------------------
// Deck setup: a union over games, discriminated by `game` (must equal the deck's `game`)
// ---------------------------------------------------------------------------

export type DeckSetup<TCardId extends string = string> = UvsDeckSetup<TCardId> | CyberpunkDeckSetup<TCardId>;
export type DeckSetupPatch<TCardId extends string = string> =
  | UvsDeckSetupPatch<TCardId>
  | CyberpunkDeckSetupPatch<TCardId>;

/**
 * Anything shaped like a deck row: `setup` (any game) plus the deprecated UVS top-level fields.
 * Each game's `normalizeSetup` reads only its own setup (a foreign one normalizes to empty).
 */
export interface DeckSetupSource<TCardId extends string = string> {
  setup?: DeckSetup<TCardId> | null;
  /** @deprecated UVS legacy field; use `setup` */
  startingCharacterId?: TCardId | null;
  /** @deprecated UVS legacy field; use `setup` */
  selectedIdentity?: string | null;
}

// ---------------------------------------------------------------------------
// Validation inputs (plain data; Convex loads them, rules stay pure)
// ---------------------------------------------------------------------------

export interface DeckRuleCard {
  _id: string;
  name: string;
  type?: string;
  symbols?: string;
  oracleId?: string;
  copyLimit?: number | null;
  difficulty?: number | null;
  control?: number | null;
  /** Cyberpunk: color (`red` | `green` | `blue` | `yellow`); Legends provide RAM of this color. */
  color?: string;
  /** Cyberpunk: card subtitle (a Legend's version, e.g. "Streetkid" in "V: Streetkid"). */
  subname?: string;
  /** Cyberpunk: RAM requirement (cards) / RAM provided (Legends). */
  ram?: number | null;
  cost?: number | null;
  power?: number | null;
  sellable?: boolean;
  /** Pipe-delimited tags. */
  tags?: string;
}

export interface DeckRuleFormat {
  key: string;
  minDeckSize: number;
  maxDeckSize?: number;
  sideboardRule: string;
  defaultCopyLimit: number;
  requiresStartingCharacter: boolean;
  requiresIdentity: boolean;
}

export interface DeckRuleLegality {
  cardId: string;
  status: "legal" | "banned" | "restricted";
  copyLimitOverride?: number;
  effectiveDate?: number;
}

export interface DeckRuleDeck extends DeckSetupSource {
  format?: string;
  mainCardIds: readonly string[];
  mainQuantities: Record<string, number>;
  sideCardIds: readonly string[];
  sideQuantities: Record<string, number>;
}

export interface DeckValidationError<TCardId extends string = string> {
  code: string;
  message: string;
  cardId?: TCardId;
  section?: "main" | "side";
}

export interface DeckValidationWarning<TCardId extends string = string> {
  code: string;
  message: string;
  cardId?: TCardId;
}

export interface DeckValidationOutcome<TCardId extends string = string> {
  errors: DeckValidationError<TCardId>[];
  warnings: DeckValidationWarning<TCardId>[];
}

/** What the loader must fetch before calling `validate`. */
export interface DeckValidationPlan {
  /** Card ids to load into `DeckValidationInput.cards`. */
  cardIds: string[];
  /** Setup card ids to load into `DeckValidationInput.setupCards`. */
  setupCardIds: string[];
}

export interface DeckValidationInput<TCard extends DeckRuleCard = DeckRuleCard> {
  deck: DeckRuleDeck;
  format: DeckRuleFormat;
  /** Loaded cards (`plan.cardIds`) keyed by `_id`; missing cards are simply absent. */
  cards: ReadonlyMap<string, TCard>;
  /** Loaded setup cards (`plan.setupCardIds`) keyed by id; `null` when not found. */
  setupCards: ReadonlyMap<string, TCard | null>;
  /** `cardLegality` rows for the deck's format, in index order (last row per card wins). */
  legality: readonly DeckRuleLegality[];
  now: number;
}

export interface GameDeckValidationRules {
  plan(deck: DeckRuleDeck, format: DeckRuleFormat): DeckValidationPlan;
  validate<TCard extends DeckRuleCard>(input: DeckValidationInput<TCard>): DeckValidationOutcome<TCard["_id"]>;
}

// ---------------------------------------------------------------------------
// Deck building helpers
// ---------------------------------------------------------------------------

export type DeckSection = "main" | "side" | "reference";

export type DeckAddableCard = {
  type?: string | null;
  difficulty?: number | null;
  control?: number | null;
  copyLimit?: number | null;
};

export type ZoneTone = "low" | "mid" | "high";

export interface DeckTextLine {
  name: string;
  quantity: number;
  type?: string;
}

export interface ParsedDeckText {
  /** UVS: the starting character (`null` for games without one). */
  character: DeckTextLine | null;
  /** Setup cards in list order (Cyberpunk: Legends). Absent for games whose setup is `character`. */
  setupCards?: DeckTextLine[];
  main: DeckTextLine[];
  side: DeckTextLine[];
}

export interface DeckTextFormatParams {
  character: { name: string } | null;
  /** Setup cards in setup order (Cyberpunk: Legends); ignored by UVS. */
  setupCards?: readonly { name: string }[];
  main: DeckTextLine[];
  side: DeckTextLine[];
}

/** Plain-text deck list import/export (UVS: the UVS Ultra `[b]Section[/b]` format). */
export interface DeckTextFormat {
  /**
   * Main-deck card types the export groups by. UVS drops other types; Cyberpunk lists
   * everything (known types first, in this order).
   */
  mainTypeOrder: readonly string[];
  parse(text: string): ParsedDeckText;
  format(params: DeckTextFormatParams): string;
}

/**
 * Per-game deck behavior. Setup functions accept the setup **union** so generic code can call
 * `getSharedGameModule(deck.game).deck.normalizeSetup(deck)` safely; each module only
 * understands its own `game`:
 * - `normalizeSetup` ignores a foreign `setup` (returns the game's empty setup),
 * - `applySetupPatch` throws on a patch for another game (servers reject it earlier),
 * - `setupCardIds` / `setupPreviewCardId` return nothing for a foreign setup.
 */
export interface SharedGameDeckModule {
  normalizeSetup<TCardId extends string>(deck: DeckSetupSource<TCardId> | null | undefined): DeckSetup<TCardId>;
  applySetupPatch<TCardId extends string>(
    current: DeckSetup<TCardId>,
    patch: DeckSetupPatch<TCardId> | null | undefined,
  ): DeckSetup<TCardId>;
  /** Card ids referenced by a setup/patch (server rejects back faces / other games' cards). */
  setupCardIds<TCardId extends string>(
    setup: DeckSetup<TCardId> | DeckSetupPatch<TCardId> | null | undefined,
  ): TCardId[];
  /** Card whose art represents the deck (UVS: starting character; Cyberpunk: first Legend). */
  setupPreviewCardId<TCardId extends string>(setup: DeckSetup<TCardId> | null | undefined): TCardId | undefined;
  validation: GameDeckValidationRules;
  /** Display order of card-type groups in deck lists. */
  cardTypeOrder: readonly string[];
  /** Plural group labels keyed by card type. */
  cardTypeLabels: Readonly<Record<string, string>>;
  /** Preferred sideboard size (UI warning only; 0 = the game has no sideboard). */
  sideboardLimit: number;
  /** Whether a card may be put in a deck at all. */
  isMainDeckEligible(card: DeckAddableCard | null | undefined): boolean;
  /** Per-card copy limit across main + side (`Infinity` when unlimited). */
  getCardCopyLimit(card: DeckAddableCard | null | undefined): number;
  /** Simulator opening hand size for a deck setup. */
  simulatorHandSize<TCardId extends string>(
    setup: DeckSetup<TCardId>,
    getCard: (id: TCardId) => { handSize?: number | null } | null | undefined,
  ): number;
  /** Parses a zone string (e.g. "High/Mid") into display labels (`[]` for games without zones). */
  extractZones(rawZone?: string | null): string[];
  zoneTone(zone?: string | null): ZoneTone | null;
  text: DeckTextFormat;
}
