const ALLOWED_PREFIXES = ["cards/", "catalog/"] as const;

export function assertAllowedR2ObjectKey(key: string): void {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("Invalid R2 object key");
  }
  if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    throw new Error("R2 object key must start with an allowed prefix");
  }
}
