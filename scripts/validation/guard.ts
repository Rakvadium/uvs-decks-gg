import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isLoopbackUrl } from "../../convex/lib/validationBackend";
import { APP_PORT_MIN, CONVEX_PORT_BASE, backendDir, portsFor, sharedCacheDir } from "./ports";

/**
 * The only deployment the wrapped CLI may target. Agent mode always names its deployment
 * `anonymous-agent`, and each backend has its own config dir, so the name is the same per port.
 */
export const ANONYMOUS_DEPLOYMENT = "anonymous:anonymous-agent";
const ANONYMOUS_PATTERN = /^anonymous:anonymous-[A-Za-z0-9_-]+$/;

/**
 * Convex CLI versions whose credential lookup, env loading, and flags were checked against this
 * guard. Before adding one, re-verify against its source: credentials only come from
 * `os.homedir()/.convex`, `CONVEX_OVERRIDE_ACCESS_TOKEN`, and deploy keys; `.env.local`/`.env` are
 * still loaded by the bundled dotenv that loadCliDotenv extracts; deployment selection still
 * follows resolveCliTarget; and the flags below are still the full set that selects a deployment.
 */
export const TESTED_CONVEX_VERSIONS = ["1.31.0"];

/**
 * The local backend release every wrapped `dev` runs, passed as `--local-backend-version`. Without
 * it, CLI 1.31 asks api.github.com for the latest release on every anonymous `dev`
 * (findLatestVersionWithBinary in cli/lib/localDeployment/download.js), and the unauthenticated
 * limit of 60 calls an hour stalls parallel agents. With it, the CLI uses
 * `<cache>/convex/binaries/<version>/` and `<cache>/convex/dashboard/` as they are. Tested with CLI
 * 1.31.0 on the validation backends. Changing it means every existing backend has to be recreated
 * (see checkSavedBackendVersion in convex.ts).
 */
export const PINNED_LOCAL_BACKEND_VERSION = "precompiled-2026-10-10-72ce13c";

/** The CLI's own "no deploy key" sentinel (processDeployKeyValue in cli/lib/utils/utils.js). */
export const DEPLOY_KEY_SENTINEL = "<ignore_deploy_key>";

export const ALLOWED_SUBCOMMANDS = new Set([
  "dev",
  "run",
  "import",
  "export",
  "env",
  "data",
  "logs",
  "codegen",
  "function-spec",
  "dashboard",
  "typecheck",
  "help",
]);

/**
 * Flags that pick a different deployment, add credentials, or override the wrapper's fixed ports or
 * pinned backend. Any other `--local-*` flag is refused too (see LOCAL_BACKEND_FLAG).
 */
export const FORBIDDEN_FLAGS = [
  "--prod",
  "--env-file",
  "--url",
  "--admin-key",
  "--preview-name",
  "--deployment-name",
  "--deployment",
  "--env",
  "--configure",
  "--cloud",
  "--team",
  "--project",
  "--dev-deployment",
  "--override-auth-url",
  "--override-auth-client",
  "--override-auth-username",
  "--override-auth-password",
  "--local",
  "--local-cloud-port",
  "--local-site-port",
  "--local-backend-version",
  "--local-force-upgrade",
];

/** `--local` and every `--local-*` flag: the wrapper alone picks the local backend, its ports and binary. */
const LOCAL_BACKEND_FLAG = /^--local(-|$)/;

/**
 * Refused when present at all, under any letter case and even when empty, in the caller's env or
 * an env file: these carry cloud credentials, redirect the CLI, turn off anonymous mode, or unlock
 * encrypted env files.
 */
export const FORBIDDEN_ENV = [
  "CONVEX_DEPLOY_KEY",
  "CONVEX_OVERRIDE_ACCESS_TOKEN",
  "CONVEX_PROVISION_HOST",
  "CONVEX_ALLOW_ANONYMOUS",
  "DOTENV_KEY",
];

/**
 * Exact values the wrapped CLI env must carry. A var that is already set can't be filled in from
 * `.env.local`/`.env` (dotenv never overrides, and Windows env names are case-insensitive), so
 * pinning these is a second line of defence behind the file checks.
 */
export const PINNED_CHILD_ENV: Record<string, string> = {
  CONVEX_AGENT_MODE: "anonymous",
  CONVEX_DEPLOYMENT: ANONYMOUS_DEPLOYMENT,
  CONVEX_DEPLOY_KEY: DEPLOY_KEY_SENTINEL,
  CONVEX_OVERRIDE_ACCESS_TOKEN: "",
  CONVEX_SELF_HOSTED_URL: "",
  CONVEX_SELF_HOSTED_ADMIN_KEY: "",
  CONVEX_PROVISION_HOST: "",
  CONVEX_ALLOW_ANONYMOUS: "true",
  DOTENV_KEY: "",
  DISABLE_BEACON: "1",
};

