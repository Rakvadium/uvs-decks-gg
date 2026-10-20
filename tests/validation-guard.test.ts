import { afterAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertValidationBackend,
  isLoopbackUrl,
  isValidationBackend,
} from "../convex/lib/validationBackend";
import { STATUS_FUNCTION, parseStatusOutput } from "../scripts/validation/backend";
import {
  CONVEX_BIN,
  buildChildEnv,
  checkInvocation,
  checkSavedBackendVersion,
  checkSavedDeploymentPorts,
  formatCheck,
  REVERTED_KEEP,
  STALE_SNAPSHOT_DIR,
  formatReverted,
  headBlobs,
  installedConvexVersion,
  linkSharedConvexCache,
  pinnedBackendCacheProblems,
  pinnedBackendFetchHint,
  prepareInvocation,
  preparePinnedBackend,
  repointEnvLocal,
  restoreCliSnapshot,
  revertBackupDir,
  seedBinaryCache,
  splitArgs,
  takeCliSnapshot,
  withLocalBackendFlags,
} from "../scripts/validation/convex";
import { buildBackendEnv } from "../scripts/validation/env";
import {
  ANONYMOUS_DEPLOYMENT,
  DEPLOY_KEY_SENTINEL,
  FORBIDDEN_FLAGS,
  GuardError,
  PINNED_CHILD_ENV,
  PINNED_LOCAL_BACKEND_VERSION,
  TESTED_CONVEX_VERSIONS,
  backendHomeProblems,
  dotenvEntries,
  guardViolations,
  mountPointProblems,
  parseMountPoints,
  sharedCacheProblems,
  loadCliDotenv,
  parseDotenv,
  resolveCliTarget,
  type Env,
  type GuardInput,
} from "../scripts/validation/guard";
import { generateAdminApiKey, generateAuthKeys } from "../scripts/validation/keys";
import {
  backendDir,
  claimPort,
  lookupRegisteredPort,
  parseAppPort,
  portsFor,
  resolveAppPort,
  sharedCacheDir,
} from "../scripts/validation/ports";

const tmpRoots: string[] = [];
function tmpDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tmpRoots.push(dir);
  return dir;
}
// The git-backed restore tests spawn git many times; under load they can pass the 5s default.
setDefaultTimeout(30_000);

afterAll(() => {
  for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true });
});

const ROOT = path.resolve("/fake-home/.uvs-validation");
const REAL_HOME = path.resolve("/fake-home");
const PLATFORM: NodeJS.Platform = "win32";
const OWNER_LOCALAPPDATA = path.join(REAL_HOME, "AppData", "Local");

function input(overrides: Partial<GuardInput> & { parentEnv?: Env; files?: Record<string, Env> } = {}): GuardInput {
  const parentEnv = overrides.parentEnv ?? { PATH: "/bin", LOCALAPPDATA: OWNER_LOCALAPPDATA };
  return {
    args: overrides.args ?? ["dev", "--once"],
    cliArgs: overrides.cliArgs,
    sources: [
      { name: "the caller's environment", env: parentEnv },
      ...Object.entries(overrides.files ?? {}).map(([name, env]) => ({ name, env })),
    ],
    vaultFiles: overrides.vaultFiles ?? [],
    childEnv: overrides.childEnv ?? buildChildEnv({ parentEnv, appPort: 8150, root: ROOT, platform: PLATFORM }),
    cliVersion: overrides.cliVersion ?? "1.31.0",
    appPort: overrides.appPort ?? 8150,
    root: overrides.root ?? ROOT,
    realHome: overrides.realHome ?? REAL_HOME,
    platform: overrides.platform ?? PLATFORM,
  };
}

function expectRefused(i: GuardInput, pattern: RegExp) {
  const violations = guardViolations(i);
  expect(violations.some((v) => pattern.test(v))).toBe(true);
}

describe("ports", () => {
  test("Convex ports derive from the app port", () => {
    expect(portsFor(8100)).toEqual({ app: 8100, cloud: 3300, site: 3301 });
    expect(portsFor(8150)).toEqual({ app: 8150, cloud: 3400, site: 3401 });
    expect(portsFor(8151)).toEqual({ app: 8151, cloud: 3402, site: 3403 });
    expect(portsFor(8199)).toEqual({ app: 8199, cloud: 3498, site: 3499 });
  });

  test("rejects ports outside 8100-8199, including the human 8090", () => {
    for (const bad of [8090, 8099, 8200, 3210, "abc", "", undefined, 8150.5]) {
      expect(() => parseAppPort(bad as number)).toThrow();
    }
  });

  test("registry claims are per worktree and conflicts fail", () => {
    const root = tmpDir("uvs-ports-");
    expect(claimPort("/wt/a", "auto", root)).toBe(8100);
    expect(claimPort("/wt/a", "auto", root)).toBe(8100);
    expect(claimPort("/wt/b", "auto", root)).toBe(8101);
    expect(() => claimPort("/wt/c", 8100, root)).toThrow(/already claimed/);
    expect(claimPort("/wt/c", 8150, root)).toBe(8150);
    expect(lookupRegisteredPort("/wt/c", root)).toBe(8150);
    expect(resolveAppPort({ worktree: "/wt/b", root, env: {} })).toBe(8101);
    expect(resolveAppPort({ flag: "8151", worktree: "/wt/b", root, env: { UVS_APP_PORT: "8160" } })).toBe(8151);
    expect(resolveAppPort({ worktree: "/wt/b", root, env: { UVS_APP_PORT: "8160" } })).toBe(8160);
    expect(() => resolveAppPort({ worktree: "/wt/none", root, env: {} })).toThrow(/No validation app port/);
  });
});

describe("loopback + validation backend gate", () => {
  test("only loopback http(s) URLs count", () => {
    for (const ok of ["http://127.0.0.1:3400", "http://localhost:3210", "http://[::1]:3210", "https://127.5.0.1"]) {
      expect(isLoopbackUrl(ok)).toBe(true);
    }
    for (const bad of [
      "https://happy-animal-123.convex.cloud",
      "https://happy-animal-123.convex.site",
      "http://127.0.0.1.evil.com",
      "http://localhost.evil.com",
      "http://127.0.0.1@evil.com",
      "ftp://127.0.0.1",
      "not a url",
      "",
      undefined,
    ]) {
      expect(isLoopbackUrl(bad)).toBe(false);
    }
  });

  test("isValidationBackend needs the flag and a loopback CONVEX_CLOUD_URL", () => {
    expect(isValidationBackend({ UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: "http://127.0.0.1:3400" })).toBe(true);
    expect(isValidationBackend({ UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: "https://x.convex.cloud" })).toBe(false);
    expect(isValidationBackend({ UVS_VALIDATION_BACKEND: "true", CONVEX_CLOUD_URL: "http://127.0.0.1:3400" })).toBe(false);
    expect(isValidationBackend({ CONVEX_CLOUD_URL: "http://127.0.0.1:3400" })).toBe(false);
    expect(() => assertValidationBackend({ UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: "https://x.convex.cloud" })).toThrow(
      /only runs on a local validation backend/,
    );
    expect(() => assertValidationBackend({ UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: "http://127.0.0.1:1" })).not.toThrow();
  });
});

describe("guard accepts the wrapped baseline", () => {
  test("clean env + wrapper-built child env passes", () => {
    expect(guardViolations(input())).toEqual([]);
    expect(guardViolations(input({ args: ["env", "set", "X"] }))).toEqual([]);
    expect(guardViolations(input({ args: ["run", "cards:list", '{"prod":true}'] }))).toEqual([]);
    expect(
      guardViolations(
        input({
          files: {
            ".env.local": {
              CONVEX_DEPLOYMENT: ANONYMOUS_DEPLOYMENT,
              NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3400",
            },
          },
        }),
      ),
    ).toEqual([]);
  });

  test("posix child env passes without LOCALAPPDATA", () => {
    const parentEnv = { PATH: "/bin" };
    const childEnv = buildChildEnv({ parentEnv, appPort: 8150, root: ROOT, platform: "linux" });
    expect(guardViolations(input({ parentEnv, childEnv, platform: "linux" }))).toEqual([]);
  });
});

describe("guard rejections: args", () => {
  test("no subcommand", () => expectRefused(input({ args: [] }), /No Convex subcommand/));
  test("deploy subcommand", () => expectRefused(input({ args: ["deploy", "-y"] }), /`deploy` is forbidden/));
  test("subcommands outside the allowlist (login, deployments, init)", () => {
    for (const sub of ["login", "logout", "deployments", "init", "reinit", "integration", "disable-local-deployments"]) {
      expectRefused(input({ args: [sub] }), /is not allowed/);
    }
  });
  test.each(FORBIDDEN_FLAGS)("flag %s (spaced and inline)", (flag) => {
    expectRefused(input({ args: ["dev", flag, "x"] }), new RegExp(`Flag \`${flag}\` is forbidden`));
    expectRefused(input({ args: ["env", "list", `${flag}=x`] }), new RegExp(`Flag \`${flag}\` is forbidden`));
  });
  test("the issue's named flags are all covered", () => {
    for (const flag of ["--prod", "--env-file", "--url"]) expect(FORBIDDEN_FLAGS).toContain(flag);
  });
  test("callers can't pick the local backend, its version, or its binary (#221)", () => {
    for (const flag of ["--local", "--local-backend-version", "--local-force-upgrade", "--local-cloud-port", "--local-site-port"]) {
      expect(FORBIDDEN_FLAGS).toContain(flag);
    }
    for (const args of [
      ["dev", "--local-backend-version", PINNED_LOCAL_BACKEND_VERSION],
      ["dev", "--once", "--local-backend-version=precompiled-2020-01-01-0000000"],
      ["dev", "--local-force-upgrade"],
      ["dev", "--local"],
      ["dev", "--local-binary", "C:/evil/convex-local-backend.exe"],
      ["dev", "--local-anything=x"],
      ["run", "f", "--local-backend-version", "x"],
    ]) {
      expectRefused(input({ args }), /Flag `--local[\w-]*` is forbidden/);
    }
  });
});

