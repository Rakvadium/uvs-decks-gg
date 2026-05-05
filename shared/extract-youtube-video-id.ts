const YOUTUBE_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeVideoId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  if (YOUTUBE_VIDEO_ID_RE.test(input)) return input;
  try {
    const withProto = input.includes("://") ? input : `https://${input}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "");
    const vParam = u.searchParams.get("v");
    if (vParam && YOUTUBE_VIDEO_ID_RE.test(vParam)) return vParam;
    const seg = u.pathname.split("/").filter(Boolean);
    if (host === "youtu.be" && seg[0] && YOUTUBE_VIDEO_ID_RE.test(seg[0])) {
      return seg[0];
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (seg[0] === "embed" || seg[0] === "shorts" || seg[0] === "live") {
        if (seg[1] && YOUTUBE_VIDEO_ID_RE.test(seg[1])) return seg[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}
