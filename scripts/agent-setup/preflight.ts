/**
 * The parts of `agent:setup` that run before dependencies are installed. Only node builtins and
 * `../validation/ports` (also builtins only) may be imported here: guard.ts needs `convex` from
 * node_modules, which a fresh worktree doesn't have yet.
 */
import { spawnSync, type SpawnSyncOptionsWithStringEncoding, type SpawnSyncReturns } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { APP_PORT_MAX, APP_PORT_MIN, parseAppPort } from "../validation/ports";

/** A process env as plain data (the project's types make NodeJS.ProcessEnv require NODE_ENV). */
export type EnvVars = Record<string, string | undefined>;

export const USAGE =`Usage: bun run agent:setup --port <P|auto> [--port-range A-B] [--reseed] [--no-install] [--repoint-env-local] [--timeout S] [--allow-main]

  --port P|auto        App port in ${APP_PORT_MIN}-${APP_PORT_MAX}. auto reuses this worktree's claim, else takes the lowest free one.
  --port-range A-B     Where auto looks for a new port (default ${APP_PORT_MIN}-${APP_PORT_MAX}).
  --reseed             Reset the backend to the golden seed even when its seed meta matches.
  --no-install         Skip bun install --frozen-lockfile and the Playwright chromium install.
  --repoint-env-local  Let validation:backend rewrite .env.local's loopback URLs for P (passed to start).
  --timeout S          Per-step timeout for validation:backend start (default 60).
  --allow-main         Run in the main checkout too (it is refused by default).`;

export type SetupArgs = {
  port: number | "auto";
  range: { min: number; max: number };
  reseed: boolean;
  install: boolean;
  allowMain: boolean;
  repointEnvLocal: boolean;
  timeoutSec?: number;
};

export function parseSetupArgs(argv: string[]): SetupArgs {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  let port: number | "auto" | undefined;
  let range = { min: APP_PORT_MIN, max: APP_PORT_MAX };
  let timeoutSec: number | undefined;
  const flags = new Set<string>();
  const value = (i: number, name: string) => {
    const v = args[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Error(`${name} needs a value.\n${USAGE}`);
    return v;
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--port") {
      const raw = value(i++, "--port");
      port = raw === "auto" ? "auto" : parseAppPort(raw);
    } else if (arg === "--port-range") {
      const m = /^(\d+)-(\d+)$/.exec(value(i++, "--port-range"));
      if (!m) throw new Error(`--port-range must look like ${APP_PORT_MIN}-${APP_PORT_MAX}.`);
      range = { min: parseAppPort(m[1]), max: parseAppPort(m[2]) };
      if (range.min > range.max) throw new Error(`--port-range ${m[0]} is empty.`);
    } else if (arg === "--timeout") {
      timeoutSec = Number(value(i++, "--timeout"));
      if (!Number.isInteger(timeoutSec) || timeoutSec <= 0) throw new Error("--timeout must be a positive integer (seconds).");
    } else if (["--reseed", "--no-install", "--allow-main", "--repoint-env-local"].includes(arg)) {
      flags.add(arg);
    } else {
      throw new Error(`Unknown argument ${JSON.stringify(arg)}.\n${USAGE}`);
    }
  }
  if (port === undefined) throw new Error(`--port is required.\n${USAGE}`);
  return {
    port,
    range,
    reseed: flags.has("--reseed"),
    install: !flags.has("--no-install"),
    allowMain: flags.has("--allow-main"),
    repointEnvLocal: flags.has("--repoint-env-local"),
    timeoutSec,
  };
}

/**
 * spawnSync, retried up to 3 times only when the process could not be started at all (`error` set
 * and no exit status: Bun 1.3 on Windows sometimes reports "Out of memory" or ENOTCONN for a
 * spawn after many others). A child that ran is never retried, whatever its exit code.
 */
export function spawnSyncStarted(cmd: string, args: string[], opts: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string> {
  let r = spawnSync(cmd, args, opts);
  for (let attempt = 1; attempt < 3 && r.error && r.status === null && r.signal === null; attempt++) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * attempt);
    r = spawnSync(cmd, args, opts);
  }
  return r;
}

/**
 * `env` without any `GIT_*` variable (any letter case), so a `GIT_DIR`/`GIT_COMMON_DIR` from the
 * shell, or from an env file Bun loaded, can't make git describe another repository.
 */
export function withoutGitEnv(env: EnvVars): EnvVars {
  return Object.fromEntries(Object.entries(env).filter(([k]) => !k.toUpperCase().startsWith("GIT_")));
}

