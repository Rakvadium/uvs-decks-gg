import fs from "node:fs";
import path from "node:path";
import { isLoopbackUrl } from "../../convex/lib/validationBackend";
import { backendDir, sharedCacheDir } from "./ports";

/**
 * The only deployment the wrapped CLI may target. Agent mode always names its deployment
 * `anonymous-agent`, and each backend has its own config dir, so the name is the same per port.
 */
export const ANONYMOUS_DEPLOYMENT = "anonymous:anonymous-agent";
const ANONYMOUS_PATTERN = /^anonymous:anonymous-[A-Za-z0-9_-]+$/;

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

/** Flags that pick a different deployment, add credentials, or override the wrapper's fixed ports. */
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
  "--local-cloud-port",
  "--local-site-port",
];

/** Present at all (non-empty) means refuse: these carry cloud credentials or redirect the CLI. */
export const FORBIDDEN_ENV = ["CONVEX_DEPLOY_KEY", "CONVEX_OVERRIDE_ACCESS_TOKEN", "CONVEX_PROVISION_HOST"];

const CONVEX_URL_VAR = /CONVEX.*URL/;

export type Env = Record<string, string | undefined>;

export type EnvSource = { name: string; env: Env };

export type GuardInput = {
  /** Args passed to the Convex CLI (wrapper flags already removed). */
  args: string[];
  /** Everything the CLI could read a deployment from: the caller's env, `.env.local`, `.env`. */
  sources: EnvSource[];
  /** The exact env the wrapped CLI will be spawned with. */
  childEnv: Env;
  appPort: number;
  /** `~/.uvs-validation` */
  root: string;
  /** The real user's home, which must stay invisible to the wrapped CLI. */
  realHome: string;
  platform?: NodeJS.Platform;
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

function samePath(a: string | undefined, b: string, platform: NodeJS.Platform): boolean {
  if (!a) return false;
  const norm = (p: string) => (platform === "win32" ? path.resolve(p).toLowerCase() : path.resolve(p));
  return norm(a) === norm(b);
}

function isInside(child: string | undefined, parent: string, platform: NodeJS.Platform): boolean {
  if (!child) return false;
  const norm = (p: string) => (platform === "win32" ? path.resolve(p).toLowerCase() : path.resolve(p));
  const rel = path.relative(norm(parent), norm(child));
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
    if (arg.startsWith("--") && FORBIDDEN_FLAGS.includes(flagName(arg))) {
      out.push(`Flag \`${flagName(arg)}\` is forbidden.`);
    }
  }
  return out;
}

export function envViolations(source: EnvSource): string[] {
  const out: string[] = [];
  for (const name of FORBIDDEN_ENV) {
    if (source.env[name]) out.push(`${name} is set in ${source.name}.`);
  }
  const deployment = source.env.CONVEX_DEPLOYMENT;
  if (deployment && !ANONYMOUS_PATTERN.test(deployment)) {
    out.push(`CONVEX_DEPLOYMENT in ${source.name} is \`${deployment}\`, not an \`anonymous:\` local deployment.`);
  }
  for (const [name, value] of Object.entries(source.env)) {
    if (CONVEX_URL_VAR.test(name) && value && !isLoopbackUrl(value)) {
      out.push(`${name} in ${source.name} is not a loopback URL.`);
    }
  }
  return out;
}

export function childEnvViolations(input: GuardInput): string[] {
  const platform = input.platform ?? process.platform;
  const { childEnv } = input;
  const out = envViolations({ name: "the wrapped CLI env", env: childEnv });
  if (childEnv.CONVEX_AGENT_MODE !== "anonymous") out.push("CONVEX_AGENT_MODE must be `anonymous`.");
  if (!childEnv.CONVEX_DEPLOYMENT || !ANONYMOUS_PATTERN.test(childEnv.CONVEX_DEPLOYMENT)) {
    out.push("The wrapped CLI must get an explicit `anonymous:` CONVEX_DEPLOYMENT.");
  }
  const home = backendDir(input.appPort, input.root);
  if (samePath(home, input.realHome, platform)) out.push("The backend home must not be the real home directory.");
  for (const name of ["USERPROFILE", "HOME"]) {
    if (!samePath(childEnv[name], home, platform)) out.push(`${name} must be ${home} so the owner's Convex login is hidden.`);
  }
  if (platform === "win32" && !isInside(childEnv.LOCALAPPDATA, sharedCacheDir(input.root), platform)) {
    out.push(`LOCALAPPDATA must be inside ${sharedCacheDir(input.root)} so the owner's Convex cache is untouched.`);
  }
  return out;
}

export function guardViolations(input: GuardInput): string[] {
  return [
    ...argViolations(input.args),
    ...input.sources.flatMap(envViolations),
    ...childEnvViolations(input),
  ];
}

export function assertGuard(input: GuardInput): void {
  const violations = guardViolations(input);
  if (violations.length > 0) throw new GuardError(violations);
}

/** Minimal dotenv parser: `KEY=value`, optional `export`, quotes, `#` comments. */
export function parseDotenv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'" || quote === "`") && value.lastIndexOf(quote) > 0) {
      value = value.slice(1, value.lastIndexOf(quote));
    } else {
      value = value.replace(/\s+#.*$/, "");
    }
    out[match[1]] = value;
  }
  return out;
}

/** The env files the Convex CLI loads from its working directory. */
export function readCliEnvFiles(cwd: string): EnvSource[] {
  return [".env.local", ".env"].flatMap((file) => {
    const full = path.join(cwd, file);
    return fs.existsSync(full) ? [{ name: file, env: parseDotenv(fs.readFileSync(full, "utf8")) }] : [];
  });
}
