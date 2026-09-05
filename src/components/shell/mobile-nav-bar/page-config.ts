export type MobileNavKind =
  | "brand"
  | "section"
  | "child"
  | "deck-details"
  | "tier-list-detail";

export interface MobileNavPageConfig {
  kind: MobileNavKind;
  title: string;
  backHref?: string;
  backLabel?: string;
  showMediaToggle: boolean;
}

const SECTION_TITLES: Array<[RegExp, string]> = [
  [/^\/decks\/?$/, "Decks"],
  [/^\/collection/, "Collection"],
  [/^\/community\/?$/, "Community"],
  [/^\/teams\/?$/, "Teams"],
  [/^\/home/, "Home"],
  [/^\/admin\/?$/, "Admin"],
];

const CHILD_ROUTES: Array<[RegExp, { title: string; backHref: string; backLabel: string }]> = [
  [/^\/community\/tier-lists\/?$/, { title: "Tier Lists", backHref: "/community", backLabel: "Community" }],
  [/^\/community\/rankings/, { title: "Rankings", backHref: "/community", backLabel: "Community" }],
  [/^\/community\/creators/, { title: "Creators", backHref: "/community", backLabel: "Community" }],
  [/^\/teams\/decks/, { title: "Team Decks", backHref: "/teams", backLabel: "Teams" }],
  [/^\/teams\/invite/, { title: "Team Invite", backHref: "/teams", backLabel: "Teams" }],
  [/^\/teams\/[^/]+/, { title: "Team", backHref: "/teams", backLabel: "Teams" }],
  [/^\/settings/, { title: "Settings", backHref: "/gallery", backLabel: "Cards" }],
  [/^\/admin\/.+/, { title: "Admin", backHref: "/admin", backLabel: "Admin" }],
];

export function resolveMobileNavPage(rawPathname: string): MobileNavPageConfig {
  const pathname = rawPathname.split("?")[0] ?? "";

  if (/^\/gallery/.test(pathname)) {
    return { kind: "brand", title: "Cards", showMediaToggle: true };
  }

  if (/^\/decks\/[^/]+/.test(pathname)) {
    return { kind: "deck-details", title: "Deck", backHref: "/decks", backLabel: "Decks", showMediaToggle: false };
  }

  if (/^\/community\/tier-lists\/[^/]+/.test(pathname)) {
    return {
      kind: "tier-list-detail",
      title: "Tier List",
      backHref: "/community/tier-lists",
      backLabel: "Tier lists",
      showMediaToggle: false,
    };
  }

  for (const [pattern, config] of CHILD_ROUTES) {
    if (pattern.test(pathname)) {
      return { kind: "child", ...config, showMediaToggle: false };
    }
  }

  for (const [pattern, title] of SECTION_TITLES) {
    if (pattern.test(pathname)) {
      return { kind: "section", title, showMediaToggle: true };
    }
  }

  return { kind: "brand", title: "UVSDECKS.GG", showMediaToggle: true };
}
