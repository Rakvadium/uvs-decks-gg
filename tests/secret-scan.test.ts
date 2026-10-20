import { describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "../scripts/secret-scan/index";
import { buildMatcher, scanTarget, utf16Encoding, type Hit } from "../scripts/secret-scan/match";
import {
  encodedForms,
  flagValues,
  loadManifest,
  loadSecrets,
  parseEnvFile,
  splitValues,
  VALUE_SEPARATOR,
  valueFragments,
  windowsFor,
} from "../scripts/secret-scan/shared";

/** Fake values only. Random per run so nothing here can match a real secret. */
const FAKE = `fake-${crypto.randomBytes(9).toString("base64url")}/42+xyz=`;
const LONG = crypto.randomBytes(30).toString("base64url");

function matcherFor(env: Record<string, string>) {
  return buildMatcher(loadSecrets(Object.keys(env), env).secrets);
}
const fakeMatcher = matcherFor({ FAKE_TOKEN: FAKE, LONG_TOKEN: LONG });
const scan = (content: string | Buffer, before?: (string | Buffer)[]): Hit[] =>
  scanTarget(
    { location: "f", bytes: Buffer.from(content), before: before?.map((b) => Buffer.from(b)) },
    fakeMatcher,
  );
const found = (content: string | Buffer, before?: (string | Buffer)[]) =>
  scan(content, before).map((hit) => `${hit.name}:${hit.line}`);

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "secret-scan-"));
}

/** A test manifest so CLI tests don't depend on the real names. */
function manifestIn(dir: string): string {
  const file = path.join(dir, "manifest.json");
  fs.writeFileSync(
    file,
    JSON.stringify({ names: ["FAKE_TOKEN", "OTHER_TOKEN", "OPT_TOKEN", "CANARY"], optional: ["OPT_TOKEN"], ciOnly: ["CANARY"] }),
  );
  return file;
}

function capture(argv: string[], env: Record<string, string>, cwd: string, manifest = manifestIn(tempDir())) {
  const lines: string[] = [];
  const code = run(argv, { env, cwd, manifest, out: (l) => lines.push(l), err: (l) => lines.push(l) });
  return { code, output: lines.join("\n") };
}

function repo() {
  const dir = tempDir();
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" }).toString().trim();
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  git("config", "core.autocrlf", "false");
  const write = (file: string, content: string | Buffer) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };
  const commit = (message: string) => {
    git("add", "-A");
    git("commit", "-qm", message, "--allow-empty");
    return git("rev-parse", "HEAD");
  };
  return { dir, git, write, commit };
}

