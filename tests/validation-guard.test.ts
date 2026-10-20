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
import { STATUS_FUNCTION, parseStatusOutput } from "../scripts/validation/backend";
import {
  CONVEX_BIN,
  buildChildEnv,
  checkInvocation,
  checkSavedDeploymentPorts,
  formatCheck,
  installedConvexVersion,
  prepareInvocation,
  repointEnvLocal,
  splitArgs,
  withLocalPorts,
} from "../scripts/validation/convex";
import { buildBackendEnv } from "../scripts/validation/env";
import {
  ANONYMOUS_DEPLOYMENT,
  DEPLOY_KEY_SENTINEL,
  FORBIDDEN_FLAGS,
  GuardError,
  PINNED_CHILD_ENV,
  TESTED_CONVEX_VERSIONS,
  dotenvEntries,
  guardViolations,
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
      convexArgs: ["dev", "--once"],
    });
    expect(splitArgs(["env", "list", "--app-port=8151", "--print-target", "--repoint-env-local", "--log-file", "x.log"])).toEqual({
      appPortFlag: "8151",
      printTarget: true,
      repointEnvLocal: true,
      check: false,
      logFile: "x.log",
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

  test("parseDotenv handles quotes, export, colons, and comments", () => {
    expect(
      parseDotenv('# c\nexport A=1\nB="two words" \nC=\'x#y\'\nD=val # trailing\nE: colon\nCONVEX_DEPLOYMENT=dev:x # team: t\n'),
    ).toEqual({ A: "1", B: "two words", C: "x#y", D: "val", E: "colon", CONVEX_DEPLOYMENT: "dev:x" });
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
