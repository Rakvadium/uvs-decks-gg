/**
 * Design-system class classifier (docs/UI_UX_DESIGN.md). Pure: one Tailwind class token in,
 * one finding (or null) out. Shared by the ESLint rules and the codemod, so both agree on what
 * is drift and on which rewrites are mechanical.
 *
 * Names come only from the doc's "Named utilities" table (src/styles/system/ladders.css).
 */

export const TONES = ["primary", "secondary", "accent", "success", "warning", "info", "destructive"];
export const BASES = ["card", "background", "popover", "muted"];

/** Tone ladder: opacity step -> name suffix, per property. */
const TONE_STEPS = {
  bg: { 10: "wash", 20: "selected", 90: "dim" },
  border: { 40: "soft", 60: "strong" },
  ring: { 40: "soft", 60: "strong" },
};

/** Doc § Snapping legacy values: the listed off-ladder tone opacities and their step. */
const TONE_SNAPS = {
  bg: { 5: 10, 8: 10, 15: 20, 25: 20, 30: 20, 50: 20, 70: 90, 80: 90 },
  border: { 20: 40, 25: 40, 30: 40, 35: 40, 50: 60 },
  ring: { 20: 40, 25: 40, 30: 40, 35: 40, 50: 60 },
};

/** Structural border ladder (`border-border/N`). */
const BORDER_STEPS = { 30: "hairline", 40: "divider", 50: "surface", 80: "placeholder" };

/** Surface opacity ladder (`bg-{base}/N`). */
const SURFACE_STEPS = {
  card: { 30: "tint", 50: "soft", 80: "elevated", 95: "overlay" },
  background: { 30: "tint", 50: "soft", 80: "elevated", 95: "overlay" },
  popover: { 30: "tint", 50: "soft", 80: "elevated", 95: "overlay" },
  muted: { 20: "tint", 50: "soft", 60: "elevated", 80: "overlay" },
};

/** Z-index stack: raw value -> named utility. */
export const Z_NAMES = {
  30: "z-sticky",
  40: "z-shell",
  50: "z-modal",
  60: "z-dialog-float",
  100: "z-chrome",
  200: "z-popover",
  300: "z-select",
  400: "z-nested-overlay",
  410: "z-nested-dialog",
  500: "z-dock",
  600: "z-drag",
};

const HUES =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
const COLOR_PROPS =
  "bg|text|border(?:-[xytrblse])?|ring|ring-offset|outline|divide|from|via|to|fill|stroke|shadow|decoration|accent|caret|placeholder";
const PALETTE_RE = new RegExp(`^(?:${COLOR_PROPS})-(?:${HUES})-(?:50|[1-9]00|950)(?:/\\S+)?$`);
const STATUS_HUE = {
  red: "destructive",
  rose: "destructive",
  orange: "warning",
  amber: "warning",
  yellow: "warning",
  lime: "success",
  green: "success",
  emerald: "success",
  teal: "success",
  cyan: "info",
  sky: "info",
  blue: "info",
  indigo: "info",
};

const TONE_RE = new RegExp(`^(bg|border|ring)-(${TONES.join("|")})/(.+)$`);
const NAMED_TONE_RE = new RegExp(`^(bg|border|ring)-(${TONES.join("|")})-(wash|selected|dim|soft|strong)$`);
const STRUCT_BORDER_RE = /^border-border\/(.+)$/;
const NAMED_BORDER_RE = /^border-(hairline|divider|surface|placeholder)$/;
const SURFACE_RE = new RegExp(`^bg-(${BASES.join("|")})/(.+)$`);
const NAMED_SURFACE_RE = new RegExp(`^bg-(${BASES.join("|")})-(tint|soft|elevated|overlay)$`);

const RADIUS_SIDES = "t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee";
const RADIUS_OFF_RE = new RegExp(`^rounded(-(?:${RADIUS_SIDES}))?(-sm)?$`);
const RADIUS_ARB_RE = new RegExp(`^rounded(-(?:${RADIUS_SIDES}))?-\\[(\\d*\\.?\\d+)(px|rem)\\]$`);
/** Micro geometry (tooltip arrows and the like): arbitrary radii up to this many px are allowed. */
export const MICRO_RADIUS_PX = 2;

