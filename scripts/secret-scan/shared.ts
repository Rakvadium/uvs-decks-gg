import fs from "node:fs";
import { fileURLToPath } from "node:url";

/** Values shorter than this are skipped: too likely to match ordinary text. */
export const MIN_SECRET_LENGTH = 8;
/** Single lines of a multi-line value (e.g. a PEM body line) are matched from this length. */
export const MIN_FRAGMENT_LENGTH = 32;
/** Values at least this long are also matched by any `WINDOW`-char slice, to catch split strings. */
export const MIN_WINDOW_VALUE = 32;
export const WINDOW = 24;
/** The DER header at the start of a PEM body is the same in every key of a type, so skip it. */
const PEM_HEADER_CHARS = 64;
/** `sync-ci` stores several distinct values of one name in one Actions secret, joined by this. */
export const VALUE_SEPARATOR = "\n--secret-scan-next-value--\n";
export const MANIFEST_PATH = fileURLToPath(new URL("./secrets.json", import.meta.url));

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TOKEN_RUN = /[A-Za-z0-9+/=_.~-]+/g;

/**
 * A secret to look for. `needles` are exact byte sequences (encoded forms of the value);
 * `windows` are `WINDOW`-byte slices of it. Never print either.
 */
export type Secret = { name: string; needles: Buffer[]; windows: Buffer[] };

export type Manifest = {
  names: string[];
  /** May be absent anywhere, even under `--strict`. */
  optional: string[];
  /** Required only under `--ci` (e.g. the CI canary); ignored locally. */
  ciOnly: string[];
};

export function loadManifest(file = MANIFEST_PATH): Manifest {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = (key: string): string[] => {
    const value: unknown = json[key] ?? [];
    if (!Array.isArray(value) || !value.every((n) => typeof n === "string" && NAME.test(n))) {
      throw new Error(`${file}: "${key}" must be an array of env var names`);
    }
    return value;
  };
  const manifest = { names: list("names"), optional: list("optional"), ciOnly: list("ciOnly") };
  const stray = [...manifest.optional, ...manifest.ciOnly].filter((n) => !manifest.names.includes(n));
  if (stray.length > 0) throw new Error(`${file}: not in "names": ${stray.join(", ")}`);
  return manifest;
}

/** Minimal dotenv: `NAME=value`, optional `export`, quotes (multi-line), inline `#` comments. */
export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, name, rest] = match;
    const quote = rest[0];
    if (quote !== '"' && quote !== "'" && quote !== "`") {
      out[name] = rest.replace(/\s+#.*$/, "").trim();
      continue;
    }
    let body = rest.slice(1);
    let close = closingQuote(body, quote);
    while (close === -1 && i + 1 < lines.length) {
      body += `\n${lines[++i]}`;
      close = closingQuote(body, quote);
    }
    const raw = close === -1 ? body : body.slice(0, close);
    out[name] = quote === '"' ? unescapeDouble(raw) : raw;
  }
  return out;
}

function closingQuote(body: string, quote: string): number {
  for (let i = 0; i < body.length; i++) {
    if (quote === '"' && body[i] === "\\") i++;
    else if (body[i] === quote) return i;
  }
  return -1;
}

function unescapeDouble(raw: string): string {
  const map: Record<string, string> = { n: "\n", r: "\r", t: "\t" };
  return raw.replace(/\\(.)/g, (_, c: string) => map[c] ?? c);
}

