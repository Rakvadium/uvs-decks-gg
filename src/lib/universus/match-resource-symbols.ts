export type Rgba = {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
};

export type ResourceSymbolTemplate = {
  id: string;
  pixels: Float32Array;
};

type IconBox = { x: number; y: number; width: number; height: number };

export const RESOURCE_SYMBOL_TEMPLATE_SIZE = 48;
export const RESOURCE_SYMBOL_NAMES = [
  "air",
  "all",
  "chaos",
  "death",
  "earth",
  "evil",
  "fire",
  "good",
  "life",
  "order",
  "void",
  "water",
  "infinity",
] as const;

function crop(src: Rgba, x: number, y: number, w: number, h: number): Rgba {
  const left = Math.max(0, Math.min(src.width - 1, Math.round(x)));
  const top = Math.max(0, Math.min(src.height - 1, Math.round(y)));
  const width = Math.max(1, Math.min(src.width - left, Math.round(w)));
  const height = Math.max(1, Math.min(src.height - top, Math.round(h)));
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    const srcStart = ((top + row) * src.width + left) * 4;
    data.set(src.data.subarray(srcStart, srcStart + width * 4), row * width * 4);
  }
  return { width, height, data };
}

function isWhiteRim(r: number, g: number, b: number, a: number): boolean {
  if (a < 80) return false;
  return r > 188 && g > 188 && b > 188 && Math.abs(r - g) < 32 && Math.abs(g - b) < 32;
}

function isCyanGlow(r: number, g: number, b: number, a: number): boolean {
  if (a < 80) return false;
  const avg = (g + b) / 2;
  return avg > 160 && r < 200 && b > 130 && g > 120 && avg > r + 15 && Math.abs(b - g) < 60;
}

type Predicate = (r: number, g: number, b: number, a: number) => boolean;

type Component = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

function components(img: Rgba, pred: Predicate): Component[] {
  const seen = new Uint8Array(img.width * img.height);
  const comps: Component[] = [];
  const stack: number[] = [];
  const at = (x: number, y: number) => y * img.width + x;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const p = at(x, y);
      if (seen[p] === 1) continue;
      const i = p * 4;
      if (!pred(img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0, img.data[i + 3] ?? 0)) {
        seen[p] = 1;
        continue;
      }
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      stack.push(p);
      seen[p] = 1;
      while (stack.length > 0) {
        const q = stack.pop() ?? 0;
        const qx = q % img.width;
        const qy = Math.floor(q / img.width);
        if (qx < minX) minX = qx;
        if (qx > maxX) maxX = qx;
        if (qy < minY) minY = qy;
        if (qy > maxY) maxY = qy;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = qx + dx;
            const ny = qy + dy;
            if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
            const np = at(nx, ny);
            if (seen[np] === 1) continue;
            const ni = np * 4;
            if (!pred(img.data[ni] ?? 0, img.data[ni + 1] ?? 0, img.data[ni + 2] ?? 0, img.data[ni + 3] ?? 0)) {
              seen[np] = 1;
              continue;
            }
            seen[np] = 1;
            stack.push(np);
          }
        }
      }
      comps.push({ minX, maxX, minY, maxY });
    }
  }
  return comps;
}

function separatorAndCutoff(img: Rgba, comps: Component[]): number {
  const { width, height, data } = img;
  const y0 = Math.round(height * 0.32);
  const y1 = Math.round(height * 0.88);
  const x0 = Math.round(width * 0.21);
  const x1 = Math.round(width * 0.295);
  const col = new Array<number>(width).fill(0);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (isWhiteRim(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0, data[i + 3] ?? 0)) {
        col[x] = (col[x] ?? 0) + 1;
      }
    }
  }
  const minHits = Math.max(6, Math.floor((y1 - y0) * 0.18));
  let best: { x: number; score: number } | null = null;
  for (let x = x0 + 2; x < x1 - 2; x++) {
    const hits = col[x] ?? 0;
    if (hits < minHits) continue;
    const neighbor = ((col[x - 3] ?? 0) + (col[x + 3] ?? 0)) / 2;
    const score = hits - neighbor;
    if (!best || score > best.score) best = { x, score };
  }
  if (best) return best.x;
  const logo = bestLogo(comps, Math.round(width * 0.32), height);
  if (logo) return Math.min(Math.round(width * 0.34), logo.maxX + Math.round((logo.maxX - logo.minX + 1) * 0.28));
  return Math.round(width * 0.27);
}

