import type { Browser, BrowserContext, BrowserContextOptions, Page, WebSocketRoute } from "playwright";
import { CONVEX_SYNC_SOCKET, createSocketGuard, isBackendUrl, isCloudConvexUrl, type SocketGuard } from "./guard.ts";
import { BREAK_PIN_ENV, createSessionPin, parseFrame, type Appearance, type ClientFrame, type SessionPin } from "./pin.ts";
import { VIEWPORTS, type Step } from "./shared.ts";
import type { PinnedCatalog } from "./target.ts";

type StorageState = Exclude<BrowserContextOptions["storageState"], string | undefined>;

/**
 * What every context of one run talks to and how. Built once from the preflight (capture.ts).
 * `catalog.served`, `catalog.misses` and `writes` fill in as the run goes.
 */
export type CaptureTarget = {
  /** The validation backend's hosts (`127.0.0.1:<port>`, `localhost:<port>`). Every other Convex target is refused. */
  backendHosts: string[];
  catalog: PinnedCatalog & { served: number; misses: string[] };
  /** `--allow-writes`: forward Mutation/Action frames (each recorded in `writes`) instead of dropping them. */
  allowWrites: boolean;
  writes: string[];
  /** `--clock`: the fixed Date.now() of every capture context (not the sign-in contexts), or null. */
  clock: number | null;
};

/** Sockets to a Convex sync path, or to any Convex cloud host, go through the proxy (which refuses the latter). */
const proxiedSocket = (url: URL) => CONVEX_SYNC_SOCKET.test(url.href) || isCloudConvexUrl(url.href);

/**
 * Proxies the Convex sync WebSocket:
 * - refuses (never connects) any socket that isn't to the validation backend, and records it on
 *   `guard`. Capture treats that as fatal.
 * - drops every Mutation/Action frame, so nothing a capture does (including app-initiated writes
 *   like appearance migration) reaches the backend. Queries still flow. `--allow-writes` forwards
 *   them instead and records each one in `target.writes`.
 * - with a `pin`, rewrites the `sessions:getSession` result the browser receives so
 *   ColorSchemeProvider's JS state (isDark, chrome, preset: menus, toasts, frosted controls) matches
 *   the pin, not the persona's saved prefs. The stored session is never touched.
 * - tells `guard` about every socket and forwarded client frame, so it can spot sockets it never saw.
 *
 * On a page it handles that page's sockets. On a context it handles every page without its own
 * route (Playwright checks page routes first).
 */
async function proxyConvexSocket(
  on: BrowserContext | Page,
  target: CaptureTarget,
  blocked: string[],
  guard: SocketGuard,
  pin?: SessionPin,
) {
  await on.routeWebSocket(proxiedSocket, (ws) => {
    if (!isBackendUrl(ws.url(), target.backendHosts)) {
      guard.refuse("WebSocket", ws.url());
      void ws.close({ code: 1008, reason: "pr-capture: not the validation backend" }).catch(() => {});
      return;
    }
    guard.proxied();
    const server = ws.connectToServer();
    const socket = pin?.socket();

    ws.onMessage((message) => {
      const frame = typeof message === "string" ? parseFrame<ClientFrame & { udfPath?: string }>(message) : null;
      if (frame?.type === "Mutation" || frame?.type === "Action") {
        const write = `${frame.type}:${frame.udfPath}`;
        if (!target.allowWrites) {
          blocked.push(write);
          return;
        }
        target.writes.push(write);
      }
      socket?.fromClient(frame);
      guard.forwarded(message);
      server.send(message);
    });

    if (!socket) return;
    server.onMessage((message) => {
      for (const out of socket.fromServer(message)) ws.send(out);
    });
    // Setting onClose turns off Playwright's automatic close forwarding, so forward it ourselves.
    // Codes a peer may not send (1005/1006, ...) are rejected, so fall back to a plain close.
    const forward = (target: WebSocketRoute, code: number | undefined, reason: string | undefined) =>
      target.close({ code, reason }).catch(() => target.close().catch(() => {}));
    ws.onClose((code, reason) => {
      socket.close();
      void forward(server, code, reason);
    });
    server.onClose((code, reason) => {
      socket.close();
      void forward(ws, code, reason);
    });
  });
}

