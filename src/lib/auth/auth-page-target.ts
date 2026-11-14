import { getSharedGameModule } from "@shared/games/registry";
import { parseHandoffReturnUrl, sanitizeSameOriginPath } from "@shared/auth-handoff";
import { resolveHost, ROOT_DOMAINS } from "@shared/hosts";

export interface AuthPageTarget {
  /** Sanitized same-origin path to continue to after auth, or null for the default. */
  nextPath: string | null;
  /** The game site a handoff sign-in came from, for "Back to …" and "Continue to …". */
  returnTo: { href: string; label: string } | null;
}

/** Resolve the `next` query param of `/sign-in` and `/sign-up`. */
export function authPageTarget(
  next: string | string[] | undefined,
  roots: readonly string[] = ROOT_DOMAINS,
): AuthPageTarget {
  const nextPath = sanitizeSameOriginPath(next, "") || null;
  return { nextPath, returnTo: handoffReturnTo(nextPath, roots) };
}

function handoffReturnTo(
  nextPath: string | null,
  roots: readonly string[],
): AuthPageTarget["returnTo"] {
  if (!nextPath) return null;
  const url = new URL(nextPath, "http://next.invalid");
  if (url.pathname !== "/auth/handoff") return null;
  const target = parseHandoffReturnUrl(url.searchParams.get("return"), roots);
  if (!target) return null;
  const host = resolveHost(new URL(target.origin).host, roots);
  if (host.kind !== "game") return null;
  return {
    href: `${target.origin}${target.path}`,
    label: getSharedGameModule(host.game).brand.title,
  };
}