const Z_RE = /^z-(?:(\d+)|\[(\d+)\])$/;
const TINY_TEXT_RE = /^text-\[(\d*\.?\d+)(px|rem)\]$/;

/** Rule ids (without the `design/` plugin prefix). */
export const RULES = {
  palette: "no-palette-hue",
  ladder: "ladder-opacity",
  radius: "radius-ladder",
  transition: "no-transition-all",
  typography: "chrome-typography",
  zIndex: "named-z-index",
  hslBorder: "no-hsl-border",
};

/**
 * Splits `md:hover:!bg-primary/10` into its variant chain and the bare utility.
 * Colons inside `[...]` / `(...)` (arbitrary variants and values) do not split.
 */
export function parseToken(token) {
  let depth = 0;
  let cut = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === ":" && depth === 0) cut = i + 1;
  }
  const variants = token.slice(0, cut);
  let utility = token.slice(cut);
  let lead = "";
  let trail = "";
  if (utility.startsWith("!")) {
    lead = "!";
    utility = utility.slice(1);
  }
  if (utility.endsWith("!") && utility.length > 1) {
    trail = "!";
    utility = utility.slice(0, -1);
  }
  return { variants, lead, utility, trail };
}

function nearestStep(steps, value) {
  let best = steps[0];
  for (const step of steps) {
    const d = Math.abs(step - value);
    const bd = Math.abs(best - value);
    // Ties round up (doc § Snapping legacy values).
    if (d < bd || (d === bd && step > best)) best = step;
  }
  return best;
}

