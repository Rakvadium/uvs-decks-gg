"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  UNIVERSUS_ATTUNED_SYMBOLS,
  UNIVERSUS_CARD_TYPES,
  UNIVERSUS_FILTER_SYMBOLS,
  UNIVERSUS_ZONES,
} from "@/config/universus";
import {
  AdminPageHeader,
  AdminSetSectionTabs,
  CatalogReleaseDialog,
} from "@/components/admin";
import { createSymbolReferenceImageUrl } from "@/lib/universus/vision-reference-images";
import { analyzeCardRegions } from "@/lib/universus/vision-card-regions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SymbolGrid } from "@/components/gallery/filter-dialog/symbols-picker-panel";
import { parseZoneDisplay } from "@/components/universus/card-details/parsers";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";
import { toastConvexError } from "@/lib/convex-error-toast";

type AdminCardDraftReviewProps = {
  setCode: string;
  setName: string;
  setNumber?: number;
  breadcrumbs?: ReactNode;
  searchSuffix?: string;
};

type DraftFormValues = {
  name: string;
  oracleId: string;
  type: string;
  rarity: string;
  collectorNumber: string;
  setNumber: string;
  difficulty: string;
  control: string;
  speed: string;
  damage: string;
  blockModifier: string;
  handSize: string;
  health: string;
  stamina: string;
  attackZone: string;
  blockZone: string;
  text: string;
  keywords: string;
  symbols: string;
  copyLimit: string;
  isVariant: boolean;
  isRevealHidden: boolean;
};

const emptyValues: DraftFormValues = {
  name: "",
  oracleId: "",
  type: "",
  rarity: "",
  collectorNumber: "",
  setNumber: "",
  difficulty: "",
  control: "",
  speed: "",
  damage: "",
  blockModifier: "",
  handSize: "",
  health: "",
  stamina: "",
  attackZone: "",
  blockZone: "",
  text: "",
  keywords: "",
  symbols: "",
  copyLimit: "4",
  isVariant: false,
  isRevealHidden: true,
};

const DRAFT_BATCH_SIZE = 100;

const VISION_AUTOFILL_APPLIED_WARNING =
  "Vision autofill applied; review every field before approving";

function draftDisplayLabel(row: {
  fileName: string;
  collectorNumber?: string;
  draft?: { name?: string };
}): string {
  return row.draft?.name?.trim() || row.collectorNumber?.trim() || row.fileName;
}

function isDraftVisionProcessed(row: {
  parseWarnings?: string[];
}): boolean {
  return (row.parseWarnings ?? []).some((warning) =>
    warning.includes("Vision autofill applied")
  );
}

type BatchVisionItemStatus = "pending" | "processing" | "done" | "error" | "skipped";

type BatchVisionItem = {
  draftId: Id<"cardDrafts">;
  label: string;
  status: BatchVisionItemStatus;
  error?: string;
};

type BatchVisionProgress = {
  phase: "running" | "complete" | "cancelled";
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentLabel: string | null;
  items: BatchVisionItem[];
};

