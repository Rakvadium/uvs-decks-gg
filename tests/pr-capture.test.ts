import { describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { agentLogin, newCaptureContext, stableScreenshot } from "../scripts/pr-capture/browser";
import { convexHostFromEnv, createSocketGuard, isConvexSocket } from "../scripts/pr-capture/guard";
import { inflatedPngText, publish, type Git } from "../scripts/pr-capture/publish";
import { UNSETTLED_PROBLEM, appearanceKey, createSessionPin, pinFlagged, shotPin, stillPin, type Appearance, type PinReport } from "../scripts/pr-capture/pin";
import {
  cachedLoad,
  parseArgs,
  parseRouteList,
  rawUrl,
  repoSlug,
  requireLabel,
  shotName,
} from "../scripts/pr-capture/shared";
import { loadManifest } from "../scripts/secret-scan/shared";
import { SKIP_DIRS } from "../scripts/secret-scan/sources";

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
    expect(pin.report()).toMatchObject({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
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
    expect(pin.report()).toMatchObject({ saved: "custom/dark/expressive", patched: true, problems: [] });
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
    expect(pin.report()).toMatchObject({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
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
    expect(has(report, "1 of 2 live sessions:getSession subscription(s) had no rewritten result")).toBe(true);
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
    expect(reconnect((s) => s.fromServer(updateFor(0, SAVED)))).toMatchObject({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a removed subscription no longer needs a result", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    s.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId: 3 }] });
    s.fromClient(add(4));
    s.fromServer(updateFor(4, SAVED));
    expect(pin.report()).toMatchObject({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a report is a snapshot: a result that arrives after it doesn't count", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    const atScreenshot = pin.report();
    s.fromServer(updateFor(3, SAVED));
    expect([atScreenshot.patched, pinFlagged(atScreenshot)]).toEqual([false, true]);
    expect(pin.report()).toMatchObject({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a clean report has no problems, so it isn't flagged", () => {
    expect(pinFlagged({ saved: appearanceKey(PIN), patched: true, problems: [] })).toBe(false);
    expect(pinFlagged({ saved: appearanceKey(PIN), patched: false, problems: ["x"] })).toBe(true);
  });
});

describe("pr-capture session pin: removal, every GIF frame, stable window", () => {
  const add = (queryId: number) => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId, udfPath: "sessions:getSession" }] });
  const remove = (queryId: number) => ({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId }] });
  const updateFor = (queryId: number, value: unknown) =>
    JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId, value }] });
  const removed = (queryId: number) => JSON.stringify({ type: "Transition", modifications: [{ type: "QueryRemoved", queryId }] });
  const clean: PinReport = { saved: "cyberpunk/dark/expressive", patched: true, problems: [] };

  test.each<[string, (s: ReturnType<ReturnType<typeof createSessionPin>["socket"]>) => void]>([
    ["client Remove after a rewrite, no re-Add (signed out)", (s) => { s.fromServer(updateFor(3, SAVED)); s.fromClient(remove(3)); }],
    ["server QueryRemoved after a rewrite", (s) => { s.fromServer(updateFor(3, SAVED)); s.fromServer(removed(3)); }],
    ["Remove before any result", (s) => s.fromClient(remove(3))],
  ])("every subscription removed is a problem (%s)", (_, drive) => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    drive(s);
    const report = pin.report();
    expect([report.patched, pinFlagged(report)]).toEqual([false, true]);
    expect(has(report, "no live sessions:getSession subscription")).toBe(true);
    expect(shotPin([report], PIN).flagged).toBe(true);
  });

  test("a GIF is flagged if any frame, not just the first or last, had a gap", () => {
    const pin = createSessionPin(PIN);
    const s = pin.socket();
    s.fromClient(add(3));
    s.fromServer(updateFor(3, SAVED));
    const first = pin.report();
    s.fromClient(remove(3)); // signed out mid-GIF: the provider skips the query
    const middle = pin.report();
    s.fromClient(add(4));
    s.fromServer(updateFor(4, SAVED));
    const last = pin.report();
    expect([pinFlagged(first), pinFlagged(last)]).toEqual([false, false]);
    // Even without the middle snapshot, the unpinned counter moved between first and last, so the gap is caught.
    const ends = shotPin([first, last], PIN);
    expect(ends.flagged).toBe(true);
    expect(has(ends, "not fully applied at some point between snapshots")).toBe(true);
    const gif = shotPin([first, middle, last], PIN);
    expect([gif.patched, gif.flagged]).toEqual([false, true]);
    expect(has(gif, "no live sessions:getSession subscription")).toBe(true);
  });

  test("shotPin: a missing snapshot or an unexplained patched:false is a problem", () => {
    expect(shotPin([clean, clean], PIN)).toMatchObject({ patched: true, flagged: false, overridden: true });
    expect(shotPin([clean], { theme: "cyberpunk", mode: "dark", chrome: "expressive" })).toMatchObject({ flagged: false, overridden: false });
    const missing = shotPin([clean, undefined], PIN);
    expect([missing.patched, missing.flagged]).toEqual([false, true]);
    expect(has(missing, "no pin snapshot")).toBe(true);
    expect(shotPin([], PIN).flagged).toBe(true);
    const silent = shotPin([{ saved: null, patched: false, problems: [] }], PIN);
    expect(silent.flagged).toBe(true);
    expect(has(silent, "not rewritten when the image was taken")).toBe(true);
    expect(pinFlagged({ saved: null, patched: false, problems: [] })).toBe(true);
  });

  test("stableScreenshot restarts the quiet window when the snapshot changes", async () => {
    const png = Buffer.from("same pixels every time");
    let shots = 0;
    let changedAt = 0;
    const page = {
      addStyleTag: async () => {},
      screenshot: async () => png,
      waitForTimeout: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
    } as unknown as Parameters<typeof stableScreenshot>[0];
    // The pixels never change, but the pin state changes on the 3rd shot (a result was forwarded).
    const snapshot = () => {
      if (++shots === 3) changedAt = Date.now();
      return shots < 3 ? "pending" : "patched";
    };
    const result = await stableScreenshot(page, false, snapshot);
    expect([result.stable, result.at]).toEqual([true, "patched"]);
    // Pixels alone were quiet from the first shot; the change pushed the return to >= 2s after it.
    expect(Date.now() - changedAt).toBeGreaterThanOrEqual(1_900);
  }, 15_000);
});