const CONVEX_URL_VAR = /CONVEX.*URL/;
/** Names whose every occurrence in an env file must read the same way to dotenv and to a plain line read. */
const RELEVANT_NAME = /CONVEX|DOTENV/i;
/** Credential names that must not appear anywhere in an env file, even inside another value. */
const CREDENTIAL_TEXT = /convex_deploy_key|convex_override_access_token|dotenv_key/i;

export type Env = Record<string, string | undefined>;

/** `entries`, when present, is every assignment found in a file, including shadowed duplicates. */
export type EnvSource = { name: string; env: Env; entries?: [string, string][] };

/** An env file as read from disk, for the ambiguity checks. */
export type EnvFile = { name: string; text: string };

export type TargetClass = "local" | "cloud" | "unknown";

export type GuardInput = {
  /** Args passed to the Convex CLI (wrapper flags already removed). `null` = not checked (`--check`). */
  args: string[] | null;
  /** The args the CLI will really get (wrapper flags added). Omitted = not checked (`--check` with no args). */
  cliArgs?: string[];
  /** Everything the CLI could read a deployment from: the caller's env, `.env.local`, `.env`. */
  sources: EnvSource[];
  /** Raw `.env.local`/`.env` text, for the ambiguity checks. */
  envFiles?: EnvFile[];
  /** `.env*.vault` files in the CLI's working directory. */
  vaultFiles: string[];
  /** convex.json links a team/project (the CLI's fallback when no deployment is selected). */
  projectLinked?: boolean;
  /** Set when the CLI's bundled dotenv could not be loaded. */
  parserError?: string;
  /** The exact env the wrapped CLI will be spawned with. */
  childEnv: Env;
  /** `version` from node_modules/convex/package.json. */
  cliVersion: string;
  appPort: number;
  /** `~/.uvs-validation` */
  root: string;
  /** The real user's home, which must stay invisible to the wrapped CLI. */
  realHome: string;
  platform?: NodeJS.Platform;
  /** Only for the pre-check before `--repoint-env-local` rewrites `.env.local`. */
  skipEnvLocalPort?: boolean;
};

export class GuardError extends Error {
  constructor(readonly violations: string[]) {
    super(
      [
        "vconvex refused to run. The Convex CLI may only target this worktree's local anonymous backend.",
        ...violations.map((v) => `  - ${v}`),
      ].join("\n"),
    );
    this.name = "GuardError";
  }
}

/** All values stored under `name`, compared case-insensitively. */
export function valuesFor(env: Env, name: string): string[] {
  const upper = name.toUpperCase();
  return Object.entries(env)
    .filter(([key, value]) => key.toUpperCase() === upper && value !== undefined)
    .map(([, value]) => value as string);
}

function normPath(p: string, platform: NodeJS.Platform): string {
  return platform === "win32" ? path.resolve(p).toLowerCase() : path.resolve(p);
}

function samePath(a: string | undefined, b: string, platform: NodeJS.Platform): boolean {
  return !!a && normPath(a, platform) === normPath(b, platform);
}

