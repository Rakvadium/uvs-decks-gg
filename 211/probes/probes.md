# #211 probe harnesses

All of these live outside the worktree. None touch app code or Convex data.

## signout.spec.json

Login isolation: route 1 signs out through the user menu; routes 2 and 3 are later contexts.

```json
{
  "routes": [
    {
      "path": "/decks",
      "auth": "agent",
      "name": "1-signs-out",
      "viewports": ["desktop"],
      "steps": [
        { "click": "[data-slot=\"dropdown-menu-trigger\"]:has-text(\"agent\")" },
        { "click": "role=menuitem[name=\"Log out\"]" },
        { "wait": 3000 }
      ]
    },
    { "path": "/decks", "auth": "agent", "name": "2-next-context", "viewports": ["desktop"] },
    { "path": "/gallery", "auth": "agent", "name": "3-later-context", "viewports": ["desktop"] }
  ]
}
```

## twopages.ts

Two pages in one context: the shot page loses its subscription while a popup stays clean.

```ts
// Two pages in one capture context: the shot page (main) loses its session subscription while a
// popup it opened stays subscribed and rewritten. Run against the old (origin/dev) or new code:
//   node twopages.ts old|new <outdir>
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";

const which = process.argv[2] as "old" | "new";
const out = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const dir =
  which === "old"
    ? "C:/Projects/uvs-decks-gg-probes/211/old"
    : "C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a516ae22cfec2db0f/scripts/pr-capture";
const browserMod = await import(`file:///${dir}/browser.ts`);
const pinMod = await import(`file:///${dir}/pin.ts`);
process.loadEnvFile("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a516ae22cfec2db0f/.env.local");

const base = "http://localhost:8131";
const appearance = { theme: "aurora", mode: "light" as const, chrome: "expressive" };
const browser = await chromium.launch();
const blocked: string[] = [];
const login = which === "old" ? await browserMod.agentStorageState(browser, base, blocked) : await browserMod.agentLogin(browser, base, blocked);
const storageState = which === "old" ? login : login.storageState;
const created = await browserMod.newCaptureContext(browser, { viewport: "desktop", appearance, storageState, blocked, still: true });
const { context, pin } = created;
const page: Page = created.page ?? (await context.newPage());
const lines: string[] = [`# two-pages probe (${which} code)`, ""];
const record = async (step: string, shot: Page) => {
  const report = pin.report();
  const still = pinMod.stillPin(report, true, appearance);
  const file = `${step}.png`;
  fs.writeFileSync(path.join(out, file), await shot.screenshot());
  lines.push(`## ${step}`, "", `- report: \`${JSON.stringify({ patched: report.patched, problems: report.problems })}\``, `- stillPin flagged: **${still.flagged}**`, `- image: ${file}`, "");
  console.log(step, JSON.stringify({ patched: report.patched, problems: report.problems }), "flagged=", still.flagged);
};

await page.goto(base + "/decks");
await browserMod.settle(page);
await page.waitForTimeout(1500);
await record("1-main-only", page);

const popupPromise = context.waitForEvent("page");
await page.evaluate(() => window.open("/decks"));
const popup: Page = await popupPromise;
await popup.waitForLoadState();
await browserMod.settle(popup);
await popup.waitForTimeout(1500);
await record("2-main-plus-popup", page);

// The main page leaves the app for a same-origin test page with no Convex client, so its socket
// closes and nothing re-subscribes. The popup stays signed in, subscribed and rewritten.
await page.route(`${base}/__probe-no-app`, (route) =>
  route.fulfill({ contentType: "text/html", body: "<!doctype html><title>probe</title><h1>Main page: no Convex client here</h1>" }),
);
await page.goto(`${base}/__probe-no-app`);
await page.waitForTimeout(2500);
await record("3-main-lost-subscription-popup-still-clean", page);
fs.writeFileSync(path.join(out, "3b-popup-at-that-moment.png"), await popup.screenshot());

lines.push(`Blocked writes: ${blocked.length}`);
fs.writeFileSync(path.join(out, "probe.md"), lines.join("\n"));
await browser.close();
```

## revproxy.mjs

Test-only reverse proxy on 8132 that injects a worker into the proxied HTML (app code untouched).

```js
// Test-only reverse proxy on 8132 in front of `next dev` on 8131, so the real capture CLI can be
// pointed at a page that also runs a worker opening a Convex-shaped sync socket. The app code is
// untouched: the worker script is injected into the proxied HTML.
//
//   node revproxy.mjs <mode>    mode = dedicated | shared | service | none
//
// - Sync-path WebSocket upgrades (/api/<x>/sync) are accepted here and never answered, so nothing
//   from the probe worker reaches Convex. Every other upgrade (Next HMR) is piped to 8131.
// - HTML responses get one <script> that starts the chosen worker; the worker opens
//   ws://127.0.0.1:8132/api/probe-<mode>/sync and sends one Connect frame, like a Convex client.
import crypto from "node:crypto";
import http from "node:http";
import net from "node:net";