describe("pr-capture session pin: socket close, unsettled shots, GIF churn", () => {
  const add = (queryId: number) => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId, udfPath: "sessions:getSession" }] });
  const remove = (queryId: number) => ({ type: "ModifyQuerySet", modifications: [{ type: "Remove", queryId }] });
  const updateFor = (queryId: number, value: unknown) =>
    JSON.stringify({ type: "Transition", modifications: [{ type: "QueryUpdated", queryId, value }] });
  const cleanSocket = (pin: ReturnType<typeof createSessionPin>, queryId = 3) => {
    const s = pin.socket();
    s.fromClient(add(queryId));
    s.fromServer(updateFor(queryId, SAVED));
    return s;
  };

  test("a reload whose new socket never re-subscribes is flagged once the old socket closes", () => {
    const pin = createSessionPin(PIN);
    const old = cleanSocket(pin);
    old.close();
    pin.socket(); // signed out: useQuery skips getSession
    const report = pin.report();
    expect([report.patched, pinFlagged(report)]).toEqual([false, true]);
    expect(has(report, "no live sessions:getSession subscription")).toBe(true);
  });

  test("a reconnect whose new socket removes its subscription is flagged", () => {
    const pin = createSessionPin(PIN);
    cleanSocket(pin).close();
    const next = pin.socket();
    next.fromClient(add(0));
    next.fromClient(remove(0)); // AuthError restart, refresh fails, the provider skips the query
    expect(pinFlagged(pin.report())).toBe(true);
  });

  test("an old socket that closed while pending doesn't flag a correct page", () => {
    const pin = createSessionPin(PIN);
    const old = pin.socket();
    old.fromClient(add(3));
    old.close(); // closed before its result arrived
    cleanSocket(pin, 0);
    expect(pin.report()).toMatchObject({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] });
  });

  test("a closed socket drops its half-received chunks and ignores late frames", () => {
    const pin = createSessionPin(PIN);
    const old = pin.socket();
    old.fromClient(add(3));
    const whole = updateFor(3, SAVED);
    old.fromServer(chunk(whole.slice(0, 10), 0));
    old.close();
    old.fromClient(add(4));
    expect(old.fromServer(chunk(whole.slice(10), 1))).toEqual([chunk(whole.slice(10), 1)]);
    cleanSocket(pin, 0);
    expect(pin.report()).toMatchObject({ patched: true, problems: [] });
  });

  test("an unsettled stability window flags a signed-in shot", () => {
    const pin = createSessionPin(PIN);
    cleanSocket(pin);
    const report = pin.report();
    expect(shotPin([report], PIN).flagged).toBe(false);
    const unsettled = shotPin([report], PIN, ["the stability window ran out"]);
    expect([unsettled.patched, unsettled.flagged]).toEqual([true, true]);
    expect(stillPin(report, true, PIN).flagged).toBe(false);
    const timedOut = stillPin(report, false, PIN);
    expect([timedOut.flagged, timedOut.problems]).toEqual([true, [UNSETTLED_PROBLEM]]);
  });

  test("GIF: a Remove + Add + rewrite entirely between two frames is still caught", () => {
    const pin = createSessionPin(PIN);
    const s = cleanSocket(pin);
    const before = pin.report();
    s.fromClient(remove(3));
    s.fromClient(add(5));
    s.fromServer(updateFor(5, SAVED));
    const after = pin.report();
    expect([pinFlagged(before), pinFlagged(after)]).toEqual([false, false]);
    expect(after.unpinned).toBeGreaterThan(before.unpinned!);
    expect(shotPin([before, after], PIN).flagged).toBe(true);
  });

  test("GIF: a skip that lands after the last frame is caught by the snapshot taken after recording", () => {
    const pin = createSessionPin(PIN);
    const s = cleanSocket(pin);
    const lastFrame = pin.report();
    s.fromClient(remove(3));
    const afterRecording = pin.report();
    expect(shotPin([lastFrame], PIN).flagged).toBe(false);
    expect(shotPin([lastFrame, afterRecording], PIN).flagged).toBe(true);
  });

  test("a steady clean context keeps the same counters, so repeated snapshots stay clean", () => {
    const pin = createSessionPin(PIN);
    const s = cleanSocket(pin);
    const a = pin.report();
    s.fromServer(JSON.stringify({ type: "Ping" }));
    s.fromServer(updateFor(3, SAVED)); // a later rewritten update is a change, but not an unpinned one
    const b = pin.report();
    expect(b.unpinned).toBe(a.unpinned);
    expect(shotPin([a, b, pin.report()], PIN).flagged).toBe(false);
  });
});

describe("pr-capture socket guard", () => {
  const connect = (sessionId: string) => JSON.stringify({ type: "Connect", sessionId, connectionCount: 0 });

  test("a proxied socket is clean: each frame it sends was forwarded first", () => {
    const guard = createSocketGuard();
    guard.proxied();
    guard.forwarded(connect("a"));
    guard.opened();
    guard.sent(connect("a"));
    guard.forwarded("same");
    guard.forwarded("same");
    guard.sent("same");
    guard.sent("same");
    expect(guard.problems()).toEqual([]);
  });

  test("a frame on a socket the proxy never saw is a problem, and names its type", () => {
    const guard = createSocketGuard();
    guard.proxied();
    guard.opened();
    guard.opened(); // a worker's socket
    guard.sent(connect("worker"));
    guard.sent(JSON.stringify({ type: "Mutation", udfPath: "decks:create" }));
    const problems = guard.problems();
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("2 frame(s) (Connect ×1, Mutation ×1) were sent on a Convex WebSocket the capture proxy never saw");
    expect(problems[1]).toContain("1 more Convex WebSocket(s) were opened than the capture proxy saw");
  });

  test("a repeated frame only matches as many times as it was forwarded", () => {
    const guard = createSocketGuard();
    guard.forwarded("ping");
    guard.sent("ping");
    expect(guard.problems()).toEqual([]);
    guard.sent("ping");
    expect(guard.problems()[0]).toContain("1 frame(s) (unparseable ×1)");
  });

  test("a silent unproxied socket is caught by the count; binary frames are compared too", () => {
    const silent = createSocketGuard();
    silent.opened();
    expect(silent.problems()[0]).toContain("1 more Convex WebSocket(s) were opened");
    const binary = createSocketGuard();
    binary.forwarded(Buffer.from([1, 2]));
    binary.sent(Buffer.from([1, 2]));
    binary.sent(Buffer.from([3]));
    expect(binary.problems()).toEqual([expect.stringContaining("1 frame(s) (binary ×1)")]);
  });

  test("a SharedWorker or service worker is a problem by itself", () => {
    const guard = createSocketGuard();
    guard.worker("SharedWorker", "/w.js");
    guard.worker("SharedWorker", "/w.js");
    guard.worker("service worker", "http://localhost/sw.js");
    expect(guard.problems()).toEqual([
      expect.stringContaining("a SharedWorker started (/w.js)"),
      expect.stringContaining("a service worker started (http://localhost/sw.js)"),
    ]);
  });

  test("Convex sockets: the sync path, or anything on the deployment host", () => {
    const host = convexHostFromEnv({ NEXT_PUBLIC_CONVEX_URL: "https://happy-otter-123.convex.cloud" });
    expect(host).toBe("happy-otter-123.convex.cloud");
    expect(isConvexSocket("wss://happy-otter-123.convex.cloud/api/1.31.0/sync", host)).toBe(true);
    expect(isConvexSocket("wss://happy-otter-123.convex.cloud/api/v2/stream", host)).toBe(true);
    expect(isConvexSocket("ws://127.0.0.1:8132/api/probe/sync", host)).toBe(true);
    expect(isConvexSocket("ws://localhost:8131/_next/webpack-hmr", host)).toBe(false);
    expect(isConvexSocket("wss://other.convex.cloud/api/v2/stream")).toBe(false);
    expect(convexHostFromEnv({})).toBeUndefined();
  });
});

