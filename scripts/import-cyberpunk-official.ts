/**
 * Import Cyberpunk TCG cards from the official card database (https://cyberpunktcg.com/cards).
 *
 *   bun scripts/import-cyberpunk-official.ts [--dry-run] [--out data/cyberpunk/cards.json] [--upload]
 *
 * The /cards page is a TanStack Start app whose client (and SSR) calls the Netdeck.gg card API:
 * `GET https://api.netdeck.gg/api/cards/cyberpunk?q=&limit=<n>&offset=<n>` → `{ items, total, limit, offset }`
 * (`?page=` on the HTML page is ignored; paging is `offset`). Each item is a card with all its
 * printings (en + fr); see scripts/lib/cyberpunk-official.ts for the normalization.
 *
 * Always: scrape → normalize → write `<out>` (cards), `sets.json`, `images.json`, `raw.json` next to it.
 * `--dry-run`: stop after writing files (the default when `--upload` is absent).
 * `--upload`: download each printing's image (signed CloudFront URL from this scrape; they expire
 *   in ~1 day, so every run re-scrapes) into `<outDir>/webp/`, upload via `POST /admin/upload-card-image`,
 *   then `/admin/upsert-set`, `/admin/upsert-cards-batch` and `/admin/rebuild-catalog-aggregates`
 *   with `game: "cyberpunk"`. Needs ADMIN_API_KEY and CONVEX_SITE_URL (or CONVEX_URL /
 *   NEXT_PUBLIC_CONVEX_URL, `.convex.cloud` → `.convex.site`); Bun loads `.env.local` automatically.
 *   `--skip-images` skips the image download/upload step.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  CYBERPUNK_GAME_ID,
  normalizeOfficialCards,
  type CyberpunkImageSource,
  type OfficialCard,
} from "./lib/cyberpunk-official";

const API_BASE = "https://api.netdeck.gg/api";
const GAME_CODE = "cyberpunk";
const PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 400;
const IMAGE_DELAY_MS = 750;
const THROTTLE_BACKOFF_MS = [2_000];
const UPLOAD_ATTEMPTS = 4;
const CARD_BATCH_SIZE = 100;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

type Args = { dryRun: boolean; upload: boolean; skipImages: boolean; out: string };

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, upload: false, skipImages: false, out: "data/cyberpunk/cards.json" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--upload") args.upload = true;
    else if (arg === "--skip-images") args.skipImages = true;
    else if (arg === "--out") args.out = argv[++i] ?? args.out;
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.dryRun && args.upload) throw new Error("--dry-run and --upload are mutually exclusive");
  return args;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", Origin: "https://cyberpunktcg.com" },
  });
  if (!response.ok) throw new Error(`GET ${url} → ${response.status}`);
  return response.json();
}

/** Sequentially pages through the official card API until `total` items are collected. */
async function scrapeOfficialCards(): Promise<OfficialCard[]> {
  const byId = new Map<string, OfficialCard>();
  let total = Infinity;
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const params = new URLSearchParams({ q: "", limit: String(PAGE_SIZE), offset: String(offset) });
    const page = (await fetchJson(`${API_BASE}/cards/${GAME_CODE}?${params}`)) as {
      items?: OfficialCard[];
      total?: number;
    };
    if (!Array.isArray(page.items)) throw new Error("Unexpected API response: no items[]");
    total = typeof page.total === "number" ? page.total : 0;
    for (const item of page.items) byId.set(item.id, item);
    process.stdout.write(`fetched offset=${offset} items=${page.items.length} total=${total}\n`);
    if (page.items.length === 0) break;
    if (offset + PAGE_SIZE < total) await sleep(REQUEST_DELAY_MS);
  }
  if (byId.size !== total) {
    throw new Error(`Collected ${byId.size} unique cards but the API reports total=${total}`);
  }
  return [...byId.values()];
}