function numToStr(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function strToNum(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function strOrUndef(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function splitPipe(value: string): string[] {
  return value
    .split("|")
    .map((token) => token.trim())
    .filter(Boolean);
}

function joinPipe(tokens: string[]): string {
  return tokens.join("|");
}

function toggleToken(current: string, token: string): string {
  const tokens = splitPipe(current);
  const lower = token.toLowerCase();
  const exists = tokens.some((item) => item.toLowerCase() === lower);
  if (exists) {
    return joinPipe(tokens.filter((item) => item.toLowerCase() !== lower));
  }
  return joinPipe([...tokens, token]);
}

function draftToValues(
  draft:
    | {
        draft: Partial<{
          name: string;
          oracleId: string;
          type: string;
          rarity: string;
          collectorNumber: string;
          setNumber: number;
          difficulty: number;
          control: number;
          speed: number;
          damage: number;
          blockModifier: number;
          handSize: number;
          health: number;
          stamina: number;
          attackZone: string;
          blockZone: string;
          text: string;
          keywords: string;
          symbols: string;
          copyLimit: number;
          isVariant: boolean;
          isRevealHidden: boolean;
        }>;
        collectorNumber?: string;
      }
    | null
    | undefined,
  fallbackSetNumber?: number
): DraftFormValues {
  if (!draft) {
    return {
      ...emptyValues,
      setNumber: numToStr(fallbackSetNumber),
    };
  }
  const row = draft.draft;
  return {
    name: row.name ?? "",
    oracleId: row.oracleId ?? crypto.randomUUID(),
    type: row.type ?? "",
    rarity: row.rarity ?? "",
    collectorNumber: row.collectorNumber ?? draft.collectorNumber ?? "",
    setNumber: numToStr(row.setNumber ?? fallbackSetNumber),
    difficulty: numToStr(row.difficulty),
    control: numToStr(row.control),
    speed: numToStr(row.speed),
    damage: numToStr(row.damage),
    blockModifier: numToStr(row.blockModifier),
    handSize: numToStr(row.handSize),
    health: numToStr(row.health),
    stamina: numToStr(row.stamina),
    attackZone: row.attackZone ?? "",
    blockZone: row.blockZone ?? "",
    text: row.text ?? "",
    keywords: row.keywords ?? "",
    symbols: row.symbols ?? "",
    copyLimit: numToStr(row.copyLimit ?? 4),
    isVariant: row.isVariant === true,
    isRevealHidden: row.isRevealHidden !== false,
  };
}

async function fileToWebp(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not load image file"));
      element.src = objectUrl;
    });
    const maxDim = 1200;
    const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare image");
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Could not encode image"));
      }, "image/webp", 0.92);
    });
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function inferCollectorNumber(fileName: string): string | undefined {
  const base = fileName.replace(/\.[^.]+$/, "");
  const match =
    base.match(/[A-Z]{2,}\d{2,}[-_ ]?(\d{1,4}[A-Z]?)/i) ??
    base.match(/\b(\d{1,4}[A-Z]?)\b/i);
  return match?.[1] ?? base;
}

function valuesToDraft(values: DraftFormValues) {
  return {
    name: strOrUndef(values.name),
    oracleId: strOrUndef(values.oracleId),
    type: strOrUndef(values.type),
    rarity: strOrUndef(values.rarity),
    collectorNumber: strOrUndef(values.collectorNumber),
    setNumber: strToNum(values.setNumber),
    difficulty: strToNum(values.difficulty),
    control: strToNum(values.control),
    speed: strToNum(values.speed),
    damage: strToNum(values.damage),
    blockModifier: strToNum(values.blockModifier),
    handSize: strToNum(values.handSize),
    health: strToNum(values.health),
    stamina: strToNum(values.stamina),
    attackZone: strOrUndef(values.attackZone),
    blockZone: strOrUndef(values.blockZone),
    text: strOrUndef(values.text),
    keywords: strOrUndef(values.keywords),
    symbols: values.symbols.trim(),
    copyLimit: strToNum(values.copyLimit),
    isFrontFace: true,
    isVariant: values.isVariant,
    isRevealHidden: values.isRevealHidden,
  };
}