function realLower(p: string): string {
  const resolved = fs.realpathSync.native(p);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/**
 * Whether `cwd` (a checkout's top level) is the main checkout, from git's on-disk layout alone, so
 * no env var can sway it. The main checkout has a `.git` directory. A linked worktree has a `.git`
 * file (`gitdir: <dir>`) whose dir holds a `commondir` file naming a different common dir. Anything
 * else (a `.git` file without `commondir`, as in a submodule) counts as a main checkout.
 */
export function isMainCheckout(cwd: string): boolean {
  const dotGit = path.join(cwd, ".git");
  const stat = fs.lstatSync(dotGit);
  if (stat.isDirectory()) return true;
  if (!stat.isFile()) throw new Error(`${dotGit} is neither a directory nor a file; refusing to guess what checkout this is.`);
  const m = /^gitdir:\s*(.+?)\s*$/m.exec(fs.readFileSync(dotGit, "utf8"));
  if (!m) throw new Error(`${dotGit} has no gitdir line.`);
  const gitDir = path.resolve(cwd, m[1]);
  const commonFile = path.join(gitDir, "commondir");
  if (!fs.existsSync(commonFile)) return true;
  const commonDir = path.resolve(gitDir, fs.readFileSync(commonFile, "utf8").trim());
  return realLower(gitDir) === realLower(commonDir);
}

/** `git rev-parse --git-dir --git-common-dir` in `cwd`, with every GIT_* variable removed. */
function gitSaysMain(cwd: string, env: EnvVars): boolean {
  const result = spawnSyncStarted("git", ["rev-parse", "--path-format=absolute", "--git-dir", "--git-common-dir"], {
    cwd,
    encoding: "utf8",
    env: withoutGitEnv(env) as NodeJS.ProcessEnv,
  });
  if (result.status !== 0) {
    throw new Error(`git rev-parse failed in ${cwd}: ${result.error ? result.error.message : (result.stderr ?? "").trim()}`);
  }
  const [gitDir, commonDir] = result.stdout.trim().split(/\r?\n/);
  if (!gitDir || !commonDir) throw new Error(`git rev-parse printed no git dirs in ${cwd}.`);
  return realLower(path.resolve(cwd, gitDir)) === realLower(path.resolve(cwd, commonDir));
}

/**
 * Throws unless `cwd` is a linked worktree (or `allowMain` is set). The on-disk layout decides, and
 * git (run without GIT_* variables) must agree; if they disagree, it is refused too.
 */
export function assertLinkedWorktree(cwd: string, allowMain: boolean, env: EnvVars = process.env): void {
  if (allowMain) return;
  const main = isMainCheckout(cwd);
  if (!main && gitSaysMain(cwd, env)) {
    throw new Error(`${cwd} looks like a linked worktree on disk, but git says it is the main checkout; refusing.`);
  }
  if (!main) return;
  throw new Error(
    `${cwd} is the main checkout. agent:setup prepares agent worktrees only (git worktree add ...), ` +
      "so it never writes the main checkout's .env.local or starts a backend from it. Pass --allow-main to override.",
  );
}

/** Every name Bun, Next.js or the Convex CLI could load env from starts with `.env` (none is tracked). */
const ENV_ENTRY = /^\.env/i;

/** `.env*` entries (files, links, dirs) directly in each of `dirs`. Builtins only: no parsing. */
export function envEntries(dirs: string[]): string[] {
  const out = new Set<string>();
  for (const dir of dirs) {
    for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
      if (ENV_ENTRY.test(name)) out.add(path.join(dir, name));
    }
  }
  return [...out];
}

/**
 * Before the first install the guard can't load, and `bun run` has already loaded any `.env*`
 * file in its cwd into this process's env (Bun 1.3 has no switch to turn that off). So a fresh
 * worktree with any `.env*` entry is refused before anything runs. Without one, Bun loaded nothing
 * and the env is the shell's own.
 */
export function assertNoEnvFilesBeforeInstall(dirs: string[]): void {
  const found = envEntries(dirs);
  if (found.length === 0) return;
  throw new Error(
    [
      "agent:setup refused: this fresh worktree already has env files. Nothing was installed or changed.",
      ...found.map((f) => `  - ${f}`),
      "Bun loaded them into this process, and the guard that checks them needs node_modules. A fresh worktree only has",
      "them when they were copied in (they may hold live secrets): move them out of the worktree and rerun.",
      "agent:setup then writes a loopback-only .env.local from its template.",
    ].join("\n"),
  );
}

/**
 * NODE_ENV must be unset or `development` (any letter case of the name). Other values make Bun and
 * Next.js load other env files and modes than `next dev` uses (`production` also makes `bun
 * install` skip devDependencies).
 */
export function shellNodeEnvProblems(env: EnvVars): string[] {
  return Object.entries(env)
    .filter(([k, v]) => k.toUpperCase() === "NODE_ENV" && v !== undefined && v !== "development")
    .map(([, v]) => `NODE_ENV is ${JSON.stringify(v)} in the caller's environment; agent:setup needs it unset or "development".`);
}

export function assertShellNodeEnv(env: EnvVars): void {
  const problems = shellNodeEnvProblems(env);
  if (problems.length > 0) throw new Error(`agent:setup refused: ${problems.join(" ")} Nothing was installed or changed.`);
}

/** Child output goes to stderr, so stdout carries only the JSON summary. */
function run(cmd: string, args: string[], cwd: string, what: string, env: EnvVars): void {
  console.error(`[agent:setup] ${what}: ${[path.basename(cmd), ...args].join(" ")}`);
  const result = spawnSync(cmd, args, { cwd, stdio: ["ignore", 2, 2], env: env as NodeJS.ProcessEnv });
  if (result.error) throw new Error(`${what} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${what} failed (exit ${result.status ?? result.signal}).`);
}

/**
 * `bun install --frozen-lockfile`, then Playwright's chromium (shared cache; a no-op once
 * present). `env` must not carry anything from a worktree env file (see the callers). Playwright
 * runs under node, which loads no env files; `bun install` always reads the worktree's, so callers
 * run it only when there are none or after they passed the guard.
 */
export function installDependencies(cwd: string, env: EnvVars): void {
  run(process.execPath, ["install", "--frozen-lockfile"], cwd, "install dependencies", env);
  run("node", [path.join(cwd, "node_modules", "playwright", "cli.js"), "install", "chromium"], cwd, "install Playwright chromium", env);
}

export function hasInstalledCli(cwd: string): boolean {
  return fs.existsSync(path.join(cwd, "node_modules", "convex", "package.json"));
}
