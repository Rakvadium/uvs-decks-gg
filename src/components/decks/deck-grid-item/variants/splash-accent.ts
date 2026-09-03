import type { CSSProperties } from "react";

export interface SymbolAccent {
  hue: number;
  saturation: number;
  lightness: number;
}

const SYMBOL_ACCENTS: Record<string, SymbolAccent> = {
  air: { hue: 192, saturation: 62, lightness: 52 },
  all: { hue: 38, saturation: 12, lightness: 58 },
  chaos: { hue: 286, saturation: 58, lightness: 50 },
  death: { hue: 262, saturation: 18, lightness: 34 },
  earth: { hue: 28, saturation: 48, lightness: 40 },
  evil: { hue: 322, saturation: 58, lightness: 42 },
  fire: { hue: 12, saturation: 82, lightness: 50 },
  good: { hue: 44, saturation: 84, lightness: 54 },
  life: { hue: 122, saturation: 48, lightness: 42 },
  order: { hue: 216, saturation: 66, lightness: 52 },
  void: { hue: 256, saturation: 50, lightness: 48 },
  water: { hue: 202, saturation: 76, lightness: 46 },
};

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function symbolAccentFor(symbol: string | null, fallbackSeed: string): SymbolAccent {
  if (symbol) {
    const accent = SYMBOL_ACCENTS[symbol];
    if (accent) return accent;
  }
  return { hue: hashString(fallbackSeed) % 360, saturation: 40, lightness: 46 };
}

export function accentCssVars(accent: SymbolAccent) {
  return {
    "--accent-h": `${accent.hue}`,
    "--accent-s": `${accent.saturation}%`,
    "--accent-l": `${accent.lightness}%`,
  } as CSSProperties;
}
