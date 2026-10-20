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
    /**
     * The final report. A context that rewrote nothing always has a problem: either it never
     * subscribed, or it subscribed but no recognisable result was rewritten (no result before the
     * shot, or the sync protocol changed shape).
     */
    report(): PinReport {
      if (!subscribed) problem("no sessions:getSession subscription was seen (renamed, or the page isn't signed in)");
      else if (!report.patched && !report.problems.length) {
        problem("subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)");
      }
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
            } else {
              const read = typeof value === "object" ? readSavedAppearance(value) : { invalid: [...PREF_KEYS] };
              if ("invalid" in read) {
                problem(`sessions:getSession result is missing or has invalid ${read.invalid.join("/")} (shape changed?)`);
              } else {
                report.saved = read.saved;
                report.patched = true;
                mod.value = { ...(value as object), ...pinned };
              }
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
