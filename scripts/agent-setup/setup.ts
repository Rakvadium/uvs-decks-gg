/**
 * `agent:setup` after dependencies are installed: env-file refusal, port claim, `.env.local`
 * template, backend start, seed check and smoke test. Env files are read through guard.ts (the
 * CLI's own dotenv) and through Next.js's own loader, and every Convex call goes through
 * `vconvex` / `validation:backend`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { isPortFree, status } from "../validation/backend";
import { REPO_ROOT, checkInvocation, formatCheck } from "../validation/convex";
import {
  ANONYMOUS_DEPLOYMENT,
  dotenvEntries,
  envFileAmbiguities,
  envViolations,
  loadCliDotenv,
  naiveEntries,
  parseDotenv,
  readCliEnvFiles,
  valuesFor,
  type EnvFile,
} from "../validation/guard";
import {
  backendDir,
  claimPort,
  defaultValidationRoot,
  loopbackUrl,
  lookupRegisteredPort,
  portsFor,
  readRegistry,
  registryPath,
} from "../validation/ports";
import { parseRunOutput, readManifest, type SeedMeta } from "../validation/seed/manifest";
import { shellNodeEnvProblems, type EnvVars, type SetupArgs } from "./preflight";

const say = (message: string) => console.error(`[agent:setup] ${message}`);

/**
 * Names of the cloud deployment's secrets (design G4 `assertNotProduction`). None belongs in a
 * worktree's env file; seeing one means it was copied from the main checkout.
 */
export const PRODUCTION_SECRET_NAMES = [
  "CONVEX_DEPLOY_KEY",
  "R2_SECRET_ACCESS_KEY",
  "OPENAI_API_KEY",
  "YOUTUBE_DATA_API_KEY",
  "ADMIN_API_KEY",
  "AUTH_RESEND_KEY",
  "JWT_PRIVATE_KEY",
  "AGENT_AUTH_PASSWORD",
];

/**
 * The only names an agent worktree's env files may set. `bun install`, `bun run` and every tool they
 * start load these files themselves (Bun 1.3 can't be told not to), so anything else could steer
 * them: download hosts, registries, proxies, `NODE_OPTIONS`, binary paths, `GIT_*`, `NODE_ENV`.
 * Convex names are checked for loopback/anonymous by guard.ts.
 */
export const ALLOWED_ENV_FILE_NAMES = [
  /^CONVEX_DEPLOYMENT$/,
  /^CONVEX_(SITE_)?URL$/,
  /^NEXT_PUBLIC_[A-Z0-9_]+$/,
  /^AGENT_AUTH_(SECRET|EMAIL|USERNAME)$/,
];

export const NEXT_ENV_MODES = ["development", "production", "test"] as const;
export type NextEnvMode = (typeof NEXT_ENV_MODES)[number];

/**
 * The files `loadEnvConfig` in @next/env 16.0.8 (the installed `next`) reads, highest priority
 * first: `.env.<mode>.local`, `.env.local` (not in test), `.env.<mode>`, `.env`. The mode is `test`
 * when NODE_ENV is `test`, else `development` for `next dev` and `production` otherwise.
 */
export function nextEnvFiles(mode: NextEnvMode): string[] {
  return [`.env.${mode}.local`, ...(mode === "test" ? [] : [".env.local"]), `.env.${mode}`, ".env"];
}

/** Every env file Next.js can load, whatever NODE_ENV is. */
export const NEXT_ENV_FILES = [...new Set(NEXT_ENV_MODES.flatMap(nextEnvFiles))];

const NEXT_ENV_MODULE = path.join(REPO_ROOT, "node_modules", "@next", "env");

function linkKind(stat: fs.Stats): string {
  if (stat.isSymbolicLink()) return "a symlink or junction";
  if (stat.isDirectory()) return "a directory";
  return "not a regular file";
}

/**
 * Every `.env*` entry in `cwd` that isn't a regular file (refused: nothing is read or written
 * through a link), and the text of each Next.js env file that is.
 */