describe("pinned local backend version (#221)", () => {
  const ports = portsFor(8150);
  const pinned = (args: string[]) => withLocalBackendFlags(args, ports);
  test("the wrapper's dev args carry the pin and pass", () => {
    expect(pinned(["dev", "--once"])).toContain(PINNED_LOCAL_BACKEND_VERSION);
    expect(guardViolations(input({ cliArgs: pinned(["dev", "--once"]) }))).toEqual([]);
    expect(guardViolations(input({ args: ["env", "list"], cliArgs: pinned(["env", "list"]) }))).toEqual([]);
  });
  test("dev args without the pin, with another version, or with it twice are refused", () => {
    const pin = /must carry `--local-backend-version precompiled-/;
    const devPorts = ["dev", "--local", "--local-cloud-port", "3400", "--local-site-port", "3401"];
    expectRefused(input({ cliArgs: devPorts }), pin);
    expectRefused(input({ cliArgs: [...devPorts, "--local-backend-version", "precompiled-2020-01-01-0000000"] }), pin);
    expectRefused(input({ cliArgs: [...devPorts, `--local-backend-version=${PINNED_LOCAL_BACKEND_VERSION}`] }), pin);
    expectRefused(input({ cliArgs: [...pinned(["dev"]), "--local-backend-version", PINNED_LOCAL_BACKEND_VERSION] }), pin);
    expectRefused(input({ cliArgs: [...pinned(["dev"]), "--local-force-upgrade"] }), /must not carry `--local-force-upgrade`/);
    expectRefused(input({ cliArgs: pinned(["dev"]).filter((a) => a !== "--local") }), /must carry `--local` exactly once/);
  });
  test("non-dev commands must not carry backend flags", () => {
    expectRefused(
      input({ args: ["env", "list"], cliArgs: ["env", "list", "--local-backend-version", PINNED_LOCAL_BACKEND_VERSION] }),
      /Only `dev` may carry the local backend flags/,
    );
  });
  test("prepareInvocation passes the pin exactly once and refuses a caller's own", () => {
    const cwd = tmpDir("uvs-wt-");
    const root = tmpDir("uvs-root-");
    const inv = prepareInvocation({ argv: ["--app-port", "8150", "dev", "--once"], parentEnv: {}, cwd, root });
    expect(inv.cliArgs.filter((a) => a === "--local-backend-version")).toHaveLength(1);
    expect(inv.cliArgs[inv.cliArgs.indexOf("--local-backend-version") + 1]).toBe(PINNED_LOCAL_BACKEND_VERSION);
    expect(inv.fetchPinnedBackend).toBe(false);
    for (const extra of [["--local-backend-version", "x"], ["--local-backend-version=x"], ["--local-force-upgrade"]]) {
      expect(() => prepareInvocation({ argv: ["--app-port", "8150", "dev", ...extra], parentEnv: {}, cwd, root })).toThrow(GuardError);
    }
    const fetching = prepareInvocation({ argv: ["--app-port", "8150", "--fetch-pinned-backend", "dev"], parentEnv: {}, cwd, root });
    expect(fetching.fetchPinnedBackend).toBe(true);
    expect(fetching.cliArgs).not.toContain("--fetch-pinned-backend");
  });
  test("--check reports the pin rule for dev and skips it without args", () => {
    const cwd = tmpDir("uvs-wt-");
    const run = (extra: string[]) =>
      checkInvocation({ argv: ["--app-port", "8150", "--check", ...extra], parentEnv: {}, cwd, root: tmpDir("uvs-root-") });
    expect(run(["dev", "--once"]).rules.find((r) => r.rule === "backend-version-pinned")?.status).toBe("pass");
    expect(run([]).rules.find((r) => r.rule === "backend-version-pinned")?.status).toBe("skipped");
    expect(run(["dev", "--local-backend-version", "x"]).ok).toBe(false);
  });

  const exe = "convex-local-backend.exe";
  const fakeCache = (dir: string, opts: { binary?: string; dashboard?: string }) => {
    if (opts.binary) {
      fs.mkdirSync(path.join(dir, "convex", "binaries", opts.binary), { recursive: true });
      fs.writeFileSync(path.join(dir, "convex", "binaries", opts.binary, exe), opts.binary);
    }
    if (opts.dashboard) {
      fs.mkdirSync(path.join(dir, "convex", "dashboard", "out"), { recursive: true });
      fs.writeFileSync(
        path.join(dir, "convex", "dashboard", "config.json"),
        JSON.stringify({ port: 6790, apiPort: 6791, version: opts.dashboard }),
      );
    }
  };
  const childEnvFor = (root: string) => buildChildEnv({ parentEnv: {}, appPort: 8150, root, platform: "win32" });

  test("the cache check wants the pinned binary and dashboard, nothing newer", () => {
    const childEnv = childEnvFor(tmpDir("uvs-root-"));
    expect(pinnedBackendCacheProblems({ childEnv, platform: "win32" })).toHaveLength(2);
    fakeCache(childEnv.LOCALAPPDATA!, { binary: "precompiled-2099-01-01-fffffff", dashboard: "precompiled-2099-01-01-fffffff" });
    const problems = pinnedBackendCacheProblems({ childEnv, platform: "win32" });
    expect(problems).toHaveLength(2);
    expect(problems[1]).toContain("at precompiled-2099-01-01-fffffff");
    fakeCache(childEnv.LOCALAPPDATA!, { binary: PINNED_LOCAL_BACKEND_VERSION, dashboard: PINNED_LOCAL_BACKEND_VERSION });
    expect(pinnedBackendCacheProblems({ childEnv, platform: "win32" })).toEqual([]);
  });

  test("a missing pinned binary fails with the one-time fetch instruction, unless --fetch-pinned-backend", () => {
    const root = tmpDir("uvs-root-");
    const owner = { parentEnv: { LOCALAPPDATA: tmpDir("uvs-owner-") }, realHome: tmpDir("uvs-home-"), platform: "win32" as const };
    const inv = { appPort: 8150, home: backendDir(8150, root), childEnv: childEnvFor(root), fetchPinnedBackend: false };
    const said: string[] = [];
    expect(() => preparePinnedBackend(inv, (m) => said.push(m), owner)).toThrow(
      /pinned Convex local backend precompiled-[\s\S]*no api\.github\.com lookup[\s\S]*bun run validation:backend -- start --app-port 8150 --fetch-pinned-backend/,
    );
    expect(pinnedBackendFetchHint(8150, ["x is missing"])).toContain("  - x is missing");
    expect(() => preparePinnedBackend({ ...inv, fetchPinnedBackend: true }, (m) => said.push(m), owner)).not.toThrow();
    expect(said.some((m) => m.includes("--fetch-pinned-backend"))).toBe(true);
  });

  test("seeding copies only the pinned version from the owner's cache, which stays untouched", () => {
    const ownerLocal = tmpDir("uvs-owner-");
    fakeCache(ownerLocal, { binary: "precompiled-2099-01-01-fffffff" });
    const opts = {
      parentEnv: { LOCALAPPDATA: ownerLocal },
      childEnv: childEnvFor(tmpDir("uvs-root-")),
      realHome: tmpDir("uvs-home-"),
      platform: "win32" as const,
    };
    expect(seedBinaryCache(opts)).toEqual([]);
    fakeCache(ownerLocal, { binary: PINNED_LOCAL_BACKEND_VERSION, dashboard: PINNED_LOCAL_BACKEND_VERSION });
    expect(seedBinaryCache(opts)).toEqual(["backend binary", "dashboard"]);
    expect(fs.readdirSync(path.join(opts.childEnv.LOCALAPPDATA!, "convex", "binaries"))).toEqual([PINNED_LOCAL_BACKEND_VERSION]);
    expect(pinnedBackendCacheProblems({ childEnv: opts.childEnv, platform: "win32" })).toEqual([]);
    expect(seedBinaryCache(opts)).toEqual([]);
    expect(fs.readdirSync(path.join(ownerLocal, "convex", "binaries")).sort()).toEqual([
      PINNED_LOCAL_BACKEND_VERSION,
      "precompiled-2099-01-01-fffffff",
    ]);
  });

  describe("macOS/Linux share one cache per machine (#233)", () => {
    // Simulated: platform "linux", temp dirs. On a Windows host the link is a junction.
    const linuxExe = "convex-local-backend";
    const fakePosixCache = (cache: string, opts: { binary?: boolean; dashboard?: string }) => {
      if (opts.binary) {
        fs.mkdirSync(path.join(cache, "binaries", PINNED_LOCAL_BACKEND_VERSION), { recursive: true });
        fs.writeFileSync(path.join(cache, "binaries", PINNED_LOCAL_BACKEND_VERSION, linuxExe), "binary");
      }
      if (opts.dashboard) {
        fs.mkdirSync(path.join(cache, "dashboard"), { recursive: true });
        fs.writeFileSync(path.join(cache, "dashboard", "config.json"), JSON.stringify({ version: opts.dashboard }));
      }
    };
    const linuxInv = (root: string, appPort: number) => {
      const childEnv = buildChildEnv({ parentEnv: {}, appPort, root, platform: "linux" });
      return { appPort, home: backendDir(appPort, root), childEnv, fetchPinnedBackend: false };
    };
    const real = (p: string) => fs.realpathSync(p);

    test("a new port reuses what an earlier port fetched, with no fetch of its own", () => {
      const root = tmpDir("uvs-root-");
      const realHome = tmpDir("uvs-home-");
      // The owner has the pinned binary but a dashboard at another version, as on the verifier's machine.
      fakePosixCache(path.join(realHome, ".cache", "convex"), { binary: true, dashboard: "precompiled-2026-07-06-44f7aa7" });
      const owner = { parentEnv: {}, realHome, platform: "linux" as const };
      const said: string[] = [];
      const first = linuxInv(root, 8182);
      expect(() => preparePinnedBackend(first, (m) => said.push(m), owner)).toThrow(/dashboard is missing/);
      const shared = path.join(sharedCacheDir(root), "convex");
      const firstCache = path.join(first.home, ".cache", "convex");
      expect(real(firstCache)).toBe(real(shared));
      expect(fs.existsSync(path.join(shared, "binaries", PINNED_LOCAL_BACKEND_VERSION, linuxExe))).toBe(true);
      // The one `--fetch-pinned-backend`: the CLI writes the dashboard through port 8182's link.
      preparePinnedBackend({ ...first, fetchPinnedBackend: true }, (m) => said.push(m), owner);
      fakePosixCache(firstCache, { dashboard: PINNED_LOCAL_BACKEND_VERSION });

      const second = linuxInv(root, 8183);
      said.length = 0;
      expect(() => preparePinnedBackend(second, (m) => said.push(m), owner)).not.toThrow();
      expect(said.some((m) => m.includes("--fetch-pinned-backend") || m.includes("seeded"))).toBe(false);
      expect(real(path.join(second.home, ".cache", "convex"))).toBe(real(shared));
      expect(pinnedBackendCacheProblems({ childEnv: second.childEnv, platform: "linux" })).toEqual([]);
      // Linked once; later runs leave the link alone.
      expect(linkSharedConvexCache(second.home, root, "linux")).toBeNull();
      expect(guardViolations(input({ parentEnv: {}, childEnv: second.childEnv, platform: "linux", root, appPort: 8183 }))).toEqual([]);
    });

    test("a per-port cache from an older wrapper hands its pinned assets to the shared cache", () => {
      const root = tmpDir("uvs-root-");
      const inv = linuxInv(root, 8182);
      const legacy = path.join(inv.home, ".cache", "convex");
      fakePosixCache(legacy, { binary: true, dashboard: PINNED_LOCAL_BACKEND_VERSION });
      // A crashed run's half-made link to the shared cache is unlinked, never deleted through.
      const shared = path.join(sharedCacheDir(root), "convex");
      fs.mkdirSync(path.join(shared, "binaries", "precompiled-2099-01-01-fffffff"), { recursive: true });
      const partial = path.join(inv.home, ".cache", `.convex-link-${process.pid}`);
      fs.symlinkSync(shared, partial, process.platform === "win32" ? "junction" : "dir");
      const message = linkSharedConvexCache(inv.home, root, "linux");
      expect(fs.existsSync(partial)).toBe(false);
      expect(fs.existsSync(path.join(shared, "binaries", "precompiled-2099-01-01-fffffff"))).toBe(true);
      expect(message).toContain("moved the backend binary and dashboard");
      expect(fs.lstatSync(legacy).isSymbolicLink() && real(legacy) === real(path.join(sharedCacheDir(root), "convex"))).toBe(true);
      expect(pinnedBackendCacheProblems({ childEnv: inv.childEnv, platform: "linux" })).toEqual([]);
    });

    test("a cache link aimed anywhere else is refused, and the owner's cache is never touched", () => {
      const root = tmpDir("uvs-root-");
      const realHome = tmpDir("uvs-home-");
      const ownerCache = path.join(realHome, ".cache", "convex");
      fakePosixCache(ownerCache, { binary: true, dashboard: PINNED_LOCAL_BACKEND_VERSION });
      const linkType = process.platform === "win32" ? "junction" : "dir";
      const guarded = (appPort: number) =>
        guardViolations(input({ parentEnv: {}, childEnv: linuxInv(root, appPort).childEnv, platform: "linux", root, appPort }));

      const a = linuxInv(root, 8182);
      fs.mkdirSync(path.join(a.home, ".cache"), { recursive: true });
      fs.symlinkSync(ownerCache, path.join(a.home, ".cache", "convex"), linkType);
      expect(() => linkSharedConvexCache(a.home, root, "linux")).toThrow(/not the shared cache/);
      expect(guarded(8182).some((v) => /must resolve to /.test(v))).toBe(true);

      const b = linuxInv(root, 8183);
      fs.mkdirSync(b.home, { recursive: true });
      fs.symlinkSync(path.join(realHome, ".cache"), path.join(b.home, ".cache"), linkType);
      expect(() => linkSharedConvexCache(b.home, root, "linux")).toThrow(/must be a plain dir inside the backend home/);
      expect(guarded(8183).some((v) => /\.cache is a symlink or junction; nothing in the backend home may be a link/.test(v))).toBe(true);
      expect(fs.readdirSync(ownerCache).sort()).toEqual(["binaries", "dashboard"]);
      expect(fs.existsSync(path.join(ownerCache, "binaries", PINNED_LOCAL_BACKEND_VERSION, linuxExe))).toBe(true);
    });

    test("a per-port binary or dashboard that is, or holds, a link is not promoted to the shared cache (#236)", () => {
      const linkType = process.platform === "win32" ? "junction" : "dir";
      const plantedDir = tmpDir("uvs-planted-");
      fs.writeFileSync(path.join(plantedDir, linuxExe), "planted");
      const cases: [string, (legacy: string) => void][] = [
        ["binaries/<pin> is a link", (legacy) => {
          fs.mkdirSync(path.join(legacy, "binaries"), { recursive: true });
          fs.symlinkSync(plantedDir, path.join(legacy, "binaries", PINNED_LOCAL_BACKEND_VERSION), linkType);
        }],
        ["binaries/<pin> holds a link", (legacy) => {
          fakePosixCache(legacy, { binary: true });
          fs.symlinkSync(plantedDir, path.join(legacy, "binaries", PINNED_LOCAL_BACKEND_VERSION, "lib"), linkType);
        }],
        ["dashboard holds a link", (legacy) => {
          fakePosixCache(legacy, { dashboard: PINNED_LOCAL_BACKEND_VERSION });
          fs.symlinkSync(plantedDir, path.join(legacy, "dashboard", "out"), linkType);
        }],
      ];
      for (const [label, plant] of cases) {
        const root = tmpDir("uvs-root-");
        const inv = linuxInv(root, 8182);
        const legacy = path.join(inv.home, ".cache", "convex");
        plant(legacy);
        expect(() => linkSharedConvexCache(inv.home, root, "linux"), label).toThrow(/Refusing to move .* symlink or junction/);
        const shared = path.join(sharedCacheDir(root), "convex");
        expect(fs.existsSync(path.join(shared, "binaries")) || fs.existsSync(path.join(shared, "dashboard")), label).toBe(false);
        expect(fs.lstatSync(legacy).isSymbolicLink(), label).toBe(false);
      }
      expect(fs.readFileSync(path.join(plantedDir, linuxExe), "utf8")).toBe("planted");
    });
  });

  describe("the shared cache dir itself must not be a link (#236)", () => {
    const linkType = process.platform === "win32" ? "junction" : "dir";
    const backendExeName = (platform: NodeJS.Platform) => (platform === "win32" ? "convex-local-backend.exe" : "convex-local-backend");
    const listFiles = (dir: string): string[] =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((d) => (d.isDirectory() ? listFiles(path.join(dir, d.name)) : [path.join(dir, d.name)]))
        .sort();
    for (const platform of ["linux", "win32"] as const) {
      for (const level of ["cache", "cache/convex"] as const) {
        for (const target of ["the owner's ~/.convex", "the owner's real Convex cache", "an arbitrary dir"] as const) {
          test(`${platform}: ${level} -> ${target} is refused by --check's rule and before seeding`, () => {
            const root = tmpDir("uvs-root-");
            const realHome = tmpDir("uvs-home-");
            fs.mkdirSync(path.join(realHome, ".convex"), { recursive: true });
            fs.writeFileSync(path.join(realHome, ".convex", "config.json"), '{"accessToken":"<placeholder>"}');
            const ownerLocal = platform === "win32" ? path.join(realHome, "AppData", "Local") : path.join(realHome, ".cache");
            const ownerCache = path.join(ownerLocal, "convex");
            fs.mkdirSync(path.join(ownerCache, "binaries", PINNED_LOCAL_BACKEND_VERSION), { recursive: true });
            fs.writeFileSync(path.join(ownerCache, "binaries", PINNED_LOCAL_BACKEND_VERSION, backendExeName(platform)), "owner");
            fs.mkdirSync(path.join(ownerCache, "dashboard"), { recursive: true });
            fs.writeFileSync(path.join(ownerCache, "dashboard", "config.json"), JSON.stringify({ version: PINNED_LOCAL_BACKEND_VERSION }));
            const dest = {
              "the owner's ~/.convex": path.join(realHome, ".convex"),
              "the owner's real Convex cache": level === "cache" ? ownerLocal : ownerCache,
              "an arbitrary dir": tmpDir("uvs-elsewhere-"),
            }[target];
            fs.mkdirSync(path.join(root, ...level.split("/").slice(0, -1)), { recursive: true });
            fs.symlinkSync(dest, path.join(root, ...level.split("/")), linkType);
            const before = listFiles(realHome);

            const parentEnv = platform === "win32" ? { LOCALAPPDATA: ownerLocal } : {};
            const childEnv = buildChildEnv({ parentEnv, appPort: 8182, root, platform });
            const violations = guardViolations(input({ parentEnv, childEnv, platform, root, realHome, appPort: 8182 }));
            expect(violations.some((v) => /is a symlink or junction; (the shared cache must be a plain dir|nothing in the shared cache may be a link)/.test(v))).toBe(true);
            const inv = { appPort: 8182, home: backendDir(8182, root), childEnv, fetchPinnedBackend: true };
            expect(() => preparePinnedBackend(inv, () => {}, { parentEnv, realHome, platform })).toThrow(/symlink or junction/);
            expect(listFiles(realHome)).toEqual(before);
          });
        }
      }
    }

    // Round 2 of #236: the rule is "no link anywhere under the shared cache or the backend home",
    // so plant one at every depth, on both platforms.
    const pin = PINNED_LOCAL_BACKEND_VERSION;
    const sharedDepths: [string, string][] = [
      ["depth 1: cache/convex", "convex"],
      ["depth 2: cache/convex/binaries", "convex/binaries"],
      ["depth 3: cache/convex/binaries/<pin>", `convex/binaries/${pin}`],
      ["depth 4: inside binaries/<pin>", `convex/binaries/${pin}/lib`],
      ["depth 2: cache/convex/dashboard", "convex/dashboard"],
      ["depth 3: inside dashboard", "convex/dashboard/out"],
      ["depth 6: deep inside dashboard", "convex/dashboard/out/_next/static/chunks"],
    ];
    const homeDepths: [string, string][] = [
      ["depth 1: <home>/.convex (the CLI's login dir)", ".convex"],
      ["depth 1: <home>/.cache", ".cache"],
      ["depth 2: <home>/.convex/anonymous-convex-backend-state", ".convex/anonymous-convex-backend-state"],
      ["depth 3: the deployment dir", ".convex/anonymous-convex-backend-state/anonymous-agent"],
      ["depth 5: inside the deployment's storage", ".convex/anonymous-convex-backend-state/anonymous-agent/convex_local_storage/modules"],
      ["depth 1: <home>/tmp", "tmp"],
    ];
    const plantAt = (top: string, rel: string, dest: string) => {
      const at = path.join(top, ...rel.split("/"));
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.symlinkSync(dest, at, linkType);
      // Plain siblings, so the walk has real dirs to go through before it reaches the link.
      fs.mkdirSync(path.join(path.dirname(at), "plain-sibling"), { recursive: true });
      fs.writeFileSync(path.join(path.dirname(at), "plain-sibling", "f"), "x");
    };
    const ownerSetup = (platform: NodeJS.Platform) => {
      const realHome = tmpDir("uvs-home-");
      fs.mkdirSync(path.join(realHome, ".convex"), { recursive: true });
      fs.writeFileSync(path.join(realHome, ".convex", "config.json"), '{"accessToken":"<placeholder>"}');
      const ownerLocal = platform === "win32" ? path.join(realHome, "AppData", "Local") : path.join(realHome, ".cache");
      fs.mkdirSync(path.join(ownerLocal, "convex", "binaries", pin), { recursive: true });
      fs.writeFileSync(path.join(ownerLocal, "convex", "binaries", pin, backendExeName(platform)), "owner");
      return { realHome, ownerLocal, parentEnv: platform === "win32" ? { LOCALAPPDATA: ownerLocal } : {} };
    };
    const refusedEverywhere = (platform: NodeJS.Platform, root: string, owner: ReturnType<typeof ownerSetup>, pattern: RegExp) => {
      const childEnv = buildChildEnv({ parentEnv: owner.parentEnv, appPort: 8182, root, platform });
      const violations = guardViolations(input({ parentEnv: owner.parentEnv, childEnv, platform, root, realHome: owner.realHome, appPort: 8182 }));
      expect(violations.some((v) => pattern.test(v))).toBe(true);
      const before = listFiles(owner.realHome);
      const inv = { appPort: 8182, home: backendDir(8182, root), childEnv, fetchPinnedBackend: true };
      expect(() => preparePinnedBackend(inv, () => {}, { ...owner, platform })).toThrow(pattern);
      expect(listFiles(owner.realHome)).toEqual(before);
      expect(fs.existsSync(path.join(owner.realHome, ".cache", "convex", "binaries", pin, "x"))).toBe(false);
    };
    for (const platform of ["linux", "win32"] as const) {
      for (const [label, rel] of sharedDepths) {
        test(`${platform}: a link at shared ${label} is refused`, () => {
          const owner = ownerSetup(platform);
          const root = tmpDir("uvs-root-");
          fs.mkdirSync(path.join(root, "cache"), { recursive: true });
          plantAt(path.join(root, "cache"), rel, path.join(owner.ownerLocal, "convex"));
          refusedEverywhere(platform, root, owner, /symlink or junction/);
        });
      }
      for (const [label, rel] of homeDepths) {
        test(`${platform}: a link in the backend home at ${label} is refused`, () => {
          const owner = ownerSetup(platform);
          const root = tmpDir("uvs-root-");
          fs.mkdirSync(backendDir(8182, root), { recursive: true });
          plantAt(backendDir(8182, root), rel, path.join(owner.realHome, ".convex"));
          refusedEverywhere(platform, root, owner, /symlink or junction; nothing in the backend home may be a link/);
        });
      }
      test(`${platform}: the backend home, or backends/, as a link to the owner's home is refused`, () => {
        for (const level of ["backends/8182", "backends"]) {
          const owner = ownerSetup(platform);
          const root = tmpDir("uvs-root-");
          plantAt(root, level, owner.realHome);
          refusedEverywhere(platform, root, owner, /symlink or junction; the backend home must be a plain dir/);
          // Case G: nothing was created in the owner's home, such as a `.cache/convex` link.
          expect(fs.lstatSync(path.join(owner.ownerLocal, "convex")).isSymbolicLink()).toBe(false);
          if (platform === "win32") expect(fs.existsSync(path.join(owner.realHome, ".cache"))).toBe(false);
        }
      });
      test(`${platform}: a root that puts the backend home inside the owner's Convex dir is refused`, () => {
        const owner = ownerSetup(platform);
        const root = path.join(tmpDir("uvs-link-parent-"), ".uvs-validation");
        fs.symlinkSync(path.join(owner.realHome, ".convex"), root, linkType);
        fs.mkdirSync(backendDir(8182, root), { recursive: true });
        refusedEverywhere(platform, root, owner, /overlaps the owner's Convex dir/);
        fs.rmSync(path.join(owner.realHome, ".convex", "backends"), { recursive: true, force: true });
      });
    }
    test("a plain file (a Windows .lnk shortcut, say) in place of cache/convex is refused", () => {
      for (const platform of ["linux", "win32"] as const) {
        const root = tmpDir("uvs-root-");
        fs.mkdirSync(path.join(root, "cache"), { recursive: true });
        fs.writeFileSync(path.join(root, "cache", "convex"), "shortcut bytes");
        const childEnv = buildChildEnv({ parentEnv: {}, appPort: 8182, root, platform });
        expect(guardViolations(input({ parentEnv: {}, childEnv, platform, root, appPort: 8182 })).some((v) => /cache[\\/]convex is not a dir/.test(v))).toBe(true);
      }
    });

    test("linux: the wrapper's own .cache/convex link passes only when it resolves to the shared cache", () => {
      const owner = ownerSetup("linux");
      const root = tmpDir("uvs-root-");
      fs.mkdirSync(path.join(root, "cache", "convex"), { recursive: true });
      const home = backendDir(8182, root);
      const guarded = () =>
        guardViolations(input({ parentEnv: {}, childEnv: buildChildEnv({ parentEnv: {}, appPort: 8182, root, platform: "linux" }), platform: "linux", root, realHome: owner.realHome, appPort: 8182 }));
      expect(linkSharedConvexCache(home, root, "linux")).toContain("linked");
      expect(guarded()).toEqual([]);
      // The same link is refused on Windows, where the wrapper never makes it.
      const win = buildChildEnv({ parentEnv: {}, appPort: 8182, root, platform: "win32" });
      expect(guardViolations(input({ parentEnv: {}, childEnv: win, platform: "win32", root, realHome: owner.realHome, appPort: 8182 })).some((v) => /nothing in the backend home may be a link/.test(v))).toBe(true);
    });
    test.skipIf(process.platform === "win32")("linux host: the node executor's socket is fine in the backend home, not in the shared cache", async () => {
      const owner = ownerSetup("linux");
      const root = tmpDir("uvs-root-");
      const listenOn = async (dir: string) => {
        fs.mkdirSync(dir, { recursive: true });
        const server = (await import("node:net")).createServer();
        await new Promise<void>((resolve) => server.listen(path.join(dir, ".executor.sock"), resolve));
        return server;
      };
      const inHome = await listenOn(path.join(backendDir(8182, root), "tmp", ".tmpabc"));
      const childEnv = buildChildEnv({ parentEnv: {}, appPort: 8182, root, platform: "linux" });
      const guarded = () => guardViolations(input({ parentEnv: {}, childEnv, platform: "linux", root, realHome: owner.realHome, appPort: 8182 }));
      expect(guarded()).toEqual([]);
      const inCache = await listenOn(path.join(root, "cache", "convex", "dashboard"));
      expect(guarded().some((v) => /\.executor\.sock is not a regular file or dir/.test(v))).toBe(true);
      inHome.close();
      inCache.close();
    });

    test.skipIf(process.platform === "win32")("linux host: a file symlink inside the shared binary dir is refused", () => {
      const owner = ownerSetup("linux");
      const root = tmpDir("uvs-root-");
      const dir = path.join(root, "cache", "convex", "binaries", pin);
      fs.mkdirSync(dir, { recursive: true });
      fs.symlinkSync(path.join(owner.ownerLocal, "convex", "binaries", pin, backendExeName("linux")), path.join(dir, backendExeName("linux")));
      refusedEverywhere("linux", root, owner, /symlink or junction/);
    });

    // Round 3 of #236: a bind mount or volume is a plain dir to lstat and realpath.
    describe("mounts are refused (#236 round 3)", () => {
      const fixture = (points: string[]) =>
        points.map((mp, i) => `${100 + i} 1 0:${50 + i} / ${mp.replace(/ /g, "\\040")} rw,relatime shared:1 - ext4 /dev/sda1 rw`).join("\n");
      test("mountinfo parsing undoes octal escapes", () => {
        expect(parseMountPoints(`36 35 98:0 /mnt1 /mnt/with\\040space rw,noatime master:1 - ext3 /dev/root rw\n37 35 0:1 / / rw - ext4 /dev/sda rw\n`)).toEqual([
          "/mnt/with space",
          "/",
        ]);
      });
      test("only mounts at or below the checked dirs count, not siblings that share a prefix", () => {
        const mi = fixture(["/r/cache", "/r/cache/convex/dashboard", "/r/cache2", "/r", "/r/backends", "/r/backends/8182/.convex", "/r/backends/81820"]);
        expect(mountPointProblems({ under: ["/r/cache"] }, "linux", mi)).toEqual(["/r/cache is a mount point", "/r/cache/convex/dashboard is a mount point"]);
        expect(mountPointProblems({ under: ["/r/backends/8182"], exact: ["/r/backends"] }, "linux", mi)).toEqual([
          "/r/backends is a mount point",
          "/r/backends/8182/.convex is a mount point",
        ]);
        expect(mountPointProblems({ under: ["/r/cache"] }, "linux", null)).toEqual([]);
      });
      test("a mount in the shared cache or the backend home is refused (mountinfo fixture)", () => {
        const owner = ownerSetup("linux");
        const root = tmpDir("uvs-root-");
        const real = fs.realpathSync.native(root);
        fs.mkdirSync(path.join(root, "cache", "convex", "dashboard"), { recursive: true });
        fs.mkdirSync(path.join(backendDir(8182, root), ".convex"), { recursive: true });
        const clean = fixture(["/", path.join(real, "..")]);
        expect(sharedCacheProblems(root, "linux", clean)).toEqual([]);
        expect(backendHomeProblems({ root, appPort: 8182, realHome: owner.realHome, platform: "linux", mountinfo: clean })).toEqual([]);
        const dashboard = fixture([path.join(real, "cache", "convex", "dashboard")]);
        expect(sharedCacheProblems(root, "linux", dashboard)[0]).toMatch(/dashboard is a mount point; nothing in the shared cache may be a link or a mount/);
        const login = fixture([path.join(real, "backends", "8182", ".convex")]);
        expect(backendHomeProblems({ root, appPort: 8182, realHome: owner.realHome, platform: "linux", mountinfo: login })[0]).toMatch(
          /\.convex is a mount point; nothing in the backend home may be a link or a mount/,
        );
        // Another port's mounts are not this port's problem.
        const other = fixture([path.join(real, "backends", "8183", ".convex")]);
        expect(backendHomeProblems({ root, appPort: 8182, realHome: owner.realHome, platform: "linux", mountinfo: other })).toEqual([]);
      });

      const sh = (script: string) => spawnSync("sh", ["-c", script], { encoding: "utf8" });
      const isLinuxRoot = process.platform === "linux" && process.getuid?.() === 0;
      const canMount = isLinuxRoot && sh("d=$(mktemp -d) && mount -t tmpfs tmpfs $d && umount $d && rmdir $d").status === 0;
      test.skipIf(!canMount)("linux, privileged: a bind mount of the owner's ~/.convex and a tmpfs in the cache are refused", () => {
        const owner = ownerSetup("linux");
        const root = tmpDir("uvs-root-");
        const login = path.join(backendDir(8182, root), ".convex");
        const out = path.join(root, "cache", "convex", "dashboard", "out");
        fs.mkdirSync(login, { recursive: true });
        fs.mkdirSync(out, { recursive: true });
        expect(sh(`mount --bind '${path.join(owner.realHome, ".convex")}' '${login}' && mount -t tmpfs tmpfs '${out}'`).status).toBe(0);
        try {
          const childEnv = buildChildEnv({ parentEnv: {}, appPort: 8182, root, platform: "linux" });
          const v = guardViolations(input({ parentEnv: {}, childEnv, platform: "linux", root, realHome: owner.realHome, appPort: 8182 }));
          // The bind mount is on the same device, so only mountinfo sees it; the tmpfs is caught both ways.
          expect(v.some((m) => /backends[\\/]8182[\\/]\.convex is a mount point/.test(m))).toBe(true);
          expect(v.some((m) => /dashboard[\\/]out is a mount point/.test(m))).toBe(true);
          expect(v.some((m) => /dashboard[\\/]out is on another device/.test(m))).toBe(true);
          const inv = { appPort: 8182, home: backendDir(8182, root), childEnv, fetchPinnedBackend: true };
          expect(() => preparePinnedBackend(inv, () => {}, { parentEnv: {}, realHome: owner.realHome, platform: "linux" })).toThrow(/mount point/);
        } finally {
          sh(`umount '${out}'; umount '${login}'`);
        }
      });
      const canUnshare = process.platform === "linux" && sh("unshare -Urm true").status === 0;
      test.skipIf(!canUnshare)("linux: a bind mount made inside `unshare -Urm` (no real root) is refused from inside it", () => {
        const owner = ownerSetup("linux");
        const root = tmpDir("uvs-root-");
        const login = path.join(backendDir(8182, root), ".convex");
        fs.mkdirSync(login, { recursive: true });
        const probe = path.join(tmpDir("uvs-probe-"), "probe.ts");
        fs.writeFileSync(
          probe,
          `import { backendHomeProblems } from ${JSON.stringify(path.resolve("scripts/validation/guard.ts"))};\n` +
            `console.log(JSON.stringify(backendHomeProblems({ root: ${JSON.stringify(root)}, appPort: 8182, realHome: ${JSON.stringify(owner.realHome)}, platform: "linux" })));\n`,
        );
        const r = sh(`unshare -Urm sh -c "mount --bind '${path.join(owner.realHome, ".convex")}' '${login}' && '${process.execPath}' '${probe}'"`);
        expect(r.status).toBe(0);
        const problems = JSON.parse(r.stdout.trim().split("\n").at(-1)!) as string[];
        expect(problems.some((m) => /\.convex is a mount point/.test(m))).toBe(true);
        // Outside the namespace there is no mount, and nothing to refuse.
        expect(backendHomeProblems({ root, appPort: 8182, realHome: owner.realHome, platform: "linux" })).toEqual([]);
      });
      test.skipIf(process.platform !== "linux")("linux host: a FIFO in the backend home is refused, and so is an unreadable deep path", () => {
        const owner = ownerSetup("linux");
        const root = tmpDir("uvs-root-");
        const state = path.join(backendDir(8182, root), ".convex", "anonymous-convex-backend-state", "anonymous-agent");
        fs.mkdirSync(state, { recursive: true });
        expect(sh(`mkfifo '${path.join(state, "config.json")}'`).status).toBe(0);
        const homeProblems = () => backendHomeProblems({ root, appPort: 8182, realHome: owner.realHome, platform: "linux", mountinfo: null });
        expect(homeProblems().some((m) => /config\.json is not a regular file or dir/.test(m))).toBe(true);
        expect(() => checkSavedBackendVersion(backendDir(8182, root), 8182)).toThrow(/is not a regular file/);
        fs.rmSync(path.join(state, "config.json"));
        // A tree deeper than PATH_MAX: the walk can't resolve or read it, so it refuses.
        const name = "d".repeat(200);
        // bash, not sh: dash can't `cd` once the path passes PATH_MAX.
        const deep = spawnSync("bash", ["-c", `cd '${backendDir(8182, root)}' && for i in $(seq 1 25); do mkdir ${name} && cd ${name} || exit 1; done && ln -s '${owner.realHome}' x`]);
        expect(deep.status).toBe(0);
        expect(homeProblems().some((m) => /could not be (read|resolved)/.test(m))).toBe(true);
        sh(`cd '${backendDir(8182, root)}' && rm -rf ${name}`);
      });
    });

    test("plain shared dirs pass, also when ~/.uvs-validation itself is a link", () => {
      const real = tmpDir("uvs-real-root-");
      const root = path.join(tmpDir("uvs-link-parent-"), ".uvs-validation");
      fs.symlinkSync(real, root, linkType);
      fs.mkdirSync(path.join(root, "cache", "convex"), { recursive: true });
      for (const platform of ["linux", "win32"] as const) {
        const childEnv = buildChildEnv({ parentEnv: {}, appPort: 8182, root, platform });
        expect(guardViolations(input({ parentEnv: {}, childEnv, platform, root, appPort: 8182 }))).toEqual([]);
      }
    });
  });

  test("a backend saved at another version is refused with the way out", () => {
    const home = tmpDir("uvs-home-");
    const dir = path.join(home, ".convex", "anonymous-convex-backend-state", "anonymous-agent");
    fs.mkdirSync(dir, { recursive: true });
    const save = (backendVersion: string) => fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({ backendVersion }));
    save(PINNED_LOCAL_BACKEND_VERSION);
    expect(() => checkSavedBackendVersion(home, 8150)).not.toThrow();
    save("precompiled-2026-06-09-b6aaa1a");
    expect(() => checkSavedBackendVersion(home, 8150)).toThrow(/created with local backend precompiled-2026-06-09-b6aaa1a[\s\S]*stop --app-port 8150/);
  });
});

