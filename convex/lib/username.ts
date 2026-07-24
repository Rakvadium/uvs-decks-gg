const USERNAME_MAX = 20;

export function normalizeUsernameInput(raw: string): string {
  return raw.trim();
}

export function assertValidUsername(username: string): void {
  if (username.length < 1) {
    throw new Error("Username is required");
  }
  if (username.length > USERNAME_MAX) {
    throw new Error("Username too long");
  }
}