function boxesFromComponents(img: Rgba, comps: Component[], separatorX: number): IconBox[] {
  const stripH = img.height;
  const icons: IconBox[] = [];
  for (const comp of comps) {
    const width = comp.maxX - comp.minX + 1;
    const height = comp.maxY - comp.minY + 1;
    if (comp.minX <= separatorX) continue;
    if (width < stripH * 0.22 || height < stripH * 0.22) continue;
    if (width > stripH * 0.55 || height > stripH * 0.55) continue;
    const ratio = width / height;
    if (ratio < 0.72 || ratio > 1.38) continue;
    icons.push({ x: comp.minX, y: comp.minY, width, height });
  }
  icons.sort((a, b) => a.x - b.x);
  const merged: IconBox[] = [];
  for (const icon of icons) {
    const prev = merged[merged.length - 1];
    if (prev && icon.x < prev.x + prev.width * 0.55) {
      if (icon.width * icon.height > prev.width * prev.height) {
        merged[merged.length - 1] = icon;
      }
      continue;
    }
    merged.push(icon);
  }
  if (merged.length <= 1) return merged;
  const ys = merged.map((icon) => icon.y + icon.height / 2).sort((a, b) => a - b);
  const midY = ys[Math.floor(ys.length / 2)] ?? 0;
  return merged.filter((icon) => Math.abs(icon.y + icon.height / 2 - midY) <= stripH * 0.22);
}

function isBrightWash(img: Rgba): boolean {
  const cx = (img.width - 1) / 2;
  const cy = (img.height - 1) / 2;
  const radius = Math.min(img.width, img.height) * 0.32;
  let total = 0;
  let bright = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > radius * radius) continue;
      const i = (y * img.width + x) * 4;
      const luma = 0.2126 * (img.data[i] ?? 0) + 0.7152 * (img.data[i + 1] ?? 0) + 0.0722 * (img.data[i + 2] ?? 0);
      total += 1;
      if (luma > 175) bright += 1;
    }
  }
  return total > 0 && bright / total > 0.58;
}

function overlaps(a: IconBox, b: IconBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function iconBounds(img: Rgba): IconBox[] {
  const stripH = img.height;
  const white = components(img, isWhiteRim);
  const separatorX = separatorAndCutoff(img, white);
  const logo = bestLogo(white, separatorX, stripH);
  const rowY = logo?.minY ?? Math.round(stripH * 0.32);
  const rowH = logo ? logo.maxY - logo.minY + 1 : Math.round(stripH * 0.45);
  const rowBottom = rowY + rowH;
  const inRow = (comp: Component) => {
    const overlap = Math.min(comp.maxY, rowBottom) - Math.max(comp.minY, rowY) + 1;
    const height = comp.maxY - comp.minY + 1;
    return overlap > height * 0.45;
  };
  const fromWhite = boxesFromComponents(
    img,
    white.filter((comp) => comp.minX >= separatorX + 6 && inRow(comp)),
    -1,
  );
  const cyan = components(img, isCyanGlow);
  const fromCyan = boxesFromComponents(
    img,
    cyan.filter((comp) => comp.minX >= separatorX + 6 && inRow(comp)),
    -1,
  ).filter((box) => !fromWhite.some((existing) => overlaps(existing, box)));
  return [...fromWhite, ...fromCyan]
    .sort((a, b) => a.x - b.x)
    .filter((box) => !isBrightWash(crop(img, box.x, box.y, box.width, box.height)));
}

function bestLogo(comps: Component[], separatorX: number, stripH: number): Component | null {
  let best: { comp: Component; score: number } | null = null;
  for (const comp of comps) {
    if (comp.maxX >= separatorX) continue;
    const width = comp.maxX - comp.minX + 1;
    const height = comp.maxY - comp.minY + 1;
    if (width < stripH * 0.22 || height < stripH * 0.22) continue;
    if (width > stripH * 0.6 || height > stripH * 0.6) continue;
    const ratio = width / height;
    if (ratio < 0.72 || ratio > 1.38) continue;
    const cy = (comp.minY + comp.maxY) / 2;
    if (cy < stripH * 0.28 || cy > stripH * 0.78) continue;
    const score = width * height - comp.minX * 6 - Math.abs(cy - stripH * 0.55) * 12;
    if (!best || score > best.score) best = { comp, score };
  }
  return best?.comp ?? null;
}

function findSymbolStrip(card: Rgba): Rgba {
  const height = Math.max(28, Math.round(card.height * 0.1));
  const y = Math.max(0, card.height - height - Math.round(card.height * 0.004));
  const width = Math.round(card.width * 0.5);
  return crop(card, 0, y, width, height);
}

export function symbolTemplateVector(img: Rgba, size = RESOURCE_SYMBOL_TEMPLATE_SIZE): Float32Array {
  const out = new Float32Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.min(img.width - 1, Math.floor((x + 0.5) * img.width / size));
      const sy = Math.min(img.height - 1, Math.floor((y + 0.5) * img.height / size));
      const i = (sy * img.width + sx) * 4;
      const o = (y * size + x) * 3;
      out[o] = (img.data[i] ?? 0) / 255;
      out[o + 1] = (img.data[i + 1] ?? 0) / 255;
      out[o + 2] = (img.data[i + 2] ?? 0) / 255;
    }
  }
  return out;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

