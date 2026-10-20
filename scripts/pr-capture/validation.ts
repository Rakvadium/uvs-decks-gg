/**
 * The Bun half of `capture`'s validation-backend wiring. `capture` runs on Node (Playwright can't
 * launch Chromium under Bun on Windows), and the validation modules it reuses are Bun-only, so
 * capture.ts runs this file as a subprocess:
 *
 *   bun scripts/pr-capture/validation.ts preflight --app-port P [--reseed]
 *   bun scripts/pr-capture/validation.ts ensure-session --app-port P --persona NAME
 *
 * Each prints its result as one `RESULT_PREFIX <json>` line on stdout. Other stdout lines (a CLI
 * child's progress) are ignored by the caller; refusals go to stderr.
 * Nothing here prints a secret value. Every Convex call goes through the guarded wrapper
 * (`runConvexCapture`, the code behind `bun run vconvex`).
 */
import { RESERVED_AGENT_EMAIL_DOMAIN } from "../../convex/lib/reservedIdentity";
import { assertEnvFilesLocal } from "../agent-setup/setup";
import { STATUS_FUNCTION, parseStatusOutput, status } from "../validation/backend";
import { REPO_ROOT, checkInvocation, formatCheck, runConvexCapture } from "../validation/convex";
import { loopbackUrl, parseAppPort, portsFor } from "../validation/ports";
import { readPinnedCatalog } from "../validation/seed/catalog";
import { parseRunOutput, readManifest, type SeedMeta } from "../validation/seed/manifest";
import { reset } from "../validation/seed/reset";

const say = (message: string) => console.error(`[capture] ${message}`);

/** Marks the one stdout line capture.ts parses. */
export const RESULT_PREFIX = "PR_CAPTURE_RESULT ";

export type Preflight = {
  appPort: number;
  /** The backend's loopback URL, e.g. http://127.0.0.1:3356. */
  convexUrl: string;
  convexPort: number;
  seed: SeedMeta & { reseeded: boolean };
  catalog: { version: number; url: string; sha256: string; path: string };
};

function sameMeta(a: SeedMeta | null, b: SeedMeta): boolean {
  return !!a && a.seedVersion === b.seedVersion && a.catalogVersion === b.catalogVersion && a.sha256 === b.sha256;
}

async function vconvex(appPort: number, args: string[]): Promise<string> {
  const run = await runConvexCapture(["--app-port", String(appPort), ...args], { capture: true, quiet: true, timeoutMs: 120_000 });
  if (run.code !== 0) throw new Error(`vconvex ${args[0]} ${args[1] ?? ""} failed (exit ${run.code}).`);
  return run.stdout;
}

/**
 * Refuses unless every env file Next.js can load and the shell are local-only (agent:setup's own
 * check, `assertEnvFilesLocal`), `vconvex --check` passes for `appPort`, and the port's backend is
 * running, says it is a validation backend, and holds the golden seed. `reseed` resets the seed
 * first. Returns the backend URL, the seed meta and the verified pinned catalog file.
 */
export async function preflight(appPort: number, opts: { reseed: boolean }): Promise<Preflight> {
  try {
    assertEnvFilesLocal(REPO_ROOT);
  } catch (err) {
    // The check is agent:setup's, so its message names agent:setup.
    throw new Error(`capture refused (the env-file check agent:setup runs):\n${err instanceof Error ? err.message : String(err)}`);
  }
  const check = checkInvocation({ argv: ["--app-port", String(appPort), "--check"] });
  if (!check.ok) throw new Error(`capture refused: \`bun run vconvex -- --app-port ${appPort} --check\` does not pass.\n${formatCheck(check)}`);
  say(`vconvex check: target=${check.target} (app port ${appPort})`);

  if ((await status(appPort)).version === null) {
    throw new Error(
      `capture refused: the port ${appPort} validation backend is not running. ` +
        `Start it with \`bun run agent:setup --port ${appPort}\` or \`bun run validation:backend -- start --app-port ${appPort}\`.`,
    );
  }
  if (parseStatusOutput(await vconvex(appPort, ["run", STATUS_FUNCTION])) !== true) {
    throw new Error(`capture refused: the port ${appPort} backend does not report itself as a validation backend (${STATUS_FUNCTION}).`);
  }

  const manifest = readManifest();
  const expected = manifest.meta;
  if (!expected) throw new Error("scripts/validation/seed/manifest.json has no seed meta; there is no golden seed to capture against.");
  if (opts.reseed) {
    say(`--reseed: resetting the port ${appPort} backend to the golden seed`);
    await reset(appPort);
  }
  const out = (await vconvex(appPort, ["run", "validationSeed:getSeedMeta"])).trim();
  const meta = out === "" ? null : parseRunOutput<SeedMeta | null>(out);
  if (!sameMeta(meta, expected)) {
    throw new Error(
      `capture refused: the port ${appPort} backend's seed meta ${JSON.stringify(meta)} is not the golden seed ${JSON.stringify(expected)}. ` +
        "Rerun with --reseed.",
    );
  }

  const pinned = readPinnedCatalog(manifest);
  const ports = portsFor(appPort);
  return {
    appPort,
    convexUrl: loopbackUrl(ports.cloud),
    convexPort: ports.cloud,
    seed: { ...meta!, reseeded: opts.reseed },
    catalog: { version: manifest.catalog.version, url: manifest.catalog.url, sha256: manifest.catalog.sha256, path: pinned.cachePath },
  };
}

