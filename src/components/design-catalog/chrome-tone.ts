/**
 * The catalog's own controls (header, chapter actions), never its specimens, keep their text on
 * `foreground`. The page can be pinned to any preset, and some primaries are light: on calm-storm
 * and cotton-candy light, `text-primary` is about 2–3:1 against the page. Specimens still show
 * every primitive exactly as it ships.
 */
export const NEUTRAL_OUTLINE = "text-foreground hover:text-foreground";

/** Same idea for a SegmentedControl's active item (`itemClassName`). */
export const NEUTRAL_SEGMENT = "data-[state=on]:text-foreground";