describe("secret-scan matching", () => {
  test("raw value, with the right line", () => {
    expect(found(`a\nb\nconst key = "${FAKE}";\n`)).toEqual(["FAKE_TOKEN:3"]);
  });

  test("URL-encoded value, upper and lower case escapes", () => {
    const encoded = encodeURIComponent(FAKE);
    expect(encoded).not.toBe(FAKE);
    expect(found(`?token=${encoded}`)).toEqual(["FAKE_TOKEN:1"]);
    expect(found(`?token=${encoded.replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase())}`)).toEqual(["FAKE_TOKEN:1"]);
  });

  test("base64 and base64url, standalone or embedded at any alignment", () => {
    for (const prefix of ["", "u:", "us:", "user:"]) {
      expect(found(`Authorization: Basic ${Buffer.from(`${prefix}${FAKE}`).toString("base64")}`)).toEqual(["FAKE_TOKEN:1"]);
      expect(found(Buffer.from(`${prefix}${FAKE}`).toString("base64url"))).toEqual(["FAKE_TOKEN:1"]);
    }
  });

  test("hard-wrapped base64 (76 columns, like base64 or MIME output)", () => {
    const b64 = Buffer.from(`${"x".repeat(50)}${FAKE}${"y".repeat(70)}`).toString("base64");
    const wrapped = b64.match(/.{1,76}/g)!.join("\r\n");
    // The value's base64 straddles a line break, so no single line holds it.
    expect(encodedForms(FAKE).some((form) => wrapped.split("\n").some((line) => line.includes(form)))).toBe(false);
    expect(scan(wrapped).map((h) => h.name)).toContain("FAKE_TOKEN");
  });

  test("value split across lines, or split into concatenated strings", () => {
    const half = Math.floor(FAKE.length / 2);
    expect(found(`key: ${FAKE.slice(0, half)}\n  ${FAKE.slice(half)}\n`)).toEqual(["FAKE_TOKEN:1"]);
    expect(found(`const key = "${FAKE.slice(0, half)}" +\n  "${FAKE.slice(half)}";`)).toEqual(["FAKE_TOKEN:1"]);
    expect(found(`key = ('${FAKE.slice(0, half)}'\n       '${FAKE.slice(half)}')`)).toEqual(["FAKE_TOKEN:1"]);
    expect(found(`$k = "${FAKE.slice(0, half)}" . "${FAKE.slice(half)}";`)).toEqual(["FAKE_TOKEN:1"]);
  });

  test("any 24-char slice of a long value, e.g. one piece of a split string", () => {
    expect(found(`parts = [x(), "${LONG.slice(3, 27)}", y()]`)).toEqual(["LONG_TOKEN:1"]);
    expect(found(`short = "${LONG.slice(3, 26)}"`)).toEqual([]);
  });

  test("UTF-16LE (with and without BOM) and UTF-16BE files", () => {
    const text = `log line\r\ntoken=${FAKE}\r\n`;
    const le = Buffer.from(text, "utf16le");
    expect(utf16Encoding(le)).toBe("le");
    expect(found(Buffer.concat([Buffer.from([0xff, 0xfe]), le]))).toContain("FAKE_TOKEN:2");
    expect(found(le)).toContain("FAKE_TOKEN:2");
    const be = Buffer.from(le).swap16();
    expect(utf16Encoding(Buffer.concat([Buffer.from([0xfe, 0xff]), be]))).toBe("be");
    expect(found(Buffer.concat([Buffer.from([0xfe, 0xff]), be]))).toContain("FAKE_TOKEN:2");
  });

  test("raw and UTF-16 values inside binary data", () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]), Buffer.from(`tEXtComment\0${FAKE}`), Buffer.alloc(64)]);
    expect(scan(png).map((h) => h.name)).toEqual(["FAKE_TOKEN"]);
    const embedded = Buffer.concat([Buffer.alloc(32, 7), Buffer.from(FAKE, "utf16le"), Buffer.alloc(32)]);
    expect(scan(embedded).map((h) => h.name)).toEqual(["FAKE_TOKEN"]);
  });

  test("JSON-escaped multi-line value", () => {
    const pem = `first-line-${FAKE}\nsecond-line-${FAKE}`;
    const m = matcherFor({ MULTI: pem });
    const hits = scanTarget({ location: "f", bytes: Buffer.from(JSON.stringify({ key: pem })) }, m);
    expect(hits.map((h) => h.name)).toEqual(["MULTI"]);
  });

  test("PEM stored space-joined: body lines match alone; armor and DER header are not windows", () => {
    // Built from parts so gitleaks' private-key rule doesn't flag this fake key.
    const armor = (edge: string) => `-----${edge} ${["PRIVATE", "KEY"].join(" ")}-----`;
    const body = Array.from({ length: 4 }, () => crypto.randomBytes(48).toString("base64"));
    const pem = `${armor("BEGIN")} ${body.join(" ")} c2hvcnQtdGFpbC1saW5l ${armor("END")}`;
    expect(valueFragments(pem)).toEqual(body);
    expect(windowsFor(pem).some((w) => body[0].includes(w))).toBe(false);
    expect(windowsFor(pem).some((w) => body[1].includes(w))).toBe(true);
    const m = matcherFor({ JWT_PRIVATE_KEY: pem });
    const partial = `const key = \`${armor("BEGIN")}\n${body[1]}\n${body[2]}\n\`;`;
    expect(scanTarget({ location: "f", bytes: Buffer.from(partial) }, m).map((h) => h.line)).toEqual([2, 3]);
    const otherKey = `${armor("BEGIN")}\n${body[0].slice(0, 40)}${crypto.randomBytes(30).toString("base64")}\n${armor("END")}`;
    expect(scanTarget({ location: "f", bytes: Buffer.from(otherKey) }, m)).toEqual([]);
  });

  test("an occurrence already in the parent blob is not re-reported; a new one is", () => {
    const old = `a\nkey=${FAKE}\n`;
    expect(found(`${old}more text\n`, [old])).toEqual([]);
    expect(found(`${old}copy=${FAKE}\n`, [old])).toEqual(["FAKE_TOKEN:2", "FAKE_TOKEN:3"]);
    expect(found(`key=${FAKE}\n`, [""])).toEqual(["FAKE_TOKEN:1"]);
  });

  test("every distinct value across env sources, including VALUE_SEPARATOR-joined ones", () => {
    const joined = ["first-value-1", "second-value-2"].join(VALUE_SEPARATOR);
    expect(splitValues(joined)).toEqual(["first-value-1", "second-value-2"]);
    const m = buildMatcher(loadSecrets(["KEY"], [{ KEY: joined }, { KEY: "third-value-3" }]).secrets);
    const hits = scanTarget({ location: "f", bytes: Buffer.from("first-value-1\nsecond-value-2\nthird-value-3") }, m);
    expect(hits.map((h) => h.line)).toEqual([1, 2, 3]);
  });

  test("a multi-line PEM value is not split into separate values", () => {
    const pem = "-----BEGIN X-----\nabcdefghijklmnop\n-----END X-----";
    expect(splitValues(pem)).toEqual([pem]);
  });

  test("skips values shorter than 8 chars and reports missing ones", () => {
    const loaded = loadSecrets(["SHORT", "OK", "UNSET", "EMPTY"], { SHORT: "1234567", OK: "12345678", EMPTY: "" });
    expect(loaded.secrets.map((s) => s.name)).toEqual(["OK"]);
    expect(loaded.short).toEqual(["SHORT"]);
    expect(loaded.missing).toEqual(["UNSET", "EMPTY"]);
  });
});

