/**
 * Per-route chrome for the Menu mobile layout.
 *
 * - `panelSlots`: which `right-sidebar` slots the action menu offers as panels. `"all"` keeps every
 *   registered slot; `"none"` hides them (the page's direct actions still show).
 * - `headerTools`: the top-right pill for searching, filtering and sorting. `portal` means the page
 *   renders it through `MobileChromePortal target="header-tools"`.
 */
export type MobileLayoutHeaderTools = "gallery" | "decks" | "tier-lists" | "portal" | "none";

export interface MobileLayoutRoute {
  id: "gallery" | "decks" | "deck-details" | "community" | "teams" | "other";
  panelSlots: "all" | "none" | string[];
  headerTools: MobileLayoutHeaderTools;
}

const GALLERY: MobileLayoutRoute = { id: "gallery", panelSlots: "all", headerTools: "gallery" };
const DECKS: MobileLayoutRoute = { id: "decks", panelSlots: "none", headerTools: "decks" };
const DECK_DETAILS: MobileLayoutRoute = { id: "deck-details", panelSlots: "all", headerTools: "portal" };
const COMMUNITY: MobileLayoutRoute = { id: "community", panelSlots: "none", headerTools: "none" };
const TIER_LISTS: MobileLayoutRoute = { ...COMMUNITY, headerTools: "tier-lists" };
const TEAMS: MobileLayoutRoute = { id: "teams", panelSlots: "all", headerTools: "none" };
const OTHER: MobileLayoutRoute = { id: "other", panelSlots: "all", headerTools: "none" };

export function resolveMobileLayoutRoute(pathname: string): MobileLayoutRoute {
  if (/^\/gallery(\/|$)/.test(pathname)) return GALLERY;
  if (/^\/decks\/?$/.test(pathname)) return DECKS;
  if (/^\/decks\/[^/]+/.test(pathname)) return DECK_DETAILS;
  if (/^\/community\/tier-lists\/?$/.test(pathname)) return TIER_LISTS;
  if (/^\/community(\/|$)/.test(pathname)) return COMMUNITY;
  if (/^\/teams(\/|$)/.test(pathname)) return TEAMS;
  return OTHER;
}

export function filterPanelSlots<T extends { id: string }>(slots: T[], rule: MobileLayoutRoute["panelSlots"]): T[] {
  if (rule === "all") return slots;
  if (rule === "none") return [];
  return slots.filter((slot) => rule.includes(slot.id));
}