const mode = process.argv[2] ?? "dedicated";
const UPSTREAM = 8131;
const PORT = 8132;
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

const workerBody = (kind) => `
  const ws = new WebSocket("ws://127.0.0.1:${PORT}/api/probe-${kind}/sync");
  ws.onopen = () => ws.send(JSON.stringify({ type: "Connect", sessionId: crypto.randomUUID(), connectionCount: 0, lastCloseReason: null }));
`;
const files = {
  "/__probe/dedicated.js": workerBody("dedicated"),
  "/__probe/shared.js": `${workerBody("shared")}\nonconnect = () => {};`,
  "/__probe/sw.js": `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => { ${workerBody("service")} });`,
};
const inject = {
  dedicated: `<script>new Worker("/__probe/dedicated.js")</script>`,
  shared: `<script>new SharedWorker("/__probe/shared.js")</script>`,
  service: `<script>navigator.serviceWorker && navigator.serviceWorker.register("/__probe/sw.js", { scope: "/__probe/" })</script>`,
  none: "",
}[mode];

const server = http.createServer((req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  if (files[path] !== undefined) {
    res.writeHead(200, { "content-type": "text/javascript", "service-worker-allowed": "/" }).end(files[path]);
    return;
  }
  const headers = { ...req.headers };
  delete headers["accept-encoding"];
  const upstream = http.request({ host: "127.0.0.1", port: UPSTREAM, method: req.method, path: req.url, headers }, (up) => {
    const html = (up.headers["content-type"] ?? "").includes("text/html");
    if (!html || !inject) {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
      return;
    }
    const chunks = [];
    up.on("data", (c) => chunks.push(c));
    up.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8").replace("</head>", `${inject}</head>`);
      const out = { ...up.headers };
      delete out["content-length"];
      delete out["transfer-encoding"];
      res.writeHead(up.statusCode ?? 502, out);
      res.end(body);
      log("injected", mode, "into", req.url.replace(/token=[^&]+/, "token=<redacted>"));
    });
  });
  upstream.on("error", () => res.writeHead(502).end());
  req.pipe(upstream);
});