describe("secret-scan env file and manifest", () => {
  test("parses names with digits, quotes, export, and inline comments", () => {
    const env = parseEnvFile(
      [
        "# comment",
        "R2_ACCESS_KEY_ID=abc123",
        "export R2_SECRET_ACCESS_KEY = 'single # kept'",
        'JWT_PRIVATE_KEY="line1\\nline2"',
        'MULTI="a',
        'b"',
        "CONVEX_DEPLOYMENT=dev:x # team: y",
      ].join("\r\n"),
    );
    expect(env).toEqual({
      R2_ACCESS_KEY_ID: "abc123",
      R2_SECRET_ACCESS_KEY: "single # kept",
      JWT_PRIVATE_KEY: "line1\nline2",
      MULTI: "a\nb",
      CONVEX_DEPLOYMENT: "dev:x",
    });
  });

  test("repeatable flags", () => {
    expect(flagValues(["--env-file", "a", "--diff", "x..y", "--env-file=b"], "env-file")).toEqual(["a", "b"]);
  });

  test("manifest: the issue's names, CONVEX_DEPLOY_KEY optional, canary CI-only", () => {
    const manifest = loadManifest();
    for (const name of ["AGENT_AUTH_SECRET", "AGENT_AUTH_PASSWORD", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "JWKS"]) {
      expect(manifest.names).toContain(name);
    }
    expect(manifest.names).not.toContain("AGENT_AUTH_USERNAME");
    expect(manifest.names).not.toContain("R2_BUCKET");
    expect(manifest.optional).toEqual(["CONVEX_DEPLOY_KEY"]);
    expect(manifest.ciOnly).toEqual(["SECRET_SCAN_CANARY"]);
  });

  test("CI passes every manifest secret and runs --strict --ci", () => {
    const ci = fs.readFileSync(path.join(import.meta.dir, "../.github/workflows/ci.yml"), "utf8");
    for (const name of loadManifest().names) expect(ci).toContain(`${name}: \${{ secrets.${name} }}`);
    expect(ci).toContain("bun run secret-scan --strict --ci --diff");
  });
});

