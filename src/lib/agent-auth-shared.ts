export function sanitizeAgentLoginNextPath(next: unknown): string {
  if (typeof next !== "string") return "/home";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return "/home";
  }
  return trimmed;
}