export function readEnvFiles(cwd: string): { files: EnvFile[]; problems: string[] } {
  const problems: string[] = [];
  for (const name of fs.existsSync(cwd) ? fs.readdirSync(cwd) : []) {
    if (!/^\.env/i.test(name)) continue;
    const stat = fs.lstatSync(path.join(cwd, name));
    if (!stat.isFile()) problems.push(`${name} is ${linkKind(stat)}; env files must be regular files, never links.`);
  }
  const files: EnvFile[] = [];
  for (const name of NEXT_ENV_FILES) {
    const full = path.join(cwd, name);
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(full);
    } catch {
      continue;
    }
    if (stat.isFile()) files.push({ name, text: fs.readFileSync(full, "utf8") });
  }
  return { files, problems };
}

/** Every assignment either view of the file finds (dotenv's and a plain line read), as guard.ts checks. */
function fileEntries(file: EnvFile): [string, string][] {
  return [...dotenvEntries(file.text), ...naiveEntries(file.text)];
}

export type NextResolved = { mode: NextEnvMode; files: string[]; env: Record<string, string>; errors: number };

type NextEnvModule = {
  loadEnvConfig(
    dir: string,
    dev?: boolean,
    log?: { info: (...a: unknown[]) => void; error: (...a: unknown[]) => void },
    forceReload?: boolean,
  ): { parsedEnv?: Record<string, string>; loadedEnvFiles: { path: string }[] };
};

/** Replaces every entry of process.env with `next` (Next's loader writes into process.env). */
function replaceProcessEnv(next: EnvVars): void {
  for (const key of Object.keys(process.env)) delete process.env[key];
  for (const [key, value] of Object.entries(next)) if (value !== undefined) process.env[key] = value;
}

/**
 * What `next dev` (development), `next build`/`next start` (production) and tests (test) would read
 * from `cwd`'s env files, from Next.js's own loader (@next/env, with its dotenv and variable
 * expansion). In this process, synchronously: each mode gets a fresh copy of the module (it caches
 * the first env it sees) and a process.env holding only PATH/SystemRoot (plus NODE_ENV=test for the
 * test mode), so expansion can't borrow shell values. process.env is restored afterwards. A child
 * process would do too, but Bun 1.3 on Windows intermittently fails spawns after many others.
 */
export function nextResolvedEnv(cwd: string, nextEnvModule = NEXT_ENV_MODULE): NextResolved[] {
  const saved: EnvVars = { ...process.env };
  const minimal: EnvVars = {};
  for (const name of ["PATH", "SystemRoot"]) {
    const value = valuesFor(saved, name)[0];
    if (value !== undefined) minimal[name] = value;
  }
  const req = createRequire(import.meta.url);
  const resolved = req.resolve(nextEnvModule);
  try {
    return NEXT_ENV_MODES.map((mode) => {
      replaceProcessEnv(mode === "test" ? { ...minimal, NODE_ENV: "test" } : minimal);
      delete req.cache[resolved];
      const { loadEnvConfig } = req(resolved) as NextEnvModule;
      let errors = 0;
      const r = loadEnvConfig(cwd, mode === "development", { info() {}, error() { errors++; } }, true);
      return { mode, files: r.loadedEnvFiles.map((f) => f.path), env: { ...(r.parsedEnv ?? {}) }, errors };
    });
  } finally {
    delete req.cache[resolved];
    replaceProcessEnv(saved);
  }
}

/**
 * Problems with the env files in `cwd`: every file Next.js can load (see NEXT_ENV_FILES; the CLI's
 * `.env.local` and `.env` are among them), whatever NODE_ENV is. Each is checked with guard.ts's
 * rules (forbidden names, a non-`anonymous:` deployment, a non-loopback Convex URL, ambiguous
 * lines), the production secret names and the name allowlist. Then each mode as Next.js itself
 * resolves it. Plus links, vault files and a project-linked convex.json. Names, never secret values.
 */