describe("secret-scan fail closed", () => {
  test("zero values loaded exits 2, even without --strict", () => {
    const { code, output } = capture(["--path", "."], {}, tempDir());
    expect(code).toBe(2);
    expect(output).toContain("no secret values loaded");
  });

  test("only a CI-only value loaded counts as zero locally", () => {
    expect(capture(["--path", "."], { CANARY: FAKE }, tempDir()).code).toBe(2);
  });

  test("without --strict, missing values warn by name and the scan passes", () => {
    const { code, output } = capture(["--path", "."], { FAKE_TOKEN: FAKE }, tempDir());
    expect(code).toBe(0);
    expect(output).toContain("no value, not checked: OTHER_TOKEN, OPT_TOKEN");
    expect(output).not.toContain("CANARY");
  });

  test("--strict: missing required value fails with a stable message; optional and CI-only don't", () => {
    const strict = capture(["--strict", "--path", "."], { FAKE_TOKEN: FAKE }, tempDir());
    expect(strict.code).toBe(2);
    expect(strict.output).toContain("secret-scan: missing required value(s): OTHER_TOKEN");
    const ok = capture(["--strict", "--path", "."], { FAKE_TOKEN: FAKE, OTHER_TOKEN: "other-value-1" }, tempDir());
    expect(ok.code).toBe(0);
    expect(ok.output).toContain("no value, not checked: OPT_TOKEN");
  });

  test("--strict --ci also requires CI-only names", () => {
    const env = { FAKE_TOKEN: FAKE, OTHER_TOKEN: "other-value-1" };
    const ci = capture(["--strict", "--ci", "--path", "."], env, tempDir());
    expect(ci.code).toBe(2);
    expect(ci.output).toContain("secret-scan: missing required value(s): CANARY");
    expect(capture(["--strict", "--ci", "--path", "."], { ...env, CANARY: "canary-value-1" }, tempDir()).code).toBe(0);
  });

  test("a hit still exits 1 under --strict with values missing", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "a.txt"), FAKE);
    expect(capture(["--strict", "--path", "."], { FAKE_TOKEN: FAKE }, dir).code).toBe(1);
  });

  test("usage errors exit 2", () => {
    for (const argv of [[], ["--diff"], ["--bogus", "x"], ["--diff", "HEAD"], ["--strict=yes", "--path", "."]]) {
      expect(capture(argv, { FAKE_TOKEN: FAKE }, tempDir()).code).toBe(2);
    }
  });
});

