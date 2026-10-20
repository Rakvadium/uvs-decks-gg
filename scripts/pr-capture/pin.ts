import type { Mode } from "./shared.ts";

export type Appearance = { theme: string; mode: Mode; chrome: string };

const SESSION_QUERY = /^sessions(\.js)?:getSession$/;
const PREF_KEYS = ["theme", "chrome", "colorSource"] as const;
/** Every server-to-client frame and modification type in Convex's sync protocol (`WireServerMessage`). */
const SERVER_FRAME_TYPES = new Set(["Transition", "TransitionChunk", "MutationResponse", "ActionResponse", "FatalError", "AuthError", "Ping"]);
const MODIFICATION_TYPES = new Set(["QueryUpdated", "QueryFailed", "QueryRemoved"]);

/** Test-only: makes the rewrite miss `sessions:getSession`, as if the query had been renamed. */
export const BREAK_PIN_ENV = "PR_CAPTURE_TEST_BREAK_PIN";

/** What one capture context's `sessions:getSession` rewrite had done at one moment. Recorded per shot in manifest.json. */
export type PinReport = {
  /** The agent's stored `preset/mode/chrome`, read before the rewrite. null if no valid result was read. */
  saved: string | null;
  /** Every live `sessions:getSession` subscription's latest result was rewritten to the pin. */
  patched: boolean;
  /** Why the page's JS may not follow the pin. Empty when it does. */
  problems: string[];
  /** Monotonic count of session-state changes (subscribe, remove, result, socket close, ...). */
  events?: number;
  /**
   * Monotonic count of changes that left the context not fully rewritten. If it differs between two
   * snapshots, the page was unpinned at some point in between, even if both snapshots look clean.
   */
  unpinned?: number;
};

export type ClientFrame = { type?: string; modifications?: { type: string; queryId: number; udfPath?: string }[] };
type Modification = { type: string; queryId: number; value?: unknown; errorMessage?: string };
type Transition = { type: "Transition"; modifications?: Modification[] };
type SessionPrefs = { theme?: string; chrome?: string; colorSource?: { kind?: string; preset?: string } };

export function parseFrame<T>(message: string): T | null {
  try {
    return JSON.parse(message) as T;
  } catch {
    return null;
  }
}

export function appearanceKey({ theme, mode, chrome }: Appearance) {
  return `${theme}/${mode}/${chrome}`;
}

/**
 * The stored `preset/mode/chrome` when the result has all three fields ColorSchemeProvider reads,
 * each with a valid value. Otherwise the fields that are missing or invalid, so nothing is guessed.
 */
export function readSavedAppearance(value: object): { saved: string } | { invalid: string[] } {
  const { theme, chrome, colorSource } = value as SessionPrefs;
  const source =
    colorSource?.kind === "preset" && typeof colorSource.preset === "string" && colorSource.preset
      ? colorSource.preset
      : colorSource?.kind === "custom"
        ? "custom"
        : null;
  const invalid = [
    !(theme === "light" || theme === "dark" || theme === "system") && "theme",
    !(typeof chrome === "string" && chrome) && "chrome",
    !source && "colorSource",
  ].filter((key): key is string => Boolean(key));
  return invalid.length ? { invalid } : { saved: `${source}/${theme}/${chrome}` };
}

/**
 * Rewrites the `sessions:getSession` result the browser receives so ColorSchemeProvider's JS state
 * (isDark, chrome, preset) follows the pin, and tracks every session subscription in the context
 * so `report()` can say whether, at that moment, the page's JS state follows the pin.
 * One per capture context; call `socket()` once per Convex sync WebSocket.
 */