describe("guard rejections: env and env files", () => {
  test("CONVEX_DEPLOY_KEY in the caller env", () =>
    expectRefused(input({ parentEnv: { CONVEX_DEPLOY_KEY: "prod:abc|xyz" } }), /CONVEX_DEPLOY_KEY is set in the caller/));
  test("CONVEX_DEPLOY_KEY in .env.local and .env", () => {
    expectRefused(input({ files: { ".env.local": { CONVEX_DEPLOY_KEY: "dev:abc|xyz" } } }), /CONVEX_DEPLOY_KEY is set in .env.local/);
    expectRefused(input({ files: { ".env": { CONVEX_DEPLOY_KEY: "dev:abc|xyz" } } }), /CONVEX_DEPLOY_KEY is set in .env/);
  });
  test("access token override and provision host", () => {
    expectRefused(input({ parentEnv: { CONVEX_OVERRIDE_ACCESS_TOKEN: "t" } }), /CONVEX_OVERRIDE_ACCESS_TOKEN/);
    expectRefused(input({ files: { ".env.local": { CONVEX_PROVISION_HOST: "http://x:8050" } } }), /CONVEX_PROVISION_HOST/);
  });
  test("cloud deployments in any source", () => {
    for (const deployment of ["dev:happy-animal-123", "prod:happy-animal-123", "preview:x", "local:x", "happy-animal-123", "anonymous:foo"]) {
      expectRefused(input({ parentEnv: { CONVEX_DEPLOYMENT: deployment } }), /CONVEX_DEPLOYMENT in the caller/);
      expectRefused(input({ files: { ".env.local": { CONVEX_DEPLOYMENT: deployment } } }), /CONVEX_DEPLOYMENT in .env.local/);
    }
  });
  test("non-loopback Convex URLs in any source", () => {
    expectRefused(input({ parentEnv: { CONVEX_URL: "https://x.convex.cloud" } }), /CONVEX_URL in the caller/);
    expectRefused(
      input({ files: { ".env.local": { NEXT_PUBLIC_CONVEX_URL: "https://x.convex.cloud" } } }),
      /NEXT_PUBLIC_CONVEX_URL in .env.local/,
    );
    expectRefused(input({ files: { ".env": { CONVEX_SITE_URL: "https://x.convex.site" } } }), /CONVEX_SITE_URL in .env/);
  });
  test("non-loopback CONVEX_SELF_HOSTED_URL", () => {
    expectRefused(
      input({ parentEnv: { CONVEX_SELF_HOSTED_URL: "https://convex.example.com", CONVEX_SELF_HOSTED_ADMIN_KEY: "k" } }),
      /CONVEX_SELF_HOSTED_URL in the caller/,
    );
    expectRefused(input({ files: { ".env.local": { CONVEX_SELF_HOSTED_URL: "https://convex.example.com" } } }), /CONVEX_SELF_HOSTED_URL/);
    expect(guardViolations(input({ parentEnv: { CONVEX_SELF_HOSTED_URL: "http://127.0.0.1:3210" } }))).toEqual([]);
  });
});

