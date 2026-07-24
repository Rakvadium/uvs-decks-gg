import { converter, parse, wcagContrast } from "culori";

const toOklch = converter("oklch");

export type AppearanceMode = "light" | "dark";

type Oklch = {
  mode: "oklch";
  l: number;
  c?: number;
  h?: number;
};

function fmt(c: Oklch) {
  return `oklch(${c.l.toFixed(4)} ${(c.c ?? 0).toFixed(4)} ${(c.h ?? 0).toFixed(2)})`;
}

function shiftL(c: Oklch, dl: number): Oklch {
  return {
    ...c,
    l: Math.min(0.995, Math.max(0, c.l + dl)),
    mode: "oklch",
  };
}

function contrastAgainst(candidate: Oklch, surface: Oklch) {
  return wcagContrast(fmt(candidate), fmt(surface));
}

function pickSignalColor(preferred: Oklch, surface: Oklch, minRatio = 3): Oklch {
  if (contrastAgainst(preferred, surface) >= minRatio) {
    return preferred;
  }

  const surfaceL = surface.l;
  const step = surfaceL >= 0.55 ? -0.04 : 0.04;
  let candidate = preferred;
  for (let i = 0; i < 18; i += 1) {
    candidate = shiftL(candidate, step);
    if (contrastAgainst(candidate, surface) >= minRatio) {
      return candidate;
    }
  }

  const fallback: Oklch = {
    mode: "oklch",
    l: surfaceL >= 0.55 ? 0.36 : 0.84,
    c: Math.min((preferred.c ?? 0) * 0.9, 0.17),
    h: preferred.h ?? 0,
  };
  return contrastAgainst(fallback, surface) >= contrastAgainst(preferred, surface)
    ? fallback
    : preferred;
}

function pickInkOn(signal: Oklch): Oklch {
  const white: Oklch = { mode: "oklch", l: 0.99, c: 0, h: 0 };
  const black: Oklch = { mode: "oklch", l: 0.14, c: 0.02, h: signal.h ?? 0 };
  return contrastAgainst(white, signal) >= contrastAgainst(black, signal) ? white : black;
}

