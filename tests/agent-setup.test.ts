import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertLinkedWorktree, isMainCheckout, parseSetupArgs } from "../scripts/agent-setup/preflight";
import {
  allocatePort,
  assertEnvFilesLocal,
  ensureEnvLocal,
  envFileProblems,
  envLocalTemplate,
  type AllocateOptions,
} from "../scripts/agent-setup/setup";
import { checkInvocation } from "../scripts/validation/convex";
import { backendDir, portsFor, readRegistry, registryPath } from "../scripts/validation/ports";

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
    const r = spawnSync("git", ["-c", "user.email=agent@validation.invalid", "-c", "user.name=agent", ...args], { cwd, encoding: "utf8" });
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
    expect(() => assertEnvFilesLocal(dir)).toThrow(/agent:setup refused/);
    expect(ensureEnvLocal(dir, 8170)).toBe("kept");
    expect(fs.readFileSync(file, "utf8")).toBe(text);
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
  const claimScript = (dir: string) => {
    const file = path.join(dir, "claim.ts");
    fs.writeFileSync(
      file,
      `import { claimPort } from ${JSON.stringify(PORTS_MODULE)};\n` +
        `console.log(claimPort(process.argv[2], "auto", process.argv[3], { min: 8170, max: 8179 }));\n`,
    );
    return file;
  };
  const claim = (script: string, worktree: string, root: string) =>
    Bun.spawn([process.execPath, script, worktree, root], { stdout: "pipe", stderr: "pipe" });

  test("concurrent claims from separate processes get distinct ports", async () => {
    const root = tmpDir("agent-setup-root-");
    const script = claimScript(tmpDir("agent-setup-script-"));
    const procs = Array.from({ length: 6 }, (_, i) => claim(script, `/wt/parallel-${i}`, root));
    const ports = await Promise.all(
      procs.map(async (p) => {
        expect(await p.exited).toBe(0);
        return Number((await new Response(p.stdout).text()).trim());
      }),
    );
    expect(new Set(ports).size).toBe(6);
    expect(ports.every((p) => p >= 8170 && p <= 8179)).toBe(true);
    expect(Object.keys(readRegistry(root))).toHaveLength(6);
  });

  test("a claim waits while another process holds the lock, then proceeds", async () => {
    const root = tmpDir("agent-setup-root-");
    const script = claimScript(tmpDir("agent-setup-script-"));
    const lock = `${registryPath(root)}.lock`;
    fs.writeFileSync(lock, "");
    const proc = claim(script, "/wt/waiting", root);
    const early = await Promise.race([proc.exited, new Promise((r) => setTimeout(() => r("waiting"), 1500))]);
    expect(early).toBe("waiting");
    expect(fs.existsSync(registryPath(root))).toBe(false);
    fs.rmSync(lock);
    expect(await proc.exited).toBe(0);
    expect(Number((await new Response(proc.stdout).text()).trim())).toBe(8170);
  });
});