describe("guard rejections: wrapped CLI env", () => {
  const base = () => buildChildEnv({ parentEnv: { LOCALAPPDATA: OWNER_LOCALAPPDATA }, appPort: 8150, root: ROOT, platform: PLATFORM });
  test("agent mode missing", () => {
    const childEnv = base();
    delete childEnv.CONVEX_AGENT_MODE;
    expectRefused(input({ childEnv }), /CONVEX_AGENT_MODE must be set exactly once to "anonymous"/);
  });
  test("child deployment missing or not anonymous", () => {
    const missing = base();
    delete missing.CONVEX_DEPLOYMENT;
    expectRefused(input({ childEnv: missing }), /CONVEX_DEPLOYMENT must be set exactly once/);
    expectRefused(input({ childEnv: { ...base(), CONVEX_DEPLOYMENT: "dev:x" } }), /CONVEX_DEPLOYMENT must be set exactly once/);
  });
  test.each(Object.keys(PINNED_CHILD_ENV))("pinned %s missing, changed, or duplicated in another case", (name) => {
    const missing = base();
    delete missing[name];
    expectRefused(input({ childEnv: missing }), new RegExp(`${name} must be set exactly once`));
    expectRefused(input({ childEnv: { ...base(), [name]: "changed.invalid" } }), new RegExp(`${name} must be set exactly once`));
    expectRefused(input({ childEnv: { ...base(), [name.toLowerCase()]: "x" } }), new RegExp(`${name} must be set exactly once`));
  });
  test("CONVEX_DEPLOY_KEY is pinned to the CLI's ignore sentinel", () => {
    expect(PINNED_CHILD_ENV.CONVEX_DEPLOY_KEY).toBe("<ignore_deploy_key>");
    expect(DEPLOY_KEY_SENTINEL).toBe("<ignore_deploy_key>");
    expect(fs.readFileSync(path.join(path.dirname(CONVEX_BIN), "..", "dist", "cli.bundle.cjs"), "utf8")).toContain(
      'deployKey === "<ignore_deploy_key>"',
    );
    expect(PINNED_CHILD_ENV.DISABLE_BEACON).toBe("1");
  });
  test("USERPROFILE or HOME pointing at the real home (owner login visible)", () => {
    expectRefused(input({ childEnv: { ...base(), USERPROFILE: REAL_HOME } }), /USERPROFILE must be/);
    expectRefused(input({ childEnv: { ...base(), HOME: REAL_HOME } }), /HOME must be/);
    const noHome = base();
    delete noHome.HOME;
    expectRefused(input({ childEnv: noHome }), /HOME must be/);
  });
  test("USERPROFILE pointing at another port's backend", () => {
    expectRefused(input({ childEnv: { ...base(), USERPROFILE: backendDir(8151, ROOT) } }), /USERPROFILE must be/);
  });
  test("backend home equal to the real home", () => {
    const root = path.join(REAL_HOME, "x");
    expectRefused(input({ root, realHome: backendDir(8150, root) }), /must not be the real home/);
  });
  test("LOCALAPPDATA left at the owner's cache on Windows", () => {
    expectRefused(input({ childEnv: { ...base(), LOCALAPPDATA: OWNER_LOCALAPPDATA } }), /LOCALAPPDATA must be inside/);
  });
  test("credentials re-added to the child env", () => {
    expectRefused(input({ childEnv: { ...base(), CONVEX_DEPLOY_KEY: FAKE_KEY } }), /CONVEX_DEPLOY_KEY must be set exactly once/);
    expectRefused(input({ childEnv: { ...base(), Convex_Deploy_Key: FAKE_KEY } }), /CONVEX_DEPLOY_KEY must be set exactly once/);
  });
});

