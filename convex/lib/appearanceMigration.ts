export const LEGACY_COLOR_SCHEME_CHROME_MAP: Record<
  string,
  "calm" | "expressive"
> = {
  default: "calm",
  "calm-storm": "calm",
  cyberpunk: "expressive",
  bubblegum: "expressive",
  "cotton-candy": "expressive",
  caffeine: "expressive",
  darkmatter: "expressive",
  holoterminal: "expressive",
};

const COLOR_PRESET_IDS = [
  "default",
  "calm-storm",
  "cyberpunk",
  "cotton-candy",
  "caffeine",
  "aurora",
  "sorbet",
  "singularity",
] as const;

type ColorPresetId = (typeof COLOR_PRESET_IDS)[number];

export function coerceColorPresetId(slug: string): ColorPresetId {
  return (COLOR_PRESET_IDS as readonly string[]).includes(slug)
    ? (slug as ColorPresetId)
    : "default";
}

export function legacyColorSchemeToPreset(colorScheme: string): ColorPresetId {
  switch (colorScheme) {
    case "holoterminal":
      return "aurora";
    case "bubblegum":
      return "sorbet";
    case "darkmatter":
      return "singularity";
    default:
      return coerceColorPresetId(colorScheme);
  }
}

export type ChromeVariant =
  | "calm"
  | "expressive"
  | "holoterminal"
  | "bubblegum"
  | "darkmatter";

export function migrateLegacySessionFields(input: {
  colorScheme?: string;
  chromePreference?: string;
}): {
  chrome: ChromeVariant;
  colorSource: { kind: "preset"; preset: ColorPresetId };
} {
  if (!input.colorScheme && !input.chromePreference) {
    return {
      chrome: "calm",
      colorSource: { kind: "preset", preset: "default" },
    };
  }

  const rawScheme = input.colorScheme ?? "holoterminal";
  const preset = legacyColorSchemeToPreset(rawScheme);

  let chrome: ChromeVariant;

  const pref = input.chromePreference;
  if (pref === "calm" || pref === "expressive") {
    chrome = pref;
  } else if (
    rawScheme === "holoterminal" ||
    rawScheme === "bubblegum" ||
    rawScheme === "darkmatter"
  ) {
    chrome = rawScheme as ChromeVariant;
  } else {
    const fromMap =
      LEGACY_COLOR_SCHEME_CHROME_MAP[rawScheme] ?? LEGACY_COLOR_SCHEME_CHROME_MAP.default;
    chrome = fromMap === "expressive" ? "expressive" : "calm";
  }

  return {
    chrome,
    colorSource: { kind: "preset" as const, preset },
  };
}