export function createSessionPin(appearance: Appearance, options: { broken?: boolean } = {}) {
  const pinned = { theme: appearance.mode, chrome: appearance.chrome, colorSource: { kind: "preset", preset: appearance.theme } };
  /** Live subscriptions, keyed `socket:queryId`. `rewritten` = its latest result was rewritten to the pin. */
  const subscriptions = new Map<string, { rewritten: boolean }>();
  const problems: string[] = [];
  let everSubscribed = false;
  let saved: string | null = null;
  let sockets = 0;
  let events = 0;
  let unpinned = 0;
  const pending = () => [...subscriptions.values()].filter((sub) => !sub.rewritten).length;
  const isPatched = () => everSubscribed && subscriptions.size > 0 && !pending();
  /** Call after every change to session state, so snapshots can see churn between them. */
  const changed = () => {
    events++;
    if (!isPatched()) unpinned++;
  };
  const problem = (text: string) => {
    if (!problems.includes(text)) problems.push(text);
    changed();
  };

  return {
    /**
     * A snapshot of what had been forwarded to the page so far. Take it at screenshot time: only
     * results forwarded before then count. Any problem means the page's JS may show the saved
     * prefs or the app defaults instead of the pin.
     */
    report(): PinReport {
      const now = [...problems];
      const waiting = pending();
      if (!everSubscribed) now.push("no sessions:getSession subscription was seen (renamed, or the page isn't signed in)");
      else if (!subscriptions.size) {
        now.push(
          "no live sessions:getSession subscription: every one was removed or its socket closed " +
            "(signed out, reloaded without re-subscribing, or the provider unmounted)",
        );
      } else if (waiting) {
        now.push(
          `${waiting} of ${subscriptions.size} live sessions:getSession subscription(s) had no rewritten result ` +
            "(none arrived yet, or the sync protocol changed)",
        );
      }
      return { saved, patched: isPatched(), problems: now, events, unpinned };
    },

    /** Convex query ids are scoped to one connection, so subscriptions are tracked per socket. */
    socket() {
      const socketId = sockets++;
      const key = (queryId: number) => `${socketId}:${queryId}`;
      const ownKeys = () => [...subscriptions.keys()].filter((k) => k.startsWith(`${socketId}:`));
      const hasSession = () => ownKeys().length > 0;
      let chunks: string[] = [];
      let closed = false;

      const patch = (transition: Transition) => {
        if (!Array.isArray(transition.modifications)) {
          if (hasSession()) problem("a Transition without a `modifications` list was forwarded unpatched (protocol changed?)");
          return JSON.stringify(transition);
        }
        for (const mod of transition.modifications) {
          const sub = subscriptions.get(key(mod.queryId));
          if (!sub) continue;
          if (!MODIFICATION_TYPES.has(mod.type)) {
            sub.rewritten = false;
            problem(`unrecognised modification type "${mod.type}" for sessions:getSession was forwarded unpatched`);
          } else if (mod.type === "QueryRemoved") {
            subscriptions.delete(key(mod.queryId));
            changed();
          } else if (mod.type === "QueryFailed") {
            sub.rewritten = false;
            problem(`sessions:getSession failed: ${mod.errorMessage ?? "unknown error"}`);
          } else {
            const value = mod.value;
            const read =
              value === null || value === undefined
                ? null
                : typeof value === "object" && !Array.isArray(value)
                  ? readSavedAppearance(value)
                  : { invalid: [...PREF_KEYS] };
            sub.rewritten = false;
            if (!read) problem("sessions:getSession returned null, so there was nothing to rewrite");
            else if ("invalid" in read) {
              problem(`sessions:getSession result is missing or has invalid ${read.invalid.join("/")} (shape changed?)`);
            } else {
              saved = read.saved;
              sub.rewritten = true;
              mod.value = { ...(value as object), ...pinned };
              changed();
            }
          }
        }
        return JSON.stringify(transition);
      };

      return {
        /** Call with each client-to-server frame so session subscriptions are known. */
        fromClient(frame: ClientFrame | null) {
          if (closed || frame?.type !== "ModifyQuerySet" || options.broken) return;
          for (const mod of frame.modifications ?? []) {
            if (mod.type === "Add" && SESSION_QUERY.test(mod.udfPath ?? "")) {
              subscriptions.set(key(mod.queryId), { rewritten: false });
              everSubscribed = true;
              changed();
            } else if (mod.type === "Remove" && subscriptions.delete(key(mod.queryId))) changed();
          }
        },

        /**
         * Call when either side closes the socket. Its subscriptions stop counting (a reconnect must
         * re-subscribe and get a rewritten result), and any half-received chunked transition is dropped.
         */
        close() {
          if (closed) return;
          closed = true;
          chunks = [];
          const keys = ownKeys();
          for (const k of keys) subscriptions.delete(k);
          if (keys.length) changed();
        },

        /** Returns the messages to forward to the browser for one server-to-client message. */
        fromServer<M extends string | Buffer>(message: M): (M | string)[] {
          if (closed) return [message];
          if (typeof message !== "string") {
            if (hasSession()) problem("a binary sync frame was forwarded unpatched (protocol changed?)");
            return [message];
          }
          const frame = parseFrame<{ type?: string; totalParts?: number; chunk?: string }>(message);
          if (frame?.type === "Transition") return [patch(frame as Transition)];
          if (frame?.type !== "TransitionChunk") {
            if (hasSession() && !SERVER_FRAME_TYPES.has(frame?.type ?? "")) {
              problem(`unrecognised sync frame type "${frame?.type ?? "unparseable"}" was forwarded unpatched`);
            }
            return [message];
          }
          // Large transitions arrive in parts; reassemble so the session result can be patched.
          chunks.push(message);
          if (chunks.length < (frame.totalParts ?? 1)) return [];
          const parts = chunks;
          chunks = [];
          const whole = parseFrame<Transition>(parts.map((part) => parseFrame<{ chunk?: string }>(part)?.chunk ?? "").join(""));
          if (whole) return [patch(whole)];
          if (hasSession()) problem("a chunked transition couldn't be reassembled and was forwarded unpatched");
          return parts;
        },
      };
    },
  };
}

