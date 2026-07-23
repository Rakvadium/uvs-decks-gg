"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { toPublicCardImageUrl } from "../../../convex/publicCardUrls";
import {
  UNIVERSUS_ATTUNED_SYMBOLS,
  UNIVERSUS_CARD_TYPES,
  UNIVERSUS_KEYWORDS,
  UNIVERSUS_SYMBOLS,
  UNIVERSUS_ZONES,
} from "@/config/universus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { toastConvexError } from "@/lib/convex-error-toast";
import { parseZoneDisplay } from "@/components/universus/card-details/parsers";
import { createSymbolReferenceImageUrl } from "@/lib/universus/vision-reference-images";
import {
  analyzeCardRegions,
  type CardRegionAnalysis,
} from "@/lib/universus/vision-card-regions";
import { cn } from "@/lib/utils";
import { Sparkles, Upload, X } from "lucide-react";

const RARITY_SUGGESTIONS = [
  "Common",
  "Uncommon",
  "Rare",
  "Super Rare",
  "Ultra Rare",
  "Promo",
  "Champion",
  "Character",
];

export type PickerCard = {
  _id: Id<"cards">;
  name: string;
  collectorNumber?: string;
  isFrontFace?: boolean;
};

export type CardFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Doc<"cards"> | null;
  setCode: string;
  setName: string;
  pickerCards: readonly PickerCard[];
  linkAsBackOf?: Id<"cards"> | null;
  presetBackFace?: boolean;
  typeOptions?: readonly string[];
  rarityOptions?: readonly string[];
  onSaved: () => void;
  onRequestCreateBackFace: (front: Doc<"cards">) => void;
};

type CardFormValues = {
  name: string;
  oracleId: string;
  type: string;
  rarity: string;
  collectorNumber: string;
  setNumber: string;
  imageUrl: string;
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
  isFrontFace: boolean;
  isVariant: boolean;
  backCardId: string;
  frontCardId: string;
};

function emptyValues(presetBackFace: boolean): CardFormValues {
  return {
    name: "",
    oracleId: "",
    type: "",
    rarity: "",
    collectorNumber: "",
    setNumber: "",
    imageUrl: "",
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
    copyLimit: "",
    isFrontFace: !presetBackFace,
    isVariant: false,
    backCardId: "",
    frontCardId: "",
  };
}