describe("guard rejections: CLI version", () => {
  test("only tested Convex CLI versions run", () => {
    expect(TESTED_CONVEX_VERSIONS).toEqual(["1.31.0"]);
    expect(TESTED_CONVEX_VERSIONS).toContain(installedConvexVersion());
    expectRefused(input({ cliVersion: "1.47.0" }), /Convex CLI 1\.47\.0 is not on the tested list.*re-verify/);
    expectRefused(input({ cliVersion: "1.31.1" }), /not on the tested list/);
    const cwd = tmpDir("uvs-wt-");
    expect(() =>
      prepareInvocation({ argv: ["--app-port", "8150", "env", "list"], parentEnv: {}, cwd, root: tmpDir("uvs-root-"), cliVersion: "1.47.0" }),
    ).toThrow(/not on the tested list/);
  });
});

/** The dotenv 16.6.1 module bundled in the installed Convex CLI, loaded the way the CLI runs it. */
const DOTENV_FROM_BUNDLE = `
const fs = require("fs");
const b = fs.readFileSync(process.env.UVS_CLI_BUNDLE, "utf8");
const s = b.indexOf("// ../common/temp/node_modules/.pnpm/dotenv@16.6.1/node_modules/dotenv/package.json");
const e = b.indexOf("// ../common/temp/node_modules/.pnpm/fetch-retry@");
if (s < 0 || e < 0) throw new Error("bundled dotenv not found");
const __commonJS = (cb, m) => function () { return m || (0, cb[Object.getOwnPropertyNames(cb)[0]])((m = { exports: {} }).exports, m), m.exports; };
const dotenv = new Function("require", "__commonJS", b.slice(s, e) + "\\nreturn require_main();")(require, __commonJS);
`;
const CLI_BUNDLE = path.join(path.dirname(CONVEX_BIN), "..", "dist", "cli.bundle.cjs");
const FAKE_KEY = "dev:does-not-exist.invalid|ZmFrZS1ub3QtYS1rZXk";

let bundledParse: ((s: string) => Record<string, string>) | null = null;
function bundledDotenvParse(src: string): Record<string, string> {
  if (!bundledParse) {
    const run = new Function("require", "process", `${DOTENV_FROM_BUNDLE}\nreturn dotenv.parse;`);
    bundledParse = run(require, { env: { UVS_CLI_BUNDLE: CLI_BUNDLE } }) as (s: string) => Record<string, string>;
  }
  return bundledParse(src);
}

/** Writes env files into a fresh worktree dir and runs the real dry-run path (the one --print-target uses). */
function dryRun(files: Record<string, string>, parentEnv: Env = {}) {
  const cwd = tmpDir("uvs-wt-");
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(cwd, name), body);
  return () => prepareInvocation({ argv: ["--app-port", "8150", "env", "list"], parentEnv, cwd, root: tmpDir("uvs-root-") });
}

describe("guard rejections: env-file forms dotenv accepts (verifier cases on #210)", () => {
  const refusals: [string, Record<string, string>, RegExp, Env?][] = [
    ["KEY: value", { ".env.local": `CONVEX_DEPLOY_KEY: ${FAKE_KEY}\n` }, /CONVEX_DEPLOY_KEY is set in .env.local/],
    ["KEY:<tab>value in .env", { ".env": `CONVEX_DEPLOY_KEY:\t${FAKE_KEY}\n` }, /CONVEX_DEPLOY_KEY is set in .env\./],
    ["lowercase name", { ".env.local": `convex_deploy_key=${FAKE_KEY}\n` }, /convex_deploy_key is set in .env.local/],
    ["mixed-case name in .env", { ".env": `Convex_Deploy_Key=${FAKE_KEY}\n` }, /Convex_Deploy_Key is set in .env\./],
    [".env.vault + DOTENV_KEY", { ".env.vault": 'DOTENV_VAULT_DEVELOPMENT="x"\n' }, /\.env\.vault exists/, { DOTENV_KEY: "dotenv://:key_x@dotenvx.invalid/vault/.env.vault?environment=development" }],
    ["lowercase override token", { ".env.local": "convex_override_access_token=fake-token.invalid\n" }, /convex_override_access_token is set/],
    ["override token, colon form", { ".env.local": "CONVEX_OVERRIDE_ACCESS_TOKEN: fake-token.invalid\n" }, /CONVEX_OVERRIDE_ACCESS_TOKEN is set/],
    ["export prefix", { ".env.local": `export CONVEX_DEPLOY_KEY=${FAKE_KEY}\n` }, /CONVEX_DEPLOY_KEY is set/],
    ["double quotes", { ".env.local": `CONVEX_DEPLOY_KEY="${FAKE_KEY}"\n` }, /CONVEX_DEPLOY_KEY is set/],
    ["single quotes", { ".env.local": `CONVEX_DEPLOY_KEY='${FAKE_KEY}'\n` }, /CONVEX_DEPLOY_KEY is set/],
    ["backticks", { ".env.local": `CONVEX_DEPLOY_KEY=\`${FAKE_KEY}\`\n` }, /CONVEX_DEPLOY_KEY is set/],
    ["after a multi-line quoted value", { ".env.local": `A="line1\nline2"\n  export CONVEX_DEPLOY_KEY = ${FAKE_KEY} # c\n` }, /CONVEX_DEPLOY_KEY is set/],
    ["empty value", { ".env.local": "CONVEX_DEPLOY_KEY=\n" }, /CONVEX_DEPLOY_KEY is set/],
    ["DOTENV_KEY in a file", { ".env.local": "DOTENV_KEY=dotenv://:key_x@dotenvx.invalid/vault/.env.vault?environment=development\n" }, /DOTENV_KEY is set in .env.local/],
    [".env.local.vault alone", { ".env.local.vault": 'DOTENV_VAULT_DEVELOPMENT="x"\n' }, /\.env\.local\.vault exists/],
    ["anonymous mode turned off", { ".env": "convex_allow_anonymous=false\n" }, /convex_allow_anonymous is set/],
    ["colon-form cloud deployment", { ".env.local": "CONVEX_DEPLOYMENT: dev:does-not-exist-123\n" }, /not an `anonymous:` local deployment/],
    ["colon-form self-hosted URL", { ".env.local": "CONVEX_SELF_HOSTED_URL: https://does-not-exist.invalid\nCONVEX_SELF_HOSTED_ADMIN_KEY: fake\n" }, /CONVEX_SELF_HOSTED_URL in .env.local is not a loopback URL/],
    ["lowercase cloud URL", { ".env": "next_public_convex_url=https://does-not-exist.invalid\n" }, /next_public_convex_url in .env is not a loopback URL/],
  ];
  for (const [name, files, pattern, parentEnv] of refusals) {
    test(`${name} is refused`, () => {
      expect(dryRun(files, parentEnv)).toThrow(pattern);
    });
  }
  test("DOTENV_KEY in the caller env alone, any case", () => {
    expect(dryRun({}, { DOTENV_KEY: "x" })).toThrow(/DOTENV_KEY is set in the caller/);
    expect(dryRun({}, { dotenv_key: "x" })).toThrow(/dotenv_key is set in the caller/);
  });
  test("forbidden caller env names in any case", () => {
    expect(dryRun({}, { convex_deploy_key: FAKE_KEY })).toThrow(/convex_deploy_key is set in the caller/);
    expect(dryRun({}, { Convex_Override_Access_Token: "x" })).toThrow(/Convex_Override_Access_Token is set in the caller/);
  });
  test("parseDotenv reads every refused file exactly as the CLI's own dotenv does", () => {
    for (const [name, files] of refusals) {
      for (const [file, body] of Object.entries(files)) {
        if (file.endsWith(".vault")) continue;
        expect([name, parseDotenv(body)]).toEqual([name, bundledDotenvParse(body)]);
      }
    }
  });
});