server.on("upgrade", (req, socket, head) => {
  if (/^\/api\/[^/]+\/sync$/.test(new URL(req.url, "http://x").pathname)) {
    const accept = crypto.createHash("sha1").update(req.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    socket.on("error", () => {});
    log("probe sync socket accepted", req.url);
    return;
  }
  const up = net.connect(UPSTREAM, "127.0.0.1", () => {
    up.write(`${req.method} ${req.url} HTTP/1.1\r\n${Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n")}\r\n\r\n`);
    if (head?.length) up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, "127.0.0.1", () => log(`revproxy ${mode} on ${PORT} -> ${UPSTREAM}`));
```

## run-worker-modes.mjs

Runs the real capture CLI with --strict against revproxy.mjs in each mode.

```js
// For each mode: start revproxy.mjs <mode> on 8132, run the real capture CLI against it with --strict, stop the proxy.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

const WT = "C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a516ae22cfec2db0f";
const HERE = "C:/Projects/uvs-decks-gg-probes/211";
for (const mode of process.argv.slice(2)) {
  const proxyLog = fs.openSync(`${HERE}/revproxy-${mode}.log`, "w");
  const proxy = spawn(process.execPath, [`${HERE}/revproxy.mjs`, mode], { stdio: ["ignore", proxyLog, proxyLog] });
  await new Promise((r) => setTimeout(r, 1500));
  const run = spawnSync(
    process.execPath,
    [
      "--disable-warning=ExperimentalWarning",
      "scripts/pr-capture/capture.ts",
      "--issue", "211", "--label", `worker-${mode}`, "--port", "8132",
      "--routes", "decks,guest:gallery", "--viewports", "desktop", "--themes", "default", "--modes", "dark", "--strict",
    ],
    { cwd: WT, encoding: "utf8" },
  );
  fs.writeFileSync(`${HERE}/worker-${mode}.log`, `${run.stdout}${run.stderr}exit=${run.status}\n`);
  console.log(`=== ${mode}: exit ${run.status}\n${run.stdout}${run.stderr}`);
  proxy.kill();
  await new Promise((r) => setTimeout(r, 1000));
}
```

## discover.mjs

Which Playwright signals see page / dedicated / shared / service worker sockets.

```js
// Which Playwright signals see WebSockets from page / dedicated / shared / service workers,
// with a context.routeWebSocket on the sync pattern (as the capture tool installs)?
import { createRequire } from "node:module";
import { startProbeServer } from "./ws-server.mjs";
const require = createRequire("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a516ae22cfec2db0f/package.json");
const { chromium } = require("playwright");

const server = await startProbeServer();
const browser = await chromium.launch();
const context = await browser.newContext();
const routed = [];
await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
  routed.push(ws.url());
  ws.connectToServer();
});
const seen = [];
context.on("page", (p) => p.on("websocket", (ws) => seen.push(`page:${ws.url()}`)));
context.on("serviceworker", (w) => seen.push(`serviceworker-event:${w.url()}`));
const page = await context.newPage();
page.on("worker", (w) => seen.push(`worker-event:${w.url()}`));
await page.goto("http://127.0.0.1:8132/");
await page.evaluate(() => {
  new WebSocket("ws://127.0.0.1:8132/api/page/sync");
  new Worker("/worker.js");
  new SharedWorker("/shared.js");
  return navigator.serviceWorker.register("/sw.js").then(() => "ok");
});
await page.waitForTimeout(3000);
console.log(JSON.stringify({ routed, seen }, null, 2));
await browser.close();
await server.close();
```

## discover2.mjs

Nested and popup worker sockets, page-vs-context route precedence.

```js
// Nested worker sockets, popup worker sockets, page-vs-context route precedence, and whether
// context "page" fires before newPage() resolves.
import { createRequire } from "node:module";
import { startProbeServer } from "./ws-server.mjs";
const require = createRequire("C:/Projects/uvs-decks-gg/.claude/worktrees/agent-a516ae22cfec2db0f/package.json");
const { chromium } = require("playwright");

const server = await startProbeServer(8132, {
  "/nest.js": `new Worker("/worker.js");`,
});
const browser = await chromium.launch();
const context = await browser.newContext();
const routed = [];
await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
  routed.push(`context:${ws.url()}`);
  ws.connectToServer();
});
const seen = [];
let pageEventBeforeResolve = false;
let created = null;
context.on("page", (p) => {
  if (!created) pageEventBeforeResolve = true;
  p.on("websocket", (ws) => seen.push(`page${p === created ? "(main)" : ""}:${ws.url()}`));
});
const page = await context.newPage();
created = page;
await page.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
  routed.push(`main-page:${ws.url()}`);
  ws.connectToServer();
});
await page.goto("http://127.0.0.1:8132/");
const popupPromise = context.waitForEvent("page");
await page.evaluate(() => {
  new WebSocket("ws://127.0.0.1:8132/api/page/sync");
  new Worker("/nest.js");
  window.open("http://127.0.0.1:8132/");
});
const popup = await popupPromise;
await popup.waitForLoadState();
await popup.evaluate(() => {
  new WebSocket("ws://127.0.0.1:8132/api/popup/sync");
  new Worker("/worker.js");
});
await page.waitForTimeout(3000);
console.log(JSON.stringify({ pageEventBeforeResolve, routed, seen }, null, 2));
await browser.close();
await server.close();
```

## discover output

```json
{
  "routed": [
    "ws://127.0.0.1:8132/api/page/sync"
  ],
  "seen": [
    "serviceworker-event:http://127.0.0.1:8132/sw.js",
    "worker-event:http://127.0.0.1:8132/worker.js",
    "page:ws://127.0.0.1:8132/api/page/sync",
    "page:ws://127.0.0.1:8132/api/dedicated/sync"
  ]
}
```

## discover2 output

```json
{
  "pageEventBeforeResolve": true,
  "routed": [
    "main-page:ws://127.0.0.1:8132/api/page/sync",
    "context:ws://127.0.0.1:8132/api/popup/sync"
  ],
  "seen": [
    "page(main):ws://127.0.0.1:8132/api/page/sync",
    "page(main):ws://127.0.0.1:8132/api/dedicated/sync",
    "page:ws://127.0.0.1:8132/api/popup/sync",
    "page:ws://127.0.0.1:8132/api/dedicated/sync"
  ]
}
```