export function envFileProblems(cwd: string, nextEnvModule = NEXT_ENV_MODULE): string[] {
  const { files, problems: out } = readEnvFiles(cwd);
  const cli = readCliEnvFiles(cwd);
  let cliParse: ((src: string) => Record<string, string>) | undefined;
  if (cli.parserError) out.push(`The CLI's bundled dotenv could not be loaded (${cli.parserError}).`);
  else if (files.length > 0) cliParse = loadCliDotenv().parse;
  for (const file of files) {
    out.push(...envViolations({ name: file.name, env: parseDotenv(file.text), entries: fileEntries(file) }));
    for (const name of new Set(fileEntries(file).map(([k]) => k.toUpperCase()))) {
      if (PRODUCTION_SECRET_NAMES.includes(name)) out.push(`${name} is set in ${file.name}: that is a cloud deployment secret.`);
      else if (!ALLOWED_ENV_FILE_NAMES.some((re) => re.test(name))) {
        out.push(`${name} is set in ${file.name}; agent worktree env files may only set CONVEX_DEPLOYMENT, CONVEX_URL, CONVEX_SITE_URL, NEXT_PUBLIC_* and AGENT_AUTH_SECRET/EMAIL/USERNAME.`);
      }
    }
    out.push(...envFileAmbiguities(file, cliParse));
  }
  for (const vault of cli.vaultFiles) out.push(`${vault} exists; dotenv can decrypt it into the CLI's env.`);
  if (cli.projectLinked) out.push("convex.json links a team/project (or can't be read), a CLI fallback to the cloud.");
  // Each file passed on its own; now check what Next.js makes of them together, per mode.
  if (out.length === 0 && files.length > 0) {
    for (const resolved of nextResolvedEnv(cwd, nextEnvModule)) {
      const name = `Next.js ${resolved.mode} env (${resolved.files.join(" + ") || "no files"})`;
      if (resolved.errors > 0) out.push(`${name}: Next.js could not load ${resolved.errors} file(s).`);
      out.push(...envViolations({ name, env: resolved.env }));
    }
  }
  return [...new Set(out)];
}

/**
 * Step 2: refuse, before anything else runs, when an env file, or the shell agent:setup runs in,
 * could point anywhere but a local backend. `bun run` loads env files into `env` too, so shell
 * entries with the same name and value as an env file entry are left to the file check. A shell
 * NODE_ENV other than `development` is refused: it makes Bun and Next.js pick other env files and
 * modes than the ones `next dev` uses.
 */
export function assertEnvFilesLocal(cwd: string, env: Record<string, string | undefined> = process.env): void {
  const fileProblems = envFileProblems(cwd);
  const fromFiles = new Set(readEnvFiles(cwd).files.flatMap((f) => fileEntries(f).map(([k, v]) => `${k.toUpperCase()}=${v}`)));
  const shellOnly = Object.fromEntries(Object.entries(env).filter(([k, v]) => !fromFiles.has(`${k.toUpperCase()}=${v}`)));
  const shellProblems = [...envViolations({ name: "the caller's environment", env: shellOnly }), ...shellNodeEnvProblems(env)];
  if (fileProblems.length === 0 && shellProblems.length === 0) return;
  throw new Error(
    [
      "agent:setup refused: this worktree's env is not local-only. Nothing was changed; .env.local was left as it is.",
      ...[...fileProblems, ...shellProblems].map((p) => `  - ${p}`),
      ...(fileProblems.length > 0
        ? [
            "A worktree's env files must never be copies of the main checkout's. Move them aside (they may hold live secrets) and rerun;",
            "agent:setup then writes a loopback-only .env.local from its template.",
          ]
        : []),
      ...(shellProblems.length > 0
        ? ["Unset those in this shell and rerun. A shell that injects cloud Convex credentials (Cursor Cloud) has no local Convex route."]
        : []),
    ].join("\n"),
  );
}

/**
 * The env for the install steps: `env` minus every name any `.env*` file in `cwd` assigns, so
 * nothing from a worktree file reaches them through this process. (`bun install` still reads the
 * files itself; by then they have passed assertEnvFilesLocal, allowlist included.)
 */