/** Raw, URL-encoded, JSON-escaped, and base64/base64url forms of a value. */
export function encodedForms(value: string): string[] {
  const forms = new Set<string>([value]);
  const url = encodeURIComponent(value);
  forms.add(url);
  forms.add(url.replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase()));
  forms.add(url.replace(/%20/g, "+"));
  forms.add(JSON.stringify(value).slice(1, -1));
  for (const b64 of base64Forms(Buffer.from(value, "utf8"))) {
    forms.add(b64);
    forms.add(b64.replace(/\+/g, "-").replace(/\//g, "_"));
  }
  return [...forms];
}

/**
 * Base64 depends on where the value sits relative to 3-byte groups (e.g. `user:pass` in a Basic
 * auth header). For each of the 3 alignments, keep only the characters that encode value bytes
 * alone, so the value is found even inside a longer base64 string.
 */
function base64Forms(bytes: Buffer): string[] {
  const forms: string[] = [];
  for (let pad = 0; pad < 3; pad++) {
    const b64 = Buffer.concat([Buffer.alloc(pad), bytes]).toString("base64");
    forms.push(b64.slice(Math.ceil((8 * pad) / 6), Math.floor((8 * (pad + bytes.length)) / 6)));
  }
  return forms;
}

/**
 * Lines of a multi-line or space-joined value (a PEM key) that are long enough to identify it on
 * their own, so a partial paste is caught. `-----BEGIN/END-----` lines are skipped.
 */
export function valueFragments(value: string): string[] {
  return value
    .split(/\s+|\\n/)
    .filter((part) => part !== value && part.length >= MIN_FRAGMENT_LENGTH && !part.includes("-----"));
}

/** Every byte sequence that counts as the value: encoded forms, PEM lines, UTF-16. */
export function needlesFor(value: string): Buffer[] {
  const compact = value.replace(/\s+/g, "");
  const parts = [value, ...valueFragments(value), ...(compact !== value ? [compact] : [])];
  const forms = new Set(parts.flatMap(encodedForms));
  const needles = [...forms].map((form) => Buffer.from(form, "utf8"));
  const utf16 = Buffer.from(value, "utf16le");
  needles.push(utf16, Buffer.from(utf16).swap16());
  return needles;
}

/**
 * `WINDOW`-char slices of a long value's token runs (base64/hex/key characters), so a value split
 * into concatenated parts is still caught. Structural text (JSON keys, PEM armor and DER header)
 * is left out because it is shared with unrelated keys.
 */
export function windowsFor(value: string): string[] {
  if (value.length < MIN_WINDOW_VALUE) return [];
  const pem = value.match(/-----BEGIN [^-]+-----([\s\S]*?)-----END [^-]+-----/);
  const runs = pem ? [pem[1].replace(/\s+/g, "").slice(PEM_HEADER_CHARS)] : (value.match(TOKEN_RUN) ?? []);
  const windows = new Set<string>();
  for (const run of runs) {
    for (let i = 0; i + WINDOW <= run.length; i++) windows.add(run.slice(i, i + WINDOW));
  }
  return [...windows];
}

export type LoadedSecrets = { secrets: Secret[]; missing: string[]; short: string[] };

type Env = Record<string, string | undefined>;

/**
 * Every distinct value of each name across `envs` is checked (a value may hold several, joined by
 * `VALUE_SEPARATOR`). Values under 8 chars are skipped.
 */
export function loadSecrets(names: string[], envs: Env | Env[]): LoadedSecrets {
  const loaded: LoadedSecrets = { secrets: [], missing: [], short: [] };
  for (const name of names) {
    const values = new Set([envs].flat().flatMap((env) => splitValues(env[name])));
    const usable = [...values].filter((value) => value.length >= MIN_SECRET_LENGTH);
    if (values.size === 0) loaded.missing.push(name);
    else if (usable.length === 0) loaded.short.push(name);
    else {
      loaded.secrets.push({
        name,
        needles: dedupe(usable.flatMap(needlesFor)),
        windows: dedupe(usable.flatMap(windowsFor).map((w) => Buffer.from(w, "latin1"))),
      });
    }
  }
  return loaded;
}

export function splitValues(raw: string | undefined): string[] {
  return raw ? raw.split(VALUE_SEPARATOR).filter(Boolean) : [];
}

function dedupe(buffers: Buffer[]): Buffer[] {
  const seen = new Map<string, Buffer>();
  for (const buffer of buffers) seen.set(buffer.toString("latin1"), buffer);
  return [...seen.values()];
}

/** Every value of a repeatable flag: `--env-file a --env-file=b` → `["a", "b"]`. */
export function flagValues(argv: string[], key: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith(`--${key}=`)) values.push(argv[i].slice(key.length + 3));
    else if (argv[i] === `--${key}` && argv[i + 1] && !argv[i + 1].startsWith("--")) values.push(argv[++i]);
  }
  return values;
}

/** Repeated flags keep their last value; use `flagValues` for repeatable ones. */
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
