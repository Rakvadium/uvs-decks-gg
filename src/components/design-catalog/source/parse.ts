/**
 * Pure parsers for the design-system CSS sources. `read.ts` feeds them the real files on the
 * server, and the tests feed them the same files, so the catalog tables can't drift from CSS.
 */

export const LADDER_TONES = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "info",
  "destructive",
] as const;
export type LadderTone = (typeof LADDER_TONES)[number];

export const SURFACE_BASES = ["card", "background", "muted", "popover"] as const;
export type SurfaceBase = (typeof SURFACE_BASES)[number];

export interface LadderUtility {
  /** Utility class name, e.g. `bg-primary-wash`. */
  name: string;
  /** What it aliases: the `@apply` class (`bg-primary/10`) or the raw declaration (`z-index: 30`). */
  alias: string;
}

export interface ToneStep extends LadderUtility {
  property: "bg" | "border" | "ring";
  step: string;
}

export interface SurfaceStep extends LadderUtility {
  step: string;
}

export interface ZIndexStep extends LadderUtility {
  value: number;
}

export interface LadderSource {
  /** Every `@utility` in source order. */
  utilities: LadderUtility[];
  tones: { tone: LadderTone; steps: ToneStep[] }[];
  borders: (LadderUtility & { step: string })[];
  surfaces: { base: SurfaceBase; steps: SurfaceStep[] }[];
  zIndex: ZIndexStep[];
  /** Utilities that matched none of the ladders above (a new ladder the catalog doesn't know). */
  unclassified: LadderUtility[];
}

const UTILITY_RE = /@utility\s+([a-z0-9-]+)\s*\{([^}]*)\}/g;

function aliasOf(body: string): string {
  const trimmed = body.trim().replace(/;$/, "").trim();
  const apply = /^@apply\s+(.+)$/.exec(trimmed);
  return apply ? apply[1].trim() : trimmed;
}

export function parseLadders(css: string): LadderSource {
  const utilities: LadderUtility[] = [];
  for (const match of css.matchAll(UTILITY_RE)) {
    utilities.push({ name: match[1], alias: aliasOf(match[2]) });
  }

  const toneRe = new RegExp(`^(bg|border|ring)-(${LADDER_TONES.join("|")})-([a-z]+)$`);
  const surfaceRe = new RegExp(`^bg-(${SURFACE_BASES.join("|")})-([a-z]+)$`);
  const borderRe = /^border-(hairline|divider|surface|placeholder)$/;
  const zRe = /^z-[a-z-]+$/;

  const tones = LADDER_TONES.map((tone) => ({ tone, steps: [] as ToneStep[] }));
  const surfaces = SURFACE_BASES.map((base) => ({ base, steps: [] as SurfaceStep[] }));
  const borders: LadderSource["borders"] = [];
  const zIndex: ZIndexStep[] = [];
  const unclassified: LadderUtility[] = [];

  for (const utility of utilities) {
    const tone = toneRe.exec(utility.name);
    if (tone) {
      tones
        .find((row) => row.tone === tone[2])!
        .steps.push({ ...utility, property: tone[1] as ToneStep["property"], step: tone[3] });
      continue;
    }
    const surface = surfaceRe.exec(utility.name);
    if (surface) {
      surfaces.find((row) => row.base === surface[1])!.steps.push({ ...utility, step: surface[2] });
      continue;
    }
    const border = borderRe.exec(utility.name);
    if (border) {
      borders.push({ ...utility, step: border[1] });
      continue;
    }
    if (zRe.test(utility.name)) {
      const value = /z-index:\s*(\d+)/.exec(utility.alias);
      if (value) {
        zIndex.push({ ...utility, value: Number(value[1]) });
        continue;
      }
    }
    unclassified.push(utility);
  }

  return { utilities, tones, borders, surfaces, zIndex, unclassified };
}

/** Custom property names declared anywhere in `css`, in first-seen order. */
export function parseCustomPropertyNames(css: string): string[] {
  const names = new Set<string>();
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of withoutComments.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    names.add(match[1]);
  }
  return [...names];
}

/** Custom property names declared in the first block whose selector is exactly `selector`. */
export function parseBlockPropertyNames(css: string, selector: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(withoutComments);
  return block ? parseCustomPropertyNames(block[1]) : [];
}
