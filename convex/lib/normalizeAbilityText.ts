const TIMING_WORDS =
  "First Enhance|First Form|Enhance|Response|Form|Blitz|Static";

const KEYWORD_REMINDER_NAMES =
  "Powerful|EX|Stun|Breaker|Deflect|Echo|Frenzy|Tension|Flash|Throw|Safe|Combo|Unique|Shift|Terrain|Elusive|Desperation";

const TIMING_HEADER_RE = new RegExp(`^(${TIMING_WORDS})\\b`, "i");
const KEYWORD_REMINDER_HEADER_RE = new RegExp(
  `^(${KEYWORD_REMINDER_NAMES})(?:\\s*\\d+)?\\b`,
  "i"
);
const REMINDER_PAREN_START_RE = new RegExp(
  `^(?:mill|drive)\\s*\\d+|(?:${KEYWORD_REMINDER_NAMES}|${TIMING_WORDS})\\b`,
  "i"
);
const CHOOSE_ONE_TAIL_RE = /:\s*choose\s+(?:one|1|two|2)\s*:?\s*$/i;

export function indexOfUnprotectedColons(text: string): number[] {
  const indices: number[] = [];
  let braceDepth = 0;
  let bracketDepth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "{") {
      braceDepth += 1;
      continue;
    }
    if (char === "}" && braceDepth > 0) {
      braceDepth -= 1;
      continue;
    }
    if (char === "[") {
      bracketDepth += 1;
      continue;
    }
    if (char === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
      continue;
    }
    if (char === ":" && braceDepth === 0 && bracketDepth === 0) {
      indices.push(i);
    }
  }
  return indices;
}

export function indexOfFirstUnprotectedColon(text: string): number {
  return indexOfUnprotectedColons(text)[0] ?? -1;
}

function compactSpaces(value: string): string {
  return value.replace(/\s{2,}/g, " ").trim();
}

function isReminderParenBody(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) return false;
  if (/[—–]/.test(trimmed)) return true;
  return REMINDER_PAREN_START_RE.test(trimmed);
}

function stripReminderParens(segment: string): string {
  let current = segment;
  for (let i = 0; i < 8; i += 1) {
    const next = current.replace(/\(([^()]*)\)/g, (full, body: string) =>
      isReminderParenBody(body) ? " " : full
    );
    if (next === current) break;
    current = next;
  }
  return compactSpaces(current);
}

function choiceListCutIndex(segment: string): number {
  const bullet = segment.search(/\s*[•●]/);
  return bullet;
}

function collapseExtraColons(segment: string): string {
  const cut = choiceListCutIndex(segment);
  const working = cut >= 0 ? segment.slice(0, cut) : segment;
  const suffix = cut >= 0 ? segment.slice(cut) : "";
  const colons = indexOfUnprotectedColons(working);
  if (colons.length <= 1) {
    return compactSpaces(working) + suffix;
  }
  if (colons.length === 2 && CHOOSE_ONE_TAIL_RE.test(working)) {
    return compactSpaces(working) + suffix;
  }
  const last = colons[colons.length - 1];
  if (last === undefined) {
    return compactSpaces(working) + suffix;
  }
  const header = compactSpaces(working.slice(0, last).replace(/:/g, " "));
  const effect = working.slice(last + 1).trim();
  const rebuilt = effect ? `${header}: ${effect}` : `${header}:`;
  return rebuilt + suffix;
}

function ensureTimingColon(segment: string): string {
  if (indexOfUnprotectedColons(segment).length > 0) return segment;
  const match = segment.match(TIMING_HEADER_RE);
  if (!match) return segment;
  const rest = segment.slice(match[0].length).trim();
  if (!rest) return segment;
  return `${match[0]}: ${rest}`;
}

function headerBeforeColon(segment: string): string {
  const colon = indexOfFirstUnprotectedColon(segment);
  return colon === -1 ? segment : segment.slice(0, colon);
}

function isKeywordReminderAbility(segment: string): boolean {
  const header = headerBeforeColon(segment);
  const stripped = compactSpaces(
    header
      .replace(new RegExp(`\\b(?:${TIMING_WORDS})\\b`, "gi"), " ")
      .replace(/[{}\[\],]/g, " ")
      .replace(/:/g, " ")
  );
  if (!stripped) return false;
  return KEYWORD_REMINDER_HEADER_RE.test(stripped);
}

function normalizeAbilitySegment(segment: string): string | null {
  const withoutParens = stripReminderParens(segment);
  if (!withoutParens) return null;
  const collapsed = ensureTimingColon(collapseExtraColons(withoutParens));
  if (!collapsed) return null;
  if (isKeywordReminderAbility(collapsed)) return null;
  return collapsed;
}

export function normalizeAbilityText(text: string): string {
  return text
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(normalizeAbilitySegment)
    .filter((segment): segment is string => Boolean(segment))
    .join(" | ");
}
