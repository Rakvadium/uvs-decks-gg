/**
 * The Node side of capture's validation-backend wiring: runs the Bun-only checks and helpers in
 * subprocesses (validation.ts, `bun run agent:login-url`) and checks what comes back.
 * One-time login codes only ever live in this process's memory and in the sign-in page's URL
 * fragment; they are never logged, written to the manifest, or passed through an env var.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Same marker as validation.ts's RESULT_PREFIX (not imported: that module is Bun-only). */
const RESULT_PREFIX = "PR_CAPTURE_RESULT ";
const HELPER = path.join(process.cwd(), "scripts", "pr-capture", "validation.ts");

/**
 * Test-only: a file outside the checkout that every minted login code is appended to, so a
 * verifier can grep capture output for codes that were really used. Codes are single use and
 * expire after 60 seconds, and capture redeems each one right away.
 */
export const CODE_SINK_ENV = "PR_CAPTURE_TEST_CODE_SINK";

export type Preflight = {
  appPort: number;
  convexUrl: string;
  convexPort: number;
  seed: { seedVersion: number; catalogVersion: number; sha256: string; reseeded: boolean };
  catalog: { version: number; url: string; sha256: string; path: string };
};

export type PinnedCatalog = { version: number; url: string; sha256: string; body: Buffer };

type Run = { code: number; stdout: string; stderr: string };

/** Runs `bun <args>` in the checkout. stderr is passed through unless `quiet` (then kept for errors). */
function runBun(args: string[], opts: { quiet?: boolean } = {}): Promise<Run> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", args, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")));
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (!opts.quiet) process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code: code ?? (signal ? 1 : 0), stdout, stderr }));
  });
}

/** The one `RESULT_PREFIX` line validation.ts prints. */
export function parseHelperResult<T>(stdout: string): T {
  const line = stdout.split(/\r?\n/).find((l) => l.startsWith(RESULT_PREFIX));
  if (!line) throw new Error("the validation helper printed no result");
  return JSON.parse(line.slice(RESULT_PREFIX.length)) as T;
}

async function helper<T>(args: string[], what: string): Promise<T> {
  const run = await runBun([HELPER, ...args]);
  if (run.code !== 0) throw new Error(`${what} failed (exit ${run.code}); see the messages above. Nothing was captured.`);
  return parseHelperResult<T>(run.stdout);
}

/**
 * agent:setup's env-file check (every file Next.js can load, plus the shell), `vconvex --check`,
 * the backend's validation status and its seed meta, and the pinned catalog file. Throws on any
 * refusal: capture never falls back to another target.
 */
export function validationPreflight(appPort: number, reseed: boolean): Promise<Preflight> {
  return helper<Preflight>(["preflight", "--app-port", String(appPort), ...(reseed ? ["--reseed"] : [])], "capture preflight");
}

export function ensureSession(appPort: number, persona: string) {
  return helper<{ persona: string; email: string; sessionCreated: boolean }>(
    ["ensure-session", "--app-port", String(appPort), "--persona", persona],
    `ensure-session for persona ${persona}`,
  );
}

/** The backend's hosts as the browser can name them. */
export function backendHosts(convexPort: number): string[] {
  return [`127.0.0.1:${convexPort}`, `localhost:${convexPort}`];
}

/** Reads the verified catalog file again and checks its sha256 here too, so a swapped file can't be served. */
export function loadPinnedCatalog(pin: Preflight["catalog"]): PinnedCatalog {
  const body = fs.readFileSync(pin.path);
  const actual = createHash("sha256").update(body).digest("hex");
  if (actual !== pin.sha256) throw new Error(`pinned catalog ${pin.path} has sha256 ${actual}, the pin is ${pin.sha256}`);
  return { version: pin.version, url: pin.url, sha256: pin.sha256, body };
}

/** `agent:login-url`'s stderr names the persona it minted for: `[agent:login-url] <email>, single use, ...`. */
export function mintedEmail(stderr: string): string | null {
  return /^\[agent:login-url\] (\S+@\S+), single use/m.exec(stderr)?.[1] ?? null;
}

/**
 * Checks a minted URL is `<baseUrl>/agent-login#code=…` with nothing else that could carry the
 * code to a server (no query string). Errors never include the URL.
 */
export function checkLoginUrl(raw: string, baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("agent:login-url printed something that is not a URL (not shown)");
  }
  const base = new URL(baseUrl);
  if (url.origin !== base.origin || url.pathname !== "/agent-login" || url.search !== "") {
    throw new Error(`agent:login-url printed a URL for ${url.origin}${url.pathname}, expected ${base.origin}/agent-login with only a #code fragment`);
  }
  if (!new URLSearchParams(url.hash.slice(1)).get("code")) throw new Error("agent:login-url printed a URL without a #code fragment");
  return url.href;
}

/**
 * Mints a fresh single-use code for `persona` with `bun run agent:login-url` (agentLogin:mintCode
 * through the guarded wrapper) and returns its `/agent-login#code=…` URL. Refuses unless the code
 * is for `<persona>@validation.invalid`.
 */
export async function mintLoginUrl(appPort: number, persona: string, baseUrl: string): Promise<{ url: string; email: string }> {
  const run = await runBun(["run", "agent:login-url", "--", "--app-port", String(appPort), "--persona", persona, "--next", "/decks"], {
    quiet: true,
  });
  // agent:login-url prints the URL (the only place the code is) on stdout and nothing else there.
  if (run.code !== 0) throw new Error(`agent:login-url failed (exit ${run.code}):\n${run.stderr.trim()}`);
  const email = mintedEmail(run.stderr);
  const expected = `${persona}@validation.invalid`;
  if (email !== expected) throw new Error(`agent:login-url minted a code for ${email ?? "an unnamed user"}, expected ${expected}; refusing.`);
  const url = checkLoginUrl(run.stdout.trim().split(/\r?\n/).at(-1) ?? "", baseUrl);
  recordCodeForTest(url);
  return { url, email };
}

/** The test-only code sink file, or null when unset. Refused inside the checkout, where capture output lives. */
export function codeSinkFile(env: Record<string, string | undefined> = process.env, cwd = process.cwd()): string | null {
  const sink = env[CODE_SINK_ENV];
  if (!sink) return null;
  const file = path.resolve(cwd, sink);
  const rel = path.relative(cwd, file);
  if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) throw new Error(`${CODE_SINK_ENV} must be outside the checkout`);
  return file;
}

function recordCodeForTest(url: string) {
  const file = codeSinkFile();
  if (file) fs.appendFileSync(file, `${new URLSearchParams(new URL(url).hash.slice(1)).get("code")}\n`);
}

/**
 * `--clock`: epoch milliseconds or an ISO date. A time later than now is refused: the auth client
 * would treat its fresh token as expired and keep refreshing it.
 */
export function parseClock(value: string | true | undefined, now = Date.now()): number | null {
  if (value === undefined) return null;
  if (value === true) throw new Error("--clock needs a value (epoch ms or an ISO date)");
  const epoch = /^\d+$/.test(value) ? Number(value) : Date.parse(value);
  if (!Number.isFinite(epoch)) throw new Error("--clock must be epoch milliseconds or an ISO date");
  if (epoch > now) throw new Error("--clock can't be later than now");
  return epoch;
}
