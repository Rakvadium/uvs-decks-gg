import fs from "node:fs";
import { fileURLToPath } from "node:url";

/** Values shorter than this are skipped: too likely to match ordinary text. */
export const MIN_SECRET_LENGTH = 8;
/** Single lines of a multi-line value (e.g. a PEM body line) are matched from this length. */
export const MIN_FRAGMENT_LENGTH = 32;
export const MANIFEST_PATH = fileURLToPath(new URL("./secrets.json", import.meta.url));

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * A secret to look for. `needles` are byte strings (UTF-8 bytes decoded as latin1) so text and
 * binary sources are matched the same way. Never print a needle.
 */
export type Secret = { name: string; needles: string[] };

/**
 * Text to scan, as a latin1 byte string. `lines[i]` is the real line number of the i-th line of
 * `text` (diffs only carry added lines); without it, line i is i + 1.
 */
export type Source = { location: string; commit?: string; text: string; lines?: number[] };

export type Hit = { name: string; location: string; line: number; commit?: string };

export function loadManifest(file = MANIFEST_PATH): string[] {
  const names: unknown = JSON.parse(fs.readFileSync(file, "utf8")).names;
  if (!Array.isArray(names) || !names.every((n) => typeof n === "string" && NAME.test(n))) {
    throw new Error(`${file}: "names" must be an array of env var names`);
  }
  return names;
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

/** Raw, URL-encoded, JSON-escaped, and base64/base64url forms of a value, as byte strings. */
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
  return [...forms].map((form) => Buffer.from(form, "utf8").toString("latin1"));
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

export type LoadedSecrets = { secrets: Secret[]; missing: string[]; short: string[] };

type Env = Record<string, string | undefined>;

/** Every distinct value of each name across `envs` is checked; values under 8 chars are skipped. */
export function loadSecrets(names: string[], envs: Env | Env[]): LoadedSecrets {
  const loaded: LoadedSecrets = { secrets: [], missing: [], short: [] };
  for (const name of names) {
    const values = new Set([envs].flat().map((env) => env[name]).filter((value): value is string => !!value));
    const usable = [...values].filter((value) => value.length >= MIN_SECRET_LENGTH);
    if (values.size === 0) loaded.missing.push(name);
    else if (usable.length === 0) loaded.short.push(name);
    else {
      const needles = usable.flatMap((value) => [value, ...valueFragments(value)].flatMap(encodedForms));
      loaded.secrets.push({ name, needles: [...new Set(needles)] });
    }
  }
  return loaded;
}

export function scanSource(source: Source, secrets: Secret[]): Hit[] {
  const hits = new Map<string, Hit>();
  let newlines: number[] | undefined;
  for (const { name, needles } of secrets) {
    for (const needle of needles) {
      for (let at = source.text.indexOf(needle); at !== -1; at = source.text.indexOf(needle, at + 1)) {
        newlines ??= newlineOffsets(source.text);
        const index = countBelow(newlines, at);
        const line = source.lines ? source.lines[index] : index + 1;
        hits.set(`${name}\0${line}`, { name, location: source.location, line, commit: source.commit });
      }
    }
  }
  return [...hits.values()];
}

function newlineOffsets(text: string): number[] {
  const out: number[] = [];
  for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) out.push(i);
  return out;
}

/** Number of sorted offsets below `at`, i.e. the 0-based line index of `at`. */
function countBelow(sorted: number[], at: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < at) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** `VAR_NAME file:line`, plus the short commit for diff hits. Never includes the value. */
export function formatHit(hit: Hit): string {
  const where = `${hit.name} ${hit.location}:${hit.line}`;
  return hit.commit ? `${where} @${hit.commit.slice(0, 7)}` : where;
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
