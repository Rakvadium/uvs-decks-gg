export const AVATAR_SYMBOLS = [
  { id: "fire", name: "Fire", path: "/universus/symbols/fire.png" },
  { id: "water", name: "Water", path: "/universus/symbols/water.png" },
  { id: "earth", name: "Earth", path: "/universus/symbols/earth.png" },
  { id: "air", name: "Air", path: "/universus/symbols/air.png" },
  { id: "life", name: "Life", path: "/universus/symbols/life.png" },
  { id: "death", name: "Death", path: "/universus/symbols/death.png" },
  { id: "order", name: "Order", path: "/universus/symbols/order.png" },
  { id: "chaos", name: "Chaos", path: "/universus/symbols/chaos.png" },
  { id: "good", name: "Good", path: "/universus/symbols/good.png" },
  { id: "evil", name: "Evil", path: "/universus/symbols/evil.png" },
  { id: "void", name: "Void", path: "/universus/symbols/void.png" },
  { id: "all", name: "All", path: "/universus/symbols/all.png" },
] as const;

export type AvatarSymbol = (typeof AVATAR_SYMBOLS)[number];

export function normalizeAvatarImagePath(image: string | null | undefined): string {
  if (!image) return "";
  const trimmed = image.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).pathname;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export function avatarInitialFromUsername(username: string | null | undefined): string {
  const trimmed = username?.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function isAvatarSymbolPath(image: string | null | undefined): boolean {
  const path = normalizeAvatarImagePath(image);
  if (!path) return false;
  return AVATAR_SYMBOLS.some((symbol) => symbol.path === path);
}