function isInside(child: string | undefined, parent: string, platform: NodeJS.Platform): boolean {
  if (!child) return false;
  const rel = path.relative(normPath(parent, platform), normPath(child, platform));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function flagName(arg: string): string {
  return arg.split("=", 1)[0];
}

export function argViolations(args: string[]): string[] {
  const out: string[] = [];
  const subcommand = args.find((a) => !a.startsWith("-"));
  if (subcommand === undefined) {
    out.push("No Convex subcommand given (e.g. `vconvex dev --once`).");
  } else if (subcommand === "deploy") {
    out.push("`deploy` is forbidden: it pushes to a cloud deployment.");
  } else if (!ALLOWED_SUBCOMMANDS.has(subcommand)) {
    out.push(`Subcommand \`${subcommand}\` is not allowed. Allowed: ${[...ALLOWED_SUBCOMMANDS].join(", ")}.`);
  }
  for (const arg of args) {
    if (!arg.startsWith("--")) continue;
    const name = flagName(arg);
    if (FORBIDDEN_FLAGS.includes(name)) {
      out.push(`Flag \`${name}\` is forbidden.`);
    } else if (LOCAL_BACKEND_FLAG.test(name)) {
      out.push(`Flag \`${name}\` is forbidden: the wrapper alone sets the local backend flags.`);
    }
  }
  return out;
}

/**
 * Checks the args the wrapper actually hands the CLI: `dev` must carry `--local` and the pinned
 * `--local-backend-version` exactly once each, so it never asks GitHub for the latest release;
 * other commands start no backend and carry neither.
 */
export function pinnedBackendViolations(cliArgs: string[]): string[] {
  const subcommand = cliArgs.find((a) => !a.startsWith("-"));
  const versionFlags = cliArgs.flatMap((a, i) => (flagName(a) === "--local-backend-version" ? [i] : []));
  const local = cliArgs.filter((a) => a === "--local").length;
  const forceUpgrade = cliArgs.some((a) => flagName(a) === "--local-force-upgrade");
  if (subcommand !== "dev") {
    return versionFlags.length > 0 || local > 0 || forceUpgrade
      ? [`Only \`dev\` may carry the local backend flags, but \`${subcommand}\` has them.`]
      : [];
  }
  const out: string[] = [];
  if (local !== 1) out.push("`dev` must carry `--local` exactly once.");
  if (forceUpgrade) out.push("`dev` must not carry `--local-force-upgrade`.");
  const value = versionFlags.length === 1 && cliArgs[versionFlags[0]] === "--local-backend-version" ? cliArgs[versionFlags[0] + 1] : null;
  if (value !== PINNED_LOCAL_BACKEND_VERSION) {
    out.push(`\`dev\` must carry \`--local-backend-version ${PINNED_LOCAL_BACKEND_VERSION}\` exactly once, so the CLI never asks GitHub for the latest release.`);
  }
  return out;
}

function deploymentAndUrlViolations(name: string, key: string, value: string | undefined): string[] {
  if (value === undefined) return [];
  const upper = key.toUpperCase();
  const isDeployment = upper === "CONVEX_DEPLOYMENT";
  const isUrl = CONVEX_URL_VAR.test(upper);
  if ((isDeployment || isUrl) && value.trim() === "") {
    return [`${key} in ${name} is set but empty; the CLI would treat it as unset and fall back to another target.`];
  }
  if (isDeployment && !ANONYMOUS_PATTERN.test(value)) {
    return [`${key} in ${name} is \`${value}\`, not an \`anonymous:\` local deployment.`];
  }
  if (isUrl && !isLoopbackUrl(value)) return [`${key} in ${name} is not a loopback URL.`];
  return [];
}

/** Checks the caller's env or an env file (every assignment, when known). Names are case-insensitive. */
export function envViolations(source: EnvSource): string[] {
  const out = new Set<string>();
  const entries = source.entries ?? Object.entries(source.env);
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (FORBIDDEN_ENV.includes(key.toUpperCase())) out.add(`${key} is set in ${source.name}.`);
    for (const v of deploymentAndUrlViolations(source.name, key, value)) out.add(v);
  }
  return [...out];
}

export function childPinViolations(childEnv: Env): string[] {
  const name = "the wrapped CLI env";
  const out: string[] = [];
  for (const [pinned, expected] of Object.entries(PINNED_CHILD_ENV)) {
    const values = valuesFor(childEnv, pinned);
    if (values.length !== 1 || values[0] !== expected) {
      out.push(`${pinned} must be set exactly once to ${JSON.stringify(expected)} in ${name}.`);
    }
  }
  const pinnedNames = new Set(Object.keys(PINNED_CHILD_ENV));
  for (const [key, value] of Object.entries(childEnv)) {
    const upper = key.toUpperCase();
    if (pinnedNames.has(upper)) continue;
    if (FORBIDDEN_ENV.includes(upper) && value !== undefined) out.push(`${key} is set in ${name}.`);
    out.push(...deploymentAndUrlViolations(name, key, value));
  }
  return out;
}

function realpathOrNull(p: string): string | null {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return null;
  }
}

