/**
 * The parts of `agent:setup` that run before dependencies are installed. Only node builtins and
 * `../validation/ports` (also builtins only) may be imported here: guard.ts needs `convex` from
 * node_modules, which a fresh worktree doesn't have yet.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { APP_PORT_MAX, APP_PORT_MIN, parseAppPort } from "../validation/ports";

export const USAGE = `Usage: bun run agent:setup --port <P|auto> [--port-range A-B] [--reseed] [--no-install] [--repoint-env-local] [--timeout S] [--allow-main]

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

function gitPath(cwd: string, flag: "--git-dir" | "--git-common-dir"): string {
  const result = spawnSync("git", ["rev-parse", "--path-format=absolute", flag], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git rev-parse ${flag} failed in ${cwd}: ${result.stderr.trim()}`);
  const resolved = fs.realpathSync.native(path.resolve(cwd, result.stdout.trim()));
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/** The main checkout has `--git-dir` == `--git-common-dir`; a linked worktree has its own git dir. */
export function isMainCheckout(cwd: string): boolean {
  return gitPath(cwd, "--git-dir") === gitPath(cwd, "--git-common-dir");
}

/** Throws unless `cwd` is a linked worktree (or `allowMain` is set). */
export function assertLinkedWorktree(cwd: string, allowMain: boolean): void {
  if (allowMain || !isMainCheckout(cwd)) return;
  throw new Error(
    `${cwd} is the main checkout. agent:setup prepares agent worktrees only (git worktree add ...), ` +
      "so it never writes the main checkout's .env.local or starts a backend from it. Pass --allow-main to override.",
  );
}

/** Child output goes to stderr, so stdout carries only the JSON summary. */
function run(cmd: string, args: string[], cwd: string, what: string): void {
  console.error(`[agent:setup] ${what}: ${[path.basename(cmd), ...args].join(" ")}`);
  const result = spawnSync(cmd, args, { cwd, stdio: ["ignore", 2, 2] });
  if (result.error) throw new Error(`${what} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${what} failed (exit ${result.status ?? result.signal}).`);
}

/** `bun install --frozen-lockfile`, then Playwright's chromium (shared cache; a no-op once present). */
export function installDependencies(cwd: string): void {
  run(process.execPath, ["install", "--frozen-lockfile"], cwd, "install dependencies");
  run(process.execPath, ["x", "playwright", "install", "chromium"], cwd, "install Playwright chromium");
}

export function hasInstalledCli(cwd: string): boolean {
  return fs.existsSync(path.join(cwd, "node_modules", "convex", "package.json"));
}
