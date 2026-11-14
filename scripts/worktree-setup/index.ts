/**
 * Points a git worktree at the main checkout's local Convex backend and gives it its own
 * dev-server port. `--audit` lists every worktree's Convex target instead.
 * See docs/local-convex.md.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import {
  MAIN_DEV_PORT,
  deploymentKind,
  pickPort,
  readEnvValue,
  withPort,
  type DeploymentKind,
} from "../lib/local-env";

function git(args: string[], cwd = process.cwd()): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function readEnvFile(dir: string): string | null {
  const path = join(dir, ".env.local");
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

function listWorktrees(): string[] {
  return git(["worktree", "list", "--porcelain"])
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .map((line) => resolve(line.slice("worktree ".length)));
}

function portIsFree(port: number): Promise<boolean> {
  return new Promise((done) => {
    const server = createServer();
    server.once("error", () => done(false));
    server.listen(port, () => server.close(() => done(true)));
  });
}

const KIND_LABEL: Record<DeploymentKind, string> = {
  local: "local backend",
  anonymous: "anonymous local backend (separate, empty data)",
  cloud: "CLOUD deployment (live data, convex dev pushes to it)",
  missing: "no .env.local",
};

function audit(): void {
  for (const dir of listWorktrees()) {
    const env = readEnvFile(dir);
    const kind = env ? deploymentKind(env) : "missing";
    const port = env ? readEnvValue(env, "PORT") : null;
    const flag = kind === "cloud" ? "!!" : "  ";
    console.log(`${flag} ${dir}\n     ${KIND_LABEL[kind]}${port ? `, PORT=${port}` : ""}`);
  }
}

async function setup(args: string[]): Promise<void> {
  const force = args.includes("--force");
  const portArg = args.find((arg) => arg.startsWith("--port="));

  const root = resolve(git(["rev-parse", "--show-toplevel"]));
  const mainCheckout = resolve(dirname(git(["rev-parse", "--path-format=absolute", "--git-common-dir"])));
  if (root === mainCheckout) {
    throw new Error("Run this inside a worktree. The main checkout owns the local backend.");
  }

  const mainEnv = readEnvFile(mainCheckout);
  if (!mainEnv || deploymentKind(mainEnv) !== "local") {
    throw new Error(
      `${join(mainCheckout, ".env.local")} must exist with CONVEX_DEPLOYMENT=local:… ` +
        "(docs/local-convex.md). Refusing to copy a cloud deployment into a worktree."
    );
  }

  const existing = readEnvFile(root);
  if (existing && deploymentKind(existing) === "local" && readEnvValue(existing, "PORT") && !force) {
    console.log(`Already set up (PORT=${readEnvValue(existing, "PORT")}). Pass --force to redo it.`);
    return;
  }

  let port: number | null;
  if (portArg) {
    port = Number(portArg.slice("--port=".length));
    if (!Number.isInteger(port) || port <= 0) throw new Error(`Invalid ${portArg}`);
  } else {
    const taken = new Set<number>([MAIN_DEV_PORT]);
    for (const dir of listWorktrees()) {
      const value = dir === root ? null : readEnvValue(readEnvFile(dir) ?? "", "PORT");
      if (value) taken.add(Number(value));
    }
    port = pickPort(taken);
    while (port !== null && !(await portIsFree(port))) {
      taken.add(port);
      port = pickPort(taken);
    }
    if (port === null) throw new Error("No free port in 8091–8099. Pass --port=<n>.");
  }

  if (existing) {
    const backup = join(root, `.env.local.bak-${Date.now()}`);
    copyFileSync(join(root, ".env.local"), backup);
    console.log(`Backed up the old .env.local (${KIND_LABEL[deploymentKind(existing)]}) to ${backup}`);
  }
  writeFileSync(join(root, ".env.local"), withPort(mainEnv, port));

  console.log(`Wrote .env.local: shared local Convex backend, PORT=${port}.
Run \`bun run dev\`, then open:
  http://tcgdecks.localhost:${port}            (apex: game picker, sign-in)
  http://uvs.tcgdecks.localhost:${port}/gallery
  http://cyberpunk.tcgdecks.localhost:${port}/gallery
\`bunx convex dev\` must be running in exactly one checkout. It pushes that checkout's convex/
code to the shared backend, so run it here only while testing this worktree's backend changes.`);
}

const args = process.argv.slice(2);
try {
  if (args.includes("--audit")) audit();
  else await setup(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
