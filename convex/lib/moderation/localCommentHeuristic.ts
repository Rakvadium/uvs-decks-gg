const FLAGGED_COMMENT_PATTERNS = [
  /\b(?:fuck|fucking|shit|bitch|asshole)\b/i,
  /\b(?:kill yourself|kys)\b/i,
  /\b(?:discord\.gg|t\.me\/|bit\.ly\/|tinyurl\.com\/)\b/i,
];

export function moderateCommentLocal(content: string) {
  const urlCount = (content.match(/https?:\/\//gi) ?? []).length;
  const repeatedCharacter = /(.)\1{7,}/.test(content);
  const repeatedPunctuation = /[!?]{5,}/.test(content);
  const uppercaseTokens = content
    .split(/\s+/)
    .filter((token) => token.length >= 5 && token === token.toUpperCase()).length;

  if (urlCount > 1) {
    return { status: "flagged" as const, moderationReason: "Too many links in one comment" };
  }

  if (repeatedCharacter || repeatedPunctuation || uppercaseTokens >= 4) {
    return { status: "pending" as const, moderationReason: "Comment looks spammy and needs review" };
  }

  for (const pattern of FLAGGED_COMMENT_PATTERNS) {
    if (pattern.test(content)) {
      return { status: "flagged" as const, moderationReason: "Comment contains language that needs review" };
    }
  }

  return { status: "approved" as const, moderationReason: undefined };
}
