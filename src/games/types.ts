import type { ComponentType, ReactNode, RefObject } from "react";
import type { DeckSetup, DeckSetupPatch, ParsedDeckText } from "@shared/games/deck";
import type { SharedGameModule } from "@shared/games/types";
import type { CachedCard } from "@/lib/universus/card-store";
import type { Id } from "../../convex/_generated/dataModel";
import type { CardFilters } from "@/providers/UIStateProvider";

// ---------------------------------------------------------------------------
// UI contract prop types (game-agnostic; each game's components satisfy them)
// ---------------------------------------------------------------------------

export interface GameCardDetailsDialogProps {
  card: CachedCard | null;
  backCard?: CachedCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards?: CachedCard[];
  getBackCard?: (card: CachedCard) => CachedCard | null | undefined;
}

export interface GameCardDetailsContentProps {
  card: CachedCard;
  className?: string;
}

export interface GameCardGridItemProps {
  card: CachedCard;
  backCard?: CachedCard | null;
  onCardClick?: (card: CachedCard) => void | Promise<void>;
  onOpenCardDetails?: (card: CachedCard) => void;
  dragSourceId?: string;
  showDeckActions?: boolean;
  imagePriority?: boolean;
  imageSizes?: string;
  imageQuality?: number;
}

export interface GameCardImageDisplayProps {
  imageUrl?: string;
  name: string;
  className?: string;
  imgRef?: RefObject<HTMLImageElement | null>;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fetchPriority?: "auto" | "high" | "low";
}

export interface GameSymbolIconProps {
  symbol: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export interface GameSymbolBadgeProps {
  symbol: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}

// ---------------------------------------------------------------------------
// Deck setup UI (UVS: starting character + identity; Cyberpunk: 3 Legends)
// ---------------------------------------------------------------------------

export type ClientDeckSetup = DeckSetup<Id<"cards">>;
export type ClientDeckSetupPatch = DeckSetupPatch<Id<"cards">>;

/**
 * Where a setup panel renders:
 * - `hero`: deck details side column (192px on desktop, up to 260px on mobile),
 * - `sidebar`: gallery active-deck panel,
 * - `compact`: read-only overlay on deck tiles (may render nothing).
 */
export type GameDeckSetupPanelVariant = "hero" | "sidebar" | "compact";

export interface GameDeckSetupPanelProps {
  variant: GameDeckSetupPanelVariant;
  /** The deck's normalized setup (`module.deck.normalizeSetup(deck)`). */
  setup: ClientDeckSetup;
  /** Card lookup by id (catalog index). */
  getCard: (id: string) => CachedCard | null | undefined;
  /** Persists a setup patch (`decks.update({ setup })`). Omit together with `readOnly`. */
  onChange?: (patch: ClientDeckSetupPatch) => void | Promise<void>;
  readOnly?: boolean;
  /** Main-deck quantities (Cyberpunk: RAM budget summary). */
  mainQuantities?: Readonly<Record<string, number>>;
  /** Deck cover art override (`deck.imageCardId`), hero only. */
  coverCard?: CachedCard | null;
  deckName?: string;
  deckDescription?: string;
  /** Hero: the deck has no cards (UVS collapses the empty frame on mobile). */
  deckEmpty?: boolean;
  /** Hero: extra overlay rendered inside the panel frame (e.g. the Ready badge). */
  overlay?: ReactNode;
  className?: string;
}

/** Deck setup card picker (UVS: starting character; Cyberpunk: Legends). */
export interface GameSetupCardPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup: ClientDeckSetup;
  onChange: (patch: ClientDeckSetupPatch) => void | Promise<void>;
  /** Multi-slot setups: the slot being filled/replaced (omit to toggle cards in and out). */
  slotIndex?: number | null;
}

/** Card details action that puts a card into the deck setup (UVS: starting character; Cyberpunk: Legend). */
export interface GameCardSetupActionProps {
  card: CachedCard;
  compact?: boolean;
  className?: string;
}

export interface GameSetupImportResult {
  /** Setup patch to apply after importing (`null` = the text named no setup cards). */
  patch: ClientDeckSetupPatch | null;
  /** Setup card names that did not resolve to a card. */
  unresolved: string[];
}

/** What to do when a card that belongs in the setup is added to the main deck. */
export type GameSetupAddResolution =
  | { kind: "add"; message: string; actionLabel: string; patch: ClientDeckSetupPatch }
  | { kind: "blocked"; message: string };