type Listener = (...args: never[]) => unknown;

function emitter() {
  const listeners = new Map<string, Listener[]>();
  return {
    on(event: string, fn: Listener) {
      listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    },
    emit(event: string, ...args: unknown[]) {
      for (const fn of listeners.get(event) ?? []) (fn as (...a: unknown[]) => unknown)(...args);
    },
  };
}

type InitScript = { script: (arg: never) => unknown; arg?: unknown };
type HookedContext = { initScripts: InitScript[]; bindingNames: string[]; bindings: ((source: unknown, url: string) => void)[] };

/**
 * Runs the context's SharedWorker init script against a stand-in `SharedWorker` global, the way the browser
 * would at document start, with each exposed binding wired to its handler, then starts a
 * SharedWorker. Proves the context installs the hook and that it reports through its own binding.
 * Returns the URLs the stand-in constructor saw (the real worker must still start).
 */
function startSharedWorker(context: HookedContext, url: string) {
  const g = globalThis as unknown as Record<string, unknown>;
  const saved = { SharedWorker: g.SharedWorker, bindings: context.bindingNames.map((name) => g[name]) };
  const started: string[] = [];
  g.SharedWorker = class {
    constructor(workerUrl: string | URL) {
      started.push(String(workerUrl));
    }
  };
  context.bindingNames.forEach((name, i) => (g[name] = (u: string) => context.bindings[i]({}, u)));
  try {
    // The hook is the init script handed a binding's name (the others need a DOM).
    const hooks = context.initScripts.filter(({ arg }) => context.bindingNames.includes(arg as string));
    for (const { script, arg } of hooks) (script as (arg: unknown) => unknown)(arg);
    new (g.SharedWorker as new (url: string) => unknown)(url);
  } finally {
    g.SharedWorker = saved.SharedWorker;
    context.bindingNames.forEach((name, i) => (g[name] = saved.bindings[i]));
  }
  return started;
}

/** Just enough of Playwright's Browser/BrowserContext/Page to drive newCaptureContext's wiring. */
function fakeBrowser() {
  const fakePage = () => {
    let wsRoute: ((ws: unknown) => void) | undefined;
    return {
      ...emitter(),
      routeWebSocket: async (_pattern: RegExp, handler: (ws: unknown) => void) => void (wsRoute = handler),
      route: (ws: unknown) => wsRoute!(ws),
    };
  };
  const fakeContext = () => {
    const events = emitter();
    const bindings: ((source: unknown, url: string) => void)[] = [];
    const bindingNames: string[] = [];
    const initScripts: InitScript[] = [];
    const pages: ReturnType<typeof fakePage>[] = [];
    let wsRoute: ((ws: unknown) => void) | undefined;
    return {
      ...events,
      pages,
      bindings,
      bindingNames,
      initScripts,
      routeWebSocket: async (_pattern: RegExp, handler: (ws: unknown) => void) => void (wsRoute = handler),
      routeSocket: (ws: unknown) => wsRoute!(ws),
      route: async () => {},
      addInitScript: async (script: InitScript["script"], arg?: unknown) => void initScripts.push({ script, arg }),
      exposeBinding: async (name: string, fn: (source: unknown, url: string) => void) => {
        bindingNames.push(name);
        bindings.push(fn);
      },
      async newPage() {
        const page = fakePage();
        pages.push(page);
        events.emit("page", page);
        return page;
      },
    };
  };
  const contexts: ReturnType<typeof fakeContext>[] = [];
  return {
    contexts,
    newContext: async () => {
      const context = fakeContext();
      contexts.push(context);
      return context;
    },
  };
}

/** A routed socket: frames from the page and the server, and what the proxy passed on. */
function fakeSocketRoute(url = "wss://x.convex.cloud/api/1.0/sync") {
  const toServer: unknown[] = [];
  const toPage: unknown[] = [];
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const server = {
    send: (m: unknown) => toServer.push(m),
    onMessage: (h: (m: unknown) => void) => void (handlers.server = h as never),
    onClose: (h: (code?: number, reason?: string) => void) => void (handlers.serverClose = h as never),
    close: async () => {},
  };
  const ws = {
    url: () => url,
    connectToServer: () => server,
    onMessage: (h: (m: unknown) => void) => void (handlers.page = h as never),
    onClose: (h: (code?: number, reason?: string) => void) => void (handlers.pageClose = h as never),
    send: (m: unknown) => toPage.push(m),
    close: async () => {},
  };
  return {
    ws,
    toServer,
    toPage,
    fromPage: (m: unknown) => handlers.page(m),
    fromServer: (m: unknown) => handlers.server(m),
    serverClosed: () => handlers.serverClose(1006, ""),
  };
}

/** A real (native) WebSocket as Playwright reports it on `page.on("websocket")`. */
function nativeSocket(url: string) {
  const events = new Map<string, (data: { payload: string | Buffer }) => void>();
  return {
    url: () => url,
    on: (event: string, fn: (data: { payload: string | Buffer }) => void) => void events.set(event, fn),
    send: (payload: string) => events.get("framesent")?.({ payload }),
  };
}

