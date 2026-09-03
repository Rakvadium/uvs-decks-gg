const PLAYLIST_ID_RE = /^(PL|UU|FL|OL|RD)[\w-]{10,}$/i;

export function extractYoutubePlaylistId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  if (PLAYLIST_ID_RE.test(input)) {
    return input;
  }
  try {
    const withProto = input.includes("://") ? input : `https://${input}`;
    const u = new URL(withProto);
    const list = u.searchParams.get("list");
    if (list && PLAYLIST_ID_RE.test(list)) {
      return list;
    }
  } catch {
    return null;
  }
  return null;
}
