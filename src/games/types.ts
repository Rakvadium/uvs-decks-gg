import type { ComponentType, RefObject } from "react";
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

/** Deck setup card picker (UVS: starting character). */
export interface GameSetupCardPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCharacterId?: Id<"cards"> | null;
  onSelectCharacter: (cardId: Id<"cards">) => void | Promise<void>;
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
  SetupCardPickerDialog: ComponentType<GameSetupCardPickerDialogProps>;

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
}

/** Client-side game module: the shared module plus React components/hooks (`ui`). */
export interface ClientGameModule extends SharedGameModule {
  ui: ClientGameUi;
}
