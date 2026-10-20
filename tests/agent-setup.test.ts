import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertLinkedWorktree,
  assertNoEnvFilesBeforeInstall,
  assertShellNodeEnv,
  isMainCheckout,
  parseSetupArgs,
  shellNodeEnvProblems,
  spawnSyncStarted,
  withoutGitEnv,
} from "../scripts/agent-setup/preflight";
import {
  NEXT_ENV_FILES,
  allocatePort,
  assertEnvFilesLocal,
  ensureEnvLocal,
  envFileProblems,
  envLocalTemplate,
  installEnv,
  nextEnvFiles,
  nextResolvedEnv,
  type AllocateOptions,
} from "../scripts/agent-setup/setup";
import { checkInvocation } from "../scripts/validation/convex";
import { backendDir, portsFor, readRegistry } from "../scripts/validation/ports";

const tmpRoots: string[] = [];
function tmpDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tmpRoots.push(dir);
  return dir;
}
afterAll(() => {
  for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true });
});

const PORTS_MODULE = pathToFileURL(path.resolve(import.meta.dir, "..", "scripts", "validation", "ports.ts")).href;

describe("arguments", () => {
  test("--port is required and must be auto or 8100-8199", () => {
    expect(() => parseSetupArgs([])).toThrow(/--port is required/);
    expect(() => parseSetupArgs(["--port", "8090"])).toThrow();
    expect(() => parseSetupArgs(["--port", "3400"])).toThrow();
    expect(() => parseSetupArgs(["--port"])).toThrow(/needs a value/);
    expect(parseSetupArgs(["--port", "auto"]).port).toBe("auto");
    expect(parseSetupArgs(["--", "--port", "8170"]).port).toBe(8170);
  });

  test("flags and --port-range", () => {
    const args = parseSetupArgs(["--port", "auto", "--port-range", "8170-8179", "--reseed", "--no-install", "--timeout", "90"]);
    expect(args).toMatchObject({ range: { min: 8170, max: 8179 }, reseed: true, install: false, allowMain: false, timeoutSec: 90 });
    expect(parseSetupArgs(["--port", "auto"]).range).toEqual({ min: 8100, max: 8199 });
    expect(() => parseSetupArgs(["--port", "auto", "--port-range", "8179-8170"])).toThrow(/empty/);
    expect(() => parseSetupArgs(["--port", "auto", "--port-range", "8000-8179"])).toThrow();
    expect(() => parseSetupArgs(["--port", "auto", "--prod"])).toThrow(/Unknown argument/);
  });
});

