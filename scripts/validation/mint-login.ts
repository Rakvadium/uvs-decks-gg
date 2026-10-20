/**
 * `bun run agent:login-url [--app-port P] [--persona NAME] [--next /path]`
 *
 * Mints a single-use, 60-second agent login code on this worktree's validation backend
 * (`vconvex run agentLogin:mintCode`, so every guard in guard.ts applies) and prints
 * `http://localhost:<P>/agent-login#code=…&next=…` on stdout. The code travels only in the URL
 * fragment, which browsers never send to a server. Nothing else is printed to stdout.
 */
import { sanitizeAgentLoginNextPath } from "../../src/lib/agent-auth-shared";
import { runConvexCapture, splitArgs } from "./convex";
import { resolveAppPort } from "./ports";

export const MINT_FUNCTION = "agentLogin:mintCode";

export type MintLoginArgs = { appPortFlag?: string; persona?: string; next: string };

export function parseMintLoginArgs(argv: string[]): MintLoginArgs {
  const { appPortFlag, convexArgs } = splitArgs(argv);
  let persona: string | undefined;
  let next = "/decks";
  for (let i = 0; i < convexArgs.length; i++) {
    const arg = convexArgs[i];
    const value = (flag: string) => {
      if (arg === flag) {
        const v = convexArgs[++i];
        if (v === undefined) throw new Error(`${flag} needs a value`);
        return v;
      }
      return arg.slice(flag.length + 1);
    };
    if (arg === "--persona" || arg.startsWith("--persona=")) persona = value("--persona");
    else if (arg === "--next" || arg.startsWith("--next=")) next = value("--next");
    else throw new Error(`Unknown argument: ${arg} (expected --app-port, --persona, --next)`);
  }
  const safeNext = sanitizeAgentLoginNextPath(next);
  if (safeNext !== next.trim()) throw new Error(`--next must be a same-origin path like /decks`);
  return { appPortFlag, persona, next: safeNext };
}

/** `convex run` prints the function's return value as JSON. */
export function parseMintOutput(stdout: string): { code: string; email: string; expiresAt: number } {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  const parsed = start === -1 || end < start ? null : (JSON.parse(stdout.slice(start, end + 1)) as unknown);
  const r = parsed as { code?: unknown; email?: unknown; expiresAt?: unknown } | null;
  if (!r || typeof r.code !== "string" || typeof r.email !== "string" || typeof r.expiresAt !== "number") {
    throw new Error(`Unexpected ${MINT_FUNCTION} output`);
  }
  return { code: r.code, email: r.email, expiresAt: r.expiresAt };
}

export function buildLoginUrl(appPort: number, code: string, next: string): string {
  return `http://localhost:${appPort}/agent-login#${new URLSearchParams({ code, next }).toString()}`;
}

export async function mintLoginUrl(argv: string[]): Promise<string> {
  const args = parseMintLoginArgs(argv);
  const appPort = resolveAppPort({ flag: args.appPortFlag, env: process.env });
  const fnArgs = JSON.stringify(args.persona === undefined ? {} : { persona: args.persona });
  const { code: exit, stdout } = await runConvexCapture(
    ["--app-port", String(appPort), "run", MINT_FUNCTION, fnArgs],
    { capture: true, timeoutMs: 60_000 },
  );
  if (exit !== 0) throw new Error(`${MINT_FUNCTION} failed (exit ${exit}); is the port ${appPort} backend running?`);
  const minted = parseMintOutput(stdout);
  console.error(`[agent:login-url] ${minted.email}, single use, expires ${new Date(minted.expiresAt).toISOString()}`);
  return buildLoginUrl(appPort, minted.code, args.next);
}

if (import.meta.main) {
  try {
    console.log(await mintLoginUrl(process.argv.slice(2)));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