function lstatOrNull(p: string): fs.Stats | null {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

/**
 * `~/.uvs-validation` with links resolved. Every expected path is built from this, never from
 * where a link under it points, so a swapped-in link can't make both sides of a check agree.
 */
function resolvedRoot(root: string): string {
  return realpathOrNull(root) ?? path.resolve(root);
}

/**
 * Walks `<base>/<rel>` and everything under it, and lists each symlink, junction or other reparse
 * point (anything `readdir`/`lstat` reports as a link), each entry that is neither a regular file
 * nor a dir, and each dir whose real path isn't its parent's real path plus its name. Empty when
 * it is all plain. `onLink` decides about a link: null allows it (it isn't descended into), a
 * string is the problem to report. Entries that vanish mid-walk are skipped.
 */
export function plainTreeProblems(
  base: string,
  rel = "",
  opts: {
    platform?: NodeJS.Platform;
    onLink?: (full: string) => string | null;
    /** Allow sockets, FIFOs and devices (the backend's node executor makes a Unix socket in its temp dir). */
    allowSpecialFiles?: boolean;
  } = {},
): string[] {
  const platform = opts.platform ?? process.platform;
  const out: string[] = [];
  const onLink = (full: string) => {
    const problem = opts.onLink ? opts.onLink(full) : `${full} is a symlink or junction`;
    if (problem) out.push(problem);
  };
  let at = base;
  for (const part of rel.split(/[\\/]/).filter(Boolean)) {
    at = path.join(at, part);
    const stat = lstatOrNull(at);
    if (stat === null) return out;
    if (stat.isSymbolicLink()) {
      onLink(at);
      return out;
    }
  }
  const walk = (dir: string, realDir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") out.push(`${dir} could not be read`);
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      let kind = entry.isSymbolicLink() ? "link" : entry.isDirectory() ? "dir" : entry.isFile() ? "file" : null;
      if (kind === null) {
        const stat = lstatOrNull(full);
        if (stat === null) continue;
        kind = stat.isSymbolicLink() ? "link" : stat.isDirectory() ? "dir" : stat.isFile() ? "file" : "other";
      }
      if (kind === "link") onLink(full);
      else if (kind === "other" && !opts.allowSpecialFiles) out.push(`${full} is not a regular file or dir`);
      else if (kind === "dir") {
        const real = realpathOrNull(full);
        if (real === null) continue;
        const expected = path.join(realDir, entry.name);
        if (samePath(real, expected, platform)) walk(full, real);
        else out.push(`${full} resolves to ${real}, not ${expected}`);
      }
    }
  };
  const realAt = realpathOrNull(at);
  if (realAt !== null) walk(at, realAt);
  return out;
}

/** Checks `<root>/<parts…>` one level at a time with lstat: each must be a plain dir resolving to the built path. */
function plainDirChain(root: string, parts: string[], platform: NodeJS.Platform, what: string): string[] {
  const base = resolvedRoot(root);
  for (let i = 1; i <= parts.length; i++) {
    const p = path.join(root, ...parts.slice(0, i));
    const stat = lstatOrNull(p);
    if (stat === null) return [];
    if (stat.isSymbolicLink()) return [`${p} is a symlink or junction; ${what} must be a plain dir.`];
    if (!stat.isDirectory()) return [`${p} is not a dir.`];
    const expected = path.join(base, ...parts.slice(0, i));
    const real = realpathOrNull(p);
    if (!samePath(real ?? undefined, expected, platform)) return [`${p} resolves to ${real}, not ${expected}.`];
  }
  return [];
}

/**
 * Nothing under `<root>/cache` may be a link, at any depth, on any platform: the wrapper seeds
 * there and the CLI runs the binary and writes the dashboard config there, so a link anywhere in
 * it would reach wherever it points (the owner's Convex cache or login dir, say).
 */
export function sharedCacheProblems(root: string, platform: NodeJS.Platform = process.platform): string[] {
  // `cache/convex` must be a dir too: the walk alone would accept a plain file there.
  const chain = plainDirChain(root, ["cache", "convex"], platform, "the shared cache");
  if (chain.length > 0 || lstatOrNull(path.join(root, "cache")) === null) return chain;
  return plainTreeProblems(path.join(root, "cache"), "", { platform }).map(
    (p) => `${p}; nothing in the shared cache may be a link, so the owner's Convex cache stays untouched.`,
  );
}

export type BackendHomeInput = {
  root: string;
  appPort: number;
  realHome: string;
  /** The caller's LOCALAPPDATA, whose `convex` dir is the owner's cache on Windows. */
  ownerLocalAppData?: string;
  platform?: NodeJS.Platform;
};

/**
 * `<root>/backends/<P>` is the wrapped CLI's HOME, where it looks for a login. It and
 * `<root>/backends` must be plain dirs (lstat), it must resolve to the path built from the
 * resolved root, and it must not be, contain, or sit inside the owner's home or Convex dirs.
 * Nothing under it may be a link, except the `.cache/convex` link the wrapper makes on macOS and
 * Linux, which must resolve to the shared cache exactly.
 */