const LOCAL_BLOCK = `CONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}\nNEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3400\n`;
const CLOUD_BLOCK = "CONVEX_DEPLOYMENT=dev:does-not-exist-123\nNEXT_PUBLIC_CONVEX_URL=https://does-not-exist-123.convex.invalid\n";

describe("guard rejections: a hand check says local but the CLI goes elsewhere (#204 verifier cases)", () => {
  test("duplicate lines where the last (cloud) one wins", () => {
    expect(dryRun({ ".env.local": LOCAL_BLOCK + CLOUD_BLOCK })).toThrow(/sets CONVEX_DEPLOYMENT more than once/);
    expect(dryRun({ ".env.local": LOCAL_BLOCK + CLOUD_BLOCK })).toThrow(/not an `anonymous:` local deployment/);
  });
  test("duplicate lines are refused even when every copy is local", () => {
    expect(dryRun({ ".env.local": LOCAL_BLOCK + LOCAL_BLOCK })).toThrow(/sets CONVEX_DEPLOYMENT more than once/);
  });
  test("duplicate deploy-key and URL lines", () => {
    expect(dryRun({ ".env": `CONVEX_DEPLOY_KEY=${FAKE_KEY}\nCONVEX_DEPLOY_KEY=\n` })).toThrow(/sets CONVEX_DEPLOY_KEY more than once/);
    expect(dryRun({ ".env.local": "CONVEX_URL=http://127.0.0.1:3400\nCONVEX_URL=http://127.0.0.1:3400\n" })).toThrow(
      /sets CONVEX_URL more than once/,
    );
  });
  test("local lines hidden inside a multi-line quoted value, then a cloud block", () => {
    const run = dryRun({ ".env.local": `NOTE="\n${LOCAL_BLOCK}"\n${CLOUD_BLOCK}` });
    expect(run).toThrow(/reads differently from a plain line-by-line read/);
    expect(run).toThrow(/not an `anonymous:` local deployment/);
  });
  test("cloud lines hidden inside a multi-line quoted value are refused too", () => {
    expect(dryRun({ ".env.local": `${LOCAL_BLOCK}NOTE="\n${CLOUD_BLOCK}"\n` })).toThrow(/reads differently/);
  });
  test("empty-but-set shell CONVEX_DEPLOYMENT (the CLI would ignore the file and fall back)", () => {
    expect(dryRun({ ".env.local": LOCAL_BLOCK }, { CONVEX_DEPLOYMENT: "" })).toThrow(/CONVEX_DEPLOYMENT in the caller's environment is set but empty/);
    expect(dryRun({ ".env.local": LOCAL_BLOCK }, { convex_deployment: "" })).toThrow(/set but empty/);
    expect(dryRun({ ".env.local": LOCAL_BLOCK }, { NEXT_PUBLIC_CONVEX_URL: "" })).toThrow(/set but empty/);
    expect(dryRun({ ".env.local": "CONVEX_DEPLOYMENT=\n" })).toThrow(/CONVEX_DEPLOYMENT in .env.local is set but empty/);
  });
  test("`KEY:value` with no space, which dotenv skips", () => {
    expect(dryRun({ ".env.local": `CONVEX_DEPLOYMENT:${ANONYMOUS_DEPLOYMENT}\n` })).toThrow(/reads differently/);
    expect(dryRun({ ".env.local": "CONVEX_DEPLOYMENT:dev:does-not-exist-123\n" })).toThrow(/reads differently/);
    expect(dryRun({ ".env": `CONVEX_DEPLOY_KEY:${FAKE_KEY}\n` })).toThrow(/reads differently/);
  });
  test("credential names inside another value", () => {
    expect(dryRun({ ".env.local": `${LOCAL_BLOCK}NOTE='CONVEX_DEPLOY_KEY=${FAKE_KEY}'\n` })).toThrow(/mentions CONVEX_DEPLOY_KEY inside another value/);
  });
  test("convex.json linking a team/project", () => {
    expect(dryRun({ ".env.local": LOCAL_BLOCK, "convex.json": '{"team":"t","project":"p"}' })).toThrow(/convex.json links a team\/project/);
    expect(dryRun({ ".env.local": LOCAL_BLOCK, "convex.json": "{not json" })).toThrow(/convex.json links/);
    expect(dryRun({ ".env.local": LOCAL_BLOCK, "convex.json": '{"functions":"convex/"}' })).not.toThrow();
  });
  test("the CLI-written .env.local passes", () => {
    expect(
      dryRun({ ".env.local": `# Deployment used by \`npx convex dev\`\nCONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}\n\nNEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3400\n` }),
    ).not.toThrow();
  });
});

describe("resolveCliTarget replays the CLI's selection", () => {
  const files = (local?: string, env?: string) =>
    [
      ...(local === undefined ? [] : [{ name: ".env.local", env: parseDotenv(local) }]),
      ...(env === undefined ? [] : [{ name: ".env", env: parseDotenv(env) }]),
    ];
  const r = (childEnv: Env, fileSources = files(), platform: NodeJS.Platform = "win32") =>
    resolveCliTarget({ childEnv, fileSources, platform }).target;
  test("classes", () => {
    expect(r({ CONVEX_DEPLOYMENT: ANONYMOUS_DEPLOYMENT })).toBe("local");
    expect(r({}, files(LOCAL_BLOCK))).toBe("local");
    expect(r({}, files(LOCAL_BLOCK + CLOUD_BLOCK))).toBe("cloud");
    expect(r({}, files(`NOTE="\n${LOCAL_BLOCK}"\n${CLOUD_BLOCK}`))).toBe("cloud");
    expect(r({ CONVEX_DEPLOYMENT: "" }, files(LOCAL_BLOCK))).toBe("unknown");
    expect(r({}, files(`CONVEX_DEPLOYMENT:${ANONYMOUS_DEPLOYMENT}\n`))).toBe("unknown");
    expect(r({}, files(LOCAL_BLOCK, `CONVEX_DEPLOY_KEY=${FAKE_KEY}\n`))).toBe("cloud");
    expect(r({}, files(`convex_deploy_key=${FAKE_KEY}\n${LOCAL_BLOCK}`))).toBe("cloud");
    expect(r({}, files(`convex_deploy_key=${FAKE_KEY}\n${LOCAL_BLOCK}`), "linux")).toBe("local");
    expect(r({}, files("CONVEX_DEPLOYMENT=anonymous:anonymous-other\n"))).toBe("unknown");
    expect(r({}, files(`${LOCAL_BLOCK}CONVEX_ALLOW_ANONYMOUS=false\n`))).toBe("unknown");
    expect(r({})).toBe("unknown");
    // The CLI treats an empty deploy key as unset.
    expect(r({ CONVEX_DEPLOY_KEY: "" })).toBe("unknown");
    expect(r({ CONVEX_DEPLOY_KEY: "" }, files(LOCAL_BLOCK))).toBe("local");
  });
  test("the wrapper's pins win over every file form", () => {
    const childEnv = buildChildEnv({ parentEnv: {}, appPort: 8150, root: ROOT, platform: "win32" });
    expect(r(childEnv, files(`convex_deploy_key=${FAKE_KEY}\n${CLOUD_BLOCK}`, `CONVEX_OVERRIDE_ACCESS_TOKEN=x\n`))).toBe("local");
  });
});

describe("vconvex --check", () => {
  const check = (files: Record<string, string>, parentEnv: Env = {}, extra: string[] = []) => {
    const cwd = tmpDir("uvs-wt-");
    for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(cwd, name), body);
    return checkInvocation({ argv: ["--app-port", "8150", "--check", ...extra], parentEnv, cwd, root: tmpDir("uvs-root-") });
  };
  test("clean worktree: local, every rule passes, subcommand rule skipped without args", () => {
    const result = check({ ".env.local": LOCAL_BLOCK });
    expect(result.ok).toBe(true);
    expect(result.target).toBe("local");
    expect(result.rules.find((x) => x.rule === "subcommand-and-flags")?.status).toBe("skipped");
    expect(result.rules.filter((x) => x.status === "fail")).toEqual([]);
    expect(check({}).ok).toBe(true);
  });
  test("cloud and unknown classes, with failing rule names", () => {
    const cloud = check({ ".env.local": LOCAL_BLOCK + CLOUD_BLOCK });
    expect(cloud).toMatchObject({ ok: false, target: "cloud" });
    expect(cloud.rules.filter((x) => x.status === "fail").map((x) => x.rule)).toEqual(["env-files-clean", "env-files-unambiguous"]);
    expect(check({ ".env": `CONVEX_DEPLOY_KEY: ${FAKE_KEY}\n` })).toMatchObject({ ok: false, target: "cloud" });
    expect(check({ ".env.local": LOCAL_BLOCK }, { CONVEX_DEPLOYMENT: "" })).toMatchObject({ ok: false, target: "unknown" });
    const emptyKey = check({ ".env.local": LOCAL_BLOCK }, { CONVEX_DEPLOY_KEY: "" });
    expect(emptyKey).toMatchObject({ ok: false, target: "unknown" });
    expect(emptyKey.rules.filter((x) => x.status === "fail").map((x) => x.rule)).toEqual(["caller-env-clean"]);
    expect(check({ ".env.local": `CONVEX_DEPLOYMENT:${ANONYMOUS_DEPLOYMENT}\n` })).toMatchObject({ ok: false, target: "unknown" });
    expect(check({ ".env.local": LOCAL_BLOCK, ".env.vault": "x\n" })).toMatchObject({ ok: false, target: "unknown" });
  });
  test("args are checked when given", () => {
    expect(check({}, {}, ["deploy"]).ok).toBe(false);
    expect(check({}, {}, ["env", "list"]).ok).toBe(true);
  });
  test("output has rule names and counts, never values", () => {
    const text = formatCheck(check({ ".env.local": `CONVEX_DEPLOY_KEY=${FAKE_KEY}\n${CLOUD_BLOCK}` }));
    expect(text).toContain("target=cloud");
    expect(text).toContain("fail    env-files-clean");
    expect(text).not.toContain("does-not-exist");
    expect(text).not.toContain(FAKE_KEY);
  });
  test("the CLI entry point exits non-zero unless local", () => {
    const run = (cwdFiles: Record<string, string>) => {
      const cwd = tmpDir("uvs-wt-");
      for (const [name, body] of Object.entries(cwdFiles)) fs.writeFileSync(path.join(cwd, name), body);
      return spawnSync(process.execPath, [path.join(path.dirname(CONVEX_BIN), "..", "..", "..", "scripts", "validation", "convex.ts"), "--app-port", "8150", "--check"], {
        cwd,
        env: Object.fromEntries(
          ["PATH", "SystemRoot", "USERPROFILE", "HOME"].flatMap((k) => (process.env[k] ? [[k, process.env[k]]] : [])),
        ) as NodeJS.ProcessEnv,
        encoding: "utf8",
      });
    };
    // convex.ts checks the repo root's env files, so this run reflects this worktree.
    const result = run({});
    expect(result.stdout).toContain("vconvex check (app port 8150)");
    expect(result.status === 0).toBe(result.stdout.includes("target=local") && result.stdout.includes("OK:"));
  });
});

describe("parseDotenv mirrors the CLI's bundled dotenv", () => {
  const corpus = [
    "A=1\nB = 2\nC:3\nD: 4\nE:\t5\n",
    "export A=1\n  export   B=two words  \n",
    "A=\"x\\ny\"\nB='x\\ny'\nC=`x\\ny`\n",
    'A="multi\nline\nvalue"\nB=after\n',
    "A=val # comment\nB='hash # inside'\nC=\"q # in\" # out\n",
    "A=\r\nB=x\r\n# full comment\nC.D-e=dotted\n",
    "lower=1\nMiXeD=2\n=novalue\nnovalue\nKEY==double\n",
    'A="unterminated\nB=2\n',
  ];
  test.each(corpus)("matches on %j", (src) => {
    expect(parseDotenv(src)).toEqual(bundledDotenvParse(src));
    expect(Object.fromEntries(dotenvEntries(src))).toEqual(bundledDotenvParse(src));
  });
  test("the guard loads the CLI's own dotenv", () => {
    expect(loadCliDotenv().parse("A: 1\nA=2\n")).toEqual({ A: "2" });
  });
});