describe("pr-capture capture context wiring", () => {
  const subscribeFrame = JSON.stringify(subscribe);
  const open = async () => {
    const browser = fakeBrowser();
    const blocked: string[] = [];
    const made = await newCaptureContext(browser as unknown as Parameters<typeof newCaptureContext>[0], {
      viewport: "desktop",
      appearance: PIN,
      blocked,
      still: true,
    });
    const context = browser.contexts[0];
    return { ...made, blocked, context, main: context.pages[0] };
  };
  const cleanSocket = (route: (ws: unknown) => void) => {
    const s = fakeSocketRoute();
    route(s.ws);
    s.fromPage(subscribeFrame);
    s.fromServer(update(SAVED));
    return s;
  };

  test("the shot page has its own route and pin; a popup's clean subscription can't mask it losing its own", async () => {
    const { pin, context, main } = await open();
    expect(context.pages).toHaveLength(1);
    const mainSocket = cleanSocket(main.route);
    expect(pin.report()).toMatchObject({ patched: true, problems: [] });
    // A popup has no page route, so its socket falls through to the context's route and pin.
    const popup = cleanSocket(context.routeSocket);
    expect(JSON.parse(popup.toPage[0] as string).modifications[0].value.colorSource.preset).toBe("aurora");
    expect(pin.report()).toMatchObject({ patched: true, problems: [] });
    mainSocket.serverClosed(); // the shot page left the app or signed out; the popup is still clean
    const report = pin.report();
    expect([report.patched, pinFlagged(report)]).toEqual([false, true]);
    expect(has(report, "no live sessions:getSession subscription")).toBe(true);
  });

  test("a popup that never subscribes doesn't flag a clean shot page", async () => {
    const { pin, context, main } = await open();
    cleanSocket(main.route);
    const popup = fakeSocketRoute();
    context.routeSocket(popup.ws);
    popup.serverClosed();
    expect(pin.report()).toMatchObject({ patched: true, problems: [] });
  });

  test("writes are dropped on the shot page's route and on the context route", async () => {
    const { blocked, context, main } = await open();
    for (const route of [main.route, context.routeSocket]) {
      const s = fakeSocketRoute();
      route(s.ws);
      s.fromPage(JSON.stringify({ type: "Mutation", udfPath: "decks:create" }));
      s.fromPage(JSON.stringify({ type: "Action", udfPath: "x:y" }));
      s.fromPage(subscribeFrame);
      expect(s.toServer).toEqual([subscribeFrame]);
    }
    expect(blocked).toEqual(["Mutation:decks:create", "Action:x:y", "Mutation:decks:create", "Action:x:y"]);
  });

  test("the guard sees real sockets on every page: proxied ones are clean, a worker's isn't", async () => {
    const { guard, context, main } = await open();
    const routed = cleanSocket(main.route);
    const native = nativeSocket(routed.ws.url());
    main.emit("websocket", native);
    native.send(subscribeFrame);
    main.emit("websocket", nativeSocket("ws://localhost:8131/_next/webpack-hmr")); // not Convex
    expect(guard.problems()).toEqual([]);

    const popup = await context.newPage();
    const worker = nativeSocket("wss://x.convex.cloud/api/1.0/sync"); // the popup's dedicated worker
    popup.emit("websocket", worker);
    worker.send(JSON.stringify({ type: "Connect", sessionId: "w" }));
    expect(guard.problems()).toEqual([
      expect.stringContaining("1 frame(s) (Connect ×1) were sent on a Convex WebSocket the capture proxy never saw"),
      expect.stringContaining("1 more Convex WebSocket(s) were opened than the capture proxy saw"),
    ]);
  });

  test("the context installs the SharedWorker hook, and a SharedWorker the page starts is flagged", async () => {
    const { guard, context } = await open();
    expect(guard.problems()).toEqual([]);
    expect(startSharedWorker(context, "/shared.js")).toEqual(["/shared.js"]);
    expect(guard.problems()).toEqual([expect.stringContaining("a SharedWorker started (/shared.js)")]);
  });

  test("the guard flags a SharedWorker (reported by the init-script binding) and a service worker", async () => {
    const { guard, context } = await open();
    expect(context.bindings).toHaveLength(1);
    context.bindings[0]({}, "/shared.js");
    context.emit("serviceworker", { url: () => "http://localhost:8131/sw.js" });
    expect(guard.problems()).toEqual([
      expect.stringContaining("a SharedWorker started (/shared.js)"),
      expect.stringContaining("a service worker started (http://localhost:8131/sw.js)"),
    ]);
  });
});

