export const USERNAME_MAX = 20;

const FORBIDDEN_CHARACTERS = /[\p{Cc}\u200B-\u200D\uFEFF]/u;

export function validateUsername(raw: string): string | null {
  const username = raw.trim();
  if (username.length === 0) return "Username is required";
  if (username.length > USERNAME_MAX) return `Username must be ${USERNAME_MAX} characters or fewer`;
  if (FORBIDDEN_CHARACTERS.test(username)) return "Username cannot contain control or zero-width characters";
  return null;
}
