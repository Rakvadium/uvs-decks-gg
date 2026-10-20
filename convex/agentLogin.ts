/**
 * One-time agent login codes for local validation backends (scripts/validation/).
 *
 * `bun run agent:login-url` mints a code through the guarded wrapper; the browser redeems it once
 * through the `agent-code` ConvexCredentials provider (convex/auth.ts). Both functions are
 * internal and refuse to run unless `isValidationBackend()`, so none of this works on a cloud
 * deployment. Only the SHA-256 of a code is stored.
 */
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { buildAdminSearchText } from "./lib/accountStatus";
import { RESERVED_AGENT_EMAIL_DOMAIN } from "./lib/reservedIdentity";
import { assertValidationBackend } from "./lib/validationBackend";

export const AGENT_LOGIN_CODE_TTL_MS = 60_000;
export const DEFAULT_AGENT_PERSONA = "agent";

/** 32 random bytes as unpadded base64url. */
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** Lowercase, 1-20 chars (a valid username), no leading/trailing hyphen. */
const PERSONA_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,18}[a-z0-9])?$/;
const PRUNE_BATCH = 100;

export function normalizeAgentPersona(raw: unknown): string {
  const persona = raw === undefined ? DEFAULT_AGENT_PERSONA : typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!PERSONA_PATTERN.test(persona)) {
    throw new ConvexError("Invalid persona: use 1-20 of a-z, 0-9 and inner hyphens.");
  }
  return persona;
}

export function agentPersonaEmail(persona: string): string {
  return `${persona}@${RESERVED_AGENT_EMAIL_DOMAIN}`;
}

/** Exactly `<persona>@validation.invalid` (no subdomains, no legacy agent addresses). */
export function isAgentPersonaEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const suffix = `@${RESERVED_AGENT_EMAIL_DOMAIN}`;
  return email.endsWith(suffix) && PERSONA_PATTERN.test(email.slice(0, -suffix.length));
}

export function isAgentLoginCode(value: unknown): value is string {
  return typeof value === "string" && CODE_PATTERN.test(value);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomAgentLoginCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function upsertPersonaUser(ctx: MutationCtx, persona: string): Promise<Id<"users">> {
  const email = agentPersonaEmail(persona);
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
  if (existing) {
    // Role is always forced empty, whatever happened to the account since the last mint.
    if (existing.role !== undefined) await ctx.db.patch(existing._id, { role: undefined });
    return existing._id;
  }
  const taken = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", persona))
    .first();
  if (taken) {
    throw new ConvexError(`Username "${persona}" belongs to another account; pick another persona.`);
  }
  const userId = await ctx.db.insert("users", { email, username: persona, hasVerifiedEmail: false });
  await ctx.db.patch(userId, { adminSearchText: buildAdminSearchText({ _id: userId, email, username: persona }) });
  return userId;
}

/** Usable by the `agent-code` provider only if still reserved, persona-shaped and role-less. */
function isLoginableAgentUser(user: Doc<"users"> | null, expectedEmail: string): boolean {
  return (
    user !== null &&
    user.email === expectedEmail &&
    isAgentPersonaEmail(user.email) &&
    (user.role === undefined || user.role === "")
  );
}

/**
 * Upsert the reserved user `<persona>@validation.invalid` (role forced empty) and store a new
 * single-use code for it, valid for 60 seconds. Returns the code; only its hash is stored.
 */
export const mintCode = internalMutation({
  args: { persona: v.optional(v.string()) },
  returns: v.object({ code: v.string(), email: v.string(), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    assertValidationBackend();
    const persona = normalizeAgentPersona(args.persona);
    const userId = await upsertPersonaUser(ctx, persona);
    const now = Date.now();

    const expired = await ctx.db
      .query("agentLoginCodes")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", now))
      .take(PRUNE_BATCH);
    for (const row of expired) await ctx.db.delete(row._id);

    const code = randomAgentLoginCode();
    const email = agentPersonaEmail(persona);
    const expiresAt = now + AGENT_LOGIN_CODE_TTL_MS;
    await ctx.db.insert("agentLoginCodes", { codeHash: await sha256Hex(code), userId, email, expiresAt });
    return { code, email, expiresAt };
  },
});

/**
 * Redeem a code. Any code that matches a stored hash is deleted before it is checked, so it is
 * single use and an expired code, or one whose user is no longer the reserved persona it was
 * minted for, is burned too. Returns the user id or null.
 */
export const consume = internalMutation({
  args: { code: v.string() },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    assertValidationBackend();
    if (!isAgentLoginCode(args.code)) return null;
    const codeHash = await sha256Hex(args.code);
    const record = await ctx.db
      .query("agentLoginCodes")
      .withIndex("by_codeHash", (q) => q.eq("codeHash", codeHash))
      .first();
    if (!record) return null;
    await ctx.db.delete(record._id);
    if (record.expiresAt <= Date.now()) return null;
    const user = await ctx.db.get(record.userId);
    return isLoginableAgentUser(user, record.email) ? record.userId : null;
  },
});
