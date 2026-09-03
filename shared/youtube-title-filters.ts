export function parseKeywordList(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function formatKeywordList(keywords: string[] | undefined): string {
  return (keywords ?? []).join(", ");
}

export function titleMatchesFilters(
  title: string,
  includes: string[] | undefined,
  excludes: string[] | undefined
): boolean {
  const haystack = title.toLowerCase();
  for (const exclude of excludes ?? []) {
    const needle = exclude.trim().toLowerCase();
    if (needle && haystack.includes(needle)) {
      return false;
    }
  }
  const required = (includes ?? []).map((item) => item.trim()).filter(Boolean);
  if (required.length === 0) {
    return true;
  }
  return required.some((item) => haystack.includes(item.toLowerCase()));
}
