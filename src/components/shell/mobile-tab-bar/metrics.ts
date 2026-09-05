import type { CSSProperties } from "react";

export type MobilePeekSide = "start" | "end";

export const MOBILE_PEEK_SIDE: MobilePeekSide = "start";

export type MobilePeekPlacement = "row" | "tabs" | "act";

export const MOBILE_PEEK_PLACEMENT: MobilePeekPlacement = "act";

export const MOBILE_NAV_ROW_HEIGHT_CLASS = "h-11";

const PLACEMENT_METRICS: Record<MobilePeekPlacement, { tabWidth: number; actSize: number }> = {
  row: { tabWidth: 48, actSize: 44 },
  tabs: { tabWidth: 42, actSize: 44 },
  act: { tabWidth: 44, actSize: 42 },
};

export const MOBILE_TAB_METRICS = {
  rowHeight: 48,
  tabWidth: PLACEMENT_METRICS[MOBILE_PEEK_PLACEMENT].tabWidth,
  actSize: PLACEMENT_METRICS[MOBILE_PEEK_PLACEMENT].actSize,
  iconSize: 20,
  rowGap: 8,
} as const;

export const MOBILE_TAB_METRIC_VARS = {
  "--mobile-tab-row-h": `${MOBILE_TAB_METRICS.rowHeight}px`,
  "--mobile-tab-item-w": `${MOBILE_TAB_METRICS.tabWidth}px`,
  "--mobile-tab-act-size": `${MOBILE_TAB_METRICS.actSize}px`,
  "--mobile-tab-icon": `${MOBILE_TAB_METRICS.iconSize}px`,
  "--mobile-tab-row-gap": `${MOBILE_TAB_METRICS.rowGap}px`,
} as CSSProperties;

export const MOBILE_TAB_ROW_HEIGHT_CLASS = "h-[var(--mobile-tab-row-h)]";
export const MOBILE_TAB_ROW_SQUARE_CLASS = "size-[var(--mobile-tab-row-h)]";
export const MOBILE_TAB_ITEM_WIDTH_CLASS = "w-[var(--mobile-tab-item-w)]";
export const MOBILE_TAB_ACT_SIZE_CLASS = "size-[var(--mobile-tab-act-size)]";
export const MOBILE_TAB_ICON_CLASS = "size-[var(--mobile-tab-icon)]";