describe("defense in depth: pinned child env survives the CLI's own .env loading", () => {
  test("bundled dotenv can't fill CONVEX_DEPLOY_KEY or the override token, in any case", () => {
    const cwd = tmpDir("uvs-wt-");
    fs.writeFileSync(
      path.join(cwd, ".env.local"),
      `convex_deploy_key=${FAKE_KEY}\nCONVEX_OVERRIDE_ACCESS_TOKEN: fake.invalid\nCONVEX_DEPLOYMENT=dev:does-not-exist\nconvex_allow_anonymous=false\n`,
    );
    fs.writeFileSync(path.join(cwd, ".env"), `CONVEX_DEPLOY_KEY=${FAKE_KEY}\nDOTENV_KEY=x\n`);
    const childEnv = buildChildEnv({ parentEnv: process.env, appPort: 8150, root: tmpDir("uvs-root-") });
    const code = `${DOTENV_FROM_BUNDLE}
dotenv.config({ path: ".env.local" }); dotenv.config();
const pick = (n) => process.env[n];
console.log(JSON.stringify({ key: pick("CONVEX_DEPLOY_KEY"), token: pick("CONVEX_OVERRIDE_ACCESS_TOKEN"), dep: pick("CONVEX_DEPLOYMENT"), anon: pick("CONVEX_ALLOW_ANONYMOUS") }));`;
    const result = spawnSync("node", ["-e", code], {
      cwd,
      env: { ...childEnv, UVS_CLI_BUNDLE: CLI_BUNDLE } as unknown as NodeJS.ProcessEnv,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    const seen = JSON.parse(result.stdout.trim().split(/\r?\n/).pop()!);
    expect(seen).toEqual({ key: "<ignore_deploy_key>", token: "", dep: ANONYMOUS_DEPLOYMENT, anon: "true" });
  });
});

describe(".env.local must point at this backend", () => {
  test("refuses a .env.local the CLI wrote for another port, with the port to use", () => {
    const run = dryRun({ ".env.local": `CONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}\nNEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3402\n` });
    expect(run).toThrow(/points at port 3402 \(the app port 8151 backend\), but this command targets app port 8150.*--repoint-env-local/);
  });
  test("accepts this port's cloud and site URLs", () => {
    expect(
      dryRun({ ".env.local": "NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3400\nNEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3401\n" }),
    ).not.toThrow();
  });
  test("--repoint-env-local rewrites loopback URLs for this port and logs it", () => {
    const cwd = tmpDir("uvs-wt-");
    const file = path.join(cwd, ".env.local");
    fs.writeFileSync(file, `# keep\nCONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}\nNEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3402\nCONVEX_SITE_URL: http://127.0.0.1:3403\n`);
    const messages: string[] = [];
    prepareInvocation({
      argv: ["--app-port", "8150", "--repoint-env-local", "env", "list"],
      parentEnv: {},
      cwd,
      root: tmpDir("uvs-root-"),
      onRepoint: (m) => messages.push(m),
    });
    expect(fs.readFileSync(file, "utf8")).toBe(
      `# keep\nCONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}\nNEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3400\nCONVEX_SITE_URL: http://127.0.0.1:3401\n`,
    );
    expect(messages).toEqual(["[vconvex] repointed .env.local NEXT_PUBLIC_CONVEX_URL, CONVEX_SITE_URL at the app port 8150 backend"]);
  });
  test("--repoint-env-local never rewrites when anything else is refused", () => {
    const cwd = tmpDir("uvs-wt-");
    const file = path.join(cwd, ".env.local");
    const body = `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3402\nCONVEX_DEPLOY_KEY: ${FAKE_KEY}\n`;
    fs.writeFileSync(file, body);
    expect(() =>
      prepareInvocation({ argv: ["--app-port", "8150", "--repoint-env-local", "env", "list"], parentEnv: {}, cwd, root: tmpDir("uvs-root-") }),
    ).toThrow(GuardError);
    expect(fs.readFileSync(file, "utf8")).toBe(body);
  });
  test("repointEnvLocal leaves non-loopback URLs alone", () => {
    const cwd = tmpDir("uvs-wt-");
    const file = path.join(cwd, ".env.local");
    fs.writeFileSync(file, "NEXT_PUBLIC_CONVEX_URL=https://does-not-exist.invalid\n");
    expect(repointEnvLocal(file, portsFor(8150))).toEqual([]);
  });
});

describe("backend readiness probe", () => {
  test("parses `convex run lib/validationBackend:status` output", () => {
    expect(STATUS_FUNCTION).toBe("lib/validationBackend:status");
    expect(parseStatusOutput('{ "validationBackend": true }\n')).toBe(true);
    expect(parseStatusOutput("{\n  validationBackend: false\n}\n")).toBe(false);
    expect(parseStatusOutput("Could not find function")).toBeNull();
    expect(parseStatusOutput("")).toBeNull();
  });
});

describe("wrapper", () => {
  test("buildChildEnv strips credentials and overrides homes case-insensitively on Windows", () => {
    const env = buildChildEnv({
      parentEnv: {
        UserProfile: REAL_HOME,
        HOME: REAL_HOME,
        LocalAppData: OWNER_LOCALAPPDATA,
        CONVEX_DEPLOY_KEY: "k",
        convex_deployment: "dev:x",
        CONVEX_SELF_HOSTED_ADMIN_KEY: "k",
        convex_override_access_token: "t",
        DOTENV_KEY: "x",
        DOTENV_CONFIG_PATH: "x",
        NODE_OPTIONS: "--require x",
        PATH: "/bin",
      },
      appPort: 8150,
      root: ROOT,
      platform: "win32",
    });
    expect(env).toEqual({
      PATH: "/bin",
      ...PINNED_CHILD_ENV,
      USERPROFILE: backendDir(8150, ROOT),
      HOME: backendDir(8150, ROOT),
      TEMP: path.join(backendDir(8150, ROOT), "tmp"),
      TMP: path.join(backendDir(8150, ROOT), "tmp"),
      LOCALAPPDATA: sharedCacheDir(ROOT),
    });
  });

  test("splitArgs strips wrapper flags and a leading --", () => {
    expect(splitArgs(["--", "--app-port", "8150", "dev", "--once"])).toEqual({
      appPortFlag: "8150",
      printTarget: false,
      repointEnvLocal: false,
      check: false,
      fetchPinnedBackend: false,
      convexArgs: ["dev", "--once"],
    });
    expect(splitArgs(["env", "list", "--app-port=8151", "--print-target", "--repoint-env-local", "--log-file", "x.log"])).toEqual({
      appPortFlag: "8151",
      printTarget: true,
      repointEnvLocal: true,
      check: false,
      fetchPinnedBackend: false,
      logFile: "x.log",
      convexArgs: ["env", "list"],
    });
    expect(splitArgs(["--fetch-pinned-backend", "dev"]).fetchPinnedBackend).toBe(true);
  });

  test("dev gets the fixed local ports and the pinned backend; other commands are untouched", () => {
    expect(withLocalBackendFlags(["dev", "--once"], portsFor(8150))).toEqual([
      "dev",
      "--local",
      "--local-cloud-port",
      "3400",
      "--local-site-port",
      "3401",
      "--local-backend-version",
      PINNED_LOCAL_BACKEND_VERSION,
      "--once",
    ]);
    expect(withLocalBackendFlags(["env", "list"], portsFor(8150))).toEqual(["env", "list"]);
  });

  test("prepareInvocation refuses a worktree whose .env.local targets a cloud deployment", () => {
    const cwd = tmpDir("uvs-wt-");
    const root = tmpDir("uvs-root-");
    fs.writeFileSync(path.join(cwd, ".env.local"), "CONVEX_DEPLOYMENT=dev:happy-animal-123 # team: x\n");
    expect(() => prepareInvocation({ argv: ["--app-port", "8150", "dev", "--once"], parentEnv: {}, cwd, root })).toThrow(GuardError);
    fs.writeFileSync(path.join(cwd, ".env.local"), `CONVEX_DEPLOYMENT=${ANONYMOUS_DEPLOYMENT}\n`);
    const inv = prepareInvocation({ argv: ["--app-port", "8150", "dev", "--once"], parentEnv: {}, cwd, root });
    expect(inv.target.url).toBe("http://127.0.0.1:3400");
    expect(inv.cliArgs).toContain("--local-cloud-port");
  });

  test("saved deployment ports must match ports.ts", () => {
    const home = tmpDir("uvs-home-");
    const dir = path.join(home, ".convex", "anonymous-convex-backend-state", "anonymous-agent");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify({ ports: { cloud: 3400, site: 3401 } }));
    expect(() => checkSavedDeploymentPorts(home, portsFor(8150))).not.toThrow();
    expect(() => checkSavedDeploymentPorts(home, portsFor(8151))).toThrow(GuardError);
  });

  test("parseDotenv handles quotes, export, colons, and comments", () => {
    expect(
      parseDotenv('# c\nexport A=1\nB="two words" \nC=\'x#y\'\nD=val # trailing\nE: colon\nCONVEX_DEPLOYMENT=dev:x # team: t\n'),
    ).toEqual({ A: "1", B: "two words", C: "x#y", D: "val", E: "colon", CONVEX_DEPLOYMENT: "dev:x" });
  });
});

describe("CLI side-effect restore", () => {
  const write = (root: string, rel: string, body: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  };
  const read = (root: string, rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

  test("restores touched files exactly and generated files only when just the line endings changed", () => {
    const root = tmpDir("uvs-repo-");
    write(root, ".cursor/rules/convex_rules.mdc", "old rules\r\n");
    write(root, "convex/_generated/api.js", "export {};\r\nconst a = 1;\r\n");
    write(root, "convex/_generated/api.d.ts", "type A = 1;\r\n");
    write(root, "convex/_generated/server.js", "same\n");
    // A JSON round trip, as `start` saves it for `stop`.
    const snapshot = JSON.parse(JSON.stringify(takeCliSnapshot(root))) as ReturnType<typeof takeCliSnapshot>;

    write(root, ".cursor/rules/convex_rules.mdc", "new rules\n");
    write(root, "convex/README.md", "scaffold\n");
    write(root, "convex/_generated/api.js", "export {};\nconst a = 1;\n");
    write(root, "convex/_generated/api.d.ts", "type A = 2;\n");
    write(root, "convex/_generated/dataModel.d.ts", "new file\n");

    expect(restoreCliSnapshot(snapshot, root).map((r) => r.rel).sort()).toEqual([
      ".cursor/rules/convex_rules.mdc",
      "convex/README.md",
      "convex/_generated/api.js",
    ]);
    expect(read(root, ".cursor/rules/convex_rules.mdc")).toBe("old rules\r\n");
    expect(fs.existsSync(path.join(root, "convex/README.md"))).toBe(false);
    expect(read(root, "convex/_generated/api.js")).toBe("export {};\r\nconst a = 1;\r\n");
    // Real codegen changes and new codegen files stay.
    expect(read(root, "convex/_generated/api.d.ts")).toBe("type A = 2;\n");
    expect(read(root, "convex/_generated/dataModel.d.ts")).toBe("new file\n");
    expect(read(root, "convex/_generated/server.js")).toBe("same\n");
    expect(restoreCliSnapshot(snapshot, root)).toEqual([]);
  });

  test("bytes a restore overwrites or deletes are saved to the backend dir first (#221)", () => {
    const root = tmpDir("uvs-repo-");
    const home = tmpDir("uvs-home-");
    write(root, ".cursor/rules/convex_rules.mdc", "committed rules\n");
    write(root, "convex/_generated/api.js", "a\r\n");
    const snapshot = takeCliSnapshot(root);
    write(root, ".cursor/rules/convex_rules.mdc", "rules edited mid-session\n");
    write(root, "convex/README.md", "readme written mid-session\n");
    write(root, "convex/_generated/api.js", "a\n");

    const backupDir = revertBackupDir(home, new Date("2026-10-19T01:02:03.456Z"));
    expect(backupDir).toBe(path.join(home, "reverted", "2026-10-19T01-02-03-456Z"));
    const reverted = restoreCliSnapshot(snapshot, root, { backupDir });
    const byRel = Object.fromEntries(reverted.map((r) => [r.rel, r.backup]));
    expect(byRel[".cursor/rules/convex_rules.mdc"]).toBe(path.join(backupDir, ".cursor/rules/convex_rules.mdc"));
    expect(byRel["convex/README.md"]).toBe(path.join(backupDir, "convex/README.md"));
    // Line-ending-only reverts lose nothing, so they get no copy.
    expect(byRel["convex/_generated/api.js"]).toBeUndefined();
    expect(fs.readFileSync(byRel[".cursor/rules/convex_rules.mdc"]!, "utf8")).toBe("rules edited mid-session\n");
    expect(fs.readFileSync(byRel["convex/README.md"]!, "utf8")).toBe("readme written mid-session\n");
    expect(read(root, ".cursor/rules/convex_rules.mdc")).toBe("committed rules\n");
    expect(fs.existsSync(path.join(root, "convex/README.md"))).toBe(false);
    const line = formatReverted(reverted);
    expect(line).toContain(`.cursor/rules/convex_rules.mdc (replaced bytes saved to ${byRel[".cursor/rules/convex_rules.mdc"]})`);
    expect(line).toContain("convex/_generated/api.js");
    // A restore with nothing to put back writes no backup dir.
    const again = revertBackupDir(home, new Date("2026-10-19T01:02:04.000Z"));
    expect(restoreCliSnapshot(snapshot, root, { backupDir: again })).toEqual([]);
    expect(fs.existsSync(again)).toBe(false);
  });

  const RULES = ".cursor/rules/convex_rules.mdc";
  const git = (cwd: string, ...args: string[]) => {
    const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...args], { cwd, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout;
  };
  const gitRepo = () => {
    const root = tmpDir("uvs-repo-");
    git(root, "init", "-q", "-b", "main");
    git(root, "config", "core.autocrlf", "false");
    write(root, RULES, "rules on main\n");
    write(root, "convex/_generated/api.js", "api on main\n");
    write(root, ".gitignore", "convex/README.md\nconvex/tsconfig.json\n");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "main");
    git(root, "checkout", "-q", "-b", "other");
    write(root, RULES, "rules on other\n");
    write(root, "convex/_generated/api.js", "api on other\n");
    git(root, "commit", "-q", "-am", "other");
    git(root, "checkout", "-q", "main");
    return root;
  };
  // `start` saves its snapshot as JSON and the next `start` or `stop` reads it back.
  const saved = (root: string) => JSON.parse(JSON.stringify(takeCliSnapshot(root))) as ReturnType<typeof takeCliSnapshot>;

  test("snapshots record each file's blob at HEAD", () => {
    const root = gitRepo();
    const blob = git(root, "rev-parse", `HEAD:${RULES}`).trim();
    const byRel = Object.fromEntries(takeCliSnapshot(root).map((e) => [e.rel, e.head]));
    expect(byRel[RULES]).toBe(blob);
    expect(byRel["convex/README.md"]).toBeNull();
    expect(headBlobs(tmpDir("uvs-not-git-"), [RULES])).toBeNull();
    expect(takeCliSnapshot(tmpDir("uvs-not-git-")).every((e) => e.head === undefined)).toBe(true);
  });

  test("crash, then git checkout another branch, then start and stop: HEAD's version is kept (#233)", () => {
    const root = gitRepo();
    const home = tmpDir("uvs-home-");
    // 1. `start` saves its snapshot on main, then is killed after the CLI rewrote the rules.
    const leftover = saved(root);
    write(root, RULES, "the CLI's rewrite\n");
    write(root, "convex/README.md", "scaffold\n");
    // 2. The owner discards that and switches branches. `other` commits different rules.
    git(root, "checkout", "-q", "-f", "other");
    expect(read(root, RULES)).toBe("rules on other\n");
    // 3. The next `start` restores the leftover snapshot before taking its own.
    const startDir = revertBackupDir(home, new Date("2026-10-19T02:00:00.000Z"));
    const reverted = restoreCliSnapshot(leftover, root, { backupDir: startDir });
    expect(read(root, RULES)).toBe("rules on other\n");
    expect(read(root, "convex/_generated/api.js")).toBe("api on other\n");
    const rules = reverted.find((r) => r.rel === RULES)!;
    expect(rules.stale?.snapshotBackup).toBe(path.join(startDir, STALE_SNAPSHOT_DIR, RULES));
    expect(fs.readFileSync(rules.stale!.snapshotBackup!, "utf8")).toBe("rules on main\n");
    expect(rules.backup).toBeUndefined();
    // The README was untracked on both branches, so the CLI's copy is still reverted as before.
    expect(reverted.find((r) => r.rel === "convex/README.md")?.backup).toBeDefined();
    expect(reverted.find((r) => r.rel === "convex/README.md")?.stale).toBeUndefined();
    expect(fs.existsSync(path.join(root, "convex/README.md"))).toBe(false);
    expect(formatReverted([rules])).toContain("changed in git since the snapshot was taken, so HEAD's version was kept");
    // 4. That `start` snapshots `other`, the CLI rewrites again, and `stop` restores.
    const fresh = saved(root);
    write(root, RULES, "the CLI's rewrite\n");
    restoreCliSnapshot(fresh, root, { backupDir: revertBackupDir(home, new Date("2026-10-19T02:05:00.000Z")) });
    expect(read(root, RULES)).toBe("rules on other\n");
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  test("a stale file that differs from HEAD is backed up and put back to HEAD's version", () => {
    const root = gitRepo();
    const home = tmpDir("uvs-home-");
    const leftover = saved(root);
    git(root, "checkout", "-q", "other");
    write(root, RULES, "edited on other\n");
    const backupDir = revertBackupDir(home, new Date("2026-10-19T03:00:00.000Z"));
    const [rules] = restoreCliSnapshot(leftover, root, { backupDir }).filter((r) => r.rel === RULES);
    expect(read(root, RULES)).toBe("rules on other\n");
    expect(fs.readFileSync(rules.backup!, "utf8")).toBe("edited on other\n");
    expect(fs.readFileSync(rules.stale!.snapshotBackup!, "utf8")).toBe("rules on main\n");
    expect(git(root, "status", "--porcelain")).toBe("");
    // A snapshot saved by an older wrapper has no blob ids, and is restored as before.
    const old = saved(root).map((e) => ({ rel: e.rel, mode: e.mode, content: e.content }));
    write(root, RULES, "the CLI's rewrite\n");
    restoreCliSnapshot(old, root);
    expect(read(root, RULES)).toBe("rules on other\n");
  });

  test("codegen goes back to CRLF only while git lists the CLI's LF rewrite as modified", () => {
    const root = tmpDir("uvs-repo-");
    const GEN = "convex/_generated/api.js";
    git(root, "init", "-q", "-b", "main");
    write(root, ".gitattributes", "convex/_generated/** text eol=lf\n");
    write(root, GEN, "a\nb\n");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "init");
    // A checkout from before .gitattributes: CRLF on disk, and an index that matches it.
    write(root, GEN, "a\r\nb\r\n");
    git(root, "add", GEN);
    expect(git(root, "status", "--porcelain")).toBe("");
    const snapshot = saved(root);
    write(root, GEN, "a\nb\n");
    expect(git(root, "status", "--porcelain")).toContain(GEN);
    expect(restoreCliSnapshot(snapshot, root).map((r) => r.rel)).toEqual([GEN]);
    expect(read(root, GEN)).toBe("a\r\nb\r\n");
    expect(git(root, "status", "--porcelain")).toBe("");
    // After a killed start, `git checkout -f` writes it with LF and git calls it clean: leave it.
    write(root, GEN, "a\nb\n");
    git(root, "checkout", "-q", "-f", "HEAD");
    expect(git(root, "status", "--porcelain")).toBe("");
    expect(restoreCliSnapshot(snapshot, root)).toEqual([]);
    expect(read(root, GEN)).toBe("a\nb\n");
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  test("identical backups are kept once, and only the newest dirs are kept per port", () => {
    const root = tmpDir("uvs-repo-");
    const home = tmpDir("uvs-home-");
    write(root, RULES, "committed\n");
    const snapshot = takeCliSnapshot(root);
    let t = Date.parse("2026-10-19T04:00:00.000Z");
    const restore = (body: string) => {
      write(root, RULES, body);
      return restoreCliSnapshot(snapshot, root, { backupDir: revertBackupDir(home, new Date((t += 1000))) });
    };
    const reverted = path.join(home, "reverted");
    restore("a real edit\n");
    for (let i = 0; i < 5; i++) restore("the CLI's rewrite\n");
    // One dir for the real edit and one for the latest identical rewrite, not six.
    const dirs = fs.readdirSync(reverted).sort();
    expect(dirs).toHaveLength(2);
    expect(fs.readFileSync(path.join(reverted, dirs[0], RULES), "utf8")).toBe("a real edit\n");
    // The printed path is the copy that was kept.
    const [last] = restore("the CLI's rewrite\n");
    expect(fs.readFileSync(last.backup!, "utf8")).toBe("the CLI's rewrite\n");
    expect(fs.readdirSync(reverted)).toHaveLength(2);

    for (let i = 0; i < REVERTED_KEEP + 5; i++) restore(`edit ${i}\n`);
    const kept = fs.readdirSync(reverted).sort();
    expect(kept).toHaveLength(REVERTED_KEEP);
    expect(fs.readFileSync(path.join(reverted, kept.at(-1)!, RULES), "utf8")).toBe(`edit ${REVERTED_KEEP + 4}\n`);
    expect(fs.readFileSync(path.join(reverted, kept[0], RULES), "utf8")).toBe("edit 5\n");
  });
});

describe("generated backend env", () => {
  test("RS256 keys in Convex Auth manual-setup format and a random admin key", async () => {
    const keys = await generateAuthKeys();
    expect(keys.JWT_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY----- ")).toBe(true);
    expect(keys.JWT_PRIVATE_KEY).not.toContain("\n");
    const jwks = JSON.parse(keys.JWKS) as { keys: Record<string, string>[] };
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0]).toMatchObject({ use: "sig", kty: "RSA", e: "AQAB" });
    expect(jwks.keys[0].d).toBeUndefined();
    const a = generateAdminApiKey();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateAdminApiKey()).not.toBe(a);
    expect((await generateAuthKeys()).JWKS).not.toBe(keys.JWKS);
  });

  test("backend env is all generated or placeholder values", () => {
    const env = buildBackendEnv(8150, { JWT_PRIVATE_KEY: "pk", JWKS: "jwks", ADMIN_API_KEY: "ak" });
    expect(env).toMatchObject({
      UVS_VALIDATION_BACKEND: "1",
      SITE_URL: "http://localhost:8150",
      MODERATION_IMAGE_PROVIDER: "stub",
      TEXT_MODERATION_PROVIDER: "stub",
      JWT_PRIVATE_KEY: "pk",
      JWKS: "jwks",
      ADMIN_API_KEY: "ak",
    });
    expect(isLoopbackUrl(env.R2_ENDPOINT)).toBe(true);
    for (const name of ["OPENAI_API_KEY", "YOUTUBE_DATA_API_KEY", "TWITCH_CLIENT_SECRET", "AUTH_RESEND_KEY"]) {
      expect(env[name]).toBeUndefined();
    }
  });
});

describe("owner login is invisible to the wrapped CLI (guard bypassed, harness only)", () => {
  test("`convex login status` with the wrapped env finds no usable login", () => {
    const root = tmpDir("uvs-login-");
    const cwd = tmpDir("uvs-login-cwd-");
    const childEnv = buildChildEnv({ parentEnv: process.env, appPort: 8150, root });
    const result = spawnSync("node", [CONVEX_BIN, "login", "status"], {
      cwd,
      env: childEnv as NodeJS.ProcessEnv,
      encoding: "utf8",
      timeout: 60_000,
    });
    const output = `${result.stdout}\n${result.stderr}`;
    expect(result.status).toBe(0);
    expect(output).toMatch(/Status: Not logged in|No token found locally/);
    expect(output).not.toMatch(/Status: Logged in/);
    // The CLI only looked for credentials under the backend home, never the real one.
    const printed = /found in: (.+config\.json)/.exec(output)?.[1]?.trim();
    if (printed) expect(path.resolve(printed).startsWith(path.resolve(backendDir(8150, root)))).toBe(true);
  }, 60_000);
});