export default function AdminCardDraftReview({
  setCode,
  setName,
  setNumber,
  breadcrumbs,
  searchSuffix = "",
}: AdminCardDraftReviewProps) {
  const drafts = useQuery(api.cardDrafts.listDraftsBySet, {
    setCode,
    status: "pending",
  });
  const generateUploadUrl = useMutation(api.cardDrafts.generateDraftUploadUrl);
  const createDrafts = useMutation(api.cardDrafts.createDraftsFromStorageIds);
  const updateDraft = useMutation(api.cardDrafts.updateDraft);
  const applyDraftOcrFromAdmin = useMutation(api.cardDrafts.applyDraftOcrFromAdmin);
  const skipDraft = useMutation(api.cardDrafts.skipDraft);
  const deleteDraft = useMutation(api.cardDrafts.deleteDraft);
  const approveDraft = useAction(api.cardDraftActions.approveDraft);
  const extractCardFromImage = useAction(api.cardOcr.extractCardFromImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelBatchVisionRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [values, setValues] = useState<DraftFormValues>(emptyValues);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [visionBusy, setVisionBusy] = useState(false);
  const [referenceBusy, setReferenceBusy] = useState(false);
  const [batchVision, setBatchVision] = useState<BatchVisionProgress | null>(null);

  const activeDraft = drafts?.[activeIndex] ?? drafts?.[0] ?? null;
  const selectedSymbols = useMemo(() => splitPipe(values.symbols), [values.symbols]);
  const unprocessedDrafts = useMemo(
    () => (drafts ?? []).filter((draft) => !isDraftVisionProcessed(draft)),
    [drafts]
  );
  const batchVisionRunning = batchVision?.phase === "running";
  const batchVisionPercent =
    batchVision && batchVision.total > 0
      ? Math.round((batchVision.processed / batchVision.total) * 100)
      : 0;

  useEffect(() => {
    if (!drafts || drafts.length === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= drafts.length) {
      setActiveIndex(Math.max(0, drafts.length - 1));
    }
  }, [activeIndex, drafts]);

  useEffect(() => {
    if (batchVisionRunning) return;
    setValues(draftToValues(activeDraft, setNumber));
  }, [activeDraft, batchVisionRunning, setNumber]);

  type DraftRow = NonNullable<typeof activeDraft>;

  const runVisionAutofillForDraft = useCallback(
    async (
      draft: DraftRow,
      options?: { existingSymbols?: string; updateForm?: boolean; showToast?: boolean }
    ) => {
      const { existingSymbols = "", updateForm = true, showToast = true } = options ?? {};
      if (!draft.imageUrl) return;
      setVisionBusy(true);
      try {
        const [symbolReferenceImageUrl, regions] = await Promise.all([
          createSymbolReferenceImageUrl(),
          analyzeCardRegions(draft.imageUrl).catch(() => ({})),
        ]);
        const extracted = await extractCardFromImage({
          imageUrl: draft.imageUrl,
          symbolReferenceImageUrl,
          symbolStripImageUrl: regions.symbolStripImageUrl,
          attackZone: regions.attackZone,
          blockZone: regions.blockZone,
        });
        const nextDraft = {
          ...draft.draft,
          ...extracted,
          symbols: existingSymbols.trim() || extracted.symbols || draft.draft.symbols || "",
        };
        await applyDraftOcrFromAdmin({
          draftId: draft._id,
          ocrRawText: "",
          draft: nextDraft,
          parseWarnings: [VISION_AUTOFILL_APPLIED_WARNING],
          detectedType: extracted.type,
        });
        if (updateForm) {
          setValues({
            ...draftToValues(
              {
                collectorNumber: draft.collectorNumber,
                draft: nextDraft,
              },
              setNumber
            ),
            symbols: existingSymbols.trim() || extracted.symbols || draft.draft.symbols || "",
          });
        }
        if (showToast) {
          toast.success("Vision autofill complete");
        }
      } catch (error) {
        toastConvexError(error, "Could not run Vision autofill");
        throw error;
      } finally {
        setVisionBusy(false);
      }
    },
    [applyDraftOcrFromAdmin, extractCardFromImage, setNumber]
  );

  const runVisionAutofillAll = useCallback(async () => {
    if (!drafts || drafts.length === 0 || batchVisionRunning) return;

    const snapshot = unprocessedDrafts.map((draft) => ({
      draftId: draft._id,
      label: draftDisplayLabel(draft),
      imageUrl: draft.imageUrl,
      draft: draft.draft,
      collectorNumber: draft.collectorNumber,
    }));

    if (snapshot.length === 0) {
      toast.message("All review cards already have Vision autofill");
      return;
    }

    cancelBatchVisionRef.current = false;

    setBatchVision({
      phase: "running",
      total: snapshot.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentLabel: null,
      items: snapshot.map((item) => ({
        draftId: item.draftId,
        label: item.label,
        status: "pending",
      })),
    });
    setVisionBusy(true);

    let symbolReferenceImageUrl: string;
    try {
      symbolReferenceImageUrl = await createSymbolReferenceImageUrl();
    } catch (error) {
      toastConvexError(error, "Could not create symbol reference");
      setBatchVision(null);
      setVisionBusy(false);
      return;
    }

    const regionCache = new Map<
      string,
      Awaited<ReturnType<typeof analyzeCardRegions>>
    >();

    let succeeded = 0;
    let failed = 0;

    for (let index = 0; index < snapshot.length; index++) {
      if (cancelBatchVisionRef.current) {
        setBatchVision((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            phase: "cancelled",
            currentLabel: null,
            items: prev.items.map((item, itemIndex) =>
              itemIndex >= index && item.status === "pending"
                ? { ...item, status: "skipped" }
                : item
            ),
          };
        });
        break;
      }

      const item = snapshot[index];

      setBatchVision((prev) => {
        if (!prev) return prev;
        const items = [...prev.items];
        items[index] = { ...items[index], status: "processing" };
        return { ...prev, currentLabel: item.label, items };
      });

      if (!item.imageUrl) {
        failed += 1;
        setBatchVision((prev) => {
          if (!prev) return prev;
          const items = [...prev.items];
          items[index] = {
            ...items[index],
            status: "error",
            error: "Image unavailable",
          };
          return {
            ...prev,
            processed: prev.processed + 1,
            failed: prev.failed + 1,
            items,
          };
        });
        continue;
      }

      try {
        let regions = regionCache.get(item.imageUrl);
        if (!regions) {
          regions = await analyzeCardRegions(item.imageUrl).catch(() => ({}));
          regionCache.set(item.imageUrl, regions);
        }
        const extracted = await extractCardFromImage({
          imageUrl: item.imageUrl,
          symbolReferenceImageUrl,
          symbolStripImageUrl: regions.symbolStripImageUrl,
          attackZone: regions.attackZone,
          blockZone: regions.blockZone,
        });
        const nextDraft = {
          ...item.draft,
          ...extracted,
          symbols: extracted.symbols || item.draft.symbols || "",
        };
        await applyDraftOcrFromAdmin({
          draftId: item.draftId,
          ocrRawText: "",
          draft: nextDraft,
          parseWarnings: [VISION_AUTOFILL_APPLIED_WARNING],
          detectedType: extracted.type,
        });
        succeeded += 1;
        setBatchVision((prev) => {
          if (!prev) return prev;
          const items = [...prev.items];
          items[index] = { ...items[index], status: "done" };
          return {
            ...prev,
            processed: prev.processed + 1,
            succeeded: prev.succeeded + 1,
            items,
          };
        });
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Vision autofill failed";
        setBatchVision((prev) => {
          if (!prev) return prev;
          const items = [...prev.items];
          items[index] = { ...items[index], status: "error", error: message };
          return {
            ...prev,
            processed: prev.processed + 1,
            failed: prev.failed + 1,
            items,
          };
        });
      }
    }

    if (!cancelBatchVisionRef.current) {
      setBatchVision((prev) =>
        prev
          ? {
              ...prev,
              phase: "complete",
              currentLabel: null,
              succeeded,
              failed,
            }
          : null
      );
      toast.success(
        `Vision autofill finished: ${succeeded} saved${failed > 0 ? `, ${failed} failed` : ""}`
      );
    } else {
      toast.message("Vision autofill cancelled");
    }

    setVisionBusy(false);
  }, [
    applyDraftOcrFromAdmin,
    batchVisionRunning,
    extractCardFromImage,
    unprocessedDrafts,
  ]);

  const cancelBatchVision = useCallback(() => {
    cancelBatchVisionRef.current = true;
  }, []);

  const setField = useCallback(
    <K extends keyof DraftFormValues>(key: K, value: DraftFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        const uploads = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const { uploadUrl } = await generateUploadUrl({});
          const webp = await fileToWebp(file);
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "image/webp" },
            body: webp,
          });
          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }
          const json = (await response.json()) as { storageId: string };
          uploads.push({
            storageId: json.storageId as Id<"_storage">,
            fileName: file.name,
            collectorNumber: inferCollectorNumber(file.name),
            sortIndex: Date.now() + i,
          });
        }
        for (let i = 0; i < uploads.length; i += DRAFT_BATCH_SIZE) {
          await createDrafts({
            setCode,
            setName,
            drafts: uploads.slice(i, i + DRAFT_BATCH_SIZE),
          });
        }
        toast.success(`Created ${uploads.length} draft${uploads.length === 1 ? "" : "s"}`);
      } catch (error) {
        toastConvexError(error, "Could not upload draft images");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [createDrafts, generateUploadUrl, setCode, setName]
  );

  const saveActiveDraft = useCallback(async () => {
    if (!activeDraft) return;
    setBusy(true);
    try {
      await updateDraft({
        draftId: activeDraft._id,
        draft: valuesToDraft(values),
      });
      toast.success("Draft saved");
    } catch (error) {
      toastConvexError(error, "Could not save draft");
    } finally {
      setBusy(false);
    }
  }, [activeDraft, updateDraft, values]);

  const runVisionAutofill = useCallback(async () => {
    if (!activeDraft) return;
    await runVisionAutofillForDraft(activeDraft, { existingSymbols: values.symbols });
  }, [activeDraft, runVisionAutofillForDraft, values.symbols]);

  const viewSymbolReference = useCallback(async () => {
    setReferenceBusy(true);
    const popup = window.open("", "_blank");
    try {
      if (popup) {
        popup.document.title = "Vision symbol reference";
        popup.document.body.style.margin = "0";
        popup.document.body.style.background = "#111827";
        popup.document.body.style.display = "grid";
        popup.document.body.style.placeItems = "center";
        popup.document.body.style.minHeight = "100vh";
        popup.document.body.textContent = "Generating symbol reference...";
      }
      const symbolReferenceImageUrl = await createSymbolReferenceImageUrl();
      if (popup) {
        popup.document.body.textContent = "";
        const image = popup.document.createElement("img");
        image.src = symbolReferenceImageUrl;
        image.alt = "Vision symbol reference";
        image.style.maxWidth = "100%";
        image.style.height = "auto";
        popup.document.body.appendChild(image);
      } else {
        const link = document.createElement("a");
        link.href = symbolReferenceImageUrl;
        link.download = "vision-symbol-reference.png";
        link.click();
        toast.success("Downloaded Vision symbol reference");
      }
    } catch (error) {
      if (popup) popup.close();
      toastConvexError(error, "Could not create symbol reference");
    } finally {
      setReferenceBusy(false);
    }
  }, []);

  const approveActiveDraft = useCallback(async () => {
    if (!activeDraft) return;
    setBusy(true);
    try {
      await updateDraft({
        draftId: activeDraft._id,
        draft: valuesToDraft(values),
      });
      await approveDraft({ draftId: activeDraft._id });
      toast.success("Card approved");
      setActiveIndex((prev) => Math.min(prev, Math.max((drafts?.length ?? 1) - 2, 0)));
    } catch (error) {
      toastConvexError(error, "Could not approve draft");
    } finally {
      setBusy(false);
    }
  }, [activeDraft, approveDraft, drafts?.length, updateDraft, values]);

  const skipActiveDraft = useCallback(async () => {
    if (!activeDraft) return;
    setBusy(true);
    try {
      await skipDraft({ draftId: activeDraft._id });
      toast.success("Draft skipped");
      setActiveIndex((prev) => Math.min(prev, Math.max((drafts?.length ?? 1) - 2, 0)));
    } catch (error) {
      toastConvexError(error, "Could not skip draft");
    } finally {
      setBusy(false);
    }
  }, [activeDraft, drafts?.length, skipDraft]);

  const deleteActiveDraft = useCallback(async () => {
    if (!activeDraft) return;
    setBusy(true);
    try {
      await deleteDraft({ draftId: activeDraft._id });
      toast.success("Draft deleted");
      setActiveIndex((prev) => Math.min(prev, Math.max((drafts?.length ?? 1) - 2, 0)));
    } catch (error) {
      toastConvexError(error, "Could not delete draft");
    } finally {
      setBusy(false);
    }
  }, [activeDraft, deleteDraft, drafts?.length]);

  const hasDrafts = drafts !== undefined && drafts.length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <AdminPageHeader
        backHref={`/admin/sets${searchSuffix}`}
        backLabel="Sets"
        breadcrumbs={breadcrumbs}
        title={`Review cards — ${setName}`}
        description={
          <span>
            OCR draft queue for <span className="font-mono">{setCode}</span>. Approved
            cards follow the normal catalog release workflow.
          </span>
        }
        subNav={<AdminSetSectionTabs setCode={setCode} searchSuffix={searchSuffix} />}
        count={drafts?.length ?? 0}
        countLabel="pending drafts"
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Upload images"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={unprocessedDrafts.length === 0 || visionBusy || batchVisionRunning}
              onClick={() => void runVisionAutofillAll()}
            >
              {batchVisionRunning
                ? "Autofilling..."
                : `Vision autofill unprocessed (${unprocessedDrafts.length})`}
            </Button>
            <CatalogReleaseDialog triggerLabel="Release catalog" buttonVariant="outline" />
          </div>
        }
      />

      {batchVision ? (
        <Card variant="quiet">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">Vision autofill progress</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {batchVision.phase === "running"
                    ? batchVision.currentLabel
                      ? `Processing ${batchVision.currentLabel}`
                      : "Preparing batch..."
                    : batchVision.phase === "complete"
                      ? "All review cards processed. You can now review and adjust each draft."
                      : "Batch cancelled. Completed drafts were saved."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {batchVisionRunning ? (
                  <Button type="button" variant="outline" size="sm" onClick={cancelBatchVision}>
                    Cancel
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchVision(null)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {batchVision.processed} of {batchVision.total} processed
                </span>
                <span className="font-mono text-muted-foreground">{batchVisionPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${batchVisionPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{batchVision.succeeded} saved</span>
                <span>{batchVision.failed} failed</span>
                {batchVision.phase === "cancelled" ? (
                  <span>
                    {batchVision.items.filter((item) => item.status === "skipped").length} skipped
                  </span>
                ) : null}
              </div>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border bg-card/30 p-2">
              {batchVision.items.map((item) => (
                <div
                  key={item.draftId}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  {item.status === "done" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : item.status === "processing" ? (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : item.status === "error" ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.label}</div>
                    {item.error ? (
                      <div className="text-xs text-destructive">{item.error}</div>
                    ) : item.status === "skipped" ? (
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {drafts === undefined ? (
        <Card variant="quiet">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading drafts...</CardContent>
        </Card>
      ) : !hasDrafts ? (
        <Card variant="quiet">
          <CardHeader>
            <CardTitle>No pending drafts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload card images to create OCR-backed drafts for this set.
            </p>
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload card images
            </Button>
          </CardContent>
        </Card>
      ) : !activeDraft ? null : (
        <div className={batchVisionRunning ? "pointer-events-none opacity-60" : undefined}>
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activeIndex + 1} of {drafts.length}</Badge>
              {activeDraft.detectedType ? (
                <Badge variant="secondary">{activeDraft.detectedType}</Badge>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeIndex === 0 || busy || batchVisionRunning}
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeIndex >= drafts.length - 1 || busy || batchVisionRunning}
                onClick={() => setActiveIndex((prev) => Math.min(drafts.length - 1, prev + 1))}
              >
                Next
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-md border bg-card/30 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.isRevealHidden}
                  onChange={(event) => setField("isRevealHidden", event.target.checked)}
                />
                <span>Keep hidden until revealed</span>
              </label>
              <Button type="button" variant="outline" disabled={busy || visionBusy || batchVisionRunning} onClick={() => void runVisionAutofill()}>
                {visionBusy && !batchVisionRunning ? "Reading image..." : "Vision autofill"}
              </Button>
              <Button type="button" variant="outline" disabled={referenceBusy || batchVisionRunning} onClick={() => void viewSymbolReference()}>
                {referenceBusy ? "Generating..." : "View symbol reference"}
              </Button>
              <Button type="button" disabled={busy || batchVisionRunning} onClick={() => void approveActiveDraft()}>
                Approve
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" disabled={busy}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More draft actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void saveActiveDraft()}>
                    Save draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void skipActiveDraft()}>
                    Skip
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => void deleteActiveDraft()}
                  >
                    Delete draft
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(320px,45%)_minmax(420px,1fr)]">
            <Card variant="quiet" className="overflow-hidden">
            <CardContent className="space-y-4 p-4">
              {activeDraft.imageUrl ? (
                <img
                  src={activeDraft.imageUrl}
                  alt={values.name || activeDraft.fileName}
                  className="mx-auto max-h-[72vh] rounded-lg border bg-muted object-contain"
                />
              ) : (
                <div className="flex min-h-96 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  Image unavailable
                </div>
              )}
              <div className="grid gap-2 text-sm">
                <div className="font-mono text-xs text-muted-foreground">{activeDraft.fileName}</div>
                {activeDraft.parseWarnings?.length ? (
                  <Alert>
                    <AlertTitle>Parse warnings</AlertTitle>
                    <AlertDescription>{activeDraft.parseWarnings.join(" · ")}</AlertDescription>
                  </Alert>
                ) : null}
                {activeDraft.approvalError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Approval failed</AlertTitle>
                    <AlertDescription>{activeDraft.approvalError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </CardContent>
            </Card>

            <Card variant="quiet">
            <CardContent className="space-y-5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={values.name} onChange={(event) => setField("name", event.target.value)} />
                </Field>
                <Field label="Type">
                  <Select value={values.type || "__none__"} onValueChange={(value) => setField("type", value === "__none__" ? "" : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {UNIVERSUS_CARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Rarity">
                  <Input value={values.rarity} onChange={(event) => setField("rarity", event.target.value)} />
                </Field>
                <Field label="Collector #">
                  <Input value={values.collectorNumber} onChange={(event) => setField("collectorNumber", event.target.value)} />
                </Field>
                <Field label="Set number">
                  <Input type="number" value={values.setNumber} onChange={(event) => setField("setNumber", event.target.value)} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Difficulty">
                  <Input
                    type="number"
                    value={values.difficulty}
                    onChange={(event) => setField("difficulty", event.target.value)}
                  />
                </Field>
                <Field label="Control">
                  <Input
                    type="number"
                    value={values.control}
                    onChange={(event) => setField("control", event.target.value)}
                  />
                </Field>
                <Field label="Block modifier">
                  <Input
                    type="number"
                    value={values.blockModifier}
                    onChange={(event) => setField("blockModifier", event.target.value)}
                  />
                </Field>
                <Field label="Block zone">
                  <ZoneSelect value={values.blockZone} onChange={(value) => setField("blockZone", value)} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Attack Speed">
                  <Input
                    type="number"
                    value={values.speed}
                    onChange={(event) => setField("speed", event.target.value)}
                  />
                </Field>
                <Field label="Attack zone">
                  <ZoneSelect value={values.attackZone} onChange={(value) => setField("attackZone", value)} />
                </Field>
                <Field label="Attack Damage">
                  <Input
                    type="number"
                    value={values.damage}
                    onChange={(event) => setField("damage", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Health">
                  <Input
                    type="number"
                    value={values.health}
                    onChange={(event) => setField("health", event.target.value)}
                  />
                </Field>
                <Field label="Hand size">
                  <Input
                    type="number"
                    value={values.handSize}
                    onChange={(event) => setField("handSize", event.target.value)}
                  />
                </Field>
                <Field label="Stamina">
                  <Input
                    type="number"
                    value={values.stamina}
                    onChange={(event) => setField("stamina", event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Keywords">
                <Input value={values.keywords} onChange={(event) => setField("keywords", event.target.value)} />
              </Field>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
                <Field label="Rules text">
                  <Textarea
                    value={values.text}
                    className="min-h-48"
                    onChange={(event) => setField("text", event.target.value)}
                  />
                </Field>

                <div className="space-y-3 rounded-lg border bg-card/30 p-3">
                  <div className="flex items-center justify-between">
                    <Label>Symbols</Label>
                    <span className="font-mono text-xs text-muted-foreground">{values.symbols || "none"}</span>
                  </div>
                  <SymbolGrid
                    symbols={UNIVERSUS_FILTER_SYMBOLS}
                    selectedSymbols={selectedSymbols}
                    shape="circle"
                    onToggle={(symbol) => setField("symbols", toggleToken(values.symbols, symbol))}
                  />
                  <SymbolGrid
                    symbols={UNIVERSUS_ATTUNED_SYMBOLS}
                    selectedSymbols={selectedSymbols}
                    shape="square"
                    onToggle={(symbol) => setField("symbols", toggleToken(values.symbols, symbol))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Oracle ID">
                  <Input value={values.oracleId} onChange={(event) => setField("oracleId", event.target.value)} />
                </Field>
                <Field label="Copy limit">
                  <Input type="number" value={values.copyLimit} onChange={(event) => setField("copyLimit", event.target.value)} />
                </Field>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.isVariant}
                    onChange={(event) => setField("isVariant", event.target.checked)}
                  />
                  Variant
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                Approved cards appear in admin card management and remain part of the normal catalog release flow.{" "}
                <Link
                  href={`/admin/sets/${encodeURIComponent(setCode)}/cards${searchSuffix}`}
                  className="text-primary hover:underline"
                >
                  View cards
                </Link>
              </p>
            </CardContent>
            </Card>
          </div>
        </>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function zoneToneClassName(value: string) {
  const [zone] = parseZoneDisplay(value);
  if (!zone) return undefined;
  return cn(zone.bgColor, zone.borderColor, zone.textColor);
}

function ZoneSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || "__none__"} onValueChange={(next) => onChange(next === "__none__" ? "" : next)}>
      <SelectTrigger className={cn("w-full", zoneToneClassName(value))}>
        <SelectValue placeholder="Zone" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">None</SelectItem>
        {UNIVERSUS_ZONES.map((zone) => {
          const [display] = parseZoneDisplay(zone);
          return (
            <SelectItem key={zone} value={zone} className={zoneToneClassName(zone)}>
              {display?.label ?? zone}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
