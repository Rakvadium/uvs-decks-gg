import type { ClientGameUi } from "../types";
import { CardDetailsContent } from "./components/card-details/content";
import { CardDetailsDialog } from "./components/card-details/dialog";
import { CardGridItem } from "./components/card-grid-item/content";
import { CardImageDisplay } from "./components/card-grid-item/image-display";
import { StartingCharacterButton } from "./components/card-details/starting-character-button";
import { UvsDeckSetupPanel, UvsSetupCardPickerDialog } from "./components/deck-setup/panel";
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
import { UVS_DECK_SETUP_HELPERS } from "./deck-setup";
import { UVS_DECK_STATS_CHARTS, UVS_DECK_STATS_PALETTE } from "./deck-stats";

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
  DeckSetupPanel: UvsDeckSetupPanel,
  SetupCardPickerDialog: UvsSetupCardPickerDialog,
  CardSetupAction: StartingCharacterButton,
  deckSetup: UVS_DECK_SETUP_HELPERS,
  StatsQuickFilterAdornment,
  getCardTypeColor: getCardTypeChipColor,
  getKeywordColor: getKeywordTimingColor,
  formatCardType: formatUniversusCardType,
  deckStats: UVS_DECK_STATS_PALETTE,
  deckStatsCharts: UVS_DECK_STATS_CHARTS,
} as const satisfies ClientGameUi;
