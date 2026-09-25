/**
 * Game-agnostic deck contracts implemented by each game module (`SharedGameModule.deck`).
 * Pure TS: safe to import from convex/ (relative path) and src/ (`@shared/*`).
 */
import type { UvsDeckSetup, UvsDeckSetupPatch, UvsDeckSetupSource } from "./uvs/setup";

// ---------------------------------------------------------------------------
// Deck setup (becomes a union over games in Phase 3)
// ---------------------------------------------------------------------------

export type DeckSetup<TCardId extends string = string> = UvsDeckSetup<TCardId>;
export type DeckSetupPatch<TCardId extends string = string> = UvsDeckSetupPatch<TCardId>;
export type DeckSetupSource<TCardId extends string = string> = UvsDeckSetupSource<TCardId>;

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
  character: DeckTextLine | null;
  main: DeckTextLine[];
  side: DeckTextLine[];
}

/** Plain-text deck list import/export (UVS: the UVS Ultra `[b]Section[/b]` format). */
export interface DeckTextFormat {
  /** Main-deck card types the export groups by (others are dropped). */
  mainTypeOrder: readonly string[];
  parse(text: string): ParsedDeckText;
  format(params: { character: { name: string } | null; main: DeckTextLine[]; side: DeckTextLine[] }): string;
}

export interface SharedGameDeckModule {
  normalizeSetup<TCardId extends string>(deck: DeckSetupSource<TCardId> | null | undefined): DeckSetup<TCardId>;
  applySetupPatch<TCardId extends string>(
    current: DeckSetup<TCardId>,
    patch: DeckSetupPatch<TCardId> | null | undefined,
  ): DeckSetup<TCardId>;
  /** Card ids referenced by a setup/patch (server rejects back faces). */
  setupCardIds<TCardId extends string>(
    setup: DeckSetup<TCardId> | DeckSetupPatch<TCardId> | null | undefined,
  ): TCardId[];
  validation: GameDeckValidationRules;
  /** Display order of card-type groups in deck lists. */
  cardTypeOrder: readonly string[];
  /** Plural group labels keyed by card type. */
  cardTypeLabels: Readonly<Record<string, string>>;
  /** Preferred sideboard size (UI warning only). */
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
  /** Parses a zone string (e.g. "High/Mid") into display labels. */
  extractZones(rawZone?: string | null): string[];
  zoneTone(zone?: string | null): ZoneTone | null;
  text: DeckTextFormat;
}
