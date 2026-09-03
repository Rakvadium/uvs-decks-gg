export type YoutubeChannelRef =
  | { kind: "id"; channelId: string }
  | { kind: "handle"; handle: string }
  | { kind: "username"; username: string };

const CHANNEL_ID_RE = /^UC[\w-]{22}$/;
const HANDLE_RE = /^[\w.-]{1,30}$/;

function youtubeHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "");
  return host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com";
}

export function extractYoutubeChannelRef(raw: string): YoutubeChannelRef | null {
  const input = raw.trim();
  if (!input) return null;
  if (CHANNEL_ID_RE.test(input)) {
    return { kind: "id", channelId: input };
  }
  if (input.startsWith("@")) {
    const handle = input.slice(1);
    if (HANDLE_RE.test(handle)) {
      return { kind: "handle", handle };
    }
    return null;
  }
  try {
    const withProto = input.includes("://") ? input : `https://${input}`;
    const u = new URL(withProto);
    if (!youtubeHost(u.hostname)) return null;
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg[0] === "channel" && seg[1] && CHANNEL_ID_RE.test(seg[1])) {
      return { kind: "id", channelId: seg[1] };
    }
    if (seg[0]?.startsWith("@")) {
      const handle = seg[0].slice(1);
      if (HANDLE_RE.test(handle)) {
        return { kind: "handle", handle };
      }
      return null;
    }
    if (seg[0] === "user" && seg[1] && HANDLE_RE.test(seg[1])) {
      return { kind: "username", username: seg[1] };
    }
    if (seg[0] === "c" && seg[1] && HANDLE_RE.test(seg[1])) {
      return { kind: "handle", handle: seg[1] };
    }
  } catch {
    return null;
  }
  return null;
}
