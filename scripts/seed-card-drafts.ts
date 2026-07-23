import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type Manifest = {
  setCode?: string;
  setName?: string;
  images?: Array<{
    fileName: string;
    collectorNumber?: string;
    sortIndex?: number;
  }>;
};

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const DRAFT_BATCH_SIZE = 100;

function argValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const exact = `--${name}`;
  const prefixed = `${exact}=`;
  const exactIndex = args.indexOf(exact);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const match = args.find((arg) => arg.startsWith(prefixed));
  return match ? match.slice(prefixed.length) : undefined;
}

function inferCollectorNumber(fileName: string): string | undefined {
  const base = fileName.replace(/\.[^.]+$/, "");
  const match =
    base.match(/[A-Z]{2,}\d{2,}[-_ ]?(\d{1,4}[A-Z]?)/i) ??
    base.match(/\b(\d{1,4}[A-Z]?)\b/i);
  return match?.[1] ?? base;
}

async function readManifest(folder: string): Promise<Manifest> {
  try {
    const raw = await readFile(path.join(folder, "manifest.json"), "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return {};
  }
}

async function listImages(folder: string, manifest: Manifest) {
  if (manifest.images && manifest.images.length > 0) {
    return manifest.images.map((entry, index) => ({
      fileName: entry.fileName,
      collectorNumber: entry.collectorNumber ?? inferCollectorNumber(entry.fileName),
      sortIndex: entry.sortIndex ?? index,
    }));
  }
  const entries = await readdir(folder, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((entry, index) => ({
      fileName: entry.name,
      collectorNumber: inferCollectorNumber(entry.name),
      sortIndex: index,
    }));
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("Usage: bun scripts/seed-card-drafts.ts --folder data/downloads/my-folder --set-code TK802 --set-name \"Tekken 8\"");
    return;
  }

  const convexUrl = process.env.CONVEX_URL;
  const adminApiKey = process.env.ADMIN_API_KEY;
  const folderArg = argValue("folder");
  if (!convexUrl) throw new Error("Missing CONVEX_URL");
  if (!adminApiKey) throw new Error("Missing ADMIN_API_KEY");
  if (!folderArg) throw new Error("Missing --folder");

  const folder = path.resolve(folderArg);
  const manifest = await readManifest(folder);
  const setCode = argValue("set-code") ?? manifest.setCode;
  const setName = argValue("set-name") ?? manifest.setName;
  if (!setCode) throw new Error("Missing --set-code or manifest.setCode");
  if (!setName) throw new Error("Missing --set-name or manifest.setName");

  const convex = new ConvexHttpClient(convexUrl);
  const images = await listImages(folder, manifest);
  const drafts = [];

  for (const image of images) {
    const { uploadUrl } = await convex.mutation(api.cardDrafts.generateDraftUploadUrlWithApiKey, {
      adminApiKey,
    });
    const filePath = path.join(folder, image.fileName);
    const bytes = await readFile(filePath);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentTypeForFile(image.fileName) },
      body: bytes,
    });
    if (!response.ok) {
      throw new Error(`Upload failed for ${image.fileName}: ${response.status}`);
    }
    const json = (await response.json()) as { storageId: string };
    drafts.push({
      storageId: json.storageId as Id<"_storage">,
      fileName: image.fileName,
      collectorNumber: image.collectorNumber,
      sortIndex: image.sortIndex,
    });
    console.log(`Uploaded ${image.fileName}`);
  }

  const ids = [];
  for (let i = 0; i < drafts.length; i += DRAFT_BATCH_SIZE) {
    const created = await convex.mutation(api.cardDrafts.createDraftsFromStorageIdsWithApiKey, {
      adminApiKey,
      setCode,
      setName,
      drafts: drafts.slice(i, i + DRAFT_BATCH_SIZE),
    });
    ids.push(...created);
  }
  console.log(`Created ${ids.length} drafts`);
}

function contentTypeForFile(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
