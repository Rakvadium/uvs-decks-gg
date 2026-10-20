import type { Mode } from "./shared.ts";

export type Appearance = { theme: string; mode: Mode; chrome: string };

const SESSION_QUERY = /^sessions(\.js)?:getSession$/;
const PREF_KEYS = ["theme", "chrome", "colorSource"] as const;

/** Test-only: makes the rewrite miss `sessions:getSession`, as if the query had been renamed. */
export const BREAK_PIN_ENV = "PR_CAPTURE_TEST_BREAK_PIN";

/** What one capture context's `sessions:getSession` rewrite did. Recorded per shot in manifest.json. */
export type PinReport = {
  /** The agent's stored `preset/mode/chrome`, read before the rewrite. null if no result was read. */
  saved: string | null;
  /** At least one session result was rewritten to the pin. */
  patched: boolean;
  /** Why the rewrite may not have applied. Empty when it did. */
  problems: string[];
};

export type ClientFrame = { type?: string; modifications?: { type: string; queryId: number; udfPath?: string }[] };
type Modification = { type: string; queryId: number; value?: unknown; errorMessage?: string };
type Transition = { type: "Transition"; modifications: Modification[] };
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

function savedKey(prefs: SessionPrefs) {
  return `${prefs.colorSource?.preset ?? prefs.colorSource?.kind ?? "default"}/${prefs.theme ?? "system"}/${prefs.chrome ?? "calm"}`;
}

/**
 * Rewrites the `sessions:getSession` result the browser receives so ColorSchemeProvider's JS state
 * (isDark, chrome, preset) follows the pin, and records in `report` whenever that can't happen.
 * One per capture context; call `socket()` once per Convex sync WebSocket.
 */
export function createSessionPin(appearance: Appearance, options: { broken?: boolean } = {}) {
  const pinned = { theme: appearance.mode, chrome: appearance.chrome, colorSource: { kind: "preset", preset: appearance.theme } };
  const report: PinReport = { saved: null, patched: false, problems: [] };
  let subscribed = false;
  const problem = (text: string) => {
    if (!report.problems.includes(text)) report.problems.push(text);
  };

  return {
    /** The final report. Adds a problem if the page never subscribed to the session query. */
    report(): PinReport {
      if (!subscribed) problem("no sessions:getSession subscription was seen (renamed, or the page isn't signed in)");
      return report;
    },

    /** Convex query ids are scoped to one connection, so track them per socket. */
    socket() {
      const sessionQueryIds = new Set<number>();
      let chunks: string[] = [];

      const patch = (transition: Transition) => {
        for (const mod of transition.modifications ?? []) {
          if (!sessionQueryIds.has(mod.queryId)) continue;
          if (mod.type === "QueryFailed") {
            problem(`sessions:getSession failed: ${mod.errorMessage ?? "unknown error"}`);
          } else if (mod.type === "QueryUpdated") {
            const value = mod.value;
            if (value === null || value === undefined) {
              problem("sessions:getSession returned null, so there was nothing to rewrite");
            } else if (typeof value !== "object" || !PREF_KEYS.some((key) => key in value)) {
              problem("sessions:getSession result has no theme/chrome/colorSource fields (shape changed?)");
            } else {
              report.saved = savedKey(value as SessionPrefs);
              report.patched = true;
              mod.value = { ...value, ...pinned };
            }
          }
        }
        return JSON.stringify(transition);
      };

      return {
        /** Call with each client-to-server frame so the session query's id is known. */
        fromClient(frame: ClientFrame | null) {
          if (frame?.type !== "ModifyQuerySet" || options.broken) return;
          for (const mod of frame.modifications ?? []) {
            if (mod.type === "Add" && SESSION_QUERY.test(mod.udfPath ?? "")) {
              sessionQueryIds.add(mod.queryId);
              subscribed = true;
            }
          }
        },

        /** Returns the messages to forward to the browser for one server-to-client message. */
        fromServer(message: string): string[] {
          const frame = parseFrame<{ type?: string; totalParts?: number; chunk?: string }>(message);
          if (frame?.type === "Transition") return [patch(frame as Transition)];
          if (frame?.type !== "TransitionChunk") return [message];
          // Large transitions arrive in parts; reassemble so the session result can be patched.
          chunks.push(message);
          if (chunks.length < (frame.totalParts ?? 1)) return [];
          const parts = chunks;
          chunks = [];
          const whole = parseFrame<Transition>(parts.map((part) => parseFrame<{ chunk?: string }>(part)?.chunk ?? "").join(""));
          if (whole) return [patch(whole)];
          if (sessionQueryIds.size) problem("a chunked transition couldn't be reassembled and was forwarded unpatched");
          return parts;
        },
      };
    },
  };
}

export type SessionPin = ReturnType<typeof createSessionPin>;

/**
 * A signed-in shot is flagged when the rewrite reported a problem and the pin differs from the
 * agent's saved appearance (or the saved value is unknown), because its JS-driven UI (menus,
 * toasts, neon forks) may then show the saved theme instead of the pin.
 * `runSaved` is any saved value another shot in the run read, used when this shot read none.
 */
export function pinFlagged(report: PinReport, appearance: Appearance, runSaved: string | null) {
  const saved = report.saved ?? runSaved;
  return report.problems.length > 0 && saved !== appearanceKey(appearance);
}
