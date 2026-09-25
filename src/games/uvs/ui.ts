import type { ClientGameUi } from "../types";
import { CardDetailsContent } from "./components/card-details/content";
import { CardDetailsDialog } from "./components/card-details/dialog";
import { CardGridItem } from "./components/card-grid-item/content";
import { CardImageDisplay } from "./components/card-grid-item/image-display";
import { DeckCharacterPickerDialog } from "./components/character-picker-dialog";
import { StatsQuickFilterAdornment } from "./components/stats-quick-filter-adornment";
import { SymbolBadge } from "./components/symbol-icon/symbol-badge";
import { SymbolIcon } from "./components/symbol-icon/symbol-icon";
import { getSymbolPath } from "./components/symbol-icon/utils";
import {
  formatUniversusCardType,
  getCardTypeChipColor,
  getKeywordTimingColor,
  getSymbolColor,
} from "./config";
import { UVS_DECK_STATS_PALETTE } from "./deck-stats";

/** UVS implementation of the client UI contract (`ClientGameModule.ui`). Static: identities never change. */
export const UVS_CLIENT_UI = {
  CardDetailsDialog,
  CardDetailsContent,
  CardGridItem,
  CardImageDisplay,
  SymbolIcon,
  SymbolBadge,
  getSymbolPath,
  getSymbolColor,
  SetupCardPickerDialog: DeckCharacterPickerDialog,
  StatsQuickFilterAdornment,
  getCardTypeColor: getCardTypeChipColor,
  getKeywordColor: getKeywordTimingColor,
  formatCardType: formatUniversusCardType,
  deckStats: UVS_DECK_STATS_PALETTE,
} as const satisfies ClientGameUi;