/** The app's defaults (ColorSchemeProvider): what a persona's new session row stores. */
export const DEFAULT_SESSION = { theme: "system", chrome: "calm", colorSource: { kind: "preset", preset: "default" } } as const;

/** `<persona>@validation.invalid`, the only accounts `agentLogin:mintCode` signs in. */
export function personaEmail(persona: string): string {
  return `${persona}@${RESERVED_AGENT_EMAIL_DOMAIN}`;
}

/** The `_id` of the user with `email` in `convex data users --format jsonLines` output, or null. */
export function findUserId(jsonLines: string, email: string): string | null {
  for (const line of jsonLines.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    const row = JSON.parse(line) as { _id?: unknown; email?: unknown };
    if (row.email === email && typeof row._id === "string") return row._id;
  }
  return null;
}

/** A `sessions:getSession` result the theme pin can rewrite: all of theme, chrome and colorSource set. */
export function hasPinnableSession(value: unknown): boolean {
  const s = value as { theme?: unknown; chrome?: unknown; colorSource?: { kind?: unknown } } | null;
  return !!s && typeof s.theme === "string" && typeof s.chrome === "string" && typeof s.colorSource?.kind === "string";
}

/**
 * Seeded and new personas have no `sessions` row, so `sessions:getSession` returns null and the
 * theme pin has nothing to rewrite (every signed-in shot would be flagged). When the persona has
 * no pinnable row, this stores DEFAULT_SESSION through the app's own `sessions:updateSession`, run
 * as that user on the local backend. Run it after the persona's first sign-in (mintCode creates
 * a new persona's user). `--reseed` removes the row again.
 */
export async function ensureSession(appPort: number, persona: string): Promise<{ persona: string; email: string; sessionCreated: boolean }> {
  const email = personaEmail(persona);
  const userId = findUserId(await vconvex(appPort, ["data", "users", "--format", "jsonLines", "--limit", "10000"]), email);
  if (!userId) throw new Error(`No user ${email} on the port ${appPort} backend (mintCode creates it on the first sign-in).`);
  const identity = ["--identity", JSON.stringify({ subject: `${userId}|pr-capture` })];
  const read = async () => {
    const out = (await vconvex(appPort, ["run", "sessions:getSession", "{}", ...identity])).trim();
    return out === "" ? null : parseRunOutput<unknown>(out);
  };
  if (hasPinnableSession(await read())) return { persona, email, sessionCreated: false };
  await vconvex(appPort, ["run", "sessions:updateSession", JSON.stringify(DEFAULT_SESSION), ...identity]);
  if (!hasPinnableSession(await read())) throw new Error(`${email} still has no session with theme, chrome and colorSource after sessions:updateSession.`);
  say(`${email} had no session row; stored the app defaults (${DEFAULT_SESSION.colorSource.preset}/${DEFAULT_SESSION.theme}/${DEFAULT_SESSION.chrome})`);
  return { persona, email, sessionCreated: true };
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${name} needs a value`);
  return value;
}

async function main(argv: string[]): Promise<unknown> {
  const [command, ...args] = argv;
  const appPort = parseAppPort(flag(args, "--app-port"));
  if (command === "preflight") return preflight(appPort, { reseed: args.includes("--reseed") });
  if (command === "ensure-session") {
    const persona = flag(args, "--persona");
    if (!persona) throw new Error("ensure-session needs --persona");
    return ensureSession(appPort, persona);
  }
  throw new Error("usage: validation.ts preflight|ensure-session --app-port P [--reseed] [--persona NAME]");
}

if (import.meta.main) {
  try {
    console.log(`${RESULT_PREFIX}${JSON.stringify(await main(process.argv.slice(2)))}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
