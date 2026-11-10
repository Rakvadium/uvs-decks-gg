import type { ClientGameUi } from "../types";
import { UVS_CLIENT_UI } from "../uvs/ui";
import { CardDetailsContent } from "./components/card-details/content";
import { CardDetailsDialog } from "./components/card-details/dialog";
import { CardGridItem } from "./components/card-grid-item";
import { CardImageDisplay } from "./components/card-image-display";
import { SymbolBadge, SymbolIcon } from "./components/color-pip";
import { StatsQuickFilterAdornment } from "./components/stats-quick-filter-adornment";
import {
  formatCyberpunkCardType,
  getCyberpunkCardTypeColor,
  getCyberpunkKeywordColor,
  getCyberpunkSymbolColor,
  getCyberpunkSymbolPath,
} from "./config";
import { CyberpunkDeckSetupPanel } from "./components/deck/deck-setup-panel";
import { LegendPickerDialog } from "./components/deck/legend-picker-dialog";
import { CyberpunkSetLegendButton } from "./components/deck/set-legend-button";
import { CYBERPUNK_DECK_SETUP_HELPERS } from "./deck-setup";
import { CYBERPUNK_DECK_STATS_CHARTS, CYBERPUNK_DECK_STATS_PALETTE } from "./deck-stats";

/**
 * Cyberpunk implementation of the client UI contract (`ClientGameModule.ui`). Static: identities
 * never change.
 *
 * Deck-setup members (`DeckSetupPanel`, `SetupCardPickerDialog`, `CardSetupAction`, `deckSetup`,
 * `deckStatsCharts`) belong to the deck-builder wave; until it lands they fall through to the
 * UVS placeholders via the spread below. Keep edits additive (override after the spread).
 */
export const CYBERPUNK_CLIENT_UI = {
  // TODO(phase3-ui): deck-setup placeholders (UVS) until the Cyberpunk deck-builder UI replaces them.
  ...UVS_CLIENT_UI,

  // Card rendering (text frame when a card has no image)
  CardDetailsDialog,
  CardDetailsContent,
  CardGridItem,
  CardImageDisplay,

  // Colors instead of UVS symbols
  SymbolIcon,
  SymbolBadge,
  getSymbolPath: getCyberpunkSymbolPath,
  getSymbolColor: getCyberpunkSymbolColor,

  // Gallery filters
  StatsQuickFilterAdornment,
  getCardTypeColor: getCyberpunkCardTypeColor,
  getKeywordColor: getCyberpunkKeywordColor,

  // Card data
  formatCardType: formatCyberpunkCardType,

  // Deck stats
  deckStats: CYBERPUNK_DECK_STATS_PALETTE,
  deckStatsCharts: CYBERPUNK_DECK_STATS_CHARTS,

  // Deck setup (deck-builder wave): 3 Legend slots, Legend picker, RAM budget, "Set As Legend"
  DeckSetupPanel: CyberpunkDeckSetupPanel,
  SetupCardPickerDialog: LegendPickerDialog,
  CardSetupAction: CyberpunkSetLegendButton,
  deckSetup: CYBERPUNK_DECK_SETUP_HELPERS,
} as const satisfies ClientGameUi;
