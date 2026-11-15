import { converter, parse } from "culori";

/**
 * Token readouts in one format, whatever build the page runs on. `next dev` hands back the CSS
 * pipeline's output (`lab(…)`, `0px`, `0.625rem`); a minified build keeps the source form
 * (`oklch(14.5% .014 265)`, `0`, `.625rem`). Both print the same here, so dev and preview
 * captures of the catalog match.
 */

const toOklch = converter("oklch");

/** Below this chroma a color reads as grey, and its hue is rounding noise. */
const ACHROMATIC_CHROMA = 0.005;

/**
 * `oklch(L C H)` with L and C to 3 places and H to 1, plus ` / A` when translucent (2 places, so
 * a minifier's 8-bit hex alpha matches). Greys print `0 none`: CSS's own spelling for a powerless
 * hue. Returns null for anything that isn't a color.
 */
export function formatOklch(value: string): string | null {
  if (!value) return null;
  const color = parse(value);
  if (!color) return null;
  const { l, c, h, alpha } = toOklch(color);
  const grey = c < ACHROMATIC_CHROMA || h === undefined;
  const a = alpha !== undefined && alpha < 1 ? ` / ${Number(alpha.toFixed(2))}` : "";
  return `oklch(${l.toFixed(3)} ${grey ? "0" : c.toFixed(3)} ${grey ? "none" : h.toFixed(1)}${a})`;
}

// Innermost color functions (no nested parens) and hex colors.
const COLOR_FN = /\b(?:oklch|oklab|lab|lch|rgba?|hsla?|hwb)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;
// A number with no leading zero (`.5`), not part of a longer number or name.
const BARE_DECIMAL = /(^|[^\w.])\.(\d)/g;
// A zero length (`0px`, `0rem`) on its own.
const ZERO_LENGTH = /(^|[^\w.])0(?:px|rem|em)\b/g;

/** A computed custom-property value (shadow, radius, letter spacing) in the format above. */
export function normalizeCssValue(value: string): string {
  return value
    .replace(COLOR_FN, (match) => formatOklch(match) ?? match)
    .replace(BARE_DECIMAL, "$10.$2")
    .replace(ZERO_LENGTH, "$10")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}