function medianChannel(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const high = sorted[mid] ?? 0;
  if (sorted.length % 2 === 1) return high;
  return ((sorted[mid - 1] ?? 0) + high) / 2;
}

function medianColor(pixels: Array<{ r: number; g: number; b: number }>): { r: number; g: number; b: number } {
  return {
    r: medianChannel(pixels.map((pixel) => pixel.r)),
    g: medianChannel(pixels.map((pixel) => pixel.g)),
    b: medianChannel(pixels.map((pixel) => pixel.b)),
  };
}

function inferBackground(img: Rgba): { r: number; g: number; b: number } {
  const dark: Array<{ r: number; g: number; b: number }> = [];
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i] ?? 0;
    const g = img.data[i + 1] ?? 0;
    const b = img.data[i + 2] ?? 0;
    const a = img.data[i + 3] ?? 0;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (a < 80 || luma < 40) dark.push({ r, g, b });
  }
  if (dark.length < 8) return { r: 0, g: 0, b: 0 };
  return medianColor(dark);
}

function sampleAroundBox(strip: Rgba, box: IconBox): { r: number; g: number; b: number } {
  const pad = Math.max(3, Math.round(Math.min(box.width, box.height) * 0.18));
  const samples: Array<{ r: number; g: number; b: number }> = [];
  const takeBand = (y0: number, y1: number) => {
    for (let y = y0; y < y1; y++) {
      if (y < 0 || y >= strip.height) continue;
      for (let x = box.x; x < box.x + box.width; x++) {
        if (x < 0 || x >= strip.width) continue;
        const i = (y * strip.width + x) * 4;
        if ((strip.data[i + 3] ?? 0) < 80) continue;
        const r = strip.data[i] ?? 0;
        const g = strip.data[i + 1] ?? 0;
        const b = strip.data[i + 2] ?? 0;
        if (Math.max(r, g, b) - Math.min(r, g, b) > 24) continue;
        samples.push({ r, g, b });
      }
    }
  };
  takeBand(box.y + box.height, box.y + box.height + pad);
  if (samples.length < 12) takeBand(box.y - pad, box.y);
  if (samples.length < 8) return inferBackground(crop(strip, box.x, box.y, box.width, box.height));
  return medianColor(samples);
}

function isFramePixel(r: number, g: number, b: number, a: number): boolean {
  return isWhiteRim(r, g, b, a) || isCyanGlow(r, g, b, a);
}

function isSilhouette(
  r: number,
  g: number,
  b: number,
  a: number,
  bg: { r: number; g: number; b: number },
): boolean {
  if (a < 80) return false;
  if (isFramePixel(r, g, b, a)) return true;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const bgLuma = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b;
  const isBackground = chroma < 14 && Math.abs(luma - bgLuma) < 42;
  return !isBackground;
}

type Point = { x: number; y: number };

