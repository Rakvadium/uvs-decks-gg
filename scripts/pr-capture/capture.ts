import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import { chromium, type Browser } from "playwright";
import {
  HIDE_DEV_OVERLAY_CSS,
  agentStorageState,
  newCaptureContext,
  runSteps,
  settle,
  stableScreenshot,
} from "./browser.ts";
import { recordFrames, writeGif } from "./gif.ts";
import { BREAK_PIN_ENV, appearanceKey, pinFlagged, type Appearance, type PinReport } from "./pin.ts";
import {
  OUTPUT_ROOT,
  VIEWPORTS,
  list,
  parseArgs,
  parseRouteList,
  requireIssue,
  requireLabel,
  shotName,
  type CaptureSpec,
  type Mode,
  type RouteSpec,
} from "./shared.ts";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = parseArgs(process.argv.slice(2));
const issue = requireIssue(args);
const label = requireLabel(args.label, "--label");
const port = Number(args.port);
if (!Number.isInteger(port) || port <= 0) throw new Error("--port <number> is required");

const spec: CaptureSpec =
  typeof args.spec === "string"
    ? JSON.parse(fs.readFileSync(args.spec, "utf8"))
    : { routes: parseRouteList(typeof args.routes === "string" ? args.routes : "/gallery,/decks,guest:/gallery") };
const viewports = list(args.viewports, ["desktop", "mobile"]);
const themes = list(args.themes, ["default"]);
const modes = list(args.modes, ["light", "dark"]) as Mode[];
const chrome = typeof args.chrome === "string" ? args.chrome : "calm";
const fullPage = args["full-page"] === true;
const stills = args["skip-stills"] !== true;
const gifWidth = Number(args["gif-width"] ?? 960);
const strict = args.strict === true;
if (process.env[BREAK_PIN_ENV] === "1") console.warn(`${BREAK_PIN_ENV}=1: the session rewrite is deliberately broken (test only).`);

if ((chrome !== "calm" || themes.some((t) => t !== "default")) && spec.routes.some((r) => r.auth === "guest")) {
  console.warn(
    "Note: signed-out pages have no session to rewrite, so their JS-driven UI uses chrome `calm` and preset " +
      "`default` (CSS still follows the pin; mode follows colorScheme emulation).",
  );
}
for (const v of viewports) if (!VIEWPORTS[v]) throw new Error(`Unknown viewport: ${v}`);
for (const m of modes) if (m !== "light" && m !== "dark") throw new Error(`Unknown mode: ${m}`);
if (args.gif === true && !spec.gif) throw new Error("--gif needs a `gif` entry in the --spec JSON");

const outDir = path.join(OUTPUT_ROOT, issue, label);
const baseUrl = `http://localhost:${port}`;

