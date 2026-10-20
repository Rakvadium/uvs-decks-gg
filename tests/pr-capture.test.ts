import { describe, expect, test } from "bun:test";
import { appearanceKey, createSessionPin, pinFlagged, type Appearance } from "../scripts/pr-capture/pin";
import {
  cachedLoad,
  parseArgs,
  parseRouteList,
  rawUrl,
  repoSlug,
  requireLabel,
  shotName,
} from "../scripts/pr-capture/shared";

describe("pr-capture args", () => {
  test("parses spaced, inline, and boolean flags", () => {
    expect(parseArgs(["--issue", "191", "--label=before", "--gif", "--port", "8101"])).toEqual({
      issue: "191",
      label: "before",
      gif: true,
      port: "8101",
    });
  });

  test("rejects unsafe labels", () => {
    expect(requireLabel("after-2", "--label")).toBe("after-2");
    expect(() => requireLabel("../x", "--label")).toThrow();
    expect(() => requireLabel(undefined, "--label")).toThrow();
  });
});

describe("pr-capture routes", () => {
  test("guest prefix and optional leading slash", () => {
    expect(parseRouteList("gallery,/decks,guest:gallery,guest:/")).toEqual([
      { path: "/gallery", auth: "agent" },
      { path: "/decks", auth: "agent" },
      { path: "/gallery", auth: "guest" },
      { path: "/", auth: "guest" },
    ]);
  });

  test("shot names are unique per auth, viewport, theme, and mode", () => {
    expect(shotName({ path: "/decks/abc", auth: "agent" }, "mobile", "cyberpunk", "dark")).toBe(
      "decks-abc__mobile__cyberpunk__dark",
    );
    expect(shotName({ path: "/", auth: "guest" }, "desktop", "default", "light")).toBe(
      "guest-root__desktop__default__light",
    );
    expect(shotName({ path: "/x", auth: "agent", name: "custom" }, "desktop", "default", "light")).toBe(
      "custom__desktop__default__light",
    );
  });
});

describe("pr-capture urls", () => {
  test("repo slug from https and ssh remotes", () => {
    expect(repoSlug("https://github.com/Rakvadium/uvs-decks-gg.git")).toBe("Rakvadium/uvs-decks-gg");
    expect(repoSlug("git@github.com:Rakvadium/uvs-decks-gg.git")).toBe("Rakvadium/uvs-decks-gg");
  });

  test("raw URLs point at the pr-media branch", () => {
    expect(rawUrl("Rakvadium/uvs-decks-gg", "191/before/gallery__desktop__default__dark.png")).toBe(
      "https://raw.githubusercontent.com/Rakvadium/uvs-decks-gg/pr-media/191/before/gallery__desktop__default__dark.png",
    );
  });
});

describe("pr-capture catalog cache", () => {
  test("concurrent callers share one load", async () => {
    const cache = new Map<string, Promise<number>>();
    let loads = 0;
    const load = () => Promise.resolve(++loads);
    expect(await Promise.all([cachedLoad(cache, "k", load), cachedLoad(cache, "k", load)])).toEqual([1, 1]);
    expect(loads).toBe(1);
  });

  test("a late waiter on a failed load can't evict a newer retry", async () => {
    const cache = new Map<string, Promise<string>>();
    let loads = 0;
    const load = () => (++loads === 1 ? Promise.reject(new Error("HTTP 500")) : new Promise<string>(() => {}));
    // Two waiters on the same failing download. Each retries on failure, like a new browser request.
    const waiter = () => cachedLoad(cache, "k", load).catch(() => void cachedLoad(cache, "k", load));
    void waiter();
    void waiter();
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The second waiter reuses the first waiter's retry instead of evicting it and downloading again.
    expect(loads).toBe(2);
    expect(cache.has("k")).toBe(true);
  });
});

const PIN: Appearance = { theme: "aurora", mode: "light", chrome: "calm" };
const SAVED = {
  _id: "s1",
  userId: "u1",
  theme: "dark",
  chrome: "expressive",
  colorSource: { kind: "preset", preset: "cyberpunk" },
};
const subscribe = { type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: 3, udfPath: "sessions:getSession" }] };
const update = (value: unknown) =>
  JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId: 3, value }] });
const chunk = (text: string, partNumber: number) =>
  JSON.stringify({ type: "TransitionChunk", chunk: text, partNumber, totalParts: 2, transitionId: "t" });

const has = (report: { problems: string[] }, text: string) => report.problems.some((p) => p.includes(text));

function subscribedPin(options?: { broken?: boolean }) {
  const pin = createSessionPin(PIN, options);
  const socket = pin.socket();
  socket.fromClient(subscribe);
  return { pin, socket };
}

