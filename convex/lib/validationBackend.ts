/**
 * Gate for code that must only ever run on a throwaway local validation backend
 * (see scripts/validation/). Cloud deployments are `https://*.convex.cloud`, so a
 * loopback `CONVEX_CLOUD_URL` plus the explicit flag is required.
 */
import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const IPV4_LOOPBACK = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export function isLoopbackUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return LOOPBACK_HOSTS.has(host) || IPV4_LOOPBACK.test(host);
}

type Env = Record<string, string | undefined>;

export function isValidationBackend(env: Env = process.env): boolean {
  return env.UVS_VALIDATION_BACKEND === "1" && isLoopbackUrl(env.CONVEX_CLOUD_URL);
}

export function assertValidationBackend(env: Env = process.env): void {
  if (!isValidationBackend(env)) {
    throw new Error(
      "Refusing: this function only runs on a local validation backend (UVS_VALIDATION_BACKEND=1 and a loopback CONVEX_CLOUD_URL).",
    );
  }
}

/**
 * Readiness probe for scripts/validation/backend.ts (`vconvex run lib/validationBackend:status`).
 * Internal, so it isn't callable from clients; on a cloud deployment it just returns false.
 */
export const status = internalQuery({
  args: {},
  returns: v.object({ validationBackend: v.boolean() }),
  handler: async () => ({ validationBackend: isValidationBackend() }),
});