export function backendHomeProblems(input: BackendHomeInput): string[] {
  const platform = input.platform ?? process.platform;
  const home = backendDir(input.appPort, input.root);
  const base = resolvedRoot(input.root);
  const chain = plainDirChain(input.root, ["backends", String(input.appPort)], platform, "the backend home");
  if (chain.length > 0) return chain;
  const realHome = realpathOrNull(home) ?? backendDir(input.appPort, base);
  const ownerHome = realpathOrNull(input.realHome) ?? path.resolve(input.realHome);
  const ownerDirs = [
    path.join(input.realHome, ".convex"),
    path.join(input.realHome, ".cache", "convex"),
    path.join(input.realHome, "AppData", "Local", "convex"),
    ...(input.ownerLocalAppData ? [path.join(input.ownerLocalAppData, "convex")] : []),
  ].map((d) => realpathOrNull(d) ?? path.resolve(d));
  if (isInside(ownerHome, realHome, platform)) {
    return [`${home} resolves to ${realHome}, which is or contains the owner's home ${ownerHome}.`];
  }
  const owner = ownerDirs.find((d) => isInside(realHome, d, platform) || isInside(d, realHome, platform));
  if (owner) return [`${home} resolves to ${realHome}, which overlaps the owner's Convex dir ${owner}.`];
  if (lstatOrNull(home) === null) return [];
  const sharedLink = path.join(home, ".cache", "convex");
  const shared = path.join(sharedCacheDir(base), "convex");
  return plainTreeProblems(home, "", {
    platform,
    // A socket or FIFO can't redirect a path; only links can point the CLI at the owner's files.
    allowSpecialFiles: true,
    onLink: (full) => {
      if (platform === "win32" || !samePath(full, sharedLink, platform)) {
        return `${full} is a symlink or junction; nothing in the backend home may be a link, so the owner's login stays hidden.`;
      }
      const real = realpathOrNull(full);
      if (real === null) return `${full} is a link that resolves nowhere; remove it so the wrapper can link it to ${shared}.`;
      return samePath(real, shared, platform) ? null : `${full} must resolve to ${shared} so the owner's Convex cache is untouched.`;
    },
  });
}

function callerEnv(input: GuardInput): Env {
  return input.sources.find((s) => s.name === "the caller's environment")?.env ?? {};
}

export function homeViolations(input: GuardInput): string[] {
  const platform = input.platform ?? process.platform;
  const home = backendDir(input.appPort, input.root);
  const realHomeOf = (p: string) => realpathOrNull(p) ?? path.resolve(p);
  const out: string[] = [];
  if (samePath(home, input.realHome, platform) || samePath(realHomeOf(home), realHomeOf(input.realHome), platform)) {
    out.push("The backend home must not be the real home directory.");
  }
  for (const homeVar of ["USERPROFILE", "HOME"]) {
    const values = valuesFor(input.childEnv, homeVar);
    if (values.length !== 1 || !samePath(values[0], home, platform) || !samePath(realHomeOf(values[0]), realHomeOf(home), platform)) {
      out.push(`${homeVar} must be ${home} so the owner's Convex login is hidden.`);
    }
  }
  out.push(
    ...backendHomeProblems({
      root: input.root,
      appPort: input.appPort,
      realHome: input.realHome,
      ownerLocalAppData: valuesFor(callerEnv(input), "LOCALAPPDATA")[0],
      platform,
    }),
  );
  return out;
}

export function cacheViolations(input: GuardInput): string[] {
  const platform = input.platform ?? process.platform;
  const shared = sharedCacheProblems(input.root, platform);
  if (platform !== "win32") return shared;
  const values = valuesFor(input.childEnv, "LOCALAPPDATA");
  const cache = sharedCacheDir(input.root);
  const resolved = values.length === 1 ? realpathOrNull(values[0]) : null;
  const inside =
    values.length === 1 &&
    isInside(values[0], cache, platform) &&
    (resolved === null || isInside(resolved, sharedCacheDir(resolvedRoot(input.root)), platform));
  return inside ? shared : [...shared, `LOCALAPPDATA must be inside ${cache} so the owner's Convex cache is untouched.`];
}

/** Kept for callers that want every child-env check in one list. */
export function childEnvViolations(input: GuardInput): string[] {
  return [...childPinViolations(input.childEnv), ...homeViolations(input), ...cacheViolations(input)];
}

export function versionViolations(cliVersion: string): string[] {
  if (TESTED_CONVEX_VERSIONS.includes(cliVersion)) return [];
  return [
    `Convex CLI ${cliVersion} is not on the tested list (${TESTED_CONVEX_VERSIONS.join(", ")}). ` +
      "Before adding it to TESTED_CONVEX_VERSIONS in scripts/validation/guard.ts, re-verify against that version's source " +
      "that the owner's login stays hidden (config dir, cache dir, credential env vars) and that this guard still covers every " +
      "deployment-selecting flag, env var, and env-file form.",
  ];
}

/** Maps a Convex cloud/site port back to the app port it belongs to, if it is in the validation range. */
function appPortForConvexPort(port: number): number | null {
  const offset = port - CONVEX_PORT_BASE;
  return offset >= 0 && offset < 200 ? APP_PORT_MIN + Math.floor(offset / 2) : null;
}

/**
 * The CLI rewrites `.env.local` for whichever backend ran `dev` last. Refuse when it points at a
 * different backend than this command targets, so the app and the agent can't silently diverge.
 */
