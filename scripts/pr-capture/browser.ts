import type { Browser, BrowserContext, BrowserContextOptions, Page } from "playwright";
import { BREAK_PIN_ENV, createSessionPin, parseFrame, type Appearance, type ClientFrame, type SessionPin } from "./pin.ts";
import { VIEWPORTS, cachedLoad, type Step } from "./shared.ts";

type StorageState = Exclude<BrowserContextOptions["storageState"], string | undefined>;

const CONVEX_SYNC_SOCKET = /\/api\/[^/]+\/sync$/;

/**
 * Proxies the Convex sync WebSocket:
 * - drops every Mutation/Action frame, so nothing a capture does (including app-initiated writes
 *   like appearance migration) reaches the shared deployment. Queries still flow.
 * - with a `pin`, rewrites the `sessions:getSession` result the browser receives so
 *   ColorSchemeProvider's JS state (isDark, chrome, preset: menus, toasts, frosted controls) matches
 *   the pin, not the agent's saved prefs. The stored session is never touched.
 */
async function proxyConvexSocket(context: BrowserContext, blocked: string[], pin?: SessionPin) {
  await context.routeWebSocket(CONVEX_SYNC_SOCKET, (ws) => {
    const server = ws.connectToServer();
    const socket = pin?.socket();

    ws.onMessage((message) => {
      const frame = typeof message === "string" ? parseFrame<ClientFrame & { udfPath?: string }>(message) : null;
      if (frame?.type === "Mutation" || frame?.type === "Action") {
        blocked.push(`${frame.type}:${frame.udfPath}`);
        return;
      }
      socket?.fromClient(frame);
      server.send(message);
    });

    if (!socket) return;
    server.onMessage((message) => {
      for (const out of socket.fromServer(message)) ws.send(out);
    });
  });
}

const catalogCache = new Map<string, Promise<{ status: number; contentType: string; body: Buffer }>>();

/**
 * The R2 static card catalog only sends CORS headers for the usual dev/prod origins, so on any
 * other --port the app falls back to a rate-limited Convex sync. Fetch it once from Node and
 * serve it to every context. That also removes R2 latency, which otherwise makes card-derived
 * content (deck art, gallery) pop in after the page looks settled.
 */
async function allowStaticCatalog(context: BrowserContext) {
  await context.route(/\/catalog\/.+\.json\.gz$/, async (route) => {
    const url = route.request().url();
    let download;
    try {
      download = await cachedLoad(catalogCache, url, () =>
        fetch(url, { signal: AbortSignal.timeout(30_000) }).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return {
            status: res.status,
            contentType: res.headers.get("content-type") ?? "application/gzip",
            body: Buffer.from(await res.arrayBuffer()),
          };
        }),
      );
    } catch (error) {
      // Fail the browser request now instead of letting it hang. cachedLoad already forgot the failure.
      console.warn(`  card catalog download failed (${url}): ${error instanceof Error ? error.message : error}`);
      await route.abort("failed").catch(() => {});
      return;
    }
    const { status, contentType, body } = download;
    await route
      .fulfill({ status, body, contentType, headers: { "access-control-allow-origin": "*" } })
      .catch(() => {}); // The context closed first (e.g. a page that never needed the catalog).
  });
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
    storageState?: StorageState;
    blocked: string[];
    still: boolean;
    videoDir?: string;
  },
): Promise<{ context: BrowserContext; pin: SessionPin }> {
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
  const pin = createSessionPin(options.appearance, { broken: process.env[BREAK_PIN_ENV] === "1" });
  await proxyConvexSocket(context, options.blocked, pin);
  await allowStaticCatalog(context);
  await context.addInitScript(pinAppearance, options.appearance);
  return { context, pin };
}

/** Signs in once through /agent-login and returns the cookies/localStorage for reuse. */
export async function agentStorageState(browser: Browser, baseUrl: string, blocked: string[]) {
  const token = process.env.AGENT_AUTH_SECRET;
  if (!token) throw new Error("AGENT_AUTH_SECRET is missing (copy .env.local into this checkout)");
  const context = await browser.newContext();
  await proxyConvexSocket(context, blocked);
  await allowStaticCatalog(context);
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/agent-login?token=${encodeURIComponent(token)}&next=/decks`, {
      timeout: 180_000,
    });
    await page.waitForURL((url) => !url.pathname.startsWith("/agent-login"), { timeout: 120_000 });
  } catch {
    // Playwright errors echo the URL, which contains the token.
    throw new Error(`Agent login did not complete (stuck on ${new URL(page.url()).pathname})`);
  }
  const state = await context.storageState();
  await context.close();
  return state;
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
 * callers can tell what state (e.g. the theme pin) the page was in when that image was taken.
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
    if (!next.png.equals(previous.png)) quietSince = Date.now();
    else if (Date.now() - quietSince >= QUIET_MS) return { ...next, stable: true };
    previous = next;
  }
  return { ...previous, stable: false };
}