export function installEnv(cwd: string, env: EnvVars = process.env): EnvVars {
  const names = new Set<string>();
  for (const name of fs.existsSync(cwd) ? fs.readdirSync(cwd) : []) {
    const full = path.join(cwd, name);
    if (!/^\.env/i.test(name) || !fs.lstatSync(full).isFile()) continue;
    for (const [k] of fileEntries({ name, text: fs.readFileSync(full, "utf8") })) names.add(k.toUpperCase());
  }
  return Object.fromEntries(Object.entries(env).filter(([k]) => !names.has(k.toUpperCase())));
}

/** The `.env.local` agent:setup writes when there is none: the anonymous deployment and loopback URLs only. */
export function envLocalTemplate(appPort: number): string {
  const ports = portsFor(appPort);
  return [
    `# Written by \`bun run agent:setup\` for app port ${appPort}: this worktree's local validation backend only.`,
    "# Deployment used by `npx convex dev`",
    `CONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}`,
    "",
    `NEXT_PUBLIC_CONVEX_URL=${loopbackUrl(ports.cloud)}`,
    "",
  ].join("\n");
}

/**
 * Writes the template when there is no `.env.local` at all (lstat: a dangling link counts as
 * present and is refused, never written through), then re-checks the result.
 */
export function ensureEnvLocal(cwd: string, appPort: number): "written" | "kept" {
  const file = path.join(cwd, ".env.local");
  let existing: fs.Stats | null = null;
  try {
    existing = fs.lstatSync(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  if (existing) {
    if (!existing.isFile()) throw new Error(`.env.local is ${linkKind(existing)}; agent:setup never writes through a link.`);
    return "kept";
  }
  fs.writeFileSync(file, envLocalTemplate(appPort), { flag: "wx" });
  const written = fs.lstatSync(file);
  const problems = [...(written.isFile() ? [] : [`.env.local is ${linkKind(written)}`]), ...envFileProblems(cwd)];
  if (problems.length > 0) throw new Error(`The .env.local template failed the guard:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  say(`wrote .env.local from the template (app port ${appPort})`);
  return "written";
}

// --- Port claim ---

export type PortAllocation = { appPort: number; reused: boolean; notes: string[] };

export type AllocateOptions = {
  worktree: string;
  requested: number | "auto";
  range: { min: number; max: number };
  root?: string;
  /** TCP probe: true when nothing listens on the port and it can be bound. */
  isFree?: (port: number) => Promise<boolean>;
  /** True when the port's validation backend is up (PID alive and /version answers). */
  backendRunning?: (appPort: number) => Promise<boolean>;
};

async function defaultBackendRunning(appPort: number): Promise<boolean> {
  const s = await status(appPort);
  return s.pidAlive && s.version !== null;
}

/**
 * Step 3: claim the app port in the registry (keyed by worktree, under its lock) and TCP-probe P
 * and its Convex ports. `auto` reuses this worktree's claim; otherwise it passes over ports that
 * are in use or have a backend dir from an earlier owner. A port this worktree already holds may
 * be busy only because its own backend (Convex ports) or `next dev` (app port) is running.
 */
export async function allocatePort(opts: AllocateOptions): Promise<PortAllocation> {
  const root = opts.root ?? defaultValidationRoot();
  const isFree = opts.isFree ?? isPortFree;
  const backendRunning = opts.backendRunning ?? defaultBackendRunning;
  const notes: string[] = [];
  const busy = async (appPort: number) => {
    const ports = portsFor(appPort);
    const out: number[] = [];
    for (const port of [ports.app, ports.cloud, ports.site]) if (!(await isFree(port))) out.push(port);
    return out;
  };
  const verifyOwn = async (appPort: number) => {
    const ports = portsFor(appPort);
    if (!(await backendRunning(appPort))) {
      for (const port of [ports.cloud, ports.site]) {
        if (!(await isFree(port))) {
          throw new Error(`Convex port ${port} (app port ${appPort}) is in use, but this worktree's port ${appPort} backend is not running. Free it or stop whatever holds it.`);
        }
      }
    }
    if (!(await isFree(ports.app))) notes.push(`app port ${appPort} is in use; assuming it is this worktree's own next dev`);
  };
  const existing = lookupRegisteredPort(opts.worktree, root);

  if (opts.requested === "auto") {
    if (existing !== null) {
      await verifyOwn(existing);
      return { appPort: claimPort(opts.worktree, "auto", root), reused: true, notes };
    }
    const registered = new Set(Object.values(readRegistry(root)));
    const skip = new Set<number>();
    for (let p = opts.range.min; p <= opts.range.max; p++) {
      if (registered.has(p)) continue;
      if (fs.existsSync(backendDir(p, root))) skip.add(p);
      else if ((await busy(p)).length > 0) skip.add(p);
    }
    const appPort = claimPort(opts.worktree, "auto", root, { ...opts.range, skip: (p) => skip.has(p) });
    const late = await busy(appPort);
    if (late.length > 0) throw new Error(`Claimed app port ${appPort}, but port(s) ${late.join(", ")} went into use meanwhile. Rerun.`);
    return { appPort, reused: false, notes };
  }

  const appPort = opts.requested;
  if (existing === appPort) {
    await verifyOwn(appPort);
    return { appPort, reused: true, notes };
  }
  if (existing !== null && (await backendRunning(existing))) {
    throw new Error(
      `This worktree's port ${existing} backend is still running. Stop it first (bun run validation:backend -- stop --app-port ${existing}) or use --port auto.`,
    );
  }
  const holder = Object.entries(readRegistry(root)).find(([, p]) => p === appPort)?.[0];
  if (holder) throw new Error(`App port ${appPort} is already claimed by ${holder}. Pick another port or use --port auto.`);
  const inUse = await busy(appPort);
  if (inUse.length > 0) throw new Error(`Port(s) ${inUse.join(", ")} for app port ${appPort} are in use. Pick another port or use --port auto.`);
  claimPort(opts.worktree, appPort, root);
  if (existing !== null) notes.push(`moved this worktree's claim from ${existing} to ${appPort}`);
  return { appPort, reused: false, notes };
}

