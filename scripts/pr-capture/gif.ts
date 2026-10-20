import fs from "node:fs";
import path from "node:path";
import gifenc from "gifenc";
import type { Page } from "playwright";
import sharp from "sharp";
import { runSteps } from "./browser.ts";
import type { Step } from "./shared.ts";

// gifenc ships CommonJS without named-export hints, so Node only exposes a default export.
const { GIFEncoder, applyPalette, quantize } = gifenc;

type Frame<T = undefined> = { png: Buffer; at: number; snapshot?: T };

/**
 * Screenshots the page in a loop while the steps run, so the GIF shows the real interaction.
 * `snapshot` runs just before each screenshot and is stored with that frame.
 */
export async function recordFrames<T = undefined>(page: Page, steps: Step[], snapshot?: () => T): Promise<Frame<T>[]> {
  const frames: Frame<T>[] = [];
  let recording = true;
  const loop = (async () => {
    while (recording) {
      const state = snapshot?.();
      frames.push({ png: await page.screenshot({ caret: "hide" }), at: Date.now(), snapshot: state });
    }
  })();
  try {
    await page.waitForTimeout(600);
    await runSteps(page, steps);
    await page.waitForTimeout(1200);
  } finally {
    recording = false;
    await loop;
  }
  return frames;
}

/** Encodes frames with gifenc (pure JS). Identical consecutive frames are merged into one delay. */
export async function writeGif(frames: Frame<unknown>[], file: string, width: number) {
  const gif = GIFEncoder();
  let pending: { rgba: Buffer; delay: number } | null = null;
  let size = { width: 0, height: 0 };
  const flush = () => {
    if (!pending) return;
    const palette = quantize(pending.rgba, 256);
    gif.writeFrame(applyPalette(pending.rgba, palette), size.width, size.height, {
      palette,
      delay: pending.delay,
    });
  };
  for (const [i, frame] of frames.entries()) {
    const delay = i + 1 < frames.length ? frames[i + 1].at - frame.at : 1500;
    const { data, info } = await sharp(frame.png)
      .resize({ width, withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    size = { width: info.width, height: info.height };
    if (pending && pending.rgba.equals(data)) {
      pending.delay += delay;
      continue;
    }
    flush();
    pending = { rgba: data, delay };
  }
  flush();
  gif.finish();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, gif.bytes());
}
