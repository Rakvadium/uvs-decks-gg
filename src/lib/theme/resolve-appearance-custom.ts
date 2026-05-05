import type { AppearanceCustom, ChromeVariant } from "./appearance-types";

export function resolveAppearanceCustomPair(
  custom: AppearanceCustom,
  chrome: ChromeVariant,
): {
  light: { primary: string; secondary: string };
  dark: { primary: string; secondary: string };
} {
  const scoped = custom.byChrome?.[chrome];
  return {
    light: scoped?.light ?? custom.fallback.light,
    dark: scoped?.dark ?? custom.fallback.dark,
  };
}
