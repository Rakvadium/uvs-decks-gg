import { execFileSync } from "node:child_process";
import path from "node:path";

export const OUTPUT_ROOT = path.join(process.cwd(), ".pr-captures");
export const MEDIA_BRANCH = "pr-media";

export type Auth = "agent" | "guest";
export type Mode = "light" | "dark";

export type Step =
  | { click: string }
  | { hover: string }
  | { press: string }
  | { fill: string; value: string }
  | { waitFor: string }
  | { wait: number };

export type RouteSpec = {
  path: string;
  auth: Auth;
  name?: string;
  steps?: Step[];
  /** Overrides --viewports for this route (e.g. a desktop-only menu). */
  viewports?: string[];
};

export type GifSpec = RouteSpec & { viewport?: string; theme?: string; mode?: Mode };

export type CaptureSpec = {
  routes: RouteSpec[];
  gif?: GifSpec;
};

export const VIEWPORTS: Record<string, { width: number; height: number; mobile: boolean }> = {
  desktop: { width: 1280, height: 800, mobile: false },
  mobile: { width: 390, height: 844, mobile: true },
};

export function parseArgs(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const [key, inline] = arg.slice(2).split("=", 2);
    if (inline !== undefined) out[key] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key] = argv[++i];
    else out[key] = true;
  }
  return out;
}

export function list(value: string | true | undefined, fallback: string[]): string[] {
  if (typeof value !== "string") return fallback;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * `gallery,/decks,guest:gallery` → routes. `guest:` means signed-out. The leading slash is
 * optional so Git Bash on Windows doesn't rewrite `/gallery` into a filesystem path.
 */
export function parseRouteList(value: string): RouteSpec[] {
  return list(value, []).map((entry) => {
    const guest = entry.startsWith("guest:");
    const route = guest ? entry.slice("guest:".length) : entry;
    return { path: `/${route.replace(/^\/+/, "")}`, auth: guest ? "guest" : "agent" };
  });
}

export function slug(value: string): string {
  const cleaned = value.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "root";
}

export function shotName(route: RouteSpec, viewport: string, theme: string, mode: Mode): string {
  const base = route.name ?? `${route.auth === "guest" ? "guest-" : ""}${slug(route.path)}`;
  return `${base}__${viewport}__${theme}__${mode}`;
}

export function requireIssue(args: Record<string, string | true>): string {
  const issue = args.issue;
  if (typeof issue !== "string" || !/^\d+$/.test(issue)) {
    throw new Error("--issue <number> is required");
  }
  return issue;
}

export function requireLabel(value: string | true | undefined, flag: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][\w.-]*$/.test(value)) {
    throw new Error(`${flag} <label> is required (letters, digits, . _ -)`);
  }
  return value;
}

export function git(args: string[], options: { input?: string; env?: NodeJS.ProcessEnv } = {}): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    input: options.input,
    env: options.env,
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

/** `owner/repo` from the origin remote (https or ssh). */
export function repoSlug(remoteUrl = git(["remote", "get-url", "origin"])): string {
  const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) throw new Error(`origin is not a GitHub remote: ${remoteUrl}`);
  return match[1];
}

export function rawUrl(repo: string, relativePath: string): string {
  const encoded = relativePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${repo}/${MEDIA_BRANCH}/${encoded}`;
}

/**
 * Shares one load per key across concurrent callers. A failed load is forgotten (once, by the load
 * itself) so the next caller retries; a late waiter on the failure can't evict a newer retry.
 */
export function cachedLoad<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing;
  const promise = load();
  cache.set(key, promise);
  promise.catch(() => {
    if (cache.get(key) === promise) cache.delete(key);
  });
  return promise;
}