export function envLocalPortViolations(sources: EnvSource[], appPort: number): string[] {
  const envLocal = sources.find((s) => s.name === ".env.local");
  if (!envLocal) return [];
  const ports = portsFor(appPort);
  const out = new Set<string>();
  for (const [key, value] of envLocal.entries ?? Object.entries(envLocal.env)) {
    if (!value || !CONVEX_URL_VAR.test(key.toUpperCase()) || !isLoopbackUrl(value)) continue;
    const port = Number(new URL(value).port);
    if (port === ports.cloud || port === ports.site) continue;
    const owner = appPortForConvexPort(port);
    out.add(
      `.env.local ${key} points at port ${port}${owner ? ` (the app port ${owner} backend)` : ""}, but this command targets app port ${appPort} ` +
        `(Convex ${ports.cloud}/${ports.site}). Rerun with --app-port ${owner ?? "<that port>"}, or add --repoint-env-local to rewrite .env.local for ${appPort}.`,
    );
  }
  return [...out];
}

// --- Env files: parse them exactly as the CLI does, and refuse anything a plain read sees differently ---

/** Path of the installed CLI bundle (the code `node_modules/convex/bin/main.js` runs). */
export const CLI_BUNDLE = fileURLToPath(new URL("../../node_modules/convex/dist/cli.bundle.cjs", import.meta.url));

type Dotenv = { parse(src: string): Record<string, string> };
const dotenvCache = new Map<string, Dotenv>();

/**
 * Loads the dotenv module bundled inside the installed Convex CLI, so env files are parsed by the
 * same code the CLI runs. Throws if the bundle layout differs (a CLI version that wasn't checked).
 */
export function loadCliDotenv(bundle = CLI_BUNDLE): Dotenv {
  const cached = dotenvCache.get(bundle);
  if (cached) return cached;
  const src = fs.readFileSync(bundle, "utf8");
  const start = src.indexOf("// ../common/temp/node_modules/.pnpm/dotenv@16.6.1/node_modules/dotenv/package.json");
  const end = src.indexOf("// ../common/temp/node_modules/.pnpm/fetch-retry@", start);
  if (start < 0 || end < 0) throw new Error(`dotenv 16.6.1 not found in ${bundle}`);
  const getOwnPropertyNames = Object.getOwnPropertyNames;
  const commonJS = (cb: Record<string, (exports: object, module: { exports: object }) => void>, mod?: { exports: object }) =>
    function load() {
      if (!mod) {
        mod = { exports: {} };
        cb[getOwnPropertyNames(cb)[0]](mod.exports, mod);
      }
      return mod.exports;
    };
  const factory = new Function("require", "__commonJS", `${src.slice(start, end)}\nreturn require_main();`);
  const dotenv = factory(createRequire(bundle), commonJS) as Dotenv;
  if (typeof dotenv.parse !== "function") throw new Error(`bundled dotenv in ${bundle} has no parse()`);
  dotenvCache.set(bundle, dotenv);
  return dotenv;
}

/**
 * Every assignment dotenv 16.6.1 matches, in order and including duplicates (the LINE regex and
 * value handling are copied from the bundle). `Object.fromEntries` of this equals dotenv's parse.
 */
const DOTENV_LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

export function dotenvEntries(src: string): [string, string][] {
  const out: [string, string][] = [];
  const lines = src.toString().replace(/\r\n?/gm, "\n");
  const re = new RegExp(DOTENV_LINE.source, DOTENV_LINE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(lines)) != null) {
    let value = (match[2] || "").trim();
    const maybeQuote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
    if (maybeQuote === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    out.push([match[1], value]);
  }
  return out;
}

