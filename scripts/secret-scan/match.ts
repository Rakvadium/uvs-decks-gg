import { WINDOW, type Secret } from "./shared.ts";

export type Hit = { name: string; location: string; line: number; commit?: string };

/**
 * Bytes to scan. With `before` (the same path in the parent commit(s)), a secret is only reported
 * when it occurs more often than in every `before` blob, so an untouched old occurrence elsewhere
 * in the file is not re-reported.
 */
export type Target = { location: string; commit?: string; bytes: Buffer; before?: Buffer[] };

export type Matcher = { secrets: Secret[]; windows: Map<number, { name: string; bytes: Buffer }[]> };

type View = { bytes: Buffer; lineAt: (offset: number) => number };
type Matches = Map<string, { count: number; lines: Set<number> }>;

const WHITESPACE = new Set([0x20, 0x09, 0x0a, 0x0d, 0x0b, 0x0c]);
const QUOTES = new Set([0x22, 0x27, 0x60]);
/** `+` (JS, Python), `.` (PHP), `,` (arrays, args) between two quotes join a split string. */
const JOINERS = new Set([0x2b, 0x2e, 0x2c]);
const HASH_BASE = 0x01000193;
let hashPow = 1;
for (let i = 1; i < WINDOW; i++) hashPow = Math.imul(hashPow, HASH_BASE);

export function buildMatcher(secrets: Secret[]): Matcher {
  const windows: Matcher["windows"] = new Map();
  for (const { name, windows: slices } of secrets) {
    for (const bytes of slices) {
      const hash = hashAt(bytes, 0);
      const bucket = windows.get(hash);
      if (bucket) bucket.push({ name, bytes });
      else windows.set(hash, [{ name, bytes }]);
    }
  }
  return { secrets, windows };
}

export function scanTarget(target: Target, matcher: Matcher): Hit[] {
  const now = matchBytes(target.bytes, matcher);
  const before = (target.before ?? []).map((bytes) => matchBytes(bytes, matcher));
  const hits: Hit[] = [];
  for (const [name, { count, lines }] of now) {
    if (before.some((old) => (old.get(name)?.count ?? 0) >= count)) continue;
    for (const line of [...lines].sort((a, b) => a - b)) {
      hits.push({ name, location: target.location, line, commit: target.commit });
    }
  }
  return hits;
}

/** `VAR_NAME file:line`, plus the short commit for diff hits. Never includes the value. */
export function formatHit(hit: Hit): string {
  const where = `${hit.name} ${hit.location}:${hit.line}`;
  return hit.commit ? `${where} @${hit.commit.slice(0, 7)}` : where;
}

function matchBytes(bytes: Buffer, matcher: Matcher): Matches {
  const matches: Matches = new Map();
  for (const view of viewsOf(bytes)) {
    const record = (name: string, offset: number) => {
      const entry = matches.get(name) ?? { count: 0, lines: new Set<number>() };
      entry.count++;
      entry.lines.add(view.lineAt(offset));
      matches.set(name, entry);
    };
    for (const { name, needles } of matcher.secrets) {
      for (const needle of needles) {
        for (let at = view.bytes.indexOf(needle); at !== -1; at = view.bytes.indexOf(needle, at + 1)) record(name, at);
      }
    }
    if (matcher.windows.size > 0) matchWindows(view.bytes, matcher, record);
  }
  return matches;
}

/**
 * The raw bytes, the UTF-16 decoding when the file looks like UTF-16, and for text: a copy with
 * all whitespace and invisible chars removed (wrapped base64, line-split values) and one that also removes string
 * joins like `"abc" +\n "def"`. Offsets in derived views map back to lines of their source.
 */
export function viewsOf(bytes: Buffer): View[] {
  const raw: View = { bytes, lineAt: lineIndex(bytes) };
  const bases = [raw];
  const utf16 = utf16Encoding(bytes);
  if (utf16) {
    const decoded = decodeUtf16(bytes, utf16);
    bases.push({ bytes: decoded, lineAt: lineIndex(decoded) });
  }
  const views: View[] = [];
  for (const base of bases) {
    views.push(base);
    if (looksBinary(base.bytes)) continue;
    views.push(derive(base, false), derive(base, true));
  }
  return views;
}

/** Like git: a NUL in the first 8000 bytes means binary. */
function looksBinary(bytes: Buffer): boolean {
  return bytes.subarray(0, 8000).includes(0);
}