describe("secret-scan --diff and --staged", () => {
  const env = { FAKE_TOKEN: FAKE };

  test("each commit's full new blobs and messages, even if later removed", () => {
    const r = repo();
    r.write("a.txt", "base\n");
    const base = r.commit("base");
    r.write("a.txt", `base\nleak=${FAKE}\n`);
    r.commit(`add\n\nmessage mentions ${Buffer.from(FAKE).toString("base64")}`);
    r.write("a.txt", "base\n");
    r.commit("remove it again");
    const { code, output } = capture(["--diff", `${base}..HEAD`], env, r.dir);
    expect(code).toBe(1);
    expect(output).toMatch(/FAKE_TOKEN a\.txt:2 @[0-9a-f]{7}/);
    expect(output).toMatch(/FAKE_TOKEN commit-message:3 @[0-9a-f]{7}/);
    expect(output).not.toContain(FAKE);
  });

  test("binary files and .gitattributes binary/-diff don't hide values", () => {
    const r = repo();
    r.write("README", "x\n");
    const base = r.commit("base");
    r.write(".gitattributes", "* binary\n*.txt -diff\n");
    r.write("hidden/notes.txt", `token=${FAKE}\n`);
    r.write("img.png", Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0]), Buffer.from(FAKE), Buffer.alloc(16)]));
    r.write("log-utf16.txt", Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(`x\r\n${FAKE}\r\n`, "utf16le")]));
    r.commit("binary and attributes");
    const { code, output } = capture(["--diff", `${base}..HEAD`], env, r.dir);
    expect(code).toBe(1);
    expect(output).toContain("FAKE_TOKEN hidden/notes.txt:1");
    expect(output).toContain("FAKE_TOKEN img.png:1");
    expect(output).toContain("FAKE_TOKEN log-utf16.txt:2");
  });

  test("an old occurrence in an edited file is not re-reported", () => {
    const r = repo();
    r.write("doc.md", `old=${FAKE}\n`);
    const base = r.commit("history already has it");
    r.write("doc.md", `old=${FAKE}\nnew unrelated line\n`);
    r.commit("edit elsewhere");
    expect(capture(["--diff", `${base}..HEAD`], env, r.dir).code).toBe(0);
  });

  test("merge-base semantics: removals on the base branch are not hits", () => {
    const r = repo();
    r.git("checkout", "-qb", "dev");
    r.write("creds.md", `old=${FAKE}\n`);
    r.commit("base with an old leak");
    r.git("checkout", "-qb", "feature");
    r.write("feature.txt", "clean work\n");
    r.commit("feature work");
    r.git("checkout", "-q", "dev");
    r.write("creds.md", "old=<placeholder>\n");
    r.commit("dev removes the leak");
    // A two-dot `git diff dev..feature` would show the removal reversed as an added line.
    expect(r.git("diff", "dev..feature")).toContain(`+old=${FAKE}`);
    const { code, output } = capture(["--diff", "dev..feature"], env, r.dir);
    expect(output).not.toContain("creds.md");
    expect(code).toBe(0);
  });

  test("a merge commit reports only what its resolution adds", () => {
    const r = repo();
    r.write("x.txt", "base\n");
    const base = r.commit("base");
    r.git("checkout", "-qb", "side");
    r.write("x.txt", "side\n");
    r.write("side-only.txt", "clean\n");
    r.commit("side");
    r.git("checkout", "-q", "main");
    r.write("x.txt", "main\n");
    r.commit("main");
    try {
      r.git("merge", "-q", "side", "-m", "merge");
    } catch {
      // Conflict expected in x.txt.
    }
    r.write("x.txt", `resolved=${FAKE}\n`);
    r.git("add", "-A");
    r.git("commit", "-qm", "merge side");
    const { code, output } = capture(["--diff", `${base}..HEAD`], env, r.dir);
    expect(code).toBe(1);
    expect(output).toContain("FAKE_TOKEN x.txt:1");
    expect(output.split("\n").filter((l) => l.startsWith("FAKE_TOKEN"))).toHaveLength(1);
  });

  test("--staged scans full index blobs, binary included", () => {
    const r = repo();
    r.write("README", "x\n");
    r.commit("base");
    r.write("data.bin", Buffer.concat([Buffer.alloc(8), Buffer.from(FAKE), Buffer.alloc(8)]));
    r.git("add", "-A");
    const { code, output } = capture(["--staged"], env, r.dir);
    expect(code).toBe(1);
    expect(output).toContain("FAKE_TOKEN data.bin:1");
    expect(output).not.toContain(FAKE);
  });

  test("repeated --env-file values all load", () => {
    const r = repo();
    r.write("a.txt", "base\n");
    const base = r.commit("base");
    r.write("a.txt", `${FAKE}\n`);
    r.commit("leak");
    fs.writeFileSync(path.join(r.dir, ".env.one"), "OTHER_TOKEN=unrelated-value\n");
    fs.writeFileSync(path.join(r.dir, ".env.two"), `FAKE_TOKEN=${FAKE}\n`);
    const { code, output } = capture(["--diff", `${base}..HEAD`, "--env-file", ".env.one", "--env-file", ".env.two"], {}, r.dir);
    expect(code).toBe(1);
    expect(output).toContain("FAKE_TOKEN a.txt:1");
  });
});

describe("secret-scan output never contains a value", () => {
  test("--path: names and lines only", () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, "out", "nested"), { recursive: true });
    fs.writeFileSync(path.join(dir, "out", "nested", "trace.json"), `{\n"t": "${encodeURIComponent(FAKE)}"\n}`);
    fs.writeFileSync(path.join(dir, "out", "clean.txt"), "nothing here");
    const { code, output } = capture(["--path", "out"], { FAKE_TOKEN: FAKE }, dir);
    expect(code).toBe(1);
    expect(output).toContain("FAKE_TOKEN out/nested/trace.json:2");
    for (const form of encodedForms(FAKE)) expect(output).not.toContain(form);
  });

  test("real process with the real manifest: stdout and stderr", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "leak.txt"), FAKE);
    const result = spawnSync(process.execPath, [path.join(import.meta.dir, "../scripts/secret-scan/index.ts"), "--path", dir], {
      env: { ...process.env, ADMIN_API_KEY: FAKE, GITHUB_ACTIONS: "true" },
    });
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).toBe(1);
    expect(output).toContain("ADMIN_API_KEY");
    expect(output).toContain("::error file=");
    expect(output).not.toContain(FAKE);
  });
});
