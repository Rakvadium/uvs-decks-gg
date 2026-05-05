"use client";

import { useCallback, useId, useState } from "react";
import Image from "next/image";
import { ExternalLink, GripVertical, RefreshCw, Trash2 } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminContentSubNav, AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAdminYoutubeCurationModel } from "./hook";

const ACCENT_PRESETS = [
  { label: "Primary", value: "from-primary/20 via-primary/5 to-transparent" },
  { label: "Secondary", value: "from-secondary/20 via-secondary/5 to-transparent" },
  { label: "Emerald", value: "from-emerald-400/20 via-emerald-400/5 to-transparent" },
  { label: "Amber", value: "from-amber-400/20 via-amber-400/5 to-transparent" },
] as const;

type CurationRow = {
  curationId: Id<"communityYoutubeCurations">;
  youtubeVideoId: string;
  sortOrder: number;
  editorialLabel?: string;
  accentClass?: string;
  title?: string;
  channelTitle?: string;
  durationLabel?: string;
  viewCountLabel?: string;
  thumbnailUrl?: string;
  watchUrl: string;
  fetchedAt?: number;
  rowStatus: "ok" | "pending" | "error";
  fetchError?: string;
};

function titleLine(row: CurationRow) {
  if (row.title) return row.title;
  if (row.rowStatus === "pending") return "Loading title…";
  if (row.rowStatus === "error") return "Could not load video";
  return "—";
}

function SortableCurationRow({
  row,
  onUpdateField,
  onRequestDelete,
}: {
  row: CurationRow;
  onUpdateField: (args: {
    curationId: Id<"communityYoutubeCurations">;
    label?: string;
    accentClass?: string;
  }) => Promise<void>;
  onRequestDelete: (curationId: Id<"communityYoutubeCurations">) => void;
}) {
  const [label, setLabel] = useState(row.editorialLabel ?? "");
  const [accent, setAccent] = useState(row.accentClass ?? "");
  const formId = useId();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.curationId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveLabel = useCallback(() => {
    const next = label.trim();
    const cur = (row.editorialLabel ?? "").trim();
    if (next === cur) return;
    return onUpdateField({ curationId: row.curationId, label: next });
  }, [label, onUpdateField, row.curationId, row.editorialLabel]);

  const saveAccent = useCallback(() => {
    const next = accent.trim();
    const cur = (row.accentClass ?? "").trim();
    if (next === cur) return;
    return onUpdateField({ curationId: row.curationId, accentClass: next });
  }, [accent, onUpdateField, row.curationId, row.accentClass]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-stretch",
        isDragging && "z-20 opacity-90 shadow-lg ring-2 ring-primary/30"
      )}
    >
      <div className="flex flex-1 gap-3 min-w-0">
        <button
          type="button"
          className="mt-1 h-9 w-9 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 mx-auto" />
        </button>
        <div className="relative w-32 shrink-0 aspect-video rounded-md overflow-hidden bg-muted">
          {row.thumbnailUrl ? (
            <Image
              src={row.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground text-center px-1">
              {row.rowStatus === "pending" ? "No preview" : row.rowStatus === "error" ? "Error" : "—"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-tight line-clamp-2">{titleLine(row)}</p>
          {row.channelTitle ? (
            <p className="text-sm text-muted-foreground line-clamp-1">{row.channelTitle}</p>
          ) : null}
          <p className="text-[11px] text-muted-foreground font-mono truncate" title={row.youtubeVideoId}>
            {row.youtubeVideoId}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {row.durationLabel ? <span>{row.durationLabel}</span> : null}
            {row.viewCountLabel ? <span>{row.viewCountLabel} views</span> : null}
            {row.rowStatus === "error" && row.fetchError ? (
              <span className="text-destructive">{row.fetchError}</span>
            ) : null}
          </div>
          <a
            href={row.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open on YouTube
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      <form
        id={formId}
        className="flex w-full flex-col gap-3 sm:max-w-xs shrink-0"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${formId}-label`}>
            Label
          </Label>
          <Input
            id={`${formId}-label`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => {
              void saveLabel();
            }}
            placeholder="e.g. Learn to play"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor={`${formId}-accent`}>
            Accent (Tailwind gradient)
          </Label>
          <Input
            id={`${formId}-accent`}
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            onBlur={() => {
              void saveAccent();
            }}
            placeholder="from-primary/20 …"
            className="h-9 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-1">
            {ACCENT_PRESETS.map((p) => (
              <Button
                key={p.value}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setAccent(p.value);
                  void onUpdateField({ curationId: row.curationId, accentClass: p.value });
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="pt-1">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onRequestDelete(row.curationId)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Remove
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminYoutubeCurationContent() {
  const {
    data,
    addUrl,
    setAddUrl,
    onAdd,
    onUpdateField,
    onDelete,
    onReorder,
    onRefreshMetadata,
  } = useAdminYoutubeCurationModel();

  const [deleteTarget, setDeleteTarget] = useState<Id<"communityYoutubeCurations"> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const items = data?.items ?? [];
  const sortableIds = items.map((r) => r.curationId);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !data?.items.length) return;
      const ids = data.items.map((r) => r.curationId);
      const oldIndex = ids.findIndex((id) => id === active.id);
      const newIndex = ids.findIndex((id) => id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(ids, oldIndex, newIndex);
      void onReorder(next);
    },
    [data, onReorder]
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <AdminPageHeader
        title="Community YouTube"
        description="Curate and order featured videos for the community page. Public visitors read from the same cache-powered feed as the homepage."
        backHref="/admin/content"
        backLabel="Content"
        subNav={<AdminContentSubNav />}
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={onRefreshMetadata} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Refresh API cache
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-8 py-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-medium mb-3">Add a video</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="add-yt-url">YouTube link or 11-char video id</Label>
              <Input
                id="add-yt-url"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onAdd();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=…"
                className="h-10"
              />
            </div>
            <Button type="button" onClick={() => void onAdd()}>
              Add to curation
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Duplicate video ids are rejected. Titles and thumbnails follow the public YouTube metadata cache (cron + manual refresh).
          </p>
        </div>

        {data === undefined ? (
          <div className="text-sm text-muted-foreground animate-pulse">Loading curation…</div>
        ) : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No videos in the curation list yet. Add a link or id above.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-3">
                {data.items.map((row) => (
                  <li key={row.curationId}>
                    <SortableCurationRow
                      row={row as CurationRow}
                      onUpdateField={onUpdateField}
                      onRequestDelete={setDeleteTarget}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {data !== undefined && data.items.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Feed state: {data.feedKind}. Community page uses the public{" "}
            <code className="text-[11px]">getFeed</code> query (metadata cached server-side, two-hour cron refresh;
            on-demand refresh is rate-limited for anonymous clients).
          </p>
        ) : null}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this video from the curation?</AlertDialogTitle>
            <AlertDialogDescription>
              The community page will no longer list it after this video is removed. This does not delete YouTube data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) void onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