/** Pure (non-React) deck setup helpers + copy. */
export interface GameDeckSetupHelpers {
  /** Deck tile subtitle when nothing is chosen (UVS: "No character selected"). */
  emptySetupLabel: string;
  /** Simulator hint when the setup is empty; `null` when draws don't depend on the setup. */
  simulatorSetupHint: string | null;
  /** Simulator hint when the setup gives no hand size; `null` when not applicable. */
  simulatorNoHandSizeHint: string | null;
  /** Setup patch for an imported deck list (`findCards` returns name matches, best first). */
  importPatch(parsed: ParsedDeckText, findCards: (name: string) => readonly CachedCard[]): GameSetupImportResult;
  /**
   * Called when a card fails `deck.isMainDeckEligible`: offer to put it in the setup instead, or
   * explain why not. `null` = not a setup card (nothing to say).
   */
  resolveSetupAdd(
    card: CachedCard,
    setup: ClientDeckSetup,
    getCard: (id: string) => CachedCard | null | undefined,
  ): GameSetupAddResolution | null;
}

export interface GameStatsQuickFilterAdornmentProps {
  filters: CardFilters;
}

/** Colors for the deck stats sidebar pie charts. */
export interface GameDeckStatsPalette {
  /** Keyed by normalized card type; `Other` is the fallback. */
  cardTypeColors: Readonly<Record<string, string>>;
  /** Keyed by zone label; `None` is the fallback. */
  zoneColors: Readonly<Record<string, string>>;
  /** Shade ramps keyed by the chart's color strategy (e.g. `characterNumeric`). */
  numericShades: Readonly<Record<string, readonly string[]>>;
}

/** One chart in the deck stats sidebar (module-driven so each game picks its own stats). */
export type GameDeckStatsChart = {
  id: string;
  title: string;
  /** Counts only these main-deck cards (and totals over them). Default: every main-deck card. */
  filter?: (card: CachedCard, formatCardType: (type?: string) => string | undefined) => boolean;
  /** Pie color strategy (`cardTypeLabels`, `zoneLabels`, or a `numericShades` key). */
  colorStrategy: string;
  /** Fixed colors keyed by bucket label (wins over `colorStrategy`). */
  labelColors?: Readonly<Record<string, string>>;
} & (
  | { kind: "cardType" }
  /** Numeric value per card (`None` bucket when missing); `display: "bars"` renders a curve. */
  | { kind: "numeric"; value: (card: CachedCard) => number | null | undefined; display?: "pie" | "bars" }
  /** Zero or more labels per card (`emptyLabel` when none); buckets sorted by count unless `order`. */
  | { kind: "labels"; labels: (card: CachedCard) => readonly string[]; emptyLabel: string; order?: readonly string[] }
);

export interface SymbolColorClasses {
  bg: string;
  text: string;
  border: string;
}

/**
 * React components + client-only helpers that game-agnostic UI renders through
 * `useGameModule().ui` instead of importing a game's modules directly.
 * Module objects are static constants, so component identities are stable across renders.
 */
export interface ClientGameUi {
  // Card rendering
  CardDetailsDialog: ComponentType<GameCardDetailsDialogProps>;
  CardDetailsContent: ComponentType<GameCardDetailsContentProps>;
  CardGridItem: ComponentType<GameCardGridItemProps>;
  CardImageDisplay: ComponentType<GameCardImageDisplayProps>;

  // Symbols / identity
  SymbolIcon: ComponentType<GameSymbolIconProps>;
  SymbolBadge: ComponentType<GameSymbolBadgeProps>;
  /** Public image path for a symbol token (e.g. `fire`, `attuned:fire`), or `null` if unknown. */
  getSymbolPath(symbol: string): string | null;
  getSymbolColor(symbol: string): SymbolColorClasses;

  // Deck setup
  /** Deck setup panel for deck details (hero), the active-deck sidebar and deck tiles (compact). */
  DeckSetupPanel: ComponentType<GameDeckSetupPanelProps>;
  SetupCardPickerDialog: ComponentType<GameSetupCardPickerDialogProps>;
  /** Card details toggle that puts the card into the deck setup (renders nothing for other cards). */
  CardSetupAction: ComponentType<GameCardSetupActionProps>;
  deckSetup: GameDeckSetupHelpers;

  // Gallery filters
  StatsQuickFilterAdornment: ComponentType<GameStatsQuickFilterAdornmentProps>;
  /** Hex color for a card-type filter chip. */
  getCardTypeColor(type: string): string;
  /** Hex color for a keyword filter chip. */
  getKeywordColor(keyword: string): string;

  // Card data
  /** Normalizes a raw card type (e.g. `"attack"` → `"Attack"`); unknown types pass through. */
  formatCardType(type?: string): string | undefined;

  // Deck stats
  deckStats: GameDeckStatsPalette;
  /** Charts in the deck stats sidebar, in order. */
  deckStatsCharts: readonly GameDeckStatsChart[];
}

/** Client-side game module: the shared module plus React components/hooks (`ui`). */
export interface ClientGameModule extends SharedGameModule {
  ui: ClientGameUi;
}