describe("main checkout refusal", () => {
  const git = (cwd: string, ...args: string[]) => {
    const r = spawnSyncStarted("git", ["-c", "user.email=agent@validation.invalid", "-c", "user.name=agent", ...args], { cwd, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  };

  test("refuses the main checkout, accepts a linked worktree, --allow-main overrides", () => {
    const main = tmpDir("agent-setup-main-");
    const linked = path.join(tmpDir("agent-setup-linked-"), "wt");
    git(main, "init", "-q");
    git(main, "commit", "-q", "--allow-empty", "-m", "init");
    git(main, "worktree", "add", "-q", linked);
    expect(isMainCheckout(main)).toBe(true);
    expect(isMainCheckout(linked)).toBe(false);
    expect(() => assertLinkedWorktree(main, false)).toThrow(/is the main checkout/);
    expect(() => assertLinkedWorktree(main, true)).not.toThrow();
    expect(() => assertLinkedWorktree(linked, false)).not.toThrow();
    expect(() => assertLinkedWorktree(path.join(main, "missing"), false)).toThrow();
    // GIT_* from the shell, or from an env file Bun loaded, can't make the main checkout look linked.
    const spoofed = path.join(main, ".git", "worktrees", "wt");
    for (const env of [{ GIT_DIR: spoofed }, { Git_Dir: spoofed }, { GIT_COMMON_DIR: path.join(linked, "nope") }, { GIT_WORK_TREE: linked, GIT_DIR: spoofed }]) {
      expect(() => assertLinkedWorktree(main, false, { ...process.env, ...env })).toThrow(/is the main checkout/);
    }
    // Nor the other way round: git, run without GIT_*, still agrees the linked worktree is linked.
    expect(() => assertLinkedWorktree(linked, false, { ...process.env, GIT_DIR: path.join(main, ".git") })).not.toThrow();
    expect(Object.keys(withoutGitEnv({ GIT_DIR: "x", git_ssh: "y", PATH: "p" }))).toEqual(["PATH"]);
  });
});

describe("before the first install", () => {
  test("a fresh worktree with any .env* entry is refused, by name, before anything runs", () => {
    const dir = tmpDir("agent-setup-fresh-");
    expect(() => assertNoEnvFilesBeforeInstall([dir])).not.toThrow();
    for (const name of [".env.local", ".env.development.local", ".env.production", ".env.staging", ".ENV", ".env.vault"]) {
      const one = tmpDir("agent-setup-fresh-");
      fs.writeFileSync(path.join(one, name), "X=1\n");
      expect(() => assertNoEnvFilesBeforeInstall([dir, one])).toThrow(new RegExp(name.replace(/\./g, "\\.")));
    }
    const linked = tmpDir("agent-setup-fresh-");
    fs.symlinkSync(tmpDir("agent-setup-outside-"), path.join(linked, ".env.local"), "junction");
    expect(() => assertNoEnvFilesBeforeInstall([linked])).toThrow(/\.env\.local/);
  });

  test("NODE_ENV in the shell must be unset or development", () => {
    expect(shellNodeEnvProblems({})).toEqual([]);
    expect(shellNodeEnvProblems({ NODE_ENV: "development" })).toEqual([]);
    for (const value of ["production", "test", "staging", "", "Development"]) {
      expect(() => assertShellNodeEnv({ NODE_ENV: value })).toThrow(/NODE_ENV is/);
    }
    expect(() => assertShellNodeEnv({ node_env: "production" })).toThrow(/NODE_ENV is "production"/);
  });
});

describe("env files", () => {
  const write = (dir: string, text: string, name = ".env.local") => {
    fs.writeFileSync(path.join(dir, name), text);
    return path.join(dir, name);
  };

  test("no env files: nothing to refuse", () => {
    expect(envFileProblems(tmpDir("agent-setup-env-"))).toEqual([]);
  });

  test("refuses a cloud .env.local and leaves it byte for byte untouched", () => {
    const dir = tmpDir("agent-setup-env-");
    const text = "CONVEX_DEPLOYMENT=dev:fake-deployment-123\r\nNEXT_PUBLIC_CONVEX_URL=https://fake-deployment-123.convex.invalid\r\n";
    const file = write(dir, text);
    const problems = envFileProblems(dir);
    expect(problems.some((p) => /CONVEX_DEPLOYMENT .*not an `anonymous:`/.test(p))).toBe(true);
    expect(problems.some((p) => /NEXT_PUBLIC_CONVEX_URL .*not a loopback URL/.test(p))).toBe(true);
    expect(() => assertEnvFilesLocal(dir, {})).toThrow(/agent:setup refused/);
    expect(ensureEnvLocal(dir, 8170)).toBe("kept");
    expect(fs.readFileSync(file, "utf8")).toBe(text);
  });

  test("refuses a shell that carries a deploy key or a cloud URL, even with a clean worktree", () => {
    const dir = tmpDir("agent-setup-env-");
    expect(() => assertEnvFilesLocal(dir, { PATH: "/bin" })).not.toThrow();
    expect(() => assertEnvFilesLocal(dir, { CONVEX_DEPLOY_KEY: "<placeholder>" })).toThrow(/CONVEX_DEPLOY_KEY is set in the caller's environment/);
    expect(() => assertEnvFilesLocal(dir, { CONVEX_URL: "https://fake-deployment-123.convex.invalid" })).toThrow(/not a loopback URL/);
    expect(fs.existsSync(path.join(dir, ".env.local"))).toBe(false);
  });

  test("values bun loaded from .env.local are reported once, as file problems", () => {
    const dir = tmpDir("agent-setup-env-");
    const cloud = "https://fake-deployment-123.convex.invalid";
    write(dir, `NEXT_PUBLIC_CONVEX_URL=${cloud}\n`);
    let message = "";
    try {
      assertEnvFilesLocal(dir, { NEXT_PUBLIC_CONVEX_URL: cloud, CONVEX_URL: cloud });
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain("NEXT_PUBLIC_CONVEX_URL in .env.local is not a loopback URL");
    expect(message).not.toContain("NEXT_PUBLIC_CONVEX_URL in the caller's environment");
    expect(message).toContain("CONVEX_URL in the caller's environment is not a loopback URL");
  });

  test("refuses production secret names next to a local deployment, without printing values", () => {
    const dir = tmpDir("agent-setup-env-");
    write(dir, `${envLocalTemplate(8170)}OPENAI_API_KEY=<placeholder-openai>\nagent_auth_password=<placeholder-password>\n`);
    const problems = envFileProblems(dir);
    expect(problems.some((p) => p.startsWith("OPENAI_API_KEY is set in .env.local"))).toBe(true);
    expect(problems.some((p) => p.startsWith("AGENT_AUTH_PASSWORD is set in .env.local"))).toBe(true);
    expect(problems.join("\n")).not.toContain("<placeholder");
  });

  test("refuses deploy keys (even empty), ambiguous lines and a cloud .env", () => {
    const empty = tmpDir("agent-setup-env-");
    write(empty, `${envLocalTemplate(8170)}CONVEX_DEPLOY_KEY=\n`);
    expect(envFileProblems(empty).some((p) => /CONVEX_DEPLOY_KEY is set/.test(p))).toBe(true);

    const dup = tmpDir("agent-setup-env-");
    write(dup, `${envLocalTemplate(8170)}NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3340\n`);
    expect(envFileProblems(dup).some((p) => /more than once/.test(p))).toBe(true);

    const dotEnv = tmpDir("agent-setup-env-");
    write(dotEnv, envLocalTemplate(8170));
    write(dotEnv, "CONVEX_URL=https://fake-deployment-123.convex.invalid\n", ".env");
    expect(envFileProblems(dotEnv).some((p) => /CONVEX_URL in \.env is not a loopback URL/.test(p))).toBe(true);
  });

  const CLOUD = "https://fake-deployment-123.convex.invalid";

  test("NEXT_ENV_FILES is exactly what the installed @next/env loadEnvConfig reads", () => {
    expect([...NEXT_ENV_FILES].sort()).toEqual([
      ".env",
      ".env.development",
      ".env.development.local",
      ".env.local",
      ".env.production",
      ".env.production.local",
      ".env.test",
      ".env.test.local",
    ]);
    expect(nextEnvFiles("development")).toEqual([".env.development.local", ".env.local", ".env.development", ".env"]);
    expect(nextEnvFiles("test")).toEqual([".env.test.local", ".env.test", ".env"]);
    // Pinned to the installed loader: if Next changes how it picks files, this fails.
    const src = fs.readFileSync(require.resolve("@next/env"), "utf8");
    for (const needle of ['c?"test":n?"development":"production"', '[`.env.${d}.local`,d!=="test"&&`.env.local`,`.env.${d}`,".env"]']) {
      expect(src).toContain(needle);
    }
  });

  for (const name of NEXT_ENV_FILES) {
    test(`${name}: a cloud URL, a cloud deployment, a deploy key or an ambiguous line is refused`, () => {
      const cases: [string, RegExp][] = [
        [`NEXT_PUBLIC_CONVEX_URL=${CLOUD}`, /NEXT_PUBLIC_CONVEX_URL in .* is not a loopback URL/],
        [`convex_url=${CLOUD}`, /convex_url in .* is not a loopback URL/],
        ["CONVEX_DEPLOYMENT=prod:fake-deployment-123", /not an `anonymous:` local deployment/],
        ["CONVEX_DEPLOY_KEY=<placeholder>", /CONVEX_DEPLOY_KEY is set in/],
        [`CONVEX_DEPLOYMENT=anonymous:anonymous-agent\nCONVEX_DEPLOYMENT:prod:x`, /reads differently|more than once/],
      ];
      for (const [line, pattern] of cases) {
        const dir = tmpDir("agent-setup-env-");
        const file = write(dir, `${line}\n`, name);
        const before = fs.readFileSync(file);
        const problems = envFileProblems(dir);
        expect(problems.some((p) => p.includes(name) && pattern.test(p))).toBe(true);
        expect(() => assertEnvFilesLocal(dir, {})).toThrow(/agent:setup refused/);
        expect(fs.readFileSync(file).equals(before)).toBe(true);
      }
    });
  }

  test("every NODE_ENV × env file: a cloud file is refused, and only an unset or development NODE_ENV passes", () => {
    for (const nodeEnv of [undefined, "development", "production", "test", "staging"]) {
      const shell = nodeEnv === undefined ? {} : { NODE_ENV: nodeEnv };
      for (const name of NEXT_ENV_FILES) {
        const dir = tmpDir("agent-setup-env-");
        write(dir, `NEXT_PUBLIC_CONVEX_URL=${CLOUD}\n`, name);
        expect(() => assertEnvFilesLocal(dir, shell)).toThrow(new RegExp(`NEXT_PUBLIC_CONVEX_URL in ${name.replace(/\./g, "\\.")} is not a loopback URL`));
      }
      const clean = tmpDir("agent-setup-env-");
      if (nodeEnv === undefined || nodeEnv === "development") expect(() => assertEnvFilesLocal(clean, shell)).not.toThrow();
      else expect(() => assertEnvFilesLocal(clean, shell)).toThrow(/NODE_ENV is/);
    }
  });

  test("the verifier's case: NODE_ENV=production plus a cloud .env.development.local next to a local .env.local", () => {
    const dir = tmpDir("agent-setup-env-");
    write(dir, envLocalTemplate(8170));
    write(dir, `NEXT_PUBLIC_CONVEX_URL=${CLOUD}\n`, ".env.development.local");
    let message = "";
    try {
      assertEnvFilesLocal(dir, { NODE_ENV: "production" });
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain("NEXT_PUBLIC_CONVEX_URL in .env.development.local is not a loopback URL");
    expect(message).toContain('NODE_ENV is "production"');
  });

  test("env files may only set allowlisted names: nothing that steers install, git or Node", () => {
    for (const line of [
      "PLAYWRIGHT_DOWNLOAD_HOST=https://fake-pw.convex.invalid",
      "BUN_INSTALL_CACHE_DIR=C:/x",
      "NPM_CONFIG_REGISTRY=https://fake-registry.invalid/",
      "HTTPS_PROXY=http://fake-proxy.invalid",
      "NODE_OPTIONS=--require x",
      "ESBUILD_BINARY_PATH=C:/x.exe",
      "GIT_DIR=C:/elsewhere/.git",
      "NODE_ENV=production",
    ]) {
      const dir = tmpDir("agent-setup-env-");
      write(dir, `${envLocalTemplate(8170)}${line}\n`);
      const name = line.split("=")[0];
      expect(envFileProblems(dir).some((p) => p.startsWith(`${name} is set in .env.local; agent worktree env files may only set`))).toBe(true);
    }
    const ok = tmpDir("agent-setup-env-");
    write(ok, `${envLocalTemplate(8170)}NEXT_PUBLIC_SITE_URL=http://localhost:8170\nAGENT_AUTH_SECRET=<placeholder>\n`);
    expect(envFileProblems(ok)).toEqual([]);
  });

  test("Next.js's own loader resolves each mode with its file priority and expansion", () => {
    const dir = tmpDir("agent-setup-env-");
    write(dir, "NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3440\nNEXT_PUBLIC_X=${NEXT_PUBLIC_CONVEX_URL}/x\n");
    write(dir, "NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3442\n", ".env.development.local");
    write(dir, "NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3444\n", ".env.test");
    const before = JSON.stringify(Object.entries(process.env).sort());
    const byMode = Object.fromEntries(nextResolvedEnv(dir).map((r) => [r.mode, r]));
    // Next's loader writes into process.env; it must come back exactly as it was.
    expect(JSON.stringify(Object.entries(process.env).sort())).toBe(before);
    expect(byMode.development).toMatchObject({
      files: [".env.development.local", ".env.local"],
      env: { NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3442", NEXT_PUBLIC_X: "http://127.0.0.1:3442/x" },
      errors: 0,
    });
    expect(byMode.production).toMatchObject({ files: [".env.local"], env: { NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3440" } });
    expect(byMode.test).toMatchObject({ files: [".env.test"], env: { NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3444" } });
  });

  test("links at env files are refused, and the template is never written through one", () => {
    const outside = tmpDir("agent-setup-outside-");
    const junction = tmpDir("agent-setup-env-");
    fs.symlinkSync(outside, path.join(junction, ".env.local"), "junction");
    expect(envFileProblems(junction)).toContain(".env.local is a symlink or junction; env files must be regular files, never links.");
    expect(() => assertEnvFilesLocal(junction, {})).toThrow(/agent:setup refused/);
    expect(() => ensureEnvLocal(junction, 8170)).toThrow(/never writes through a link/);
    expect(fs.readdirSync(outside)).toEqual([]);

    const dir = tmpDir("agent-setup-env-");
    fs.mkdirSync(path.join(dir, ".env.development"));
    expect(envFileProblems(dir)).toContain(".env.development is a directory; env files must be regular files, never links.");

    // File symlinks need Developer Mode or admin on Windows; skip that part where they can't be made.
    const dangling = tmpDir("agent-setup-env-");
    const target = path.join(outside, "does-not-exist.env");
    try {
      fs.symlinkSync(target, path.join(dangling, ".env.local"), "file");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EPERM") return;
      throw err;
    }
    expect(envFileProblems(dangling)).toContain(".env.local is a symlink or junction; env files must be regular files, never links.");
    expect(() => ensureEnvLocal(dangling, 8170)).toThrow(/never writes through a link/);
    expect(fs.existsSync(target)).toBe(false);
    const local = path.join(outside, "local.env");
    fs.writeFileSync(local, envLocalTemplate(8170));
    const linkedLocal = tmpDir("agent-setup-env-");
    fs.symlinkSync(local, path.join(linkedLocal, ".env.test.local"), "file");
    expect(envFileProblems(linkedLocal)).toContain(".env.test.local is a symlink or junction; env files must be regular files, never links.");
  });

  test("installEnv drops every name an env file assigns, in any letter case", () => {
    const dir = tmpDir("agent-setup-env-");
    write(dir, `${envLocalTemplate(8170)}playwright_download_host=https://fake-pw.convex.invalid\n`);
    write(dir, "BUN_INSTALL_CACHE_DIR=C:/x\n", ".env.whatever");
    const env = installEnv(dir, {
      PATH: "/bin",
      PLAYWRIGHT_DOWNLOAD_HOST: "https://fake-pw.convex.invalid",
      BUN_INSTALL_CACHE_DIR: "C:/x",
      NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3440",
      HOME: "/home/agent",
    });
    expect(env).toEqual({ PATH: "/bin", HOME: "/home/agent" });
  });

  test("the template is written only when missing and passes the full vconvex guard for its port", () => {
    const dir = tmpDir("agent-setup-env-");
    const root = tmpDir("agent-setup-root-");
    expect(ensureEnvLocal(dir, 8170)).toBe("written");
    const text = fs.readFileSync(path.join(dir, ".env.local"), "utf8");
    expect(text).toContain(`NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:${portsFor(8170).cloud}`);
    expect(envFileProblems(dir)).toEqual([]);
    expect(ensureEnvLocal(dir, 8171)).toBe("kept");
    expect(fs.readFileSync(path.join(dir, ".env.local"), "utf8")).toBe(text);

    const check = (port: number) =>
      checkInvocation({ argv: ["--app-port", String(port), "--check"], cwd: dir, root, parentEnv: { PATH: process.env.PATH } });
    expect(check(8170)).toMatchObject({ ok: true, target: "local" });
    const other = check(8171);
    expect(other.ok).toBe(false);
    expect(other.rules.filter((r) => r.status === "fail").map((r) => r.rule)).toEqual(["env-local-points-here"]);
  });
});

describe("port allocation", () => {
  const RANGE = { min: 8170, max: 8173 };
  const probes = (busyPorts: number[], running: number[] = []): Pick<AllocateOptions, "isFree" | "backendRunning"> => ({
    isFree: async (port) => !busyPorts.includes(port),
    backendRunning: async (appPort) => running.includes(appPort),
  });

  test("auto skips busy ports and old backend dirs, then reuses the worktree's claim", async () => {
    const root = tmpDir("agent-setup-root-");
    fs.mkdirSync(backendDir(8172, root), { recursive: true });
    const busy = probes([portsFor(8170).cloud]);
    const a = await allocatePort({ worktree: "/wt/a", requested: "auto", range: RANGE, root, ...busy });
    expect(a).toMatchObject({ appPort: 8171, reused: false });
    const b = await allocatePort({ worktree: "/wt/b", requested: "auto", range: RANGE, root, ...busy });
    expect(b.appPort).toBe(8173);
    const again = await allocatePort({ worktree: "/wt/a", requested: "auto", range: RANGE, root, ...probes([])});
    expect(again).toMatchObject({ appPort: 8171, reused: true });
    await expect(allocatePort({ worktree: "/wt/c", requested: "auto", range: RANGE, root, ...busy })).rejects.toThrow(
      /No free validation app ports left in 8170-8173/,
    );
    expect(Object.values(readRegistry(root)).sort()).toEqual([8171, 8173]);
  });

  test("collisions: a port held by another worktree, or one that is in use, is refused", async () => {
    const root = tmpDir("agent-setup-root-");
    await allocatePort({ worktree: "/wt/a", requested: 8170, range: RANGE, root, ...probes([]) });
    await expect(allocatePort({ worktree: "/wt/b", requested: 8170, range: RANGE, root, ...probes([]) })).rejects.toThrow(
      /already claimed by/,
    );
    // The holder's backend is up too: the message still names the registry claim.
    const held = portsFor(8170);
    await expect(
      allocatePort({ worktree: "/wt/b", requested: 8170, range: RANGE, root, ...probes([held.cloud, held.site]) }),
    ).rejects.toThrow(/already claimed by/);
    await expect(
      allocatePort({ worktree: "/wt/b", requested: 8171, range: RANGE, root, ...probes([portsFor(8171).site]) }),
    ).rejects.toThrow(/in use/);
    expect(Object.values(readRegistry(root))).toEqual([8170]);
  });

  test("a reused claim may be busy only because its own backend or next dev runs", async () => {
    const root = tmpDir("agent-setup-root-");
    await allocatePort({ worktree: "/wt/a", requested: "auto", range: RANGE, root, ...probes([]) });
    const own = portsFor(8170);
    await expect(
      allocatePort({ worktree: "/wt/a", requested: "auto", range: RANGE, root, ...probes([own.cloud]) }),
    ).rejects.toThrow(/backend is not running/);
    const running = await allocatePort({
      worktree: "/wt/a",
      requested: "auto",
      range: RANGE,
      root,
      ...probes([own.app, own.cloud, own.site], [8170]),
    });
    expect(running).toMatchObject({ appPort: 8170, reused: true });
    expect(running.notes.join()).toMatch(/own next dev/);
    await expect(
      allocatePort({ worktree: "/wt/a", requested: 8171, range: RANGE, root, ...probes([], [8170]) }),
    ).rejects.toThrow(/still running/);
  });
});


describe("registry lock", () => {
  /**
   * Every scenario runs inside one driver process, which the test starts once with spawnSync. Bun 1.3
   * on Windows starts failing spawns ("Out of memory", ENOTCONN) once a test process has made many,
   * so the concurrent workers are the driver's children, not the test's.
   */
  const WORKER = `import fs from "node:fs";
import path from "node:path";
import { claimPort, lookupRegisteredPort, readRegistry } from ${JSON.stringify(PORTS_MODULE)};
const [mode, a, b] = process.argv.slice(2);
if (mode === "many") {
  // Five auto claims over the whole range, each for its own worktree.
  const ports = [];
  let errors = 0;
  for (let j = 0; j < 5; j++) {
    try { ports.push(claimPort("/wt/many-" + b + "-" + j, "auto", a)); } catch (e) { errors++; console.error(String(e)); }
  }
  console.log(JSON.stringify({ errors, ports }));
} else if (mode === "claim") {
  console.log(claimPort(a, "auto", b, { min: 8170, max: 8179 }));
} else if (mode === "reader") {
  // Unlocked reads in a tight loop, as another agent's vconvex or agent:setup does.
  let errors = 0;
  while (!fs.existsSync(path.join(a, "stop"))) {
    try { readRegistry(a); } catch { errors++; }
  }
  console.log(errors);
} else {
  // Alternate between two ports so every claim rewrites the registry; read it unlocked in between.
  const n = Number(b);
  let errors = 0;
  for (let i = 0; i < 100; i++) {
    try {
      claimPort("/wt/churn-" + b, i % 2 ? 8100 + n : 8150 + n, a);
      lookupRegisteredPort("/wt/churn-" + ((n + 1) % 6), a);
    } catch (e) {
      errors++;
      console.error(String(e));
    }
  }
  console.log(errors);
}
`;
  const DRIVER = `import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const [worker, ...roots] = process.argv.slice(2);
const [parallelRoot, churnRoot, unknownRoot, liveRoot, deadRoot, manyRoot] = roots;
const run = (args) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [worker, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("close", (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim(), pid: child.pid }));
  });
const six = (args) => Promise.all(Array.from({ length: 6 }, (_, i) => run(args(i))));
const lockOf = (root) => path.join(root, "ports.json.lock");
const out = {};
out.parallel = await six((i) => ["claim", "/wt/parallel-" + i, parallelRoot]);

fs.mkdirSync(manyRoot, { recursive: true });
const manyReaders = Array.from({ length: 3 }, () => run(["reader", manyRoot]));
out.many = await Promise.all(Array.from({ length: 8 }, (_, i) => run(["many", manyRoot, String(i)])));
fs.writeFileSync(path.join(manyRoot, "stop"), "");
out.manyReaders = await Promise.all(manyReaders);
out.manyLeftovers = fs.readdirSync(manyRoot).filter((f) => f !== "ports.json" && f !== "stop");

fs.writeFileSync(path.join(churnRoot, "ports.json"), "{}\\n");
const readers = Array.from({ length: 3 }, () => run(["reader", churnRoot]));
out.churn = await six((i) => ["churn", churnRoot, String(i)]);
fs.writeFileSync(path.join(churnRoot, "stop"), "");
out.readers = await Promise.all(readers);
out.leftovers = fs.readdirSync(churnRoot).filter((f) => f !== "ports.json" && f !== "stop");

// A held lock: the claim must still be waiting after 1.5s, then go through once it is released.
const waitWith = async (root, content) => {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(lockOf(root), content);
  const claim = run(["claim", "/wt/waiting", root]);
  const early = await Promise.race([claim, new Promise((r) => setTimeout(() => r("waiting"), 1500))]);
  const registryWritten = fs.existsSync(path.join(root, "ports.json"));
  fs.rmSync(lockOf(root), { force: true });
  const result = await claim;
  return { early, registryWritten, result: { code: result.code, stdout: result.stdout, stderr: result.stderr } };
};
out.unknownOwner = await waitWith(unknownRoot, "");
const now = Date.now();
out.liveOwner = await waitWith(liveRoot, JSON.stringify({ pid: process.pid, host: os.hostname(), startedAt: now, acquiredAt: now }));

// A fresh lock whose owner has exited is reclaimed at once, not after the 30s stale age.
// Any child that has exited gives a PID that is no longer running.
const dead = await run(["claim", "/wt/dead-owner-probe", path.join(deadRoot, "probe")]);
fs.mkdirSync(deadRoot, { recursive: true });
fs.writeFileSync(lockOf(deadRoot), JSON.stringify({ pid: dead.pid, host: os.hostname(), startedAt: now, acquiredAt: Date.now() }));
const started = Date.now();
const reclaimed = await run(["claim", "/wt/after-dead-owner", deadRoot]);
out.deadOwner = { code: reclaimed.code, stdout: reclaimed.stdout, stderr: reclaimed.stderr, ms: Date.now() - started, lockLeft: fs.existsSync(lockOf(deadRoot)) };
console.log(JSON.stringify(out));
`;
  type Result = { code: number | null; stdout: string; stderr: string };
  type DriverOut = {
    parallel: Result[];
    many: Result[];
    manyReaders: Result[];
    manyLeftovers: string[];
    churn: Result[];
    readers: Result[];
    leftovers: string[];
    unknownOwner: { early: unknown; registryWritten: boolean; result: Result };
    liveOwner: { early: unknown; registryWritten: boolean; result: Result };
    deadOwner: Result & { ms: number; lockLeft: boolean };
  };
  const roots = { parallel: "", churn: "", unknown: "", live: "", dead: "", many: "" };
  let out: DriverOut;
  // Bun runs a file's tests in order, so the scenario tests below read what this one collected.
  test("the lock driver runs every scenario", () => {
    const dir = tmpDir("agent-setup-script-");
    fs.writeFileSync(path.join(dir, "worker.ts"), WORKER);
    fs.writeFileSync(path.join(dir, "driver.ts"), DRIVER);
    for (const key of Object.keys(roots) as (keyof typeof roots)[]) roots[key] = tmpDir(`agent-setup-root-${key}-`);
    const r = spawnSyncStarted(
      process.execPath,
      [path.join(dir, "driver.ts"), path.join(dir, "worker.ts"), roots.parallel, roots.churn, roots.unknown, roots.live, roots.dead, roots.many],
      { encoding: "utf8", timeout: 120_000 },
    );
    if (r.status !== 0) throw new Error(`lock driver exited ${r.status ?? r.signal} (${r.error?.message ?? "no spawn error"}): ${r.stderr}`);
    out = JSON.parse(r.stdout) as DriverOut;
  }, 130_000);

  test("40 concurrent auto claims under tight unlocked readers: all distinct, none failed, nothing left behind", () => {
    const ports: number[] = [];
    for (const r of out.many) {
      expect(r).toMatchObject({ code: 0, stderr: "" });
      const parsed = JSON.parse(r.stdout) as { errors: number; ports: number[] };
      expect(parsed.errors).toBe(0);
      ports.push(...parsed.ports);
    }
    expect(ports).toHaveLength(40);
    expect(new Set(ports).size).toBe(40);
    expect(Object.keys(readRegistry(roots.many))).toHaveLength(40);
    for (const r of out.manyReaders) expect(r).toMatchObject({ code: 0, stdout: "0" });
    expect(out.manyLeftovers).toEqual([]);
  });

  test("concurrent claims from separate processes get distinct ports", () => {
    for (const r of out.parallel) expect(r.code).toBe(0);
    const ports = out.parallel.map((r) => Number(r.stdout));
    expect(new Set(ports).size).toBe(6);
    expect(ports.every((p) => p >= 8170 && p <= 8179)).toBe(true);
    expect(Object.keys(readRegistry(roots.parallel))).toHaveLength(6);
  });

  test("heavy contention with tight unlocked readers: no failed claims, no reader errors, no temp files left", () => {
    for (const r of out.churn) expect(r).toMatchObject({ code: 0, stdout: "0", stderr: "" });
    for (const r of out.readers) expect(r).toMatchObject({ code: 0, stdout: "0" });
    expect(out.leftovers).toEqual([]);
    // The last claim (i = 99) is 8100 + n.
    expect(Object.values(readRegistry(roots.churn)).sort()).toEqual([8100, 8101, 8102, 8103, 8104, 8105]);
  });

  test("a claim waits while a lock with no owner record, or with a live owner, is held", () => {
    for (const held of [out.unknownOwner, out.liveOwner]) {
      expect(held).toEqual({ early: "waiting", registryWritten: false, result: { code: 0, stdout: "8170", stderr: "" } });
    }
  });

  test("a fresh lock whose owner process has exited is reclaimed at once", () => {
    expect(out.deadOwner).toMatchObject({ code: 0, stdout: "8170", stderr: "", lockLeft: false });
    expect(out.deadOwner.ms).toBeLessThan(5_000);
  });
});
