import { validateUsername } from "../../shared/username";

export function normalizeUsernameInput(raw: string): string {
  return raw.trim();
}

export function assertValidUsername(username: string): void {
  const error = validateUsername(username);
  if (error) {
    throw new Error(error);
  }
}