describe("pr-capture session pin", () => {
  test("rewrites the session result and records the saved appearance", () => {
    const { pin, socket } = subscribedPin();
    const [out] = socket.fromServer(update(SAVED));
    expect(JSON.parse(out).modifications[0].value).toEqual({
      ...SAVED,
      theme: "light",
      chrome: "calm",
      colorSource: { kind: "preset", preset: "aurora" },
    });
    expect(pin.report()).toEqual({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("reassembles chunked transitions before patching", () => {
    const { pin, socket } = subscribedPin();
    const whole = update(SAVED);
    const half = Math.floor(whole.length / 2);
    expect(socket.fromServer(chunk(whole.slice(0, half), 0))).toEqual([]);
    const [out] = socket.fromServer(chunk(whole.slice(half), 1));
    expect(JSON.parse(out).modifications[0].value.theme).toBe("light");
    expect(pin.report().patched).toBe(true);
  });

  test("reports a renamed query", () => {
    const pin = createSessionPin(PIN);
    pin.socket().fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: 3, udfPath: "prefs:get" }] });
    expect(pin.report()).toMatchObject({ patched: false, problems: [expect.stringContaining("no sessions:getSession")] });
  });


  test("the test-only break switch forwards the saved prefs and reports it", () => {
    const { pin, socket } = subscribedPin({ broken: true });
    expect(JSON.parse(socket.fromServer(update(SAVED))[0]).modifications[0].value).toEqual(SAVED);
    const report = pin.report();
    expect([report.saved, report.patched, pinFlagged(report)]).toEqual([null, false, true]);
    expect(has(report, "no sessions:getSession")).toBe(true);
  });

  test.each([
    ["a null result", update(null), "returned null"],
    ["a shape change", update({ _id: "s1", appearance: { theme: "dark" } }), "shape changed"],
    ["an array result", update([1, 2]), "shape changed"],
    [
      "a failed query",
      JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: 3, errorMessage: "boom" }] }),
      "failed: boom",
    ],
  ])("reports %s", (_, message, problem) => {
    const { pin, socket } = subscribedPin();
    socket.fromServer(message);
    const report = pin.report();
    expect([report.saved, report.patched, pinFlagged(report)]).toEqual([null, false, true]);
    expect(has(report, problem)).toBe(true);
  });

  test.each([
    ["a partial shape change (one field moved)", "chrome", { ...SAVED, chrome: undefined, prefs: { chrome: "expressive" } }],
    ["an invalid theme", "theme", { ...SAVED, theme: "midnight" }],
    ["a colorSource without a preset", "colorSource", { ...SAVED, colorSource: { kind: "preset" } }],
  ])("doesn't count %s as rewritten, and leaves saved unknown", (_, field, value) => {
    const { pin, socket } = subscribedPin();
    expect(JSON.parse(socket.fromServer(update(value))[0]).modifications[0].value).toEqual(JSON.parse(JSON.stringify(value)));
    const report = pin.report();
    expect([report.saved, report.patched, pinFlagged(report)]).toEqual([null, false, true]);
    expect(report.problems.some((p) => p.includes("shape changed") && p.includes(field))).toBe(true);
  });

  test("records a custom colorSource as saved preset `custom`", () => {
    const { pin, socket } = subscribedPin();
    socket.fromServer(update({ ...SAVED, colorSource: { kind: "custom", custom: {} } }));
    expect(pin.report()).toEqual({ saved: "custom/dark/expressive", patched: true, problems: [] });
  });

  test.each([
    ["no result before the shot", [], "no rewritten result"],
    [
      "a renamed update type",
      [JSON.stringify({ type: "Transition", modifications: [{ type: "QueryResult", queryId: 3, value: SAVED }] })],
      'unrecognised modification type "QueryResult"',
    ],
    [
      "an unknown frame type",
      [JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })],
      'unrecognised sync frame type "TransitionV2"',
    ],
    [
      "a renamed modifications key",
      [JSON.stringify({ type: "Transition", changes: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })],
      "without a `modifications` list",
    ],
  ])("subscribed but nothing rewritten (%s) is a problem and flags the shot", (_, messages, problem) => {
    const { pin, socket } = subscribedPin();
    for (const message of messages) socket.fromServer(message);
    const report = pin.report();
    expect([report.saved, report.patched, pinFlagged(report)]).toEqual([null, false, true]);
    expect(has(report, "no rewritten result")).toBe(true);
    expect(has(report, problem)).toBe(true);
  });

  test("reports a chunked transition that can't be reassembled, and forwards it as-is", () => {
    const { pin, socket } = subscribedPin();
    const parts = [chunk("{not json", 0), chunk("either", 1)];
    expect(socket.fromServer(parts[0])).toEqual([]);
    expect(socket.fromServer(parts[1])).toEqual(parts);
    expect(has(pin.report(), "couldn't be reassembled")).toBe(true);
  });

  test("Ping frames and unknown frames on sockets without a session subscription are not problems", () => {
    const { pin, socket } = subscribedPin();
    socket.fromServer(JSON.stringify({ type: "Ping" }));
    socket.fromServer(update(SAVED));
    pin.socket().fromServer(JSON.stringify({ type: "TransitionV2" }));
    expect(pin.report()).toEqual({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });
});