/** Aborts every HTTP request to a Convex cloud host before it is sent, and records it on `guard`. */
async function refuseCloudRequests(context: BrowserContext, guard: SocketGuard) {
  await context.route(
    (url) => isCloudConvexUrl(url.href),
    async (route) => {
      guard.refuse("request", route.request().url());
      await route.abort("blockedbyclient").catch(() => {});
    },
  );
}

const CATALOG_REQUEST = /\/catalog\/.+\.json\.gz$/;

/**
 * Serves the card catalog from the seed's pinned bytes (the file `pinnedCatalogForUrl` reads,
 * sha256-checked by the preflight and again in target.ts). Nothing is downloaded. The request for
 * the pinned URL is answered from memory with `access-control-allow-origin: *` (R2 only sends CORS
 * headers for the usual origins). Any other catalog URL is aborted and listed in `catalog.misses`,
 * which fails --strict. Card images still load from public R2.
 */
async function servePinnedCatalog(context: BrowserContext, catalog: CaptureTarget["catalog"]) {
  await context.route(
    (url) => url.href === catalog.url || CATALOG_REQUEST.test(url.pathname),
    async (route) => {
      const url = route.request().url();
      if (url !== catalog.url) {
        if (!catalog.misses.includes(url)) {
          catalog.misses.push(url);
          console.warn(`  WARNING: the app asked for catalog ${url}, not the pinned v${catalog.version}; the request was aborted`);
        }
        await route.abort("blockedbyclient").catch(() => {});
        return;
      }
      catalog.served++;
      await route
        .fulfill({ status: 200, body: catalog.body, contentType: "application/gzip", headers: { "access-control-allow-origin": "*" } })
        .catch(() => {}); // The context closed first (e.g. a page that never needed the catalog).
    },
  );
}

/**
 * Pins theme/mode/chrome on <html> before the app's first script runs and re-asserts them whenever
 * ColorSchemeProvider's effects write the session values back. Purely client-side.
 */
function pinAppearance({ theme, mode, chrome }: Appearance) {
  const apply = (root: HTMLElement) => {
    if (root.getAttribute("data-color-theme") !== theme) root.setAttribute("data-color-theme", theme);
    if (root.getAttribute("data-chrome") !== chrome) root.setAttribute("data-chrome", chrome);
    if (root.classList.contains("dark") !== (mode === "dark")) root.classList.toggle("dark", mode === "dark");
    if (root.style.colorScheme !== mode) root.style.colorScheme = mode;
  };
  const start = () => {
    const root = document.documentElement;
    if (!root) return false;
    apply(root);
    new MutationObserver(() => apply(root)).observe(root, {
      attributes: true,
      attributeFilter: ["class", "style", "data-color-theme", "data-chrome"],
    });
    return true;
  };
  if (!start()) {
    new MutationObserver((_, observer) => {
      if (start()) observer.disconnect();
    }).observe(document, { childList: true });
  }
}

export async function newCaptureContext(
  browser: Browser,
  options: {
    viewport: string;
    appearance: Appearance;
    target: CaptureTarget;
    storageState?: StorageState;
    blocked: string[];
    still: boolean;
    videoDir?: string;
  },
): Promise<{ context: BrowserContext; page: Page; pin: SessionPin; guard: SocketGuard }> {
  const vp = VIEWPORTS[options.viewport];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile && options.still ? 2 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    colorScheme: options.appearance.mode,
    reducedMotion: options.still ? "reduce" : "no-preference",
    // So copy buttons show their success toast instead of the clipboard-denied error.
    permissions: ["clipboard-read", "clipboard-write"],
    storageState: options.storageState,
    recordVideo: options.videoDir
      ? { dir: options.videoDir, size: { width: vp.width, height: vp.height } }
      : undefined,
  });
  const broken = process.env[BREAK_PIN_ENV] === "1";
  const { target } = options;
  const guard = await guardContext(context, target);
  // Any page without its own route (a popup a step opened) gets this pin: rewritten the same way so
  // its UI follows the pin too, but never reported, so its subscriptions can't stand in for the shot page's.
  await proxyConvexSocket(context, target, options.blocked, guard, createSessionPin(options.appearance, { broken }));
  await servePinnedCatalog(context, target.catalog);
  await context.addInitScript(pinAppearance, options.appearance);
  if (target.clock !== null) await context.clock.setFixedTime(target.clock);
  // The page that gets shot has its own route and pin, installed before it navigates anywhere.
  const page = await context.newPage();
  const pin = createSessionPin(options.appearance, { broken });
  await proxyConvexSocket(page, target, options.blocked, guard, pin);
  return { context, page, pin, guard };
}