describe("pr-capture agent login", () => {
  type Emitter = ReturnType<typeof emitter>;
  /** Runs while the sign-in page loads, like something the page or a worker it starts would do. */
  type During = (context: Emitter & HookedContext, page: Emitter) => void;
  const loginBrowser = (options: { fail?: boolean; during?: During } = {}) => {
    const contexts: { closed: boolean; state: object }[] = [];
    return {
      contexts,
      newContext: async () => {
        const record = { closed: false, state: { cookies: [{ name: "__convexAuthRefreshToken", value: `t${contexts.length}` }] } };
        contexts.push(record);
        let at = "about:blank";
        const context = {
          ...emitter(),
          initScripts: [] as InitScript[],
          bindingNames: [] as string[],
          bindings: [] as ((source: unknown, url: string) => void)[],
          route: async () => {},
          routeWebSocket: async () => {},
          addInitScript: async (script: InitScript["script"], arg?: unknown) => void context.initScripts.push({ script, arg }),
          exposeBinding: async (name: string, fn: (source: unknown, url: string) => void) => {
            context.bindingNames.push(name);
            context.bindings.push(fn);
          },
          storageState: async () => record.state,
          close: async () => void (record.closed = true),
          newPage: async () => {
            const page = {
              ...emitter(),
              url: () => at,
              goto: async (url: string) => {
                at = url;
                options.during?.(context, page);
                if (options.fail) throw new Error(`timeout navigating to ${url}`);
                at = "http://localhost:8131/decks";
              },
              waitForURL: async () => {},
            };
            context.emit("page", page);
            return page;
          },
        };
        return context;
      },
    };
  };
  const withSecret = async (run: () => Promise<void>) => {
    const previous = process.env.AGENT_AUTH_SECRET;
    process.env.AGENT_AUTH_SECRET = "s3cret";
    try {
      await run();
    } finally {
      if (previous === undefined) delete process.env.AGENT_AUTH_SECRET;
      else process.env.AGENT_AUTH_SECRET = previous;
    }
  };

  test("every call is its own sign-in in its own throwaway context", () =>
    withSecret(async () => {
      const browser = loginBrowser();
      const asBrowser = browser as unknown as Parameters<typeof agentLogin>[0];
      const first = await agentLogin(asBrowser, "http://localhost:8131", []);
      const second = await agentLogin(asBrowser, "http://localhost:8131", []);
      expect(browser.contexts).toHaveLength(2);
      expect(browser.contexts.every((context) => context.closed)).toBe(true);
      expect(first.storageState as object).toBe(browser.contexts[0].state);
      expect(second.storageState as object).toBe(browser.contexts[1].state);
      expect([first.unproxied, second.unproxied]).toEqual([[], []]);
    }));

  test("unproxied is the sign-in context's own guard result: worker sockets, SharedWorkers, service workers", () =>
    withSecret(async () => {
      const login = (during: During) =>
        agentLogin(loginBrowser({ during }) as unknown as Parameters<typeof agentLogin>[0], "http://localhost:8131", []);
      const worker = await login((_context, page) => {
        const socket = nativeSocket("wss://x.convex.cloud/api/1.0/sync"); // a dedicated worker's socket: never proxied
        page.emit("websocket", socket);
        socket.send(JSON.stringify({ type: "Connect", sessionId: "w" }));
      });
      expect(worker.unproxied).toEqual([
        expect.stringContaining("1 frame(s) (Connect ×1) were sent on a Convex WebSocket the capture proxy never saw"),
        expect.stringContaining("1 more Convex WebSocket(s) were opened than the capture proxy saw"),
      ]);
      const shared = await login((context) => void startSharedWorker(context, "/shared.js"));
      expect(shared.unproxied).toEqual([expect.stringContaining("a SharedWorker started (/shared.js)")]);
      const service = await login((context) => context.emit("serviceworker", { url: () => "http://localhost:8131/sw.js" }));
      expect(service.unproxied).toEqual([expect.stringContaining("a service worker started (http://localhost:8131/sw.js)")]);
    }));

  test("a failed sign-in closes its context and never echoes the token", () =>
    withSecret(async () => {
      const browser = loginBrowser({ fail: true });
      const error = await agentLogin(browser as unknown as Parameters<typeof agentLogin>[0], "http://localhost:8131", []).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("stuck on /agent-login");
      expect((error as Error).message).not.toContain("s3cret");
      expect(browser.contexts[0].closed).toBe(true);
    }));
});

const PUBLISH = path.join(import.meta.dir, "../scripts/pr-capture/publish.ts");
const MANIFEST = loadManifest();
const REQUIRED = MANIFEST.names.filter((name) => !MANIFEST.optional.includes(name) && !MANIFEST.ciOnly.includes(name));
/** Fake values only, random per run, so nothing here can match a real secret. */
const fakeValue = (name: string) => `fake${name.replace(/_/g, "").toLowerCase()}${crypto.randomBytes(12).toString("hex")}`;
const FAKE_ENV = Object.fromEntries(REQUIRED.map((name) => [name, fakeValue(name)]));
const PLANTED = FAKE_ENV.AGENT_AUTH_PASSWORD;
const envText = (names: string[]) => names.map((name) => `${name}=${FAKE_ENV[name]}`).join("\n") + "\n";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function pngChunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([head, body, tail]);
}
/** A valid 1×1 RGB PNG with `chunks` (e.g. text chunks) before IEND. */
function png(...chunks: Buffer[]) {
  const ihdr = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(Buffer.from([0, 0, 0, 0]))),
    ...chunks,
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
const tEXt = (text: string) => pngChunk("tEXt", Buffer.concat([Buffer.from("Comment\0"), Buffer.from(text, "latin1")]));
const zTXt = (text: string) => pngChunk("zTXt", Buffer.concat([Buffer.from("Comment\0\0"), zlib.deflateSync(Buffer.from(text))]));
const iTXt = (text: string, compressed: boolean) =>
  pngChunk(
    "iTXt",
    Buffer.concat([
      Buffer.from(`Comment\0${compressed ? "\x01" : "\0"}\0en\0Comment\0`, "latin1"),
      compressed ? zlib.deflateSync(Buffer.from(text)) : Buffer.from(text),
    ]),
  );