export function utf16Encoding(bytes: Buffer): "le" | "be" | null {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return "le";
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return "be";
  const sample = Math.min(bytes.length - (bytes.length % 2), 4096);
  if (sample < 16) return null;
  let evenNul = 0;
  let oddNul = 0;
  for (let i = 0; i < sample; i += 2) {
    if (bytes[i] === 0) evenNul++;
    if (bytes[i + 1] === 0) oddNul++;
  }
  const pairs = sample / 2;
  if (oddNul / pairs > 0.4 && evenNul / pairs < 0.05) return "le";
  if (evenNul / pairs > 0.4 && oddNul / pairs < 0.05) return "be";
  return null;
}

function decodeUtf16(bytes: Buffer, encoding: "le" | "be"): Buffer {
  const hasBom = (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);
  let body = bytes.subarray(hasBom ? 2 : 0);
  body = body.subarray(0, body.length - (body.length % 2));
  if (encoding === "be") body = Buffer.from(body).swap16();
  return Buffer.from(body.toString("utf16le"), "utf8");
}

function derive(base: View, joinStrings: boolean): View {
  const src = base.bytes;
  const out = Buffer.allocUnsafe(src.length);
  const origin = new Uint32Array(src.length);
  let n = 0;
  for (let i = 0; i < src.length; i++) {
    const byte = src[i];
    if (WHITESPACE.has(byte)) continue;
    const zeroWidth = zeroWidthLength(src, i);
    if (zeroWidth > 0) {
      i += zeroWidth - 1;
      continue;
    }
    if (joinStrings && byte === 0x5c && (src[i + 1] === 0x0a || (src[i + 1] === 0x0d && src[i + 2] === 0x0a))) continue;
    if (joinStrings && QUOTES.has(byte)) {
      let j = skipWhitespace(src, i + 1);
      if (JOINERS.has(src[j])) j = skipWhitespace(src, j + 1);
      if (QUOTES.has(src[j])) {
        i = j;
        continue;
      }
    }
    out[n] = byte;
    origin[n] = i;
    n++;
  }
  return { bytes: out.subarray(0, n), lineAt: (offset) => base.lineAt(origin[offset]) };
}

/**
 * UTF-8 length of an invisible char at `i`, else 0: soft hyphen U+00AD, zero-width U+200B-U+200D,
 * word joiner U+2060, invisible operators U+2061-U+2064, and U+FEFF.
 */
function zeroWidthLength(bytes: Buffer, i: number): number {
  if (bytes[i] === 0xc2 && bytes[i + 1] === 0xad) return 2;
  if (bytes[i] === 0xe2 && bytes[i + 1] === 0x80 && bytes[i + 2] >= 0x8b && bytes[i + 2] <= 0x8d) return 3;
  if (bytes[i] === 0xe2 && bytes[i + 1] === 0x81 && bytes[i + 2] >= 0xa0 && bytes[i + 2] <= 0xa4) return 3;
  if (bytes[i] === 0xef && bytes[i + 1] === 0xbb && bytes[i + 2] === 0xbf) return 3;
  return 0;
}

function skipWhitespace(bytes: Buffer, from: number): number {
  let i = from;
  while (i < bytes.length && WHITESPACE.has(bytes[i])) i++;
  return i;
}

function lineIndex(bytes: Buffer): (offset: number) => number {
  let newlines: number[] | undefined;
  return (offset) => {
    if (!newlines) {
      newlines = [];
      for (let i = bytes.indexOf(0x0a); i !== -1; i = bytes.indexOf(0x0a, i + 1)) newlines.push(i);
    }
    let lo = 0;
    let hi = newlines.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (newlines[mid] < offset) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
}

function hashAt(bytes: Buffer, start: number): number {
  let hash = 0;
  for (let i = 0; i < WINDOW; i++) hash = (Math.imul(hash, HASH_BASE) + bytes[start + i]) >>> 0;
  return hash;
}

/** Rabin-Karp over every `WINDOW`-byte slice, verified byte for byte on a hash hit. */
function matchWindows(bytes: Buffer, matcher: Matcher, record: (name: string, offset: number) => void) {
  if (bytes.length < WINDOW) return;
  let hash = hashAt(bytes, 0);
  for (let i = 0; ; i++) {
    const bucket = matcher.windows.get(hash);
    if (bucket) {
      for (const window of bucket) {
        if (bytes.compare(window.bytes, 0, WINDOW, i, i + WINDOW) === 0) record(window.name, i);
      }
    }
    if (i + WINDOW >= bytes.length) break;
    hash = (Math.imul((hash - Math.imul(bytes[i], hashPow)) >>> 0, HASH_BASE) + bytes[i + WINDOW]) >>> 0;
  }
}