export function buildSemanticCssVars(primaryHex: string, secondaryHex: string, mode: AppearanceMode): Record<string, string> {
  const parsedP = parse(primaryHex.trim());
  const parsedS = parse(secondaryHex.trim());
  const p = parsedP ? toOklch(parsedP) : null;
  const s = parsedS ? toOklch(parsedS) : null;
  if (
    !p ||
    !s ||
    p.mode !== "oklch" ||
    s.mode !== "oklch" ||
    typeof p.l !== "number" ||
    typeof s.l !== "number"
  ) {
    throw new Error("Colors must resolve to OKLCH");
  }

  let background: Oklch;
  let foreground: Oklch;
  let card: Oklch;
  let muted: Oklch;
  let mutedFg: Oklch;
  let borderCol: Oklch;
  let inputCol: Oklch;
  let primaryFg: Oklch;
  let secondaryFg: Oklch;

  if (mode === "light") {
    background = {
      mode: "oklch",
      l: 0.99,
      c: Math.min((p.c ?? 0) * 0.02 + (s.c ?? 0) * 0.01, 0.02),
      h: (p.h ?? s.h ?? 130) ?? 130,
    };
    foreground = shiftL(s, -0.08);
    if (wcagContrast(fmt(p), fmt(foreground)) < 4.5 && (p.l ?? 0) < 0.75) {
      primaryFg = { mode: "oklch", l: 0.99, c: 0, h: 0 };
    } else if (wcagContrast(fmt(p), "#ffffff") >= wcagContrast(fmt(p), "#0a0a0a")) {
      primaryFg = { mode: "oklch", l: 0.99, c: 0, h: 0 };
    } else {
      primaryFg = {
        mode: "oklch",
        l: 0.12,
        c: 0.02,
        h: foreground.h ?? 130,
      };
    }
    card = {
      mode: "oklch",
      l: Math.min(background.l + 0.015, 1),
      c: Math.max((background.c ?? 0) * 1.05, 0),
      h: background.h,
    };
    muted = shiftL(s, 0.55);
    mutedFg = shiftL(foreground, -0.12);
    borderCol = shiftL(background, -0.06);
    inputCol = borderCol;
    secondaryFg =
      s.l > 0.62
        ? shiftL(s, -0.42)
        : { mode: "oklch", l: 0.985, c: Math.min((s.c ?? 0) * 0.06, 0.02), h: s.h ?? 90 };
    const sidebar = shiftL(background, -0.01);
    const accent = pickSignalColor(p, sidebar);
    return {
      "--background": fmt(background),
      "--foreground": fmt(foreground),
      "--card": fmt(card),
      "--card-foreground": fmt(foreground),
      "--popover": fmt(card),
      "--popover-foreground": fmt(foreground),
      "--primary": fmt(p),
      "--primary-foreground": fmt(primaryFg),
      "--secondary": fmt(s),
      "--secondary-foreground": fmt(secondaryFg),
      "--muted": fmt(muted),
      "--muted-foreground": fmt(mutedFg),
      "--accent": fmt(accent),
      "--accent-foreground": fmt(pickInkOn(accent)),
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--destructive-foreground": "oklch(0.985 0 0)",
      "--border": fmt(borderCol),
      "--input": fmt(inputCol),
      "--ring": fmt(p),
      "--chart-1": fmt(p),
      "--chart-2": fmt(s),
      "--chart-3": fmt(shiftL(p, -0.05)),
      "--chart-4": fmt(shiftL(s, 0.05)),
      "--chart-5": fmt(shiftL(p, -0.08)),
      "--sidebar": fmt(sidebar),
      "--sidebar-foreground": fmt(foreground),
      "--sidebar-primary": fmt(p),
      "--sidebar-primary-foreground": fmt(primaryFg),
      "--sidebar-accent": fmt(muted),
      "--sidebar-accent-foreground": fmt(foreground),
      "--sidebar-border": fmt(borderCol),
      "--sidebar-ring": fmt(p),
    };
  }

  background = shiftL(s, -0.12);
  foreground = shiftL(p, 0.22);
  card = shiftL(background, 0.035);
  muted = shiftL(background, 0.065);
  mutedFg = shiftL(foreground, -0.16);
  borderCol = shiftL(background, 0.1);
  inputCol = borderCol;

  const primaryTone = shiftL(p, 0.05);
  const primaryInk = contrastAgainst(primaryTone, shiftL(background, 0.015)) >= 4.5
    ? shiftL(background, 0)
    : {
        mode: "oklch" as const,
        l: 0.12,
        c: Math.min(background.c ?? 0, 0.04),
        h: background.h ?? p.h ?? 145,
      };
  const secondaryInk =
    contrastAgainst(shiftL(s, 0.06), shiftL(background, 0.015)) >= 4.5 ? primaryInk : foreground;
  const sidebar = shiftL(background, 0.02);
  const accent = pickSignalColor(shiftL(p, 0.06), sidebar);

  return {
    "--background": fmt(background),
    "--foreground": fmt(foreground),
    "--card": fmt(card),
    "--card-foreground": fmt(foreground),
    "--popover": fmt(background),
    "--popover-foreground": fmt(foreground),
    "--primary": fmt(primaryTone),
    "--primary-foreground": fmt(primaryInk),
    "--secondary": fmt(shiftL(s, 0.06)),
    "--secondary-foreground": fmt(secondaryInk),
    "--muted": fmt(muted),
    "--muted-foreground": fmt(mutedFg),
    "--accent": fmt(accent),
    "--accent-foreground": fmt(pickInkOn(accent)),
    "--destructive": "oklch(0.62 0.22 25)",
    "--destructive-foreground": "oklch(0.98 0 0)",
    "--border": fmt(borderCol),
    "--input": fmt(inputCol),
    "--ring": fmt(shiftL(p, 0.08)),
    "--chart-1": fmt(shiftL(p, 0.06)),
    "--chart-2": fmt(shiftL(s, 0.06)),
    "--chart-3": fmt(shiftL(p, -0.02)),
    "--chart-4": fmt(shiftL(s, -0.04)),
    "--chart-5": fmt(shiftL(p, -0.06)),
    "--sidebar": fmt(sidebar),
    "--sidebar-foreground": fmt(foreground),
    "--sidebar-primary": fmt(shiftL(p, 0.06)),
    "--sidebar-primary-foreground": fmt(primaryInk),
    "--sidebar-accent": fmt(muted),
    "--sidebar-accent-foreground": fmt(foreground),
    "--sidebar-border": fmt(borderCol),
    "--sidebar-ring": fmt(shiftL(p, 0.06)),
  };
}