// --- Package scripts ---

/** `bun run <script> -- <args>` in the worktree. Its stderr is passed through; stdout is returned. */
export function runPackageScript(cwd: string, script: string, args: string[]): Promise<{ code: number; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["run", script, "--", ...args], { cwd, stdio: ["ignore", "pipe", "inherit"] });
    let stdout = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")));
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code: code ?? (signal ? 1 : 0), stdout }));
  });
}

function sameMeta(a: SeedMeta | null, b: SeedMeta): boolean {
  return !!a && a.seedVersion === b.seedVersion && a.catalogVersion === b.catalogVersion && a.sha256 === b.sha256;
}

async function readSeedMeta(cwd: string, appPort: number): Promise<SeedMeta | null> {
  const run = await runPackageScript(cwd, "vconvex", ["--app-port", String(appPort), "run", "validationSeed:getSeedMeta"]);
  if (run.code !== 0) throw new Error(`Reading validationSeedMeta failed (vconvex run exited ${run.code}).`);
  // `convex run` prints nothing when the function returns null (a backend with no seed yet).
  return run.stdout.trim() === "" ? null : parseRunOutput<SeedMeta | null>(run.stdout);
}

export type SetupSummary = {
  ok: true;
  worktree: string;
  appPort: number;
  portClaim: "reused" | "claimed";
  registry: string;
  convexPorts: { cloud: number; site: number };
  backendUrl: string;
  siteUrl: string;
  envLocal: "written" | "kept";
  seed: { seedVersion: number; catalogVersion: number; reset: boolean; reason: string };
  smoke: { check: string; cardDataVersion: number };
  notes: string[];
  elapsedSec: number;
  next: Record<string, string>;
};