function numToStr(value: number | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

function cardToValues(card: Doc<"cards">): CardFormValues {
  return {
    name: card.name ?? "",
    oracleId: card.oracleId ?? "",
    type: card.type ?? "",
    rarity: card.rarity ?? "",
    collectorNumber: card.collectorNumber ?? "",
    setNumber: numToStr(card.setNumber),
    imageUrl: card.imageUrl ?? "",
    difficulty: numToStr(card.difficulty),
    control: numToStr(card.control),
    speed: numToStr(card.speed),
    damage: numToStr(card.damage),
    blockModifier: numToStr(card.blockModifier),
    handSize: numToStr(card.handSize),
    health: numToStr(card.health),
    stamina: numToStr(card.stamina),
    attackZone: card.attackZone ?? "",
    blockZone: card.blockZone ?? "",
    text: card.text ?? "",
    keywords: card.keywords ?? "",
    symbols: card.symbols ?? "",
    copyLimit: numToStr(card.copyLimit),
    isFrontFace: card.isFrontFace !== false,
    isVariant: card.isVariant === true,
    backCardId: card.backCardId ?? "",
    frontCardId: card.frontCardId ?? "",
  };
}

function strToNum(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function strOrUndef(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function splitPipe(value: string): string[] {
  return value
    .split("|")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function joinPipe(tokens: string[]): string {
  return tokens.join("|");
}

function toggleToken(current: string, token: string): string {
  const tokens = splitPipe(current);
  const lower = token.toLowerCase();
  const exists = tokens.some((t) => t.toLowerCase() === lower);
  if (exists) {
    return joinPipe(tokens.filter((t) => t.toLowerCase() !== lower));
  }
  return joinPipe([...tokens, token]);
}

function addToken(current: string, token: string): string {
  const clean = token.trim();
  if (!clean) return current;
  const tokens = splitPipe(current);
  if (tokens.some((t) => t.toLowerCase() === clean.toLowerCase())) {
    return current;
  }
  return joinPipe([...tokens, clean]);
}

function removeToken(current: string, token: string): string {
  const tokens = splitPipe(current);
  return joinPipe(tokens.filter((t) => t.toLowerCase() !== token.toLowerCase()));
}

function hasToken(current: string, token: string): boolean {
  const lower = token.toLowerCase();
  return splitPipe(current).some((t) => t.toLowerCase() === lower);
}

function slugifyFileSeed(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fileToWebp(
  file: File,
  maxDim = 1024,
  quality = 0.9
): Promise<{ bytes: ArrayBuffer; dataUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load image file"));
      el.src = objectUrl;
    });

    const ratio = Math.min(
      1,
      maxDim / Math.max(img.naturalWidth, img.naturalHeight)
    );
    const width = Math.max(1, Math.round(img.naturalWidth * ratio));
    const height = Math.max(1, Math.round(img.naturalHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not supported in this browser");
    }
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob) {
      throw new Error("Could not convert image to WebP");
    }

    const bytes = await blob.arrayBuffer();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read converted image"));
      reader.readAsDataURL(blob);
    });

    return { bytes, dataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function DatalistInput({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
}) {
  const listId = `${id}-list`;
  return (
    <>
      <Input
        id={id}
        value={value}
        list={listId}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {suggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

function CardPicker({
  cards,
  value,
  onChange,
  placeholder,
  excludeId,
}: {
  cards: readonly PickerCard[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  excludeId?: Id<"cards">;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => cards.find((c) => c._id === value),
    [cards, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards
      .filter((c) => c._id !== excludeId)
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.collectorNumber ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 60);
  }, [cards, query, excludeId]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start font-normal"
          >
            {selected
              ? `${selected.name}${selected.collectorNumber ? ` · #${selected.collectorNumber}` : ""}`
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <Input
            autoFocus
            placeholder="Search this set…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No matching cards.
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange(c._id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {c.collectorNumber ? `#${c.collectorNumber}` : ""}
                    {c.isFrontFace === false ? " back" : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
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
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Select
      value={value || "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
    >
      <SelectTrigger className={cn("w-full", zoneToneClassName(value))}>
        <SelectValue placeholder={placeholder} />
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

export function CardFormDialog({
  open,
  onOpenChange,
  editing,
  setCode,
  setName,
  pickerCards,
  linkAsBackOf,
  presetBackFace = false,
  typeOptions = [],
  rarityOptions = [],
  onSaved,
  onRequestCreateBackFace,
}: CardFormDialogProps) {
  const createCard = useMutation(api.admin.createCard);
  const updateCard = useMutation(api.admin.updateCard);
  const linkCardFaces = useMutation(api.admin.linkCardFacesById);
  const uploadCardImage = useAction(api.cardImages.uploadCardImage);
  const extractCardFromImage = useAction(api.cardOcr.extractCardFromImage);

  const [values, setValues] = useState<CardFormValues>(() =>
    emptyValues(presetBackFace)
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setValues(cardToValues(editing));
    } else {
      setValues(emptyValues(presetBackFace));
    }
    setLocalPreview(null);
    setKeywordDraft("");
  }, [open, editing, presetBackFace, linkAsBackOf]);

  const setField = useCallback(
    <K extends keyof CardFormValues>(key: K, value: CardFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const typeSuggestions = useMemo(() => {
    const set = new Set<string>(UNIVERSUS_CARD_TYPES);
    for (const option of typeOptions) set.add(option);
    return Array.from(set);
  }, [typeOptions]);

  const raritySuggestions = useMemo(() => {
    const set = new Set<string>(RARITY_SUGGESTIONS);
    for (const option of rarityOptions) set.add(option);
    return Array.from(set);
  }, [rarityOptions]);

  const previewUrl = localPreview ?? toPublicCardImageUrl(values.imageUrl) ?? null;
  const isBackFaceMode = presetBackFace || linkAsBackOf != null;

  const runUpload = useCallback(
    async (file: File) => {
      const seed =
        slugifyFileSeed(values.collectorNumber) ||
        slugifyFileSeed(values.name) ||
        `card-${Date.now()}`;
      setUploading(true);
      try {
        const { bytes, dataUrl } = await fileToWebp(file);
        setLocalPreview(dataUrl);
        const { key } = await uploadCardImage({
          setCode,
          fileName: seed,
          bytes,
        });
        setField("imageUrl", key);
        toast.success("Image uploaded");
      } catch (e) {
        toastConvexError(e, "Could not upload image");
      } finally {
        setUploading(false);
      }
    },
    [setCode, uploadCardImage, values.collectorNumber, values.name, setField]
  );

  const handleAutofill = useCallback(async () => {
    const source = values.imageUrl
      ? toPublicCardImageUrl(values.imageUrl)
      : localPreview;
    if (!source) {
      toast.error("Add a card image first");
      return;
    }
    setOcrBusy(true);
    try {
      const [symbolReferenceImageUrl, regions] = await Promise.all([
        createSymbolReferenceImageUrl(),
        analyzeCardRegions(source).catch((): CardRegionAnalysis => ({})),
      ]);
      const extracted = await extractCardFromImage({
        imageUrl: source,
        symbolReferenceImageUrl,
        symbolStripImageUrl: regions.symbolStripImageUrl,
        attackZone: regions.attackZone,
        blockZone: regions.blockZone,
      });
      const next: Partial<CardFormValues> = {};
      let count = 0;
      const assign = (key: keyof CardFormValues, value: string | undefined) => {
        if (value !== undefined && value !== "") {
          (next as Record<string, string>)[key] = value;
          count += 1;
        }
      };
      assign("name", extracted.name);
      assign("type", extracted.type);
      assign("rarity", extracted.rarity);
      assign("difficulty", numToStr(extracted.difficulty));
      assign("control", numToStr(extracted.control));
      assign("speed", numToStr(extracted.speed));
      assign("damage", numToStr(extracted.damage));
      assign("blockModifier", numToStr(extracted.blockModifier));
      assign("handSize", numToStr(extracted.handSize));
      assign("health", numToStr(extracted.health));
      assign("stamina", numToStr(extracted.stamina));
      assign("attackZone", extracted.attackZone);
      assign("blockZone", extracted.blockZone);
      assign("keywords", extracted.keywords);
      assign("symbols", extracted.symbols);
      assign("text", extracted.text);
      setValues((prev) => ({ ...prev, ...next }));
      if (count > 0) {
        toast.success(`Filled ${count} field${count === 1 ? "" : "s"}. Review before saving.`);
      } else {
        toast.message("No fields could be read from the image");
      }
    } catch (e) {
      toastConvexError(e, "Could not read card image");
    } finally {
      setOcrBusy(false);
    }
  }, [values.imageUrl, localPreview, extractCardFromImage]);

  const handleSave = useCallback(async () => {
    if (!values.name.trim()) {
      toast.error("Card name is required");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateCard({
          cardId: editing._id,
          updates: {
            name: values.name.trim(),
            oracleId: strOrUndef(values.oracleId),
            type: strOrUndef(values.type),
            rarity: strOrUndef(values.rarity),
            collectorNumber: strOrUndef(values.collectorNumber),
            setNumber: strToNum(values.setNumber),
            imageUrl: strOrUndef(values.imageUrl),
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
            symbols: strOrUndef(values.symbols),
            copyLimit: strToNum(values.copyLimit),
            isFrontFace: values.isFrontFace,
            isVariant: values.isVariant,
            setCode,
            setName,
          },
        });

        if (values.isFrontFace) {
          const currentBack = editing.backCardId ?? "";
          if (values.backCardId !== currentBack) {
            await linkCardFaces({
              frontId: editing._id,
              backId: values.backCardId
                ? (values.backCardId as Id<"cards">)
                : undefined,
            });
          }
        } else if (values.frontCardId && values.frontCardId !== (editing.frontCardId ?? "")) {
          await linkCardFaces({
            frontId: values.frontCardId as Id<"cards">,
            backId: editing._id,
          });
        }
        toast.success("Card updated");
      } else {
        const newId = await createCard({
          card: {
            name: values.name.trim(),
            setCode,
            setName,
            oracleId: strOrUndef(values.oracleId),
            type: strOrUndef(values.type),
            rarity: strOrUndef(values.rarity),
            collectorNumber: strOrUndef(values.collectorNumber),
            setNumber: strToNum(values.setNumber),
            imageUrl: strOrUndef(values.imageUrl),
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
            symbols: strOrUndef(values.symbols),
            copyLimit: strToNum(values.copyLimit),
            isFrontFace: values.isFrontFace,
            isVariant: values.isVariant,
          },
        });

        if (linkAsBackOf) {
          await linkCardFaces({ frontId: linkAsBackOf, backId: newId });
          toast.success("Back face created and linked");
        } else {
          toast.success("Card created");
        }
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toastConvexError(e, "Could not save card");
    } finally {
      setBusy(false);
    }
  }, [
    values,
    editing,
    setCode,
    setName,
    linkAsBackOf,
    createCard,
    updateCard,
    linkCardFaces,
    onSaved,
    onOpenChange,
  ]);

  const dialogTitle = editing
    ? "Edit card"
    : isBackFaceMode
      ? "Create back face"
      : "Add card";

  const keywordTokens = splitPipe(values.keywords);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        contentPadding="none"
        className="max-h-[min(92vh,860px)] overflow-y-auto p-0 sm:max-w-2xl"
      >
        <DialogHeader className="px-4 pt-6 md:px-6">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-6 px-4 md:px-6">
          <section className="grid gap-4">
            <SectionHeading>Identity</SectionHeading>
            <div className="space-y-2">
              <Label htmlFor="cf-name">Name</Label>
              <Input
                id="cf-name"
                value={values.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cf-type">Type</Label>
                <DatalistInput
                  id="cf-type"
                  value={values.type}
                  onChange={(v) => setField("type", v)}
                  suggestions={typeSuggestions}
                  placeholder="Character, Attack…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-rarity">Rarity</Label>
                <DatalistInput
                  id="cf-rarity"
                  value={values.rarity}
                  onChange={(v) => setField("rarity", v)}
                  suggestions={raritySuggestions}
                  placeholder="Common, Rare…"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cf-collector">Collector #</Label>
                <Input
                  id="cf-collector"
                  value={values.collectorNumber}
                  onChange={(e) => setField("collectorNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-setnumber">Set number</Label>
                <Input
                  id="cf-setnumber"
                  type="number"
                  value={values.setNumber}
                  onChange={(e) => setField("setNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-copylimit">Copy limit</Label>
                <Input
                  id="cf-copylimit"
                  type="number"
                  value={values.copyLimit}
                  onChange={(e) => setField("copyLimit", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-oracle">Oracle ID</Label>
              <Input
                id="cf-oracle"
                value={values.oracleId}
                placeholder="Shared across printings / faces"
                onChange={(e) => setField("oracleId", e.target.value)}
              />
            </div>
          </section>

          <section className="grid gap-4">
            <SectionHeading>Stats</SectionHeading>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="cf-difficulty">Difficulty</Label>
                <Input
                  id="cf-difficulty"
                  type="number"
                  value={values.difficulty}
                  onChange={(e) => setField("difficulty", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-control">Control</Label>
                <Input
                  id="cf-control"
                  type="number"
                  value={values.control}
                  onChange={(e) => setField("control", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-blockModifier">Block modifier</Label>
                <Input
                  id="cf-blockModifier"
                  type="number"
                  value={values.blockModifier}
                  onChange={(e) => setField("blockModifier", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Block zone</Label>
                <ZoneSelect
                  value={values.blockZone}
                  onChange={(v) => setField("blockZone", v)}
                  placeholder="Block zone"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cf-speed">Attack Speed</Label>
                <Input
                  id="cf-speed"
                  type="number"
                  value={values.speed}
                  onChange={(e) => setField("speed", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Attack zone</Label>
                <ZoneSelect
                  value={values.attackZone}
                  onChange={(v) => setField("attackZone", v)}
                  placeholder="Attack zone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-damage">Attack Damage</Label>
                <Input
                  id="cf-damage"
                  type="number"
                  value={values.damage}
                  onChange={(e) => setField("damage", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cf-health">Health</Label>
                <Input
                  id="cf-health"
                  type="number"
                  value={values.health}
                  onChange={(e) => setField("health", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-handSize">Hand size</Label>
                <Input
                  id="cf-handSize"
                  type="number"
                  value={values.handSize}
                  onChange={(e) => setField("handSize", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf-stamina">Stamina</Label>
                <Input
                  id="cf-stamina"
                  type="number"
                  value={values.stamina}
                  onChange={(e) => setField("stamina", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <SectionHeading>Text, keywords &amp; symbols</SectionHeading>
            <div className="space-y-2">
              <Label htmlFor="cf-text">Rules text</Label>
              <Textarea
                id="cf-text"
                rows={4}
                value={values.text}
                placeholder="Separate distinct abilities with |"
                onChange={(e) => setField("text", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use <span className="font-mono">|</span> to separate abilities.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Keywords</Label>
              {keywordTokens.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keywordTokens.map((token) => (
                    <Badge
                      key={token}
                      tone="outline"
                      className="cursor-pointer"
                      onClick={() =>
                        setField("keywords", removeToken(values.keywords, token))
                      }
                    >
                      {token}
                      <X className="size-3" />
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input
                  value={keywordDraft}
                  list="cf-keyword-list"
                  placeholder="Add keyword, press Enter"
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setField("keywords", addToken(values.keywords, keywordDraft));
                      setKeywordDraft("");
                    }
                  }}
                />
                <datalist id="cf-keyword-list">
                  {UNIVERSUS_KEYWORDS.map((kw) => (
                    <option key={kw} value={kw} />
                  ))}
                </datalist>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setField("keywords", addToken(values.keywords, keywordDraft));
                    setKeywordDraft("");
                  }}
                >
                  Add
                </Button>
              </div>
              <Input
                aria-label="Raw keywords"
                value={values.keywords}
                placeholder="Raw pipe-delimited keywords"
                onChange={(e) => setField("keywords", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Symbols</Label>
              <div className="flex flex-wrap gap-1.5">
                {UNIVERSUS_SYMBOLS.map((symbol) => (
                  <Badge
                    key={symbol}
                    tone={hasToken(values.symbols, symbol) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setField("symbols", toggleToken(values.symbols, symbol))
                    }
                  >
                    {symbol}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {UNIVERSUS_ATTUNED_SYMBOLS.map((symbol) => (
                  <Badge
                    key={symbol}
                    tone={hasToken(values.symbols, symbol) ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setField("symbols", toggleToken(values.symbols, symbol))
                    }
                  >
                    {symbol.replace("attuned:", "a:")}
                  </Badge>
                ))}
              </div>
              <Input
                aria-label="Raw symbols"
                value={values.symbols}
                placeholder="Raw pipe-delimited symbols"
                onChange={(e) => setField("symbols", e.target.value)}
              />
            </div>
          </section>

          <section className="grid gap-4">
            <SectionHeading>Image</SectionHeading>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex w-full flex-col gap-2 sm:w-2/3">
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) void runUpload(file);
                  }}
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag &amp; drop or
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? "Uploading…" : "Choose file"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void runUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cf-image">Image path or URL</Label>
                  <Input
                    id="cf-image"
                    value={values.imageUrl}
                    placeholder="set-code/001.webp"
                    onChange={(e) => setField("imageUrl", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-fit"
                  disabled={ocrBusy || (!values.imageUrl && !localPreview)}
                  onClick={() => void handleAutofill()}
                >
                  <Sparkles className="size-4" />
                  {ocrBusy ? "Reading image…" : "Auto-fill from image"}
                </Button>
              </div>
              <div className="flex w-full items-start justify-center sm:w-1/3">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Card preview"
                    className="max-h-56 w-auto rounded-md border object-contain"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <SectionHeading>Faces &amp; variant</SectionHeading>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cf-frontface"
                  checked={values.isFrontFace}
                  disabled={isBackFaceMode}
                  onCheckedChange={(v) => setField("isFrontFace", v === true)}
                />
                <Label htmlFor="cf-frontface" className="font-normal">
                  Front face
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cf-variant"
                  checked={values.isVariant}
                  onCheckedChange={(v) => setField("isVariant", v === true)}
                />
                <Label htmlFor="cf-variant" className="font-normal">
                  Variant
                </Label>
              </div>
            </div>

            {editing && values.isFrontFace ? (
              <div className="space-y-2">
                <Label>Back face</Label>
                <CardPicker
                  cards={pickerCards}
                  value={values.backCardId}
                  onChange={(id) => setField("backCardId", id)}
                  placeholder="Link an existing card as the back face"
                  excludeId={editing._id}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestCreateBackFace(editing)}
                >
                  Create new back face
                </Button>
              </div>
            ) : null}

            {editing && !values.isFrontFace ? (
              <div className="space-y-2">
                <Label>Front face</Label>
                <CardPicker
                  cards={pickerCards}
                  value={values.frontCardId}
                  onChange={(id) => setField("frontCardId", id)}
                  placeholder="Link the front face for this card"
                  excludeId={editing._id}
                />
              </div>
            ) : null}
          </section>
        </DialogBody>
        <DialogFooter className="gap-2 px-4 pb-6 md:px-6 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
