import { converter } from "culori";

const toHsv = converter("hsv");

const BLOCK_REGION = { x: 0.84, y: 0.04, w: 0.12, h: 0.08 };
const ATTACK_REGION = { x: 0.84, y: 0.46, w: 0.12, h: 0.08 };
const SYMBOL_STRIP = { x: 0.02, y: 0.86, w: 0.55, h: 0.1 };

type Zone = "high" | "mid" | "low";

export type CardRegionAnalysis = {
  attackZone?: Zone;
  blockZone?: Zone;
  symbolStripImageUrl?: string;
};

export async function analyzeCardRegions(imageUrl: string): Promise<CardRegionAnalysis> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch card image (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("Could not decode card image for region analysis"));
      element.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not analyze card image regions");
    ctx.drawImage(image, 0, 0);

    const block = readRegion(ctx, canvas.width, canvas.height, BLOCK_REGION);
    const attack = readRegion(ctx, canvas.width, canvas.height, ATTACK_REGION);
    const strip = readRegion(ctx, canvas.width, canvas.height, SYMBOL_STRIP);

    const blockZone = majorityZone(block.imageData);
    const attackZone = majorityZone(attack.imageData);
    const symbolStripImageUrl = cropSymbolStripDataUrl(canvas, strip);

    return {
      ...(attackZone ? { attackZone } : {}),
      ...(blockZone ? { blockZone } : {}),
      ...(symbolStripImageUrl ? { symbolStripImageUrl } : {}),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function readRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  region: { x: number; y: number; w: number; h: number }
) {
  const left = Math.max(0, Math.min(width - 1, Math.round(width * region.x)));
  const top = Math.max(0, Math.min(height - 1, Math.round(height * region.y)));
  const extractWidth = Math.max(1, Math.min(width - left, Math.round(width * region.w)));
  const extractHeight = Math.max(1, Math.min(height - top, Math.round(height * region.h)));
  return {
    left,
    top,
    width: extractWidth,
    height: extractHeight,
    imageData: ctx.getImageData(left, top, extractWidth, extractHeight),
  };
}

function classifyZoneHue(h: number | undefined, s: number, v: number): Zone | null {
  if (h === undefined || s < 0.35 || v < 0.2) return null;
  if (h <= 18 || h >= 345) return "high";
  if (h > 18 && h <= 42) return "mid";
  if (h > 42 && h <= 75) return "low";
  return null;
}

function majorityZone(imageData: ImageData): Zone | undefined {
  const counts = { high: 0, mid: 0, low: 0 };
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 128) continue;
    const hsv = toHsv({
      mode: "rgb",
      r: (data[i] ?? 0) / 255,
      g: (data[i + 1] ?? 0) / 255,
      b: (data[i + 2] ?? 0) / 255,
    });
    if (!hsv) continue;
    const zone = classifyZoneHue(hsv.h, hsv.s ?? 0, hsv.v ?? 0);
    if (zone) counts[zone] += 1;
  }
  const total = counts.high + counts.mid + counts.low;
  if (total < 40) return undefined;
  const ranked = (Object.entries(counts) as Array<[Zone, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  const winnerEntry = ranked[0];
  if (!winnerEntry) return undefined;
  const [winner, winnerCount] = winnerEntry;
  if (winnerCount / total < 0.4) return undefined;
  return winner;
}

function findSeparatorX(imageData: ImageData): number {
  const { width, height, data } = imageData;
  const nearWhite = new Array<number>(width).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      if (r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
        nearWhite[x] = (nearWhite[x] ?? 0) + 1;
      }
    }
  }

  let best: { x: number; score: number } | null = null;
  const minHits = Math.max(4, Math.floor(height * 0.22));
  for (let x = 8; x < width - 8; x++) {
    const hits = nearWhite[x] ?? 0;
    if (hits < minHits) continue;
    const neighbor = ((nearWhite[x - 4] ?? 0) + (nearWhite[x + 4] ?? 0)) / 2;
    const score = hits - neighbor;
    if (!best || score > best.score) best = { x, score };
  }
  if (best) return best.x;
  return Math.round(width * 0.34);
}

function cropSymbolStripDataUrl(
  sourceCanvas: HTMLCanvasElement,
  strip: { left: number; top: number; width: number; height: number; imageData: ImageData }
): string | undefined {
  const separatorX = findSeparatorX(strip.imageData);
  const rightLeft = Math.min(strip.width - 8, separatorX + 3);
  const rightWidth = strip.width - rightLeft;
  if (rightWidth < 12) return undefined;

  const crop = document.createElement("canvas");
  crop.width = rightWidth;
  crop.height = strip.height;
  const cropCtx = crop.getContext("2d");
  if (!cropCtx) return undefined;
  cropCtx.drawImage(
    sourceCanvas,
    strip.left + rightLeft,
    strip.top,
    rightWidth,
    strip.height,
    0,
    0,
    rightWidth,
    strip.height
  );
  return crop.toDataURL("image/png");
}