const SHARED_WORKER_BINDING = "__prCaptureSharedWorkerStarted";

/** Init script: reports every SharedWorker the page starts (Playwright has no event for them). */
function reportSharedWorkers(binding: string) {
  const Native = globalThis.SharedWorker;
  if (!Native) return;
  globalThis.SharedWorker = class extends Native {
    constructor(url: string | URL, options?: string | WorkerOptions) {
      super(url, options);
      (globalThis as unknown as Record<string, ((url: string) => unknown) | undefined>)[binding]?.(String(url));
    }
  };
}

/**
 * Feeds the context's socket guard: every WebSocket (and its sent frames) Playwright reports on any
 * page, which covers the page's dedicated workers, plus every SharedWorker and service worker started.
 * Also refuses every HTTP request to a Convex cloud host.
 */
async function guardContext(context: BrowserContext, target: CaptureTarget): Promise<SocketGuard> {
  const guard = createSocketGuard(target.backendHosts);
  await refuseCloudRequests(context, guard);
  context.on("page", (page) =>
    page.on("websocket", (ws) => {
      if (!guard.isConvexSocket(ws.url())) return;
      guard.opened();
      ws.on("framesent", ({ payload }) => guard.sent(payload));
    }),
  );
  context.on("serviceworker", (worker) => guard.worker("service worker", worker.url()));
  await context.exposeBinding(SHARED_WORKER_BINDING, (_source, url: string) => guard.worker("SharedWorker", url));
  await context.addInitScript(reportSharedWorkers, SHARED_WORKER_BINDING);
  return guard;
}

/**
 * Signs in with a one-time agent code in a throwaway context and returns that sign-in's
 * cookies/localStorage. `loginUrl` is a freshly minted `/agent-login#code=…` URL (target.ts
 * `mintLoginUrl`). The code is only in the fragment, which the browser never sends to a server.
 * Call it once per capture context, each time with a new code: each sign-in is its own Convex
 * Auth session, so a step that signs out or reloads (rotating the refresh token) in one context
 * can't sign out the next one. `unproxied` and `refused` are the sign-in context's own guard results.
 */
export async function agentLogin(browser: Browser, loginUrl: string, target: CaptureTarget, blocked: string[]) {
  const context = await browser.newContext();
  try {
    const guard = await guardContext(context, target);
    await proxyConvexSocket(context, target, blocked, guard);
    await servePinnedCatalog(context, target.catalog);
    const page = await context.newPage();
    try {
      await page.goto(loginUrl, { timeout: 180_000 });
      await page.waitForURL((url) => !url.pathname.startsWith("/agent-login"), { timeout: 120_000 });
    } catch {
      // Playwright errors echo the URL, and its fragment holds the code.
      throw new Error(`Agent login did not complete (stuck on ${new URL(page.url()).pathname})`);
    }
    const storageState = await context.storageState();
    return { storageState, unproxied: guard.problems(), refused: guard.refusals() };
  } finally {
    await context.close();
  }
}

/**
 * Runs before the first sign-in. Loads `/agent-login` signed out (no code, so nothing is redeemed)
 * and waits for the app's Convex socket. Throws unless that socket goes to the validation backend,
 * so a reused `next dev` started with another deployment's URL is caught before any code is sent.
 */
