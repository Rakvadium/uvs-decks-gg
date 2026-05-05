"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
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

type FormatDoc = Doc<"formats">;

type SubFormRow = { key: string; name: string };

const defaultCreateState = {
  key: "",
  name: "",
  description: "",
  isDefault: false,
  minDeckSize: 60,
  maxDeckSize: "" as string,
  sideboardRule: "optional",
  defaultCopyLimit: 4,
  requiresStartingCharacter: true,
  requiresIdentity: false,
  subFormats: [] as SubFormRow[],
};

function docToState(f: FormatDoc) {
  return {
    key: f.key,
    name: f.name,
    description: f.description ?? "",
    isDefault: f.isDefault,
    minDeckSize: f.minDeckSize,
    maxDeckSize: f.maxDeckSize !== undefined && f.maxDeckSize !== null ? String(f.maxDeckSize) : "",
    sideboardRule: f.sideboardRule,
    defaultCopyLimit: f.defaultCopyLimit,
    requiresStartingCharacter: f.requiresStartingCharacter,
    requiresIdentity: f.requiresIdentity,
    subFormats: f.subFormats?.map((s) => ({ key: s.key, name: s.name })) ?? [],
  };
}

type FormatFormContentProps = {
  mode: "create" | "edit";
  format?: FormatDoc | null;
};

