import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertValidationBackend,
  isLoopbackUrl,
  isValidationBackend,
} from "../convex/lib/validationBackend";
import {
  CONVEX_BIN,
  buildChildEnv,
  checkSavedDeploymentPorts,
  prepareInvocation,
  splitArgs,
  withLocalPorts,
} from "../scripts/validation/convex";
import { buildBackendEnv } from "../scripts/validation/env";
import {
  ANONYMOUS_DEPLOYMENT,
  FORBIDDEN_FLAGS,
  GuardError,
  guardViolations,
  parseDotenv,
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
    sources: [
      { name: "the caller's environment", env: parentEnv },
      ...Object.entries(overrides.files ?? {}).map(([name, env]) => ({ name, env })),
    ],
    childEnv: overrides.childEnv ?? buildChildEnv({ parentEnv, appPort: 8150, root: ROOT, platform: PLATFORM }),
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
    expectRefused(input({ childEnv }), /CONVEX_AGENT_MODE must be `anonymous`/);
  });
  test("child deployment missing or not anonymous", () => {
    const missing = base();
    delete missing.CONVEX_DEPLOYMENT;
    expectRefused(input({ childEnv: missing }), /explicit `anonymous:` CONVEX_DEPLOYMENT/);
    expectRefused(input({ childEnv: { ...base(), CONVEX_DEPLOYMENT: "dev:x" } }), /explicit `anonymous:`/);
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
    expectRefused(input({ childEnv: { ...base(), CONVEX_DEPLOY_KEY: "k" } }), /CONVEX_DEPLOY_KEY is set in the wrapped CLI env/);
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
        PATH: "/bin",
      },
      appPort: 8150,
      root: ROOT,
      platform: "win32",
    });
    expect(env).toEqual({
      PATH: "/bin",
      CONVEX_AGENT_MODE: "anonymous",
      CONVEX_DEPLOYMENT: ANONYMOUS_DEPLOYMENT,
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
      convexArgs: ["dev", "--once"],
    });
    expect(splitArgs(["env", "list", "--app-port=8151", "--print-target"])).toEqual({
      appPortFlag: "8151",
      printTarget: true,
      convexArgs: ["env", "list"],
    });
  });

  test("dev gets the fixed local ports; other commands are untouched", () => {
    expect(withLocalPorts(["dev", "--once"], portsFor(8150))).toEqual([
      "dev",
      "--local",
      "--local-cloud-port",
      "3400",
      "--local-site-port",
      "3401",
      "--once",
    ]);
    expect(withLocalPorts(["env", "list"], portsFor(8150))).toEqual(["env", "list"]);
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

  test("parseDotenv handles quotes, export, and comments", () => {
    expect(
      parseDotenv('# c\nexport A=1\nB="two words" \nC=\'x#y\'\nD=val # trailing\nCONVEX_DEPLOYMENT=dev:x # team: t\n'),
    ).toEqual({ A: "1", B: "two words", C: "x#y", D: "val", CONVEX_DEPLOYMENT: "dev:x" });
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