function largestPredicateComponent(
  img: Rgba,
  pred: (r: number, g: number, b: number, a: number) => boolean,
): Component | null {
  const comps = components(img, pred);
  const minSide = Math.min(img.width, img.height) * 0.35;
  const cx = (img.width - 1) / 2;
  const cy = (img.height - 1) / 2;
  const maxDist = Math.min(img.width, img.height) * 0.22;
  const scored: Array<{ comp: Component; area: number; dist: number }> = [];
  for (const comp of comps) {
    const width = comp.maxX - comp.minX + 1;
    const height = comp.maxY - comp.minY + 1;
    if (width < minSide || height < minSide) continue;
    const ratio = width / height;
    if (ratio < 0.72 || ratio > 1.38) continue;
    const dist = Math.hypot((comp.minX + comp.maxX) / 2 - cx, (comp.minY + comp.maxY) / 2 - cy);
    scored.push({ comp, area: width * height, dist });
  }
  const centered = scored.filter((item) => item.dist <= maxDist);
  const pool = centered.length > 0 ? centered : scored;
  let best: { comp: Component; area: number } | null = null;
  for (const item of pool) {
    if (!best || item.area > best.area) best = item;
  }
  return best?.comp ?? null;
}

function collectComponentPoints(
  img: Rgba,
  comp: Component,
  pred: (r: number, g: number, b: number, a: number) => boolean,
): Point[] {
  const seen = new Uint8Array(img.width * img.height);
  const points: Point[] = [];
  const stack: number[] = [];
  const at = (x: number, y: number) => y * img.width + x;
  const inComp = (x: number, y: number) =>
    x >= comp.minX && x <= comp.maxX && y >= comp.minY && y <= comp.maxY;
  let seed: number | null = null;
  for (let y = comp.minY; y <= comp.maxY && seed === null; y++) {
    for (let x = comp.minX; x <= comp.maxX; x++) {
      const i = (y * img.width + x) * 4;
      if (pred(img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0, img.data[i + 3] ?? 0)) {
        seed = at(x, y);
        break;
      }
    }
  }
  if (seed === null) return points;
  stack.push(seed);
  seen[seed] = 1;
  while (stack.length > 0) {
    const q = stack.pop() ?? 0;
    const x = q % img.width;
    const y = Math.floor(q / img.width);
    points.push({ x, y });
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!inComp(nx, ny) || nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
        const np = at(nx, ny);
        if (seen[np] === 1) continue;
        const ni = np * 4;
        if (!pred(img.data[ni] ?? 0, img.data[ni + 1] ?? 0, img.data[ni + 2] ?? 0, img.data[ni + 3] ?? 0)) {
          seen[np] = 1;
          continue;
        }
        seen[np] = 1;
        stack.push(np);
      }
    }
  }
  return points;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function convexHull(points: Point[]): Point[] {
  if (points.length <= 2) return points.slice();
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const lower: Point[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2] ?? point, lower[lower.length - 1] ?? point, point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i];
    if (!point) continue;
    while (upper.length >= 2 && cross(upper[upper.length - 2] ?? point, upper[upper.length - 1] ?? point, point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (!a || !b) continue;
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function fillRatioForPredicate(
  img: Rgba,
  pred: (r: number, g: number, b: number, a: number) => boolean,
): number | null {
  const comp = largestPredicateComponent(img, pred);
  if (!comp) return null;
  const points = collectComponentPoints(img, comp, pred);
  if (points.length < 24) return null;
  const hull = convexHull(points);
  const hullArea = polygonArea(hull);
  const boxArea = (comp.maxX - comp.minX + 1) * (comp.maxY - comp.minY + 1);
  if (boxArea <= 0) return null;
  return hullArea / boxArea;
}

export function attunedShapeFillRatio(
  img: Rgba,
  background: { r: number; g: number; b: number } = inferBackground(img),
): number | null {
  const framePred = isFramePixel;
  const fullPred = (r: number, g: number, b: number, a: number) => isSilhouette(r, g, b, a, background);
  const frameComp = largestPredicateComponent(img, framePred);
  const fullComp = largestPredicateComponent(img, fullPred);
  const frameArea = frameComp
    ? (frameComp.maxX - frameComp.minX + 1) * (frameComp.maxY - frameComp.minY + 1)
    : 0;
  const fullArea = fullComp
    ? (fullComp.maxX - fullComp.minX + 1) * (fullComp.maxY - fullComp.minY + 1)
    : 0;
  const cropArea = img.width * img.height;
  if (fullComp && fullArea > frameArea * 1.15 && fullArea < cropArea * 0.9) {
    return fillRatioForPredicate(img, fullPred);
  }
  if (frameComp) return fillRatioForPredicate(img, framePred);
  if (fullComp) return fillRatioForPredicate(img, fullPred);
  return null;
}

/**
 * Attuned icons are squares; normal icons are circles.
 * Segment the printed silhouette against the surrounding strip, then compare
 * the whole shape (convex hull) to its bounding square.
 */
export function isAttunedSymbolShape(
  img: Rgba,
  background: { r: number; g: number; b: number } = inferBackground(img),
): boolean {
  const fill = attunedShapeFillRatio(img, background);
  return fill !== null && fill >= 0.88;
}

function matchBlob(
  img: Rgba,
  templates: ResourceSymbolTemplate[],
  minScore = 0.68,
): string | null {
  const vec = symbolTemplateVector(img, RESOURCE_SYMBOL_TEMPLATE_SIZE);
  let best: { id: string; score: number } | null = null;
  for (const template of templates) {
    const score = cosine(vec, template.pixels);
    if (!best || score > best.score) best = { id: template.id, score };
  }
  if (!best || best.score < minScore) return null;
  if (best.id === "infinity" && best.score < 0.86) return null;
  return best.id;
}

function paddedBox(icon: IconBox, others: IconBox[], pad: number): IconBox {
  let left = pad;
  let right = pad;
  let top = pad;
  let bottom = pad;
  for (const other of others) {
    const gapLeft = icon.x - (other.x + other.width);
    if (gapLeft >= 0 && gapLeft < icon.width) left = Math.min(left, Math.max(1, gapLeft - 1));
    const gapRight = other.x - (icon.x + icon.width);
    if (gapRight >= 0 && gapRight < icon.width) right = Math.min(right, Math.max(1, gapRight - 1));
  }
  return {
    x: icon.x - left,
    y: icon.y - top,
    width: icon.width + left + right,
    height: icon.height + top + bottom,
  };
}

export function matchResourceSymbols(
  card: Rgba,
  templates: ResourceSymbolTemplate[],
): string[] {
  const strip = findSymbolStrip(card);
  const located = iconBounds(strip);
  const icons = [...located];
  if (located.length === 0) {
    const white = components(strip, isWhiteRim);
    const separatorX = separatorAndCutoff(strip, white);
    const logo = bestLogo(white, separatorX, strip.height);
    const size = logo ? logo.maxX - logo.minX + 1 : Math.round(strip.height * 0.4);
    const y = logo ? logo.minY : Math.round(strip.height * 0.35);
    const x = separatorX + Math.max(8, Math.round(size * 0.28));
    if (x + size <= strip.width && y + size <= strip.height) {
      icons.push({ x, y, width: size, height: size });
    }
  }
  const peekFrom = located.length;
  if (located.length > 0 && located.length < 3) {
    const last = located[located.length - 1];
    if (last) {
      const gap = Math.max(3, Math.round(last.width * 0.08));
      const nextX = last.x + last.width + gap;
      if (nextX + last.width <= strip.width) {
        icons.push({ x: nextX, y: last.y, width: last.width, height: last.height });
      }
    }
  }
  const symbols: string[] = [];
  for (const [index, icon] of icons.entries()) {
    const img = crop(strip, icon.x, icon.y, icon.width, icon.height);
    const matched = matchBlob(img, templates, index >= peekFrom ? 0.74 : 0.68);
    if (!matched) {
      if (symbols.length > 0) break;
      continue;
    }
    const fallback = index >= peekFrom || located.length <= 1;
    const pad = Math.max(3, Math.round(Math.min(icon.width, icon.height) * (fallback ? 0.22 : 0.1)));
    const grown = paddedBox(
      icon,
      icons.filter((other) => other !== icon),
      pad,
    );
    if (!fallback) {
      const topShrink = Math.max(0, Math.round(pad * 0.6));
      grown.y += topShrink;
      grown.height -= topShrink;
    }
    const background = sampleAroundBox(strip, grown);
    const shape = crop(strip, grown.x, grown.y, grown.width, grown.height);
    const attuned = matched !== "infinity" && isAttunedSymbolShape(shape, background);
    symbols.push(attuned ? `attuned:${matched}` : matched);
  }
  return symbols;
}