export type SessionPin = ReturnType<typeof createSessionPin>;

/**
 * A signed-in shot is flagged whenever the rewrite reported a problem or wasn't fully applied, even
 * if the pin equals the saved appearance: a page that never received a session value falls back to
 * the app defaults (`system`/`calm`/`default`), not to the saved prefs.
 */
export function pinFlagged(report: PinReport) {
  return report.problems.length > 0 || !report.patched;
}

export type ShotPin = PinReport & { pinned: string; overridden: boolean; flagged: boolean };

/**
 * Combines the pin reports snapshotted when a shot's images were taken (the still, or every GIF
 * frame plus one after recording). Every snapshot must be patched with no problems; a missing
 * snapshot, `patched: false` without a recorded reason, or an `unpinned` count that moved between
 * snapshots is itself a problem, so no "nothing happened" state comes out clean. `extraProblems`
 * are the caller's own (e.g. the stability window ran out).
 */
export function shotPin(snapshots: (PinReport | undefined)[], appearance: Appearance, extraProblems: string[] = []): ShotPin {
  const taken = snapshots.filter((report): report is PinReport => report !== undefined);
  const problems = [...new Set([...taken.flatMap((report) => report.problems), ...extraProblems])];
  if (taken.length < snapshots.length || !taken.length) problems.push("no pin snapshot was taken for an image");
  if (new Set(taken.map((report) => report.unpinned)).size > 1) {
    problems.push("the session pin was not fully applied at some point between snapshots (subscription churn or a gap)");
  }
  const patched = taken.length > 0 && taken.length === snapshots.length && taken.every((report) => report.patched);
  if (!patched && !problems.length) problems.push("the session result was not rewritten when the image was taken");
  const saved = taken.findLast((report) => report.saved)?.saved ?? null;
  const pinned = appearanceKey(appearance);
  const last = taken.at(-1);
  const report = { saved, patched, problems, events: last?.events, unpinned: last?.unpinned };
  return { ...report, pinned, overridden: patched && saved !== pinned, flagged: pinFlagged(report) };
}

/** A still whose stability window ran out: its image (and pin snapshot) may predate the page's final state. */
export const UNSETTLED_PROBLEM = "the image and pin state never stayed unchanged for the full stability window (30s ran out)";

/** A signed-in still: its one snapshot, flagged as well if `stableScreenshot` never settled. */
export function stillPin(snapshot: PinReport | undefined, stable: boolean, appearance: Appearance): ShotPin {
  return shotPin([snapshot], appearance, stable ? [] : [UNSETTLED_PROBLEM]);
}