function portOpen(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

/** Reuses whatever already listens on --port, otherwise starts `next dev -p <port>` (never Convex). */
async function ensureServer(): Promise<ChildProcess | null> {
  if (await portOpen()) {
    console.log(`Reusing server on ${baseUrl}`);
    return null;
  }
  const logFile = path.join(outDir, "next-dev.log");
  console.log(`Starting next dev on ${baseUrl} (log: ${logFile})`);
  const log = fs.createWriteStream(logFile);
  const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [next, "dev", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  let ready = false;
  let lockBusy = false;
  for (const stream of [child.stdout, child.stderr]) {
    readline.createInterface({ input: stream }).on("line", (line) => {
      // Next logs request URLs, and /agent-login carries AGENT_AUTH_SECRET.
      log.write(`${line.replace(/token=[^&\s]+/g, "token=<redacted>")}\n`);
      if (/Ready in/.test(line)) ready = true;
      if (/Unable to acquire lock/.test(line)) lockBusy = true;
    });
  }
  for (let waited = 0; waited < 180_000; waited += 500) {
    if (ready && (await portOpen())) return child;
    if (child.exitCode !== null) {
      throw new Error(
        lockBusy
          ? "next dev refused to start: another `next dev` already holds .next/dev/lock in this checkout. " +
              "Use one checkout/worktree per concurrent run, or pass that run's --port to reuse its server."
          : `next dev exited early (code ${child.exitCode}); see ${logFile}`,
      );
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`next dev was not ready on port ${port} within 180s`);
}

type ShotPin = PinReport & { pinned: string; overridden: boolean; flagged: boolean };

/**
 * Signed-in shots only. `snapshots` are pin reports taken at screenshot time (the still, or the
 * GIF's first and last frame), so a session result that arrives after the image doesn't count.
 */
function shotPin(snapshots: (PinReport | undefined)[], auth: RouteSpec["auth"], appearance: Appearance): ShotPin | null {
  if (auth !== "agent") return null;
  const taken = snapshots.filter((report): report is PinReport => report !== undefined);
  const problems = [...new Set(taken.flatMap((report) => report.problems))];
  if (!taken.length) problems.push("no pin snapshot was taken (no frame captured)");
  const saved = taken.findLast((report) => report.saved)?.saved ?? null;
  const patched = taken.length > 0 && taken.every((report) => report.patched);
  const pinned = appearanceKey(appearance);
  const report = { saved, patched, problems };
  return { ...report, pinned, overridden: patched && saved !== pinned, flagged: pinFlagged(report) };
}

function warnPin(pin: ShotPin | null) {
  if (pin?.problems.length) console.warn(`    WARNING: JS theme pin may not apply: ${pin.problems.join("; ")}`);
}

function stopServer(child: ChildProcess | null) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  else process.kill(-child.pid, "SIGTERM");
}

async function captureStill(
  browser: Browser,
  route: RouteSpec,
  viewport: string,
  appearance: Appearance,
  storageState: Awaited<ReturnType<typeof agentStorageState>> | undefined,
  blocked: string[],
) {
  const name = shotName(route, viewport, appearance.theme, appearance.mode);
  const { context, pin } = await newCaptureContext(browser, {
    viewport,
    appearance,
    storageState: route.auth === "agent" ? storageState : undefined,
    blocked,
    still: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(baseUrl + route.path, { timeout: 180_000 });
    await settle(page);
    await runSteps(page, route.steps);
    const loaded = await settle(page);
    const { png, stable, at } = await stableScreenshot(page, fullPage, route.auth === "agent" ? pin.report : undefined);
    fs.writeFileSync(path.join(outDir, `${name}.png`), png);
    const finalPath = new URL(page.url()).pathname;
    const notes = [
      !loaded && "loaders still visible",
      !stable && "not visually stable",
      finalPath !== route.path && `landed on ${finalPath}`,
    ].filter(Boolean);
    console.log(`  ${name}.png${notes.length ? `  (${notes.join("; ")})` : ""}`);
    const report = shotPin([at], route.auth, appearance);
    warnPin(report);
    return { name, route: route.path, auth: route.auth, appearance, finalPath, loaded, stable, pin: report };
  } finally {
    await context.close();
  }
}

async function captureGif(
  browser: Browser,
  storageState: Awaited<ReturnType<typeof agentStorageState>> | undefined,
  blocked: string[],
) {
  const gif = spec.gif!;
  const viewport = gif.viewport ?? "desktop";
  const appearance = { theme: gif.theme ?? themes[0], mode: gif.mode ?? modes[0], chrome };
  const name = shotName(gif, viewport, appearance.theme, appearance.mode);
  const videoDir = path.join(outDir, ".video-tmp");
  const { context, pin } = await newCaptureContext(browser, {
    viewport,
    appearance,
    storageState: gif.auth === "agent" ? storageState : undefined,
    blocked,
    still: false,
    videoDir,
  });
  const page = await context.newPage();
  let frames: Awaited<ReturnType<typeof recordFrames<PinReport>>> = [];
  try {
    await page.goto(baseUrl + gif.path, { timeout: 180_000 });
    await settle(page);
    await page.addStyleTag({ content: HIDE_DEV_OVERLAY_CSS });
    frames = await recordFrames(page, gif.steps ?? [], gif.auth === "agent" ? pin.report : undefined);
  } finally {
    await context.close();
  }
  const gifPin = shotPin([frames[0]?.snapshot, frames.at(-1)?.snapshot], gif.auth, appearance);
  await page.video()?.saveAs(path.join(outDir, `${name}.webm`));
  fs.rmSync(videoDir, { recursive: true, force: true });
  await writeGif(frames, path.join(outDir, `${name}.gif`), gifWidth);
  console.log(`  ${name}.gif (${frames.length} frames) + ${name}.webm`);
  warnPin(gifPin);
  return { name, auth: gif.auth, appearance, frames: frames.length, pin: gifPin };
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const server = await ensureServer();
  process.once("SIGINT", () => {
    stopServer(server);
    process.exit(130);
  });

  const blocked: string[] = [];
  const shots: Awaited<ReturnType<typeof captureStill>>[] = [];
  let gifShot: Awaited<ReturnType<typeof captureGif>> | undefined;
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
    const needsAgent = [...(stills ? spec.routes : []), ...(spec.gif && args.gif ? [spec.gif] : [])].some(
      (route) => route.auth === "agent",
    );
    const storageState = needsAgent ? await agentStorageState(browser, baseUrl, blocked) : undefined;

    if (stills) {
      console.log(`Capturing #${issue} "${label}" → ${outDir}`);
      for (const route of spec.routes)
        for (const viewport of route.viewports ?? viewports)
          for (const theme of themes)
            for (const mode of modes)
              shots.push(await captureStill(browser, route, viewport, { theme, mode, chrome }, storageState, blocked));
    }
    if (args.gif === true) gifShot = await captureGif(browser, storageState, blocked);
  } finally {
    await browser?.close();
    stopServer(server);
  }

  const signedIn = [...shots, ...(gifShot ? [gifShot] : [])].flatMap((shot) => (shot.pin ? [{ ...shot, pin: shot.pin }] : []));
  const savedAppearance = [...new Set(signedIn.flatMap((shot) => (shot.pin.saved ? [shot.pin.saved] : [])))];
  const flagged = signedIn.filter((shot) => shot.pin.flagged).map((shot) => shot.name);

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(
      {
        issue,
        label,
        port,
        chrome,
        fullPage,
        strict,
        shots,
        gif: gifShot ?? null,
        blockedConvexWrites: blocked,
        savedAppearance,
        pinFlagged: flagged,
      },
      null,
      2,
    ),
  );
  const counts = new Map<string, number>();
  for (const write of blocked) counts.set(write, (counts.get(write) ?? 0) + 1);
  const summary = [...counts].map(([write, n]) => `${write} ×${n}`).join(", ");
  console.log(`Done: ${shots.length} stills. Blocked Convex writes: ${summary || "none"}`);
  if (signedIn.length) {
    const patched = signedIn.filter((shot) => shot.pin.patched).length;
    const overridden = signedIn.filter((shot) => shot.pin.overridden).length;
    console.log(
      `Agent's saved appearance (preset/mode/chrome): ${savedAppearance.join(", ") || "unknown"}. ` +
        `Session result rewritten in ${patched}/${signedIn.length} signed-in shots (${overridden} differ from saved).`,
    );
  }
  if (flagged.length) {
    console.warn(
      `WARNING: ${flagged.length} signed-in shot(s) may show the agent's saved theme or the app defaults in JS-driven UI ` +
        `(menus, toasts, neon forks) instead of the pin: ${flagged.join(", ")}. See \`pin.problems\` in manifest.json.`,
    );
    if (strict) throw new Error("--strict: failing because the JS theme pin did not apply to every signed-in shot.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