function normalizeKeyInput(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

function validateKey(key: string) {
  if (!key.length) {
    return "Key is required";
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    return "Use a lowercase key with letters, numbers, and hyphens (e.g. my-format)";
  }
  return null;
}

export function FormatFormContent({ mode, format }: FormatFormContentProps) {
  const router = useRouter();
  const createFormat = useMutation(api.admin.createFormat);
  const updateFormat = useMutation(api.admin.updateFormat);
  const [submitting, setSubmitting] = useState(false);
  const [s, setS] = useState(
    () =>
      mode === "create"
        ? { ...defaultCreateState }
        : { ...defaultCreateState, ...docToState(format as FormatDoc) }
  );

  useEffect(() => {
    if (mode === "edit" && format) {
      setS(docToState(format));
    }
  }, [mode, format]);

  const setField = <K extends keyof typeof s>(key: K, value: (typeof s)[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
  };

  const addSubForm = () => {
    setS((prev) => ({
      ...prev,
      subFormats: [...prev.subFormats, { key: "", name: "" }],
    }));
  };

  const removeSubForm = (i: number) => {
    setS((prev) => ({
      ...prev,
      subFormats: prev.subFormats.filter((_, j) => j !== i),
    }));
  };

  const patchSubForm = (i: number, field: "key" | "name", value: string) => {
    setS((prev) => ({
      ...prev,
      subFormats: prev.subFormats.map((row, j) =>
        j === i ? { ...row, [field]: value } : row
      ),
    }));
  };

  const parseForm = () => {
    const key = mode === "create" ? normalizeKeyInput(s.key) : (format as FormatDoc).key;
    const name = s.name.trim();
    if (!name) {
      return { error: "Name is required" as const };
    }
    if (mode === "create") {
      const kErr = validateKey(key);
      if (kErr) {
        return { error: kErr } as const;
      }
    }
    const minD = s.minDeckSize;
    if (!Number.isFinite(minD) || minD < 1) {
      return { error: "Minimum deck size must be at least 1" } as const;
    }
    const maxS = s.maxDeckSize.trim();
    let maxD: number | undefined;
    if (maxS) {
      const n = parseInt(maxS, 10);
      if (Number.isNaN(n) || n < 1) {
        return { error: "Max deck size must be a positive number" } as const;
      }
      maxD = n;
      if (maxD < minD) {
        return { error: "Max deck size cannot be less than minimum" } as const;
      }
    }
    if (!s.sideboardRule.trim()) {
      return { error: "Sideboard rule is required" } as const;
    }
    if (!Number.isFinite(s.defaultCopyLimit) || s.defaultCopyLimit < 1) {
      return { error: "Default copy limit must be at least 1" } as const;
    }
    const subKeySet = new Set<string>();
    for (const row of s.subFormats) {
      const sk = row.key.trim();
      if (!sk && !row.name.trim()) {
        continue;
      }
      if (!sk) {
        return { error: "Each sub-format needs a key" } as const;
      }
      if (!row.name.trim()) {
        return { error: "Each sub-format needs a name" } as const;
      }
      const nk = normalizeKeyInput(sk);
      if (subKeySet.has(nk)) {
        return { error: `Duplicate sub-format key: ${nk}` } as const;
      }
      subKeySet.add(nk);
    }
    const subFormatsList = s.subFormats
      .map((row) => ({
        key: normalizeKeyInput(row.key),
        name: row.name.trim(),
      }))
      .filter((row) => row.key && row.name);
    const desc = s.description.trim();
    return {
      data: {
        key,
        name,
        description: desc,
        isDefault: s.isDefault,
        minDeckSize: minD,
        maxDeckSize: maxD,
        sideboardRule: s.sideboardRule.trim(),
        defaultCopyLimit: s.defaultCopyLimit,
        requiresStartingCharacter: s.requiresStartingCharacter,
        requiresIdentity: s.requiresIdentity,
        subFormats: subFormatsList,
      },
    } as const;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseForm();
    if ("error" in parsed) {
      toast.error(parsed.error);
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        await createFormat({
          key: parsed.data.key,
          name: parsed.data.name,
          description: parsed.data.description || undefined,
          isDefault: parsed.data.isDefault,
          minDeckSize: parsed.data.minDeckSize,
          maxDeckSize: parsed.data.maxDeckSize,
          sideboardRule: parsed.data.sideboardRule,
          defaultCopyLimit: parsed.data.defaultCopyLimit,
          requiresStartingCharacter: parsed.data.requiresStartingCharacter,
          requiresIdentity: parsed.data.requiresIdentity,
          subFormats: parsed.data.subFormats.length > 0 ? parsed.data.subFormats : undefined,
        });
        toast.success("Format created");
        router.push(`/admin/formats/${encodeURIComponent(parsed.data.key)}`);
      } else if (format) {
        await updateFormat({
          formatId: format._id,
          name: parsed.data.name,
          description: parsed.data.description,
          isDefault: parsed.data.isDefault,
          minDeckSize: parsed.data.minDeckSize,
          maxDeckSize: parsed.data.maxDeckSize,
          sideboardRule: parsed.data.sideboardRule,
          defaultCopyLimit: parsed.data.defaultCopyLimit,
          requiresStartingCharacter: parsed.data.requiresStartingCharacter,
          requiresIdentity: parsed.data.requiresIdentity,
          subFormats: parsed.data.subFormats,
        });
        toast.success("Format saved");
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6 pb-8">
      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor="format-key">Key</Label>
          <Input
            id="format-key"
            value={s.key}
            onChange={(e) => setField("key", e.target.value)}
            placeholder="e.g. my-format"
            className="font-mono"
            autoComplete="off"
          />
          <p className="text-sm text-muted-foreground">
            Stable identifier in URLs and data. Lowercase, hyphens allowed.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Key</p>
          <p className="font-mono text-sm">{format?.key}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="format-name">Name</Label>
        <Input
          id="format-name"
          value={s.name}
          onChange={(e) => setField("name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="format-desc">Description</Label>
        <Textarea
          id="format-desc"
          value={s.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Default format</p>
          <p className="text-sm text-muted-foreground">
            Only one can be default. Enabling this clears default on other formats. Turning it off
            promotes another if needed.
          </p>
        </div>
        <Switch
          checked={s.isDefault}
          onCheckedChange={(c) => setField("isDefault", c)}
          disabled={submitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="min-deck">Min main deck</Label>
          <Input
            id="min-deck"
            type="number"
            min={1}
            value={s.minDeckSize}
            onChange={(e) => setField("minDeckSize", parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-deck">Max main deck (optional)</Label>
          <Input
            id="max-deck"
            type="number"
            min={1}
            value={s.maxDeckSize}
            onChange={(e) => setField("maxDeckSize", e.target.value)}
            placeholder="No cap"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sideboard">Sideboard rule</Label>
        <Input
          id="sideboard"
          value={s.sideboardRule}
          onChange={(e) => setField("sideboardRule", e.target.value)}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground">
          Examples: <span className="font-mono">optional</span>,{" "}
          <span className="font-mono">exact:15</span>, <span className="font-mono">max:10</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="copy-limit">Default copy limit</Label>
        <Input
          id="copy-limit"
          type="number"
          min={1}
          value={s.defaultCopyLimit}
          onChange={(e) => setField("defaultCopyLimit", parseInt(e.target.value, 10) || 0)}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium">Requires starting character</span>
        <Switch
          checked={s.requiresStartingCharacter}
          onCheckedChange={(c) => setField("requiresStartingCharacter", c)}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium">Requires identity (symbol) selection</span>
        <Switch
          checked={s.requiresIdentity}
          onCheckedChange={(c) => setField("requiresIdentity", c)}
          disabled={submitting}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Sub-formats (optional)</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addSubForm}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {s.subFormats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sub-formats. Example: &quot;competitive&quot; / &quot;Competitive&quot;.</p>
        ) : (
          <ul className="space-y-2">
            {s.subFormats.map((row, i) => (
              <li
                key={i}
                className="flex flex-wrap items-end gap-2 rounded-md border border-border/60 p-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs">Key</Label>
                  <Input
                    value={row.key}
                    onChange={(e) => patchSubForm(i, "key", e.target.value)}
                    className="font-mono h-8 text-sm"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={row.name}
                    onChange={(e) => patchSubForm(i, "name", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => removeSubForm(i)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        {mode === "create" ? "Create format" : "Save changes"}
      </Button>
    </form>
  );
}

type FormatDeleteSectionProps = {
  format: FormatDoc;
};

export function FormatDeleteSection({ format }: FormatDeleteSectionProps) {
  const router = useRouter();
  const blockers = useQuery(api.admin.getFormatDeleteBlockers, { formatId: format._id });
  const del = useMutation(api.admin.deleteFormat);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canDelete =
    blockers === undefined
      ? false
      : blockers === null
        ? false
        : blockers.cardLegalityCount === 0 &&
          blockers.setLegalityCount === 0 &&
          blockers.deckCount === 0;

  const onConfirm = async () => {
    setBusy(true);
    try {
      await del({ formatId: format._id });
      toast.success("Format deleted");
      setOpen(false);
      router.push("/admin/formats");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="text-sm font-medium text-destructive">Delete format</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently remove this format. Blocked if any decks, card legality, or set legality rows
        reference it.
      </p>
      {blockers === undefined ? (
        <p className="mt-3 text-sm text-muted-foreground">Checking dependencies…</p>
      ) : blockers === null ? null : (
        <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
          <li>Card legality entries: {blockers.cardLegalityCount}</li>
          <li>Set legality entries: {blockers.setLegalityCount}</li>
          <li>Decks: {blockers.deckCount}</li>
        </ul>
      )}
      <div className="mt-4">
        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpen(true)}
          disabled={!canDelete || blockers === undefined}
        >
          Delete format
        </Button>
        {!canDelete && blockers && blockers !== null ? (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
            Remove dependencies before delete is allowed.
          </p>
        ) : null}
      </div>
      <AlertDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this format?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-mono text-foreground">{format.name}</span> (
              <span className="font-mono">{format.key}</span>). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void onConfirm()}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
