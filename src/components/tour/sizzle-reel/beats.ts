import type { SizzleBeat } from "./types";

export const SIZZLE_BEATS: SizzleBeat[] = [
  {
    id: "open",
    kicker: "UVSDECKS.GG",
    title: "Build the meta.",
    line: "A fast UniVersus toolkit for cards, decks, and community signal.",
    durationMs: 4200,
  },
  {
    id: "gallery",
    kicker: "Card Gallery",
    title: "Every card. Instantly.",
    line: "Search, filter, and inspect the full catalog without leaving flow.",
    ctaHref: "/gallery",
    ctaLabel: "Open Gallery",
    durationMs: 4800,
  },
  {
    id: "decks",
    kicker: "Deck Builder",
    title: "Main. Side. Reference.",
    line: "Iterate lists with clear zones, formats, and shareable visibility.",
    ctaHref: "/decks",
    ctaLabel: "Open Decks",
    durationMs: 4800,
  },
  {
    id: "collection",
    kicker: "Collection",
    title: "Know what you own.",
    line: "Track quantities against the catalog so builds stay grounded.",
    ctaHref: "/collection",
    ctaLabel: "Open Collection",
    durationMs: 4200,
  },
  {
    id: "community",
    kicker: "Community",
    title: "Tier lists that explain.",
    line: "Publish rankings, browse the meta, and keep the signal readable.",
    ctaHref: "/community",
    ctaLabel: "Open Community",
    durationMs: 4800,
  },
  {
    id: "teams",
    kicker: "Teams",
    title: "Build together.",
    line: "Shared decks, announcements, and a workspace for your crew.",
    ctaHref: "/teams",
    ctaLabel: "Open Teams",
    durationMs: 4200,
  },
  {
    id: "close",
    kicker: "Ready",
    title: "Your next list starts here.",
    line: "Jump into the gallery or explore what the community is playing.",
    ctaHref: "/gallery",
    ctaLabel: "Start in Gallery",
    durationMs: 5600,
  },
];

export const SIZZLE_TOTAL_MS = SIZZLE_BEATS.reduce((sum, beat) => sum + beat.durationMs, 0);