/** A plain line-by-line read (`KEY=value` or `KEY:value` on one line), the way a person reads the file. */
export function naiveEntries(src: string): [string, string][] {
  const out: [string, string][] = [];
  for (const line of src.split(/\r?\n|\r/)) {
    const m = /^\s*(?:export\s+)?([\w.-]+)\s*[=:]\s*(.*)$/.exec(line);
    if (!m) continue;
    const raw = m[2].trim();
    const quoted = /^(['"`])(.*)\1\s*(?:#.*)?$/.exec(raw);
    let value = quoted ? quoted[2] : raw.split("#")[0].trim();
    if (quoted?.[1] === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    out.push([m[1], value]);
  }
  return out;
}

/** Uses the CLI's own dotenv when it loads; otherwise the copied regex (and the guard refuses). */
export function parseDotenv(src: string): Record<string, string> {
  try {
    return loadCliDotenv().parse(src);
  } catch {
    return Object.fromEntries(dotenvEntries(src));
  }
}

/**
 * Refuses env files that could be read two ways: Convex/dotenv names that appear more than once
 * (dotenv keeps the last), lines a plain read sees but dotenv doesn't (multi-line quoted values,
 * `KEY:value` with no space), credential names inside other values, or a guard/CLI parser mismatch.
 */
export function envFileAmbiguities(file: EnvFile, cliParse?: (src: string) => Record<string, string>): string[] {
  const out: string[] = [];
  const dot = dotenvEntries(file.text);
  const naive = naiveEntries(file.text);
  if (cliParse && JSON.stringify(cliParse(file.text)) !== JSON.stringify(Object.fromEntries(dot))) {
    out.push(`${file.name} is parsed differently by the CLI's dotenv than by the guard.`);
  }
  const relevant = (entries: [string, string][]) =>
    entries.filter(([k]) => RELEVANT_NAME.test(k)).map(([k, v]) => [k.toUpperCase(), v] as const);
  const dotRelevant = relevant(dot);
  const naiveRelevant = relevant(naive);
  const duplicated = new Set<string>();
  for (const view of [dotRelevant, naiveRelevant]) {
    const seen = new Set<string>();
    for (const [k] of view) (seen.has(k) ? duplicated : seen).add(k);
  }
  for (const k of duplicated) {
    out.push(`${file.name} sets ${k} more than once; dotenv keeps the last one, so it is refused as ambiguous.`);
  }
  if (JSON.stringify(dotRelevant) !== JSON.stringify(naiveRelevant)) {
    out.push(
      `${file.name} has Convex/dotenv lines that dotenv reads differently from a plain line-by-line read ` +
        "(a multi-line quoted value, `KEY:value` without a space, or similar); refused as ambiguous.",
    );
  }
  const credential = CREDENTIAL_TEXT.exec(file.text);
  if (credential && !dot.some(([k]) => CREDENTIAL_TEXT.test(k))) {
    out.push(`${file.name} mentions ${credential[0]} inside another value or comment; refused as ambiguous.`);
  }
  return out;
}

/**
 * Where the wrapped CLI would point, replaying its own steps: the spawn env, then `.env.local` and
 * `.env` filled in without overriding (case-insensitively on Windows), then deployment selection
 * (getDeploymentSelectionFromEnv in cli/lib/deploymentSelection.js). `local` only for the
 * wrapper's own anonymous deployment; anything else that selects a target is `cloud`; no
 * selection (the CLI would fall back to convex.json or login) is `unknown`.
 */
export function resolveCliTarget(input: {
  childEnv: Env;
  fileSources: EnvSource[];
  projectLinked?: boolean;
  platform?: NodeJS.Platform;
}): { target: TargetClass; reason: string } {
  const platform = input.platform ?? process.platform;
  const env: Env = { ...input.childEnv };
  const has = (k: string) =>
    platform === "win32" ? Object.keys(env).some((x) => x.toUpperCase() === k.toUpperCase()) : k in env;
  const get = (k: string) => (platform === "win32" ? valuesFor(env, k)[0] : env[k]);
  for (const name of [".env.local", ".env"]) {
    const source = input.fileSources.find((s) => s.name === name);
    for (const [k, v] of Object.entries(source?.env ?? {})) if (!has(k)) env[k] = v;
  }
  const deployKey = get("CONVEX_DEPLOY_KEY");
  // The CLI treats an empty deploy key as unset; caller-env-clean still refuses one.
  if (deployKey && deployKey !== DEPLOY_KEY_SENTINEL) return { target: "cloud", reason: "a deploy key is set" };
  if (get("CONVEX_OVERRIDE_ACCESS_TOKEN")) return { target: "cloud", reason: "an access token override is set" };
  if (get("CONVEX_PROVISION_HOST")) return { target: "unknown", reason: "CONVEX_PROVISION_HOST redirects the CLI" };
  const selfHosted = get("CONVEX_SELF_HOSTED_URL");
  if (selfHosted && get("CONVEX_SELF_HOSTED_ADMIN_KEY")) {
    return isLoopbackUrl(selfHosted)
      ? { target: "unknown", reason: "a self-hosted deployment is selected" }
      : { target: "cloud", reason: "a non-loopback self-hosted deployment is selected" };
  }
  const deployment = get("CONVEX_DEPLOYMENT");
  if (deployment) {
    if (deployment !== ANONYMOUS_DEPLOYMENT) {
      return ANONYMOUS_PATTERN.test(deployment)
        ? { target: "unknown", reason: "a different anonymous deployment is selected" }
        : { target: "cloud", reason: "a non-anonymous CONVEX_DEPLOYMENT is selected" };
    }
    if (get("CONVEX_ALLOW_ANONYMOUS") === "false") return { target: "unknown", reason: "anonymous mode is turned off" };
    return { target: "local", reason: `${ANONYMOUS_DEPLOYMENT} is selected` };
  }
  return {
    target: "unknown",
    reason: input.projectLinked
      ? "no deployment is selected; the CLI would use convex.json's team/project"
      : "no deployment is selected; the CLI would fall back to login",
  };
}

export type RuleResult = { rule: string; violations: string[]; skipped?: boolean };

export function guardReport(input: GuardInput): RuleResult[] {
  const fileSources = input.sources.filter((s) => s.name === ".env.local" || s.name === ".env");
  const otherSources = input.sources.filter((s) => !fileSources.includes(s));
  let cliParse: ((src: string) => Record<string, string>) | undefined;
  let parserError = input.parserError;
  if (input.envFiles && input.envFiles.length > 0 && !parserError) {
    try {
      cliParse = loadCliDotenv().parse;
    } catch (err) {
      parserError = (err as Error).message;
    }
  }
  const resolved = resolveCliTarget({
    childEnv: input.childEnv,
    fileSources,
    projectLinked: input.projectLinked,
    platform: input.platform,
  });
  return [
    { rule: "cli-version-tested", violations: versionViolations(input.cliVersion) },
    input.args === null
      ? { rule: "subcommand-and-flags", violations: [], skipped: true }
      : { rule: "subcommand-and-flags", violations: argViolations(input.args) },
    input.cliArgs === undefined
      ? { rule: "backend-version-pinned", violations: [], skipped: true }
      : { rule: "backend-version-pinned", violations: pinnedBackendViolations(input.cliArgs) },
    { rule: "caller-env-clean", violations: otherSources.flatMap(envViolations) },
    { rule: "env-files-clean", violations: fileSources.flatMap(envViolations) },
    {
      rule: "env-files-unambiguous",
      violations: [
        ...(parserError ? [`The CLI's bundled dotenv could not be loaded (${parserError}).`] : []),
        ...(input.envFiles ?? []).flatMap((f) => envFileAmbiguities(f, cliParse)),
      ],
    },
    {
      rule: "no-dotenv-vault",
      violations: input.vaultFiles.map((f) => `${f} exists; dotenv can decrypt it into the CLI's env, so it is refused.`),
    },
    {
      rule: "no-convex-json-project-link",
      violations: input.projectLinked ? ["convex.json links a team/project (or can't be read), a CLI fallback to the cloud."] : [],
    },
    input.skipEnvLocalPort
      ? { rule: "env-local-points-here", violations: [], skipped: true }
      : { rule: "env-local-points-here", violations: envLocalPortViolations(input.sources, input.appPort) },
    { rule: "child-env-pinned", violations: childPinViolations(input.childEnv) },
    { rule: "owner-login-hidden", violations: homeViolations(input) },
    { rule: "owner-cache-untouched", violations: cacheViolations(input) },
    {
      rule: "resolved-target-local",
      violations: resolved.target === "local" ? [] : [`The CLI would target ${resolved.target}: ${resolved.reason}.`],
    },
  ];
}

export function guardViolations(input: GuardInput): string[] {
  return guardReport(input).flatMap((r) => r.violations);
}

export function assertGuard(input: GuardInput): void {
  const violations = guardViolations(input);
  if (violations.length > 0) throw new GuardError(violations);
}

export type CliEnvFiles = {
  sources: EnvSource[];
  envFiles: EnvFile[];
  vaultFiles: string[];
  projectLinked: boolean;
  parserError?: string;
};

/** The env files the Convex CLI loads from its working directory, plus vault files and convex.json. */
export function readCliEnvFiles(cwd: string): CliEnvFiles {
  let parserError: string | undefined;
  const envFiles: EnvFile[] = [".env.local", ".env"].flatMap((name) => {
    const full = path.join(cwd, name);
    return fs.existsSync(full) && fs.statSync(full).isFile() ? [{ name, text: fs.readFileSync(full, "utf8") }] : [];
  });
  const sources = envFiles.map(({ name, text }) => {
    let env: Record<string, string>;
    try {
      env = loadCliDotenv().parse(text);
    } catch (err) {
      parserError = (err as Error).message;
      env = Object.fromEntries(dotenvEntries(text));
    }
    // Check every assignment either view finds, not just the value dotenv keeps.
    return { name, env, entries: [...dotenvEntries(text), ...naiveEntries(text)] };
  });
  const vaultFiles = fs.existsSync(cwd) ? fs.readdirSync(cwd).filter((f) => /^\.env.*\.vault$/i.test(f)) : [];
  let projectLinked = false;
  const convexJson = path.join(cwd, "convex.json");
  if (fs.existsSync(convexJson)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(convexJson, "utf8")) as Record<string, unknown>;
      projectLinked = parsed.team !== undefined || parsed.project !== undefined;
    } catch {
      projectLinked = true;
    }
  }
  return { sources, envFiles, vaultFiles, projectLinked, parserError };
}
