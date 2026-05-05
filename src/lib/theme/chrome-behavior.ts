import type { ChromeVariant } from "@/lib/theme/appearance-types";

export function chromeHasNeonChrome(chrome: ChromeVariant): boolean {
  return chrome === "expressive" || chrome === "holoterminal";
}

export function chromeUsesScanlines(chrome: ChromeVariant): boolean {
  return chrome === "expressive" || chrome === "holoterminal";
}
