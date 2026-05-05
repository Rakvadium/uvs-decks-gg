import type { Doc } from "../_generated/dataModel";

export const ACCOUNT_STATUSES = [
  "active",
  "suspended",
  "banned",
  "write_restricted",
] as const;
export type AccountStatusValue = (typeof ACCOUNT_STATUSES)[number];

export function effectiveAccountStatus(
  user: Doc<"users">,
  at: number
): AccountStatusValue {
  const raw = (user.accountStatus ?? "active") as AccountStatusValue;
  if (user.statusExpiresAt !== undefined && user.statusExpiresAt <= at) {
    return "active";
  }
  return raw;
}

export function isDocAccountActiveForQuery(user: Doc<"users">): boolean {
  const s = (user.accountStatus ?? "active") as AccountStatusValue;
  if (s === "banned" || s === "suspended" || s === "write_restricted") {
    return false;
  }
  return true;
}

export function userCanPostContent(status: AccountStatusValue): boolean {
  return status === "active";
}

export function userCanUpdateProfile(status: AccountStatusValue): boolean {
  return status === "active" || status === "write_restricted";
}

export function isAdminRole(role: string | undefined): boolean {
  return role === "Admin";
}

export function buildAdminSearchText(
  u: Pick<Doc<"users">, "username" | "email" | "_id">
) {
  const parts = [u._id, u.username, u.email].filter(Boolean) as string[];
  return parts.join(" ").toLowerCase();
}
