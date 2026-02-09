"use client";

export function isRefreshTokenParseError(error: unknown): boolean {
  if (typeof error === "string") {
    return error.includes("Can't parse refresh token");
  }
  if (error instanceof Error) {
    return error.message.includes("Can't parse refresh token");
  }
  return false;
}

export async function clearAuthCookies(): Promise<void> {
  await fetch("/api/auth/clear", {
    method: "POST",
    credentials: "include",
  });
}