export async function probeServerTarget(browser: Browser, baseUrl: string, target: CaptureTarget, blocked: string[]) {
  const context = await browser.newContext();
  try {
    const guard = await guardContext(context, target);
    await proxyConvexSocket(context, target, blocked, guard);
    await servePinnedCatalog(context, target.catalog);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/agent-login`, { timeout: 180_000 });
    for (const deadline = Date.now() + 60_000; Date.now() < deadline; ) {
      if (guard.refusals().length) {
        throw new Error(`capture refused: the app on ${baseUrl} tried to reach another Convex deployment: ${guard.refusals().join("; ")}`);
      }
      if (guard.proxiedCount() > 0) return;
      await page.waitForTimeout(250);
    }
    throw new Error(`capture refused: the app on ${baseUrl} opened no Convex socket within 60s, so its backend can't be confirmed.`);
  } finally {
    await context.close();
  }
}

export async function runSteps(page: Page, steps: Step[] = []) {
  for (const step of steps) {
    if ("click" in step) await page.locator(step.click).first().click();
    else if ("hover" in step) await page.locator(step.hover).first().hover();
    else if ("press" in step) await page.keyboard.press(step.press);
    else if ("fill" in step) await page.locator(step.fill).first().fill(step.value);
    else if ("waitFor" in step) await page.locator(step.waitFor).first().waitFor();
    else if ("wait" in step) await page.waitForTimeout(step.wait);
  }
}

/** Loader conventions in this app: pulse/spin skeletons and aria-busy placeholders. */
function loadersGone() {
  const loaders = document.querySelectorAll('.animate-pulse, .animate-spin, [aria-busy="true"]');
  return !Array.from(loaders).some((el) => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
  });
}

/**
 * Network idle, no visible loaders, web fonts loaded, and every on-screen image decoded.
 * Returns false if loaders were still visible after the timeout.
 */
export async function settle(page: Page): Promise<boolean> {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  const loaded = await page
    .waitForFunction(loadersGone, undefined, { timeout: 60_000, polling: 250 })
    .then(() => true, () => false);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = Array.from(document.images).filter((img) => {
      const box = img.getBoundingClientRect();
      return box.width > 0 && box.bottom > 0 && box.top < window.innerHeight;
    });
    await Promise.all(
      visible.map((img) => img.decode().catch(() => undefined)),
    );
  });
  return loaded;
}

/** The Next dev indicator / overlay host. */
export const HIDE_DEV_OVERLAY_CSS = "nextjs-portal { display: none !important; }";

const FREEZE_CSS = `
${HIDE_DEV_OVERLAY_CSS}
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition: none !important;
  caret-color: transparent !important;
}
`;

/**
 * Freezes motion, then shoots until the page has looked identical for QUIET_MS. A short window
 * isn't enough: some content (e.g. deck art resolved from the card catalog) pops in late with no
 * loader.
 */
const QUIET_MS = 2_000;
const SHOT_INTERVAL_MS = 400;

/**
 * `snapshot` runs just before each screenshot. The returned `at` belongs to the returned `png`, so
 * callers can tell what state (e.g. the theme pin) the page was in when that image was taken. A
 * change in the snapshot restarts the quiet window like a pixel change does, so the shot is only
 * returned once the image and the snapshot have both been unchanged for QUIET_MS (a newly forwarded
 * result gets time to render).
 */
export async function stableScreenshot<T = undefined>(page: Page, fullPage: boolean, snapshot?: () => T) {
  await page.addStyleTag({ content: FREEZE_CSS });
  const shoot = async () => {
    const at = snapshot?.();
    return { png: await page.screenshot({ animations: "disabled", caret: "hide", fullPage }), at };
  };
  let previous = await shoot();
  let quietSince = Date.now();
  for (const deadline = Date.now() + 30_000; Date.now() < deadline; ) {
    await page.waitForTimeout(SHOT_INTERVAL_MS);
    const next = await shoot();
    if (!next.png.equals(previous.png) || JSON.stringify(next.at) !== JSON.stringify(previous.at)) quietSince = Date.now();
    else if (Date.now() - quietSince >= QUIET_MS) return { ...next, stable: true };
    previous = next;
  }
  return { ...previous, stable: false };
}