function countBy<T>(rows: T[], key: (row: T) => string | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const k = key(row) ?? "(none)";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function siteUrlFromEnv(): string {
  const explicit = process.env.CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const cloud = (process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL)?.trim();
  if (!cloud) throw new Error("Set CONVEX_SITE_URL or CONVEX_URL (e.g. via .env.local)");
  return cloud.replace(/\/$/, "").replace(".convex.cloud", ".convex.site");
}

async function adminPost(
  siteUrl: string,
  adminKey: string,
  route: string,
  body: unknown,
  contentType = "application/json",
): Promise<unknown> {
  const response = await fetch(`${siteUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": contentType, Authorization: `Bearer ${adminKey}` },
    body:
      contentType === "application/json"
        ? JSON.stringify(body)
        : new Blob([Uint8Array.from(body as Uint8Array)], { type: contentType }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${route} ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

/** Downloads (signed URL first, then the unsigned source URL) and returns webp bytes. */
async function downloadWebp(image: CyberpunkImageSource): Promise<Uint8Array> {
  const urls = [image.signedUrl, image.sourceUrl, image.fallbackUrl].filter((u): u is string => Boolean(u));
  let lastError = "no image URL";
  for (const url of urls) {
    // The CDN starts answering 403 after a burst of downloads; back off and retry.
    let response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    for (const waitMs of THROTTLE_BACKOFF_MS) {
      if (response.status !== 403) break;
      await sleep(waitMs);
      response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    }
    if (!response.ok) {
      lastError = `${response.status} for ${url.split("?")[0]}`;
      continue;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const isWebp =
      bytes.length > 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    return isWebp ? bytes : new Uint8Array(await sharp(bytes).webp({ quality: 90 }).toBuffer());
  }
  throw new Error(`Image download failed for ${image.imageUrl}: ${lastError}`);
}

async function uploadImages(siteUrl: string, adminKey: string, images: CyberpunkImageSource[], outDir: string) {
  const cacheDir = path.join(outDir, "webp");
  let downloaded = 0;
  let uploaded = 0;
  const failed = new Set<string>();
  for (const [index, image] of images.entries()) {
    const localPath = path.join(cacheDir, image.imageUrl);
    let bytes: Uint8Array;
    if (existsSync(localPath)) {
      bytes = new Uint8Array(await readFile(localPath));
    } else {
      try {
        bytes = await downloadWebp(image);
      } catch (error) {
        // Some CDN renders 403 even with a fresh signature; keep going and import the card
        // without an image rather than aborting the whole run.
        process.stdout.write(`skip image ${image.imageUrl}: ${error instanceof Error ? error.message : String(error)}
`);
        failed.add(image.imageUrl);
        continue;
      }
      await mkdir(path.dirname(localPath), { recursive: true });
      await writeFile(localPath, bytes);
      downloaded++;
      await sleep(IMAGE_DELAY_MS);
    }
    const params = new URLSearchParams({ setCode: image.setCode, fileName: image.fileName });
    // R2 occasionally reports NotFound right after a write; retry a few times.
    for (let attempt = 1; ; attempt++) {
      try {
        await adminPost(siteUrl, adminKey, `/admin/upload-card-image?${params}`, bytes, "image/webp");
        break;
      } catch (error) {
        if (attempt >= UPLOAD_ATTEMPTS) throw error;
        process.stdout.write(`retry ${image.imageUrl} (attempt ${attempt} failed)\n`);
        await sleep(1000 * attempt);
      }
    }
    uploaded++;
    process.stdout.write(`[${index + 1}/${images.length}] ${image.imageUrl}\n`);
  }
  process.stdout.write(`images: downloaded ${downloaded}, uploaded ${uploaded}, failed ${failed.size}\n`);
  return failed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(args.out);
  const outDir = path.dirname(outPath);

  const raw = await scrapeOfficialCards();
  const { cards, sets, images, warnings } = normalizeOfficialCards(raw);

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "raw.json"), JSON.stringify(raw, null, 2));
  await writeFile(outPath, JSON.stringify(cards, null, 2));
  await writeFile(path.join(outDir, "sets.json"), JSON.stringify(sets, null, 2));
  await writeFile(path.join(outDir, "images.json"), JSON.stringify(images, null, 2));

  for (const warning of warnings) process.stdout.write(`warn: ${warning}\n`);
  const gallery = cards.filter((c) => !c.isVariant);
  const summary = {
    officialCards: raw.length,
    rows: cards.length,
    uniqueOracleIds: new Set(cards.map((c) => c.oracleId)).size,
    galleryRows: gallery.length,
    byType: countBy(gallery, (c) => c.type),
    byColor: countBy(gallery, (c) => c.color),
    bySet: countBy(cards, (c) => c.setCode),
    byRarity: countBy(cards, (c) => c.rarity),
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\nwrote ${outPath}\n`);

  if (!args.upload) return;

  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!adminKey) throw new Error("ADMIN_API_KEY is required for --upload");
  const siteUrl = siteUrlFromEnv();
  process.stdout.write(`uploading to ${siteUrl}\n`);

  const failedImages = args.skipImages ? new Set<string>() : await uploadImages(siteUrl, adminKey, images, outDir);
  for (const card of cards) {
    if (card.imageUrl && failedImages.has(card.imageUrl)) delete card.imageUrl;
  }

  for (const set of sets) {
    const result = await adminPost(siteUrl, adminKey, "/admin/upsert-set", {
      game: CYBERPUNK_GAME_ID,
      code: set.code,
      name: set.name,
      setNumber: set.setNumber,
      legality: set.legality,
      isRotating: false,
      isFuture: false,
    });
    process.stdout.write(`upsert-set ${set.code} ${JSON.stringify(result)}\n`);
  }
  const totals = { inserted: 0, updated: 0, failed: 0 };
  for (let i = 0; i < cards.length; i += CARD_BATCH_SIZE) {
    const batch = cards.slice(i, i + CARD_BATCH_SIZE);
    const result = (await adminPost(siteUrl, adminKey, "/admin/upsert-cards-batch", {
      game: CYBERPUNK_GAME_ID,
      cards: batch,
    })) as typeof totals;
    totals.inserted += result.inserted;
    totals.updated += result.updated;
    totals.failed += result.failed;
    process.stdout.write(`upsert-cards-batch ${i}..${i + batch.length} ${JSON.stringify(result)}\n`);
  }
  process.stdout.write(`cards: ${JSON.stringify(totals)}\n`);
  const rebuilt = await adminPost(siteUrl, adminKey, "/admin/rebuild-catalog-aggregates", {
    game: CYBERPUNK_GAME_ID,
  });
  process.stdout.write(`rebuild ${JSON.stringify(rebuilt)}\n`);
  if (totals.failed > 0) process.exitCode = 1;
}

await main();
