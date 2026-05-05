"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const ACCENT_NONE = "__none__";

const ACCENT_PRESETS = [
  { value: ACCENT_NONE, label: "None" },
  {
    value: "from-primary/20 via-primary/5 to-transparent",
    label: "Primary",
  },
  {
    value: "from-secondary/20 via-secondary/5 to-transparent",
    label: "Secondary",
  },
  {
    value: "from-emerald-400/20 via-emerald-400/5 to-transparent",
    label: "Emerald",
  },
] as const;

function accentSelectValue(accentClass: string | undefined): string {
  if (!accentClass) {
    return ACCENT_NONE;
  }
  const hit = ACCENT_PRESETS.find((p) => p.value === accentClass);
  return hit ? hit.value : "__custom__";
}

export default function CommunityMediaPageClient() {
  const rows = useQuery(api.communityYoutube.listCurationsAdmin);
  const addCuration = useMutation(api.communityYoutube.addCommunityYoutubeCuration);
  const updateCuration = useMutation(
    api.communityYoutube.updateCommunityYoutubeCuration
  );
  const deleteCuration = useMutation(
    api.communityYoutube.deleteCommunityYoutubeCuration
  );
  const reorder = useMutation(api.communityYoutube.reorderCommunityYoutubeCurations);
  const refreshMetadata = useAction(
    api.communityYoutube.adminRefreshYoutubeFeedMetadata
  );

  const [addUrl, setAddUrl] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addAccent, setAddAccent] = useState(ACCENT_NONE);
  const [addCustomAccent, setAddCustomAccent] = useState("");
  const [adding, setAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<Id<"communityYoutubeCurations"> | null>(
    null
  );
  const [editUrl, setEditUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editAccent, setEditAccent] = useState("");
  const [editCustomAccent, setEditCustomAccent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const orderedIds = useMemo(() => rows?.map((r) => r._id) ?? [], [rows]);

  const resolveAccentForSave = (preset: string, custom: string) => {
    if (preset === "__custom__") {
      return custom.trim() || undefined;
    }
    if (preset === ACCENT_NONE) {
      return undefined;
    }
    return preset.trim() || undefined;
  };

  const openEdit = (row: NonNullable<typeof rows>[number]) => {
    setEditId(row._id);
    setEditUrl(row.youtubeVideoId);
    setEditLabel(row.label ?? "");
    const sel = accentSelectValue(row.accentClass);
    if (sel === "__custom__") {
      setEditAccent("__custom__");
      setEditCustomAccent(row.accentClass ?? "");
    } else {
      setEditAccent(sel);
      setEditCustomAccent("");
    }
    setEditOpen(true);
  };

  const handleAdd = async () => {
    if (!addUrl.trim()) {
      toast.error("Enter a YouTube URL or video ID");
      return;
    }
    setAdding(true);
    try {
      const accent = resolveAccentForSave(addAccent, addCustomAccent);
      await addCuration({
        youtubeVideoIdOrUrl: addUrl.trim(),
        label: addLabel.trim() || undefined,
        accentClass: accent,
      });
      setAddUrl("");
      setAddLabel("");
      setAddAccent(ACCENT_NONE);
      setAddCustomAccent("");
      toast.success("Video added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add video");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editId || !editUrl.trim()) {
      return;
    }
    setSavingEdit(true);
    try {
      const accent = resolveAccentForSave(editAccent, editCustomAccent);
      await updateCuration({
        curationId: editId,
        youtubeVideoIdOrUrl: editUrl.trim(),
        label: editLabel.trim() === "" ? null : editLabel.trim(),
        accentClass: accent === undefined ? null : accent,
      });
      setEditOpen(false);
      setEditId(null);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: Id<"communityYoutubeCurations">) => {
    if (!confirm("Remove this video from the community feed?")) {
      return;
    }
    try {
      await deleteCuration({ curationId: id });
      toast.success("Removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!rows || rows.length < 2) {
      return;
    }
    const j = index + dir;
    if (j < 0 || j >= rows.length) {
      return;
    }
    const next = [...orderedIds];
    const t = next[index];
    next[index] = next[j];
    next[j] = t;
    try {
      await reorder({ orderedIds: next });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    }
  };

  const handleRefreshMetadata = async () => {
    setRefreshing(true);
    try {
      const res = await refreshMetadata({});
      if (res.ok) {
        toast.success("Metadata refreshed");
      } else {
        toast.error(
          res.reason === "missing_api_key"
            ? "Set YOUTUBE_DATA_API_KEY on the Convex deployment"
            : res.reason ?? "Refresh failed"
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Community media</h1>
            <p className="text-muted-foreground">
              Videos shown in Community → Universus Content. Order matches the
              public feed.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={refreshing || rows === undefined}
            onClick={() => void handleRefreshMetadata()}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh titles & thumbnails
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Accent</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows === undefined ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No videos yet. Add one below, or run the default seed on an
                    empty database.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={i === 0}
                          aria-label="Move up"
                          onClick={() => void move(i, -1)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={i === rows.length - 1}
                          aria-label="Move down"
                          onClick={() => void move(i, 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <code className="text-xs font-mono">
                          {row.youtubeVideoId}
                        </code>
                        <Link
                          href={`https://www.youtube.com/watch?v=${encodeURIComponent(row.youtubeVideoId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline w-fit"
                        >
                          Open on YouTube
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.label ?? "—"}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs break-all max-w-[200px] block">
                        {row.accentClass ?? "—"}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Edit"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Remove"
                          onClick={() => void handleDelete(row._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add video</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-url">YouTube URL or video ID</Label>
              <Input
                id="add-url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-label">Label (optional)</Label>
              <Input
                id="add-label"
                placeholder="Short editorial label"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Card accent</Label>
              <Select
                value={addAccent}
                onValueChange={(v) => {
                  setAddAccent(v);
                  if (v !== "__custom__") {
                    setAddCustomAccent("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose preset" />
                </SelectTrigger>
                <SelectContent>
                  {ACCENT_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom class…</SelectItem>
                </SelectContent>
              </Select>
              {addAccent === "__custom__" && (
                <Input
                  className="mt-2 font-mono text-xs"
                  placeholder="Tailwind gradient classes"
                  value={addCustomAccent}
                  onChange={(e) => setAddCustomAccent(e.target.value)}
                />
              )}
            </div>
          </div>
          <Button disabled={adding} onClick={() => void handleAdd()}>
            {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to feed
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit video</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-url">YouTube URL or video ID</Label>
              <Input
                id="edit-url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Card accent</Label>
              <Select
                value={editAccent}
                onValueChange={(v) => {
                  setEditAccent(v);
                  if (v !== "__custom__") {
                    setEditCustomAccent("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCENT_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom class…</SelectItem>
                </SelectContent>
              </Select>
              {editAccent === "__custom__" && (
                <Input
                  className="font-mono text-xs"
                  placeholder="Tailwind gradient classes"
                  value={editCustomAccent}
                  onChange={(e) => setEditCustomAccent(e.target.value)}
                />
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button disabled={savingEdit} onClick={() => void handleSaveEdit()}>
              {savingEdit && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