export async function runSetup(args: SetupArgs, cwd: string): Promise<SetupSummary> {
  const started = Date.now();
  assertEnvFilesLocal(cwd);
  const root = defaultValidationRoot();
  const alloc = await allocatePort({ worktree: cwd, requested: args.port, range: args.range, root });
  const appPort = alloc.appPort;
  const ports = portsFor(appPort);
  say(`app port ${appPort} (${alloc.reused ? "this worktree's existing claim" : "newly claimed"}), Convex ${ports.cloud}/${ports.site}`);
  for (const note of alloc.notes) say(note);

  const envLocal = ensureEnvLocal(cwd, appPort);
  const pre = checkInvocation({ argv: ["--app-port", String(appPort), "--check"], cwd });
  const failed = pre.rules.filter((r) => r.status === "fail").map((r) => r.rule);
  const onlyPortMismatch = failed.length === 1 && failed[0] === "env-local-points-here";
  if (!pre.ok && !(args.repointEnvLocal && onlyPortMismatch)) {
    throw new Error(`vconvex --check refused before the backend start:\n${formatCheck(pre)}`);
  }

  const P = String(appPort);
  const startArgs = [
    "start",
    "--app-port",
    P,
    ...(args.repointEnvLocal ? ["--repoint-env-local"] : []),
    ...(args.timeoutSec ? ["--timeout", String(args.timeoutSec)] : []),
  ];
  const start = await runPackageScript(cwd, "validation:backend", startArgs);
  if (start.code !== 0) throw new Error(`validation:backend start --app-port ${P} failed (exit ${start.code}).`);

  const expected = readManifest().meta;
  if (!expected) throw new Error("scripts/validation/seed/manifest.json has no seed meta; there is no golden seed to reset to.");
  let meta = await readSeedMeta(cwd, appPort);
  const reason = args.reseed ? "--reseed" : !meta ? "no seed meta" : !sameMeta(meta, expected) ? "seed meta differs from manifest.json" : "";
  if (reason) {
    say(`resetting the seed (${reason})`);
    const reset = await runPackageScript(cwd, "validation:seed:reset", ["--app-port", P]);
    if (reset.code !== 0) throw new Error(`validation:seed:reset --app-port ${P} failed (exit ${reset.code}).`);
    meta = await readSeedMeta(cwd, appPort);
    if (!sameMeta(meta, expected)) throw new Error(`After the reset, validationSeedMeta ${JSON.stringify(meta)} still differs from manifest.json.`);
  } else {
    say(`seed v${expected.seedVersion} already loaded; no reset`);
  }

  const check = await runPackageScript(cwd, "vconvex", ["--app-port", P, "--check"]);
  process.stderr.write(check.stdout);
  if (check.code !== 0 || !/target=local\b/.test(check.stdout) || !/^OK:/m.test(check.stdout)) {
    throw new Error(`vconvex --app-port ${P} --check did not pass (exit ${check.code}).`);
  }
  const url = loopbackUrl(ports.cloud);
  const version = await new ConvexHttpClient(url).query(
    makeFunctionReference<"query", Record<string, never>, { version: number } | null>("cards:getCardDataVersion"),
    {},
  );
  if (!version || version.version !== expected.catalogVersion) {
    throw new Error(`Smoke read cards:getCardDataVersion returned ${JSON.stringify(version?.version ?? null)}, expected catalog v${expected.catalogVersion}.`);
  }

  return {
    ok: true,
    worktree: cwd,
    appPort,
    portClaim: alloc.reused ? "reused" : "claimed",
    registry: registryPath(root),
    convexPorts: { cloud: ports.cloud, site: ports.site },
    backendUrl: url,
    siteUrl: loopbackUrl(ports.site),
    envLocal,
    seed: { seedVersion: expected.seedVersion, catalogVersion: expected.catalogVersion, reset: reason !== "", reason: reason || "meta matches manifest.json" },
    smoke: { check: "target=local", cardDataVersion: version.version },
    notes: alloc.notes,
    elapsedSec: Math.round((Date.now() - started) / 100) / 10,
    next: {
      app: `bunx next dev -p ${appPort}`,
      login: "bun run agent:login-url",
      capture: `bun run capture --issue <N> --label before --port ${appPort} --routes <routes>`,
      check: `bun run vconvex -- --app-port ${appPort} --check`,
      reseed: `bun run validation:seed:reset -- --app-port ${appPort}`,
      stop: `bun run validation:backend -- stop --app-port ${appPort}`,
    },
  };
}
