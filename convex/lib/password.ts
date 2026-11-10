export const PASSWORD_REQUIREMENTS = "At least 8 characters, including a number.";

export function passwordRequirementError(password: string): string | null {
  if (password.length < 8 || !/\d/.test(password)) {
    return "Password must be at least 8 characters and include a number.";
  }
  return null;
}
