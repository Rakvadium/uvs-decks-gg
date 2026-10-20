/** The Convex sync WebSocket path the capture proxy routes. */
export const CONVEX_SYNC_SOCKET = /\/api\/[^/]+\/sync$/;

/** A sync-path socket, or any socket to the Convex deployment's host (so a renamed path still counts). */
export function isConvexSocket(url: string, convexHost?: string) {
  if (CONVEX_SYNC_SOCKET.test(url)) return true;
  if (!convexHost) return false;
  try {
    return new URL(url).host === convexHost;
  } catch {
    return false;
  }
}

const frameKey = (frame: string | Buffer) => (typeof frame === "string" ? `s:${frame}` : `b:${frame.toString("base64")}`);
const frameType = (frame: string | Buffer) => {
  if (typeof frame !== "string") return "binary";
  try {
    const type = (JSON.parse(frame) as { type?: unknown }).type;
    return typeof type === "string" ? type : "unknown";
  } catch {
    return "unparseable";
  }
};

/**
 * Tripwire for Convex WebSockets the capture proxy never saw. Playwright only routes sockets that
 * pages open, so a socket opened by a worker skips both the write blocking and the theme pin. The
 * app has none today. One per capture context (and one per sign-in context).
 *
 * Playwright reports every real WebSocket a page or its dedicated workers (nested ones too) open,
 * including the real connections behind proxied sockets. Two checks tell them apart:
 * - **Frames.** The proxy records each client frame before it hands it to the real connection, so a
 *   proxied socket's sent frames are always already recorded when Playwright reports them. A sent
 *   frame that was never recorded came from a socket the proxy didn't see. Every Convex client's
 *   first frame is a `Connect` with its own random session id, so any unproxied client that talks
 *   at all is caught, and so is any write it sends (the proxy never forwards those).
 * - **Count.** More Convex sockets opened than proxied catches a socket that never sends a frame.
 *
 * SharedWorkers and service workers get no WebSocket reporting from Playwright at all, so starting
 * one is a problem by itself: nothing it opens could be checked.
 */
export function createSocketGuard(convexHost?: string) {
  let proxied = 0;
  let opened = 0;
  /** Client frames the proxy forwarded and the real connection hasn't reported sending yet. */
  const forwardedFrames = new Map<string, number>();
  const strayTypes = new Map<string, number>();
  const workers: string[] = [];
  return {
    isConvexSocket: (url: string) => isConvexSocket(url, convexHost),
    /** The proxy routed a socket. Called before it connects, so before `opened` sees it. */
    proxied() {
      proxied++;
    },
    /** The proxy is about to hand this client frame to the real connection. */
    forwarded(frame: string | Buffer) {
      const key = frameKey(frame);
      forwardedFrames.set(key, (forwardedFrames.get(key) ?? 0) + 1);
    },
    /** Playwright reported a real Convex WebSocket on a page (or one of its dedicated workers). */
    opened() {
      opened++;
    },
    /** Playwright reported a frame sent on a real Convex WebSocket. */
    sent(frame: string | Buffer) {
      const key = frameKey(frame);
      const left = forwardedFrames.get(key) ?? 0;
      if (left > 1) forwardedFrames.set(key, left - 1);
      else if (left === 1) forwardedFrames.delete(key);
      else strayTypes.set(frameType(frame), (strayTypes.get(frameType(frame)) ?? 0) + 1);
    },
    worker(kind: string, url: string) {
      const text = `a ${kind} started (${url}); WebSockets it opens bypass the capture proxy and can't be seen, so its writes would not be blocked`;
      if (!workers.includes(text)) workers.push(text);
    },
    /** Empty when every Convex socket so far went through the proxy and no unobservable worker started. */
    problems(): string[] {
      const problems: string[] = [];
      const stray = [...strayTypes.values()].reduce((sum, n) => sum + n, 0);
      if (stray) {
        const types = [...strayTypes].map(([type, n]) => `${type} ×${n}`).join(", ");
        problems.push(
          `${stray} frame(s) (${types}) were sent on a Convex WebSocket the capture proxy never saw (e.g. from a worker): ` +
            "its writes were not blocked and its session results were not rewritten",
        );
      }
      if (opened > proxied) {
        problems.push(`${opened - proxied} more Convex WebSocket(s) were opened than the capture proxy saw (e.g. from a worker)`);
      }
      return [...problems, ...workers];
    },
  };
}

export type SocketGuard = ReturnType<typeof createSocketGuard>;

/** The Convex deployment host from NEXT_PUBLIC_CONVEX_URL, if set. */
export function convexHostFromEnv(env: Record<string, string | undefined> = process.env) {
  try {
    return env.NEXT_PUBLIC_CONVEX_URL ? new URL(env.NEXT_PUBLIC_CONVEX_URL).host : undefined;
  } catch {
    return undefined;
  }
}
