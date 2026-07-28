export type SizzleStageId =
  | "open"
  | "gallery"
  | "decks"
  | "collection"
  | "community"
  | "teams"
  | "close";

export type SizzleBeat = {
  id: SizzleStageId;
  kicker: string;
  title: string;
  line: string;
  ctaHref?: string;
  ctaLabel?: string;
  durationMs: number;
};