describe("pr-capture session pin: every subscription, every result", () => {
  const SAVED_PIN: Appearance = { theme: "cyberpunk", mode: "dark", chrome: "expressive" };
  const add = (queryId: number) => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId, udfPath: "sessions:getSession" }] });
  const updateFor = (queryId: number, value: unknown, type = "QueryUpdated") =>
    JSON.stringify({ type: "Transition", modifications: [{ type, queryId, value }] });

  test.each<[string, (pin: ReturnType<typeof createSessionPin>) => void]>([
    ["subscribed, no result before the shot", (pin) => pin.socket().fromClient(add(3))],
    ["a null result", (pin) => { const s = pin.socket(); s.fromClient(add(3)); s.fromServer(updateFor(3, null)); }],
    ["never subscribed", (pin) => void pin.socket()],
    [
      "a failed query",
      (pin) => {
        const s = pin.socket();
        s.fromClient(add(3));
        s.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: 3, errorMessage: "boom" }] }));
      },
    ],
  ])("pin == saved is still flagged when no session value reached the page (%s)", (_, drive) => {
    // The app then shows its defaults (system/calm/default), not the saved prefs.
    const pin = createSessionPin(SAVED_PIN);
    drive(pin);
    expect(pinFlagged(pin.report())).toBe(true);
  });

  test("a second subscription with no result is a problem", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    s.fromClient(add(4));
    s.fromServer(updateFor(3, SAVED));
    const report = pin.report();
    expect([report.patched, pinFlagged(report)]).toEqual([false, true]);
    expect(has(report, "1 of 2 sessions:getSession subscription(s) had no rewritten result")).toBe(true);
  });

  test("a second subscription whose result uses an unknown type is a problem", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    s.fromClient(add(4));
    s.fromServer(updateFor(3, SAVED));
    s.fromServer(updateFor(4, SAVED, "QueryResult"));
    expect(pinFlagged(pin.report())).toBe(true);
  });

  test("a later update in an unknown format, after a rewrite, is a problem", () => {
    for (const later of [
      updateFor(3, SAVED, "QueryResult"),
      JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] }),
      updateFor(3, null),
    ]) {
      const pin = createSessionPin(PIN);
      const s = pin.socket();
      s.fromClient(add(3));
      s.fromServer(updateFor(3, SAVED));
      expect(pinFlagged(pin.report())).toBe(false);
      s.fromServer(later);
      expect(pinFlagged(pin.report())).toBe(true);
    }
  });

  test("a reconnect is clean only if the new socket's result is rewritten too", () => {
    const reconnect = (second: (s: ReturnType<ReturnType<typeof createSessionPin>["socket"]>) => void) => {
      const pin = createSessionPin(PIN);
      const first = pin.socket();
      first.fromClient(add(3));
      first.fromServer(updateFor(3, SAVED));
      const next = pin.socket();
      next.fromClient(add(0));
      second(next);
      return pin.report();
    };
    expect(pinFlagged(reconnect(() => {}))).toBe(true);
    expect(
      pinFlagged(reconnect((s) => s.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 0, value: SAVED }] })))),
    ).toBe(true);
    expect(reconnect((s) => s.fromServer(updateFor(0, SAVED)))).toEqual({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a removed subscription no longer needs a result", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    s.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: 3 }] });
    s.fromClient(add(4));
    s.fromServer(updateFor(4, SAVED));
    expect(pin.report()).toEqual({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a report is a snapshot: a result that arrives after it doesn't count", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    const atScreenshot = pin.report();
    s.fromServer(updateFor(3, SAVED));
    expect([atScreenshot.patched, pinFlagged(atScreenshot)]).toEqual([false, true]);
    expect(pin.report()).toEqual({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a clean report has no problems, so it isn't flagged", () => {
    expect(pinFlagged({ saved: appearanceKey(PIN), patched: true, problems: [] })).toBe(false);
    expect(pinFlagged({ saved: appearanceKey(PIN), patched: false, problems: ["x"] })).toBe(true);
  });
});
