const MASK = "\u2588";

const PATTERNS: RegExp[] = [
  /\b(?:fuck|fucking|fucked|fucker|fucks|fck|f\*\*k)\b/gi,
  /\b(?:shit|shits|shitty|bullshit)\b/gi,
  /\b(?:bitch|bitches|asshole|dick|dicks|piss|pussy|cock|cocks|damn|bastard|whore|slut|crap)\b/gi,
  /\b(?:kill\s+yourself|kys)\b/gi,
  /\b(?:n[i1!]g+[a3e4@][a-z]*)\b/gi,
  /\bcunt\b/gi,
];

function maskMatch(match: string): string {
  return MASK.repeat(match.length);
}

export function applyProfanityMaskToText(text: string): string {
  if (!text) {
    return text;
  }
  let out = text;
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, (m) => maskMatch(m));
  }
  return out;
}

export function profanityFilterActive(enabled: boolean | undefined): boolean {
  return enabled !== false;
}

export function displayCommunityText(
  text: string,
  filterEnabled: boolean,
  isOwnContent: boolean
): string {
  if (isOwnContent) {
    return text;
  }
  if (!filterEnabled) {
    return text;
  }
  return applyProfanityMaskToText(text);
}