function parseOpacity(raw) {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

/**
 * Classifies one bare utility (no variants). Returns null for on-system classes, otherwise
 * `{ rule, message, replacement?, family?, step? }`. `replacement` is set only when the rewrite
 * is mechanical; findings without it need human judgment.
 * `family`/`step` let callers detect two states (e.g. base + hover) collapsing onto one name.
 */
export function classifyUtility(utility) {
  if (PALETTE_RE.test(utility)) {
    const hue = utility.match(new RegExp(`-(${HUES})-`))?.[1];
    const tone = hue ? STATUS_HUE[hue] : undefined;
    const hint = tone
      ? `a semantic token such as \`${tone}\``
      : "a semantic token (primary, secondary, accent, success, warning, info, destructive)";
    return {
      rule: RULES.palette,
      message: `Raw palette hue \`${utility}\`. Use ${hint} (UI_UX_DESIGN.md § Status colors); domain colors live in src/config/universus.ts.`,
    };
  }

  let m = utility.match(TONE_RE);
  if (m) {
    const [, prop, tone, rawOpacity] = m;
    const family = `${prop}-${tone}`;
    const n = parseOpacity(rawOpacity);
    const steps = TONE_STEPS[prop];
    if (n !== null && steps[n]) {
      const name = `${family}-${steps[n]}`;
      return { rule: RULES.ladder, message: `Use \`${name}\` (named alias of \`${utility}\`).`, replacement: name, family, step: n, exact: true };
    }
    const snapped = n !== null ? TONE_SNAPS[prop][n] : undefined;
    if (snapped) {
      const name = `${family}-${steps[snapped]}`;
      return {
        rule: RULES.ladder,
        message: `\`${utility}\` is off the tone ladder. Snap to \`${name}\` (/${snapped}).`,
        replacement: name,
        family,
        step: snapped,
      };
    }
    const hintStep = n !== null ? nearestStep(Object.keys(steps).map(Number), n) : null;
    const hint = hintStep !== null ? ` Nearest step: \`${family}-${steps[hintStep]}\` (/${hintStep}); confirm the role.` : "";
    return {
      rule: RULES.ladder,
      message: `\`${utility}\` is off the tone ladder (${Object.keys(steps).map((s) => `/${s}`).join(" ")}).${hint}`,
    };
  }

  m = utility.match(STRUCT_BORDER_RE);
  if (m) {
    const n = parseOpacity(m[1]);
    const family = "border-structural";
    if (n !== null && BORDER_STEPS[n]) {
      const name = `border-${BORDER_STEPS[n]}`;
      return { rule: RULES.ladder, message: `Use \`${name}\` (named alias of \`${utility}\`).`, replacement: name, family, step: n, exact: true };
    }
    const steps = Object.keys(BORDER_STEPS).map(Number);
    const snapped = n !== null ? nearestStep(steps, n) : null;
    // Mechanical only inside the ladder range, without lowering contrast, and never onto the
    // role-specific dashed placeholder step.
    if (n !== null && snapped !== null && n > steps[0] && n < steps[steps.length - 1] && snapped >= n && snapped !== 80) {
      const name = `border-${BORDER_STEPS[snapped]}`;
      return {
        rule: RULES.ladder,
        message: `\`${utility}\` is off the border ladder. Snap to \`${name}\` (/${snapped}).`,
        replacement: name,
        family,
        step: snapped,
      };
    }
    const hint = snapped !== null ? ` Nearest step: \`border-${BORDER_STEPS[snapped]}\` (/${snapped}); pick the step that keeps contrast.` : "";
    return {
      rule: RULES.ladder,
      message: `\`${utility}\` is off the border ladder (border-hairline /30, -divider /40, -surface /50, -placeholder /80).${hint}`,
    };
  }

  m = utility.match(SURFACE_RE);
  if (m) {
    const [, base, rawOpacity] = m;
    const n = parseOpacity(rawOpacity);
    const ladder = SURFACE_STEPS[base];
    const family = `bg-${base}`;
    if (n !== null && ladder[n]) {
      const name = `${family}-${ladder[n]}`;
      return { rule: RULES.ladder, message: `Use \`${name}\` (named alias of \`${utility}\`).`, replacement: name, family, step: n, exact: true };
    }
    const steps = Object.keys(ladder).map(Number);
    const snapped = n !== null ? nearestStep(steps, n) : null;
    if (n !== null && snapped !== null && n > steps[0] && n < steps[steps.length - 1]) {
      const name = `${family}-${ladder[snapped]}`;
      return {
        rule: RULES.ladder,
        message: `\`${utility}\` is off the surface ladder. Snap to \`${name}\` (/${snapped}).`,
        replacement: name,
        family,
        step: snapped,
      };
    }
    const hint = snapped !== null ? ` Nearest step: \`${family}-${ladder[snapped]}\` (/${snapped}); confirm the role.` : "";
    return {
      rule: RULES.ladder,
      message: `\`${utility}\` is off the surface ladder (${steps.map((s) => `/${s}`).join(" ")}).${hint}`,
    };
  }

  m = utility.match(RADIUS_OFF_RE);
  if (m) {
    const side = m[1] ?? "";
    const name = `rounded${side}-md`;
    return {
      rule: RULES.radius,
      message: `\`${utility}\` is off the radius ladder (bare/sm ignore the chrome --radius). Use \`${name}\`.`,
      replacement: name,
    };
  }

  m = utility.match(RADIUS_ARB_RE);
  if (m) {
    const px = Number(m[2]) * (m[3] === "rem" ? 16 : 1);
    if (px <= MICRO_RADIUS_PX) return null;
    return {
      rule: RULES.radius,
      message: `One-off radius \`${utility}\`. Use the ladder: rounded-md (controls), -lg (cards), -xl, -3xl, -full.`,
    };
  }

  if (utility === "transition-all" || utility === "transition") {
    return {
      rule: RULES.transition,
      message: `\`${utility}\` animates every property. Use transition-colors / -opacity / -transform or an explicit list (UI_UX_DESIGN.md § Motion).`,
    };
  }

  if (utility === "uppercase") {
    return {
      rule: RULES.typography,
      message: "Casing is chrome-owned. Use Kicker / SectionHeading / PageHeading, or chrome-label-case / chrome-heading-case.",
    };
  }
  if (utility.startsWith("tracking-") && utility !== "tracking-tight" && utility !== "tracking-normal") {
    return {
      rule: RULES.typography,
      message: `Tracking is chrome-owned; \`${utility}\` is not allowed at a call site (only tracking-tight on display type, tracking-normal to opt out).`,
    };
  }
  if (utility === "font-mono" || utility === "font-display") {
    return {
      rule: RULES.typography,
      message: `\`${utility}\`: the app ships one typeface (Outfit); the chrome owns font choice.`,
    };
  }
  m = utility.match(TINY_TEXT_RE);
  if (m) {
    const px = Number(m[1]) * (m[2] === "rem" ? 16 : 1);
    if (px >= 7 && px < 10) {
      return {
        rule: RULES.typography,
        message: `\`${utility}\` is below the type ladder. Use Kicker size="meta" (text-[10px]) or text-xs.`,
      };
    }
    return null;
  }

  m = utility.match(Z_RE);
  if (m) {
    const n = Number(m[1] ?? m[2]);
    const name = Z_NAMES[n];
    if (name) {
      return {
        rule: RULES.zIndex,
        message: `Use \`${name}\` instead of raw \`${utility}\` (UI_UX_DESIGN.md § Z-index stack).`,
        replacement: name,
        family: "z",
      };
    }
    return null;
  }

  return null;
}

const HSL_BORDER_RE = /hsl\(\s*var\(\s*--border/;

export const HSL_BORDER_MESSAGE =
  "`hsl(var(--border…))` is invalid: theme borders are oklch. Use `var(--border)` or a named border utility (border-hairline / -divider / -surface / -placeholder).";

/** True when any string in the file builds a color from `hsl(var(--border…`. */
export function hasHslBorder(text) {
  return HSL_BORDER_RE.test(text);
}

/** Ladder family + step of an already-named utility, for collision checks. */
export function namedFamily(utility) {
  let m = utility.match(NAMED_TONE_RE);
  if (m) {
    const steps = TONE_STEPS[m[1]];
    const step = Number(Object.keys(steps).find((k) => steps[k] === m[3]));
    return Number.isNaN(step) ? null : { family: `${m[1]}-${m[2]}`, step };
  }
  m = utility.match(NAMED_BORDER_RE);
  if (m) {
    const step = Number(Object.keys(BORDER_STEPS).find((k) => BORDER_STEPS[k] === m[1]));
    return { family: "border-structural", step };
  }
  m = utility.match(NAMED_SURFACE_RE);
  if (m) {
    const ladder = SURFACE_STEPS[m[1]];
    const step = Number(Object.keys(ladder).find((k) => ladder[k] === m[2]));
    return { family: `bg-${m[1]}`, step };
  }
  return null;
}

/**
 * Classifies every token of one class group (all strings feeding one className / cn() / cva()).
 * `tokens` is `[{ text, ...extra }]`. Returns `[{ token, finding, replacementToken? }]` for drift.
 *
 * Collision guard: when a snap makes two different states of one ladder family (say `bg-primary/15`
 * and `hover:bg-primary/25`) land on the same name, the hover would vanish, so that family's
 * snaps are left for judgment. Exact aliases (`bg-primary/20` -> `bg-primary-selected`) still
 * rewrite: they emit identical CSS.
 */
export function classifyGroup(tokens) {
  const results = [];
  /** family -> [{ variants, original, step }] */
  const families = new Map();
  for (const token of tokens) {
    const parsed = parseToken(token.text);
    const finding = classifyUtility(parsed.utility);
    if (finding?.family && finding.family !== "z") {
      const list = families.get(finding.family) ?? [];
      list.push({ variants: parsed.variants, original: parsed.utility, step: finding.step });
      families.set(finding.family, list);
    } else if (!finding) {
      const named = namedFamily(parsed.utility);
      if (named) {
        const list = families.get(named.family) ?? [];
        list.push({ variants: parsed.variants, original: parsed.utility, step: named.step });
        families.set(named.family, list);
      }
    }
    if (finding) results.push({ token, parsed, finding });
  }

  const collided = new Set();
  for (const [family, list] of families) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.step === b.step && a.original !== b.original && a.variants !== b.variants) collided.add(family);
      }
    }
  }

  return results.map(({ token, parsed, finding }) => {
    if (finding.replacement && !finding.exact && finding.family && collided.has(finding.family)) {
      return {
        token,
        finding: {
          ...finding,
          replacement: undefined,
          message: `${finding.message} Not auto-fixed: another state of \`${finding.family}\` in this class list lands on the same step, so the state change would disappear. Move the hover one step up or change the border instead.`,
        },
      };
    }
    const replacementToken = finding.replacement
      ? `${parsed.variants}${parsed.lead}${finding.replacement}${parsed.trail}`
      : undefined;
    return { token, finding, replacementToken };
  });
}