/** A work repo whose `origin` is a local bare repo (under a `github.com/<owner>/<repo>` path, for the raw URL). */
function mediaRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pr-capture-publish-"));
  const globalConfig = path.join(root, "gitconfig");
  fs.writeFileSync(globalConfig, "");
  const strip = new Set(MANIFEST.names);
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env)) if (strip.has(key) || key.toUpperCase().startsWith("GIT_")) delete env[key];
  Object.assign(env, {
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  });
  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, env, stdio: "pipe" }).toString().trim();
  const origin = path.join(root, "github.com", "test", "media.git");
  fs.mkdirSync(origin, { recursive: true });
  git(origin, "init", "-q", "--bare");
  const work = path.join(root, "work");
  fs.mkdirSync(work);
  git(work, "init", "-q");
  git(work, "remote", "add", "origin", origin.split(path.sep).join("/"));
  git(work, "commit", "-q", "--allow-empty", "-m", "init");
  const envFile = path.join(root, "fake.env");
  fs.writeFileSync(envFile, envText(REQUIRED));

  return {
    root,
    work,
    envFile,
    git,
    capture(cwd: string, label: string, files: Record<string, string | Buffer>) {
      const dir = path.join(cwd, ".pr-captures", "1", label);
      fs.mkdirSync(dir, { recursive: true });
      for (const [name, bytes] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), bytes);
    },
    publish(cwd: string, ...args: string[]) {
      const result = spawnSync(process.execPath, [PUBLISH, "--issue", "1", ...args], { cwd, env, encoding: "utf8" });
      return { status: result.status, out: `${result.stdout}\n${result.stderr}` };
    },
    /**
     * Runs publish in-process from `cwd` with a stand-in git: every command runs the real git there,
     * after `before` has seen its args.
     */
    publishWith(cwd: string, before: (args: string[]) => void, ...args: string[]) {
      const standIn: Git = (gitArgs, options = {}) => {
        before(gitArgs);
        return execFileSync("git", gitArgs, {
          cwd,
          input: options.input,
          env: { ...options.env, ...env },
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
      };
      return publish(["--issue", "1", ...args], { cwd, git: standIn });
    },
    tip: () => {
      try {
        return git(origin, "rev-parse", "--verify", "-q", "refs/heads/pr-media");
      } catch {
        return null;
      }
    },
    tree: () => git(origin, "ls-tree", "-r", "--name-only", "pr-media").split("\n"),
    blob: (rel: string) => execFileSync("git", ["show", `pr-media:${rel}`], { cwd: origin, env, stdio: "pipe" }),
    /** Whether any object in origin (reachable or not) holds `value`. */
    originHas: (value: string) =>
      execFileSync("git", ["cat-file", "--batch-all-objects", "--batch"], { cwd: origin, env, stdio: "pipe", maxBuffer: 1 << 30 }).includes(value),
    /** Every object in both repos, so a write before the abort (even an unreferenced blob) shows up. */
    objects: () => [work, origin].map((dir) => git(dir, "count-objects", "-v")).join("\n"),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

const CLEAN_FILES = () => ({
  "shot.png": png(tEXt("Software: test")),
  "manifest.json": JSON.stringify({ shots: ["shot.png"] }, null, 2),
  "summary.md": "| a | b |\r\n| - | - |\r\n",
});

describe("pr-capture publish: secret-scan gate", () => {
  test("a clean set publishes exactly its bytes; logs stay behind", () => {
    const repo = mediaRepo();
    try {
      const files = CLEAN_FILES();
      repo.capture(repo.work, "after", { ...files, "next-dev.log": `token=${PLANTED}` });
      const result = repo.publish(repo.work, "--env-file", repo.envFile);
      expect(result.status).toBe(0);
      expect(result.out).toContain(`secret-scan: clean (${REQUIRED.length} values checked`);
      expect(result.out).toContain("Pushed 3 files to pr-media");
      expect(result.out).toContain("https://raw.githubusercontent.com/test/media/pr-media/1/");
      expect(repo.tree()).toEqual(["1/after/manifest.json", "1/after/shot.png", "1/after/summary.md", "vercel.json"]);
      for (const [name, bytes] of Object.entries(files)) expect(repo.blob(`1/after/${name}`).equals(Buffer.from(bytes))).toBe(true);
      expect(JSON.parse(repo.blob("vercel.json").toString())).toEqual({ git: { deploymentEnabled: false } });
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  const planted: [string, Record<string, string | Buffer>, string][] = [
    ["a PNG tEXt chunk", { "shot.png": png(tEXt(`token=${PLANTED}`)) }, "1/after/shot.png:"],
    ["a PNG zTXt chunk (compressed)", { "shot.png": png(zTXt(`token=${PLANTED}`)) }, "_scan-only/1/after/shot.png.text-1.txt:"],
    ["a compressed PNG iTXt chunk", { "shot.png": png(iTXt(`token=${PLANTED}`, true)) }, "_scan-only/1/after/shot.png.text-1.txt:"],
    ["an uncompressed PNG iTXt chunk", { "shot.png": png(iTXt(`token=${PLANTED}`, false)) }, "1/after/shot.png:"],
    ["manifest.json", { "manifest.json": JSON.stringify({ url: `http://localhost:8133/x?token=${PLANTED}` }) }, "1/after/manifest.json:"],
    ["summary.md", { "summary.md": `| shot |\n| ${PLANTED} |\n` }, "1/after/summary.md:2"],
    ["a .gif", { "x.gif": Buffer.concat([Buffer.from("GIF89a\0\0"), Buffer.from(PLANTED)]) }, "1/after/x.gif:"],
  ];
  for (const [where, files, hit] of planted) {
    test(`a fake value in ${where} aborts before any git write; pr-media is untouched`, () => {
      const repo = mediaRepo();
      try {
        repo.capture(repo.work, "before", CLEAN_FILES());
        expect(repo.publish(repo.work, "--env-file", repo.envFile).status).toBe(0);
        const tip = repo.tip();
        const objects = repo.objects();
        repo.capture(repo.work, "after", { ...CLEAN_FILES(), ...files });
        const result = repo.publish(repo.work, "--env-file", repo.envFile);
        expect(result.status).toBe(1);
        expect(result.out).toContain(`AGENT_AUTH_PASSWORD ${hit}`);
        expect(result.out).toContain("publish: aborted, secret-scan --strict exited 1");
        expect(result.out).not.toContain(PLANTED);
        expect(repo.tip()).toBe(tip);
        expect(repo.objects()).toBe(objects);
      } finally {
        repo.cleanup();
      }
    }, 60_000);
  }

  test("a fake value in a label (a tree path and the commit message) aborts", () => {
    const repo = mediaRepo();
    try {
      repo.capture(repo.work, PLANTED, CLEAN_FILES());
      const result = repo.publish(repo.work, "--env-file", repo.envFile);
      expect(result.status).toBe(1);
      expect(result.out).toContain("AGENT_AUTH_PASSWORD _scan-only/paths-and-commit-message.txt:");
      expect(repo.tip()).toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("a PNG text chunk that won't inflate aborts", () => {
    const repo = mediaRepo();
    try {
      repo.capture(repo.work, "after", { "shot.png": png(pngChunk("zTXt", Buffer.from("Comment\0\0not zlib"))) });
      const result = repo.publish(repo.work, "--env-file", repo.envFile);
      expect(result.status).toBe(1);
      expect(result.out).toContain("can't read the PNG text chunks of a file to publish");
      expect(result.out).toContain("exited 2");
      expect(repo.tip()).toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("no values to scan with is exit 2, and publish aborts", () => {
    const repo = mediaRepo();
    try {
      repo.capture(repo.work, "after", CLEAN_FILES());
      const objects = repo.objects();
      // No --env-file and no env files in the main checkout.
      const none = repo.publish(repo.work);
      expect(none.out).toContain("secret-scan: cannot read --env-file");
      // An env file with no values.
      const empty = path.join(repo.root, "empty.env");
      fs.writeFileSync(empty, "# nothing\n");
      const nothing = repo.publish(repo.work, "--env-file", empty);
      expect(nothing.out).toContain("secret-scan: no secret values loaded");
      // --strict: a required value missing.
      const partial = path.join(repo.root, "partial.env");
      fs.writeFileSync(partial, envText(REQUIRED.filter((name) => name !== "JWKS")));
      const missing = repo.publish(repo.work, "--env-file", partial);
      expect(missing.out).toContain("secret-scan: missing required value(s): JWKS");
      for (const result of [none, nothing, missing]) {
        expect(result.status).toBe(1);
        expect(result.out).toContain("publish: aborted, secret-scan --strict exited 2 (the scan couldn't run completely)");
      }
      expect(repo.tip()).toBeNull();
      expect(repo.objects()).toBe(objects);
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("without --env-file it scans with both of the main checkout's env files, also from a worktree", () => {
    const repo = mediaRepo();
    try {
      // Split the values so the strict scan only passes when both files are read.
      const half = Math.ceil(REQUIRED.length / 2);
      fs.writeFileSync(path.join(repo.work, ".env.local.live-backup"), envText(REQUIRED.slice(0, half)));
      fs.mkdirSync(path.join(repo.work, "data"));
      fs.writeFileSync(path.join(repo.work, "data", "live-env-no-r2.txt"), envText(REQUIRED.slice(half)));
      const worktree = path.join(repo.root, "wt");
      repo.git(repo.work, "worktree", "add", "-q", "--detach", worktree);

      repo.capture(worktree, "after", { ...CLEAN_FILES(), "summary.md": `${FAKE_ENV.JWKS}\n` });
      const planted = repo.publish(worktree);
      expect(planted.status).toBe(1);
      expect(planted.out).toContain("JWKS 1/after/summary.md:1");
      expect(repo.tip()).toBeNull();

      repo.capture(worktree, "after", CLEAN_FILES());
      const clean = repo.publish(worktree);
      expect(clean.status).toBe(0);
      expect(clean.out).toContain(`secret-scan: clean (${REQUIRED.length} values checked`);
      expect(repo.tip()).not.toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("unknown flags, and an empty or bare --env-file, are refused before anything is published", () => {
    const repo = mediaRepo();
    try {
      repo.capture(repo.work, "after", CLEAN_FILES());
      const unknown = repo.publish(repo.work, "--env-file", repo.envFile, "--skip-scan");
      expect(unknown.status).not.toBe(0);
      expect(unknown.out).toContain("Unknown option: --skip-scan");
      for (const args of [
        ["--env-file="],
        ["--env-file"],
        ["--env-file", "--labels", "after"],
        ["--env-file", "--labels", "after", "--env-file", repo.envFile],
      ]) {
        const bare = repo.publish(repo.work, ...args);
        expect(bare.status).not.toBe(0);
        expect(bare.out).toContain("--env-file needs a value");
      }
      expect(repo.tip()).toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("--env-file adds to the main checkout's env files: a dummy-values file can't mask the real ones", () => {
    const repo = mediaRepo();
    try {
      // The main checkout holds the "real" values; dummy.env has other values for every name, so it
      // passes --strict on its own.
      fs.writeFileSync(path.join(repo.work, ".env.local.live-backup"), envText(REQUIRED));
      fs.mkdirSync(path.join(repo.work, "data"));
      fs.writeFileSync(path.join(repo.work, "data", "live-env-no-r2.txt"), "");
      const dummy = path.join(repo.root, "dummy.env");
      fs.writeFileSync(dummy, REQUIRED.map((name) => `${name}=${fakeValue(name)}`).join("\n"));
      repo.capture(repo.work, "after", { ...CLEAN_FILES(), "summary.md": `${PLANTED}\n` });
      const result = repo.publish(repo.work, "--env-file", dummy);
      expect(result.status).toBe(1);
      expect(result.out).toContain("AGENT_AUTH_PASSWORD 1/after/summary.md:1");
      expect(repo.tip()).toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("a label named like a folder `--path` skips is still scanned (or refused): no folder walk", () => {
    expect([...SKIP_DIRS]).toContain("node_modules");
    for (const label of SKIP_DIRS) {
      const repo = mediaRepo();
      try {
        repo.capture(repo.work, label, { ...CLEAN_FILES(), "manifest.json": JSON.stringify({ token: PLANTED }) });
        for (const args of [[], ["--labels", label]]) {
          const result = repo.publish(repo.work, "--env-file", repo.envFile, ...args);
          expect(result.status).toBe(1);
          expect(result.out).not.toContain(PLANTED);
          // `.git` isn't a valid label name; anything that is gets scanned.
          if (/^[a-zA-Z0-9][\w.-]*$/.test(label)) expect(result.out).toContain(`AGENT_AUTH_PASSWORD 1/${label}/manifest.json:1`);
          else expect(result.out).toContain("--labels <label> is required");
        }
        expect(repo.tip()).toBeNull();
        expect(repo.originHas(PLANTED)).toBe(false);
      } finally {
        repo.cleanup();
      }
    }
  }, 120_000);

  const pngTricks: [string, Record<string, string | Buffer>, string][] = [
    ["PNG bytes with a zTXt chunk, named .gif", { "x.gif": png(zTXt(`token=${PLANTED}`)) }, "AGENT_AUTH_PASSWORD _scan-only/1/after/x.gif.text-1.txt:1"],
    ["PNG bytes with a zTXt chunk, named .json", { "x.json": png(zTXt(`token=${PLANTED}`)) }, "AGENT_AUTH_PASSWORD _scan-only/1/after/x.json.text-1.txt:1"],
    [
      "a PNG with a zTXt chunk appended to a GIF",
      { "x.gif": Buffer.concat([Buffer.from("GIF89a"), png(zTXt(`token=${PLANTED}`))]) },
      "AGENT_AUTH_PASSWORD _scan-only/1/after/x.gif.text-1.txt:1",
    ],
    [
      "a zTXt chunk with the value in a second, concatenated zlib stream",
      { "shot.png": png(pngChunk("zTXt", Buffer.concat([Buffer.from("Comment\0\0"), zlib.deflateSync("clean"), zlib.deflateSync(`token=${PLANTED}`)]))) },
      "AGENT_AUTH_PASSWORD _scan-only/1/after/shot.png.text-2.txt:1",
    ],
    [
      "an iTXt chunk with the value in a second, concatenated zlib stream",
      {
        "shot.png": png(
          pngChunk("iTXt", Buffer.concat([Buffer.from("Comment\0\x01\0en\0Comment\0", "latin1"), zlib.deflateSync("clean"), zlib.deflateSync(`token=${PLANTED}`)])),
        ),
      },
      "AGENT_AUTH_PASSWORD _scan-only/1/after/shot.png.text-2.txt:1",
    ],
    [
      "a PNG iCCP (colour profile) chunk",
      { "shot.png": png(pngChunk("iCCP", Buffer.concat([Buffer.from("icc\0\0"), zlib.deflateSync(`token=${PLANTED}`)]))) },
      "AGENT_AUTH_PASSWORD _scan-only/1/after/shot.png.text-1.txt:1",
    ],
    ["a .png that isn't a PNG", { "shot.png": Buffer.from("not a png at all") }, "a .png that isn't a PNG"],
    [
      "a zTXt chunk with undecodable data after its zlib stream",
      { "shot.png": png(pngChunk("zTXt", Buffer.concat([Buffer.from("Comment\0\0"), zlib.deflateSync("clean"), Buffer.from(PLANTED)]))) },
      "exited 2",
    ],
  ];
  for (const [what, files, expected] of pngTricks) {
    test(`${what} aborts`, () => {
      const repo = mediaRepo();
      try {
        repo.capture(repo.work, "after", { ...CLEAN_FILES(), ...files });
        const result = repo.publish(repo.work, "--env-file", repo.envFile);
        expect(result.status).toBe(1);
        expect(result.out).toContain(expected);
        expect(result.out).toContain("publish: aborted");
        expect(result.out).not.toContain(PLANTED);
        expect(repo.tip()).toBeNull();
      } finally {
        repo.cleanup();
      }
    }, 60_000);
  }

  test("a --labels name that doesn't exist is refused without printing it, and so are case-only duplicates", () => {
    const repo = mediaRepo();
    try {
      repo.capture(repo.work, "after", CLEAN_FILES());
      const result = repo.publish(repo.work, "--env-file", repo.envFile, "--labels", `after,${PLANTED}`);
      expect(result.status).toBe(1);
      expect(result.out).toContain("1 of the --labels isn't a folder under .pr-captures/1/. Names not printed.");
      expect(result.out).not.toContain(PLANTED);
      const cased = repo.publish(repo.work, "--env-file", repo.envFile, "--labels", "after,AFTER");
      expect(cased.status).toBe(1);
      expect(cased.out).toContain("--labels has labels that differ only by case");
      expect(repo.tip()).toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("a folder or symlink with a media extension is refused, without printing its name", () => {
    const repo = mediaRepo();
    try {
      repo.capture(repo.work, "after", CLEAN_FILES());
      const dir = path.join(repo.work, ".pr-captures", "1", "after");
      fs.mkdirSync(path.join(dir, `${PLANTED}.png`));
      const folder = repo.publish(repo.work, "--env-file", repo.envFile);
      expect(folder.status).toBe(1);
      expect(folder.out).toContain("1 entry with a media extension under .pr-captures/1/ isn't a regular file");
      expect(folder.out).not.toContain(PLANTED);
      fs.rmSync(path.join(dir, `${PLANTED}.png`), { recursive: true });

      // A symlink to a clean file outside the capture would read and scan fine, so only the check stops it.
      const outside = path.join(repo.root, "outside.json");
      fs.writeFileSync(outside, "{}");
      let linked = true;
      try {
        fs.symlinkSync(outside, path.join(dir, "linked.json"), "file");
      } catch {
        linked = false; // Windows without symlink rights: the junction below still covers a link.
      }
      if (!linked) fs.symlinkSync(repo.root, path.join(dir, "linked.json"), "junction");
      const link = repo.publish(repo.work, "--env-file", repo.envFile);
      expect(link.status).toBe(1);
      expect(link.out).toContain("1 entry with a media extension under .pr-captures/1/ isn't a regular file");
      expect(repo.tip()).toBeNull();
    } finally {
      repo.cleanup();
    }
  }, 60_000);

  test("a file changed after the scan: the scanned bytes are published, not the new ones (stand-in git)", async () => {
    const repo = mediaRepo();
    try {
      const clean = CLEAN_FILES();
      repo.capture(repo.work, "after", clean);
      const file = path.join(repo.work, ".pr-captures", "1", "after", "summary.md");
      let swapped = false;
      const code = await repo.publishWith(
        repo.work,
        (args) => {
          // The first git write runs after the scan: swap the file on disk for planted bytes right then.
          if (args[0] === "hash-object" && !swapped) {
            fs.writeFileSync(file, `${PLANTED}\n`);
            swapped = true;
          }
        },
        "--env-file",
        repo.envFile,
      );
      expect(code).toBe(0);
      expect(swapped).toBe(true);
      expect(fs.readFileSync(file, "utf8")).toBe(`${PLANTED}\n`);
      expect(repo.blob("1/after/summary.md").equals(Buffer.from(clean["summary.md"]))).toBe(true);
      expect(repo.originHas(PLANTED)).toBe(false);
    } finally {
      repo.cleanup();
    }
  }, 60_000);
});

describe("pr-capture publish: PNG text chunks", () => {
  test("inflates zTXt and compressed iTXt; plain text chunks are left to the raw scan", () => {
    const texts = inflatedPngText(png(tEXt("a"), zTXt("b"), iTXt("c", true), iTXt("d", false)));
    expect(texts.map((t) => t.toString())).toEqual(["b", "c"]);
  });

  test("every zlib stream in a chunk, and every PNG anywhere in the bytes, is inflated", () => {
    const twoStreams = pngChunk("zTXt", Buffer.concat([Buffer.from("Comment\0\0"), zlib.deflateSync("one"), zlib.deflateSync("two")]));
    expect(inflatedPngText(png(twoStreams)).map(String)).toEqual(["one", "two"]);
    expect(inflatedPngText(Buffer.concat([Buffer.from("GIF89a"), png(zTXt("inner"))])).map(String)).toEqual(["inner"]);
    expect(inflatedPngText(Buffer.from("not a png"))).toEqual([]);
  });

  test("a malformed or truncated PNG, or leftover bytes after a zlib stream, throws", () => {
    const whole = png(zTXt("b"));
    expect(() => inflatedPngText(whole.subarray(0, whole.length - 6))).toThrow("truncated");
    expect(() => inflatedPngText(png(pngChunk("zTXt", Buffer.from("no keyword end"))))).toThrow("malformed zTXt");
    expect(() => inflatedPngText(png(pngChunk("zTXt", Buffer.concat([Buffer.from("C\0\0"), zlib.deflateSync("x"), Buffer.from("junk")]))))).toThrow();
    const cut = zlib.deflateSync("a longer text that compresses into a stream we can cut short");
    expect(() => inflatedPngText(png(pngChunk("zTXt", Buffer.concat([Buffer.from("C\0\0"), cut.subarray(0, cut.length - 4)]))))).toThrow();
  });
});
