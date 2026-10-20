/**
 * `agent:setup` after dependencies are installed: env-file refusal, port claim, `.env.local`
 * template, backend start, seed check and smoke test. Every env file is read through guard.ts
 * (the CLI's own dotenv), and every Convex call goes through `vconvex` / `validation:backend`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { isPortFree, status } from "../validation/backend";
import { checkInvocation, formatCheck } from "../validation/convex";
import { ANONYMOUS_DEPLOYMENT, envFileAmbiguities, envViolations, loadCliDotenv, readCliEnvFiles } from "../validation/guard";
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
import type { SetupArgs } from "./preflight";

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
 * Problems with the env files the Convex CLI would load from `cwd` (`.env.local`, `.env`), checked
 * with guard.ts's own rules: forbidden names, a non-`anonymous:` deployment, a non-loopback Convex
 * URL, ambiguous lines, vault files, a project-linked convex.json. Plus any production secret name.
 * Messages carry names, never secret values. No files → no problems.
 */
export function envFileProblems(cwd: string): string[] {
  const files = readCliEnvFiles(cwd);
  const out: string[] = [];
  let cliParse: ((src: string) => Record<string, string>) | undefined;
  if (files.parserError) out.push(`The CLI's bundled dotenv could not be loaded (${files.parserError}).`);
  else if (files.envFiles.length > 0) cliParse = loadCliDotenv().parse;
  for (const source of files.sources) {
    out.push(...envViolations(source));
    const names = new Set((source.entries ?? Object.entries(source.env)).map(([k]) => k.toUpperCase()));
    for (const name of PRODUCTION_SECRET_NAMES) {
      if (names.has(name)) out.push(`${name} is set in ${source.name}: that is a cloud deployment secret.`);
    }
  }
  for (const file of files.envFiles) out.push(...envFileAmbiguities(file, cliParse));
  for (const vault of files.vaultFiles) out.push(`${vault} exists; dotenv can decrypt it into the CLI's env.`);
  if (files.projectLinked) out.push("convex.json links a team/project (or can't be read), a CLI fallback to the cloud.");
  return [...new Set(out)];
}

/**
 * Step 2: refuse, before anything else runs, when an env file, or the shell agent:setup runs in,
 * could point anywhere but a local backend. Bun loads `.env.local` into `env` too, so a file
 * problem can show up twice, once per source.
 */
export function assertEnvFilesLocal(cwd: string, env: Record<string, string | undefined> = process.env): void {
  const fileProblems = envFileProblems(cwd);
  const shellProblems = envViolations({ name: "the caller's environment", env: { ...env } });
  if (fileProblems.length === 0 && shellProblems.length === 0) return;
  throw new Error(
    [
      "agent:setup refused: this worktree's env is not local-only. Nothing was changed; .env.local was left as it is.",
      ...[...fileProblems, ...shellProblems].map((p) => `  - ${p}`),
      ...(fileProblems.length > 0
        ? [
            "A worktree's .env.local must never be a copy of the main checkout's. Move it aside (it may hold live secrets) and rerun;",
            "agent:setup then writes a loopback-only .env.local from its template.",
          ]
        : []),
      ...(shellProblems.length > 0
        ? ["Unset those in this shell and rerun. A shell that injects cloud Convex credentials (Cursor Cloud) has no local Convex route."]
        : []),
    ].join("\n"),
  );
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

/** Writes the template when `.env.local` is missing (never overwrites), then re-checks it. */
export function ensureEnvLocal(cwd: string, appPort: number): "written" | "kept" {
  const file = path.join(cwd, ".env.local");
  if (fs.existsSync(file)) return "kept";
  fs.writeFileSync(file, envLocalTemplate(appPort), { flag: "wx" });
  const problems = envFileProblems(cwd);
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
