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
    expect(pin.report()).toMatchObject({ saved: null, patched: false, problems: [expect.stringContaining("no sessions:getSession")] });
  });

  test.each([
    ["a null result", update(null), "returned null"],
    ["a shape change", update({ _id: "s1", appearance: { theme: "dark" } }), "shape changed"],
    [
      "a failed query",
      JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: 3, errorMessage: "boom" }] }),
      "failed: boom",
    ],
  ])("reports %s", (_, message, problem) => {
    const { pin, socket } = subscribedPin();
    socket.fromServer(message);
    expect(pin.report()).toMatchObject({ patched: false, problems: [expect.stringContaining(problem)] });
  });

  test("reports a chunked transition that can't be reassembled, and forwards it as-is", () => {
    const { pin, socket } = subscribedPin();
    const parts = [chunk("{not json", 0), chunk("either", 1)];
    expect(socket.fromServer(parts[0])).toEqual([]);
    expect(socket.fromServer(parts[1])).toEqual(parts);
    expect(pin.report().problems.join()).toContain("couldn't be reassembled");
  });

  test("flags a shot only when a miss could change what it shows", () => {
    const miss = { saved: null, patched: false, problems: ["x"] };
    expect(pinFlagged(miss, PIN, null)).toBe(true);
    expect(pinFlagged(miss, PIN, "cyberpunk/dark/expressive")).toBe(true);
    expect(pinFlagged(miss, PIN, appearanceKey(PIN))).toBe(false);
    expect(pinFlagged({ saved: "cyberpunk/dark/expressive", patched: true, problems: [] }, PIN, null)).toBe(false);
  });
});
