"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import {
  AdminPageHeader,
  AdminSetSectionTabs,
  CatalogReleaseDialog,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminSetCardsModel, type AdminSetCardsSort } from "./hook";
import { LoadMoreIndicator } from "@/components/gallery/main-content/load-more-indicator";
import { toast } from "sonner";
import { toastConvexError } from "@/lib/convex-error-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SetAdminCardsProps = {
  setCode: string;
  setName: string;
  breadcrumbs?: ReactNode;
  searchSuffix?: string;
  variant?: "standalone" | "embedded";
};

function parseOptionalId(raw: string): Id<"cards"> | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  return t as Id<"cards">;
}

export default function SetAdminCards({
  setCode,
  setName,
  breadcrumbs,
  searchSuffix = "",
  variant = "standalone",
}: SetAdminCardsProps) {
  const listQuery = searchSuffix;
  const {
    visibleItems,
    hasMore,
    loadMoreRef,
    isLoadingList,
    filteredSorted,
    versionDoc,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    rarityFilter,
    setRarityFilter,
    collectorQ,
    setCollectorQ,
    onlyFront,
    setOnlyFront,
    includeVariants,
    setIncludeVariants,
    sort,
    setSort,
    typeOptions,
    rarityOptions,
    bumpLocalCache,
    scrollRootRef,
  } = useAdminSetCardsModel(setCode, {
    infiniteScrollRoot: variant === "embedded" ? "viewport" : "self",
  });

  const createCard = useMutation(api.admin.createCard);
  const updateCard = useMutation(api.admin.updateCard);
  const deleteCard = useMutation(api.admin.deleteCard);
  const formats = useQuery(api.formats.list);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"cards"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"cards"> | null>(null);

  const deleteWarnings = useQuery(
    api.admin.getCardDeleteWarnings,
    deleteTarget ? { cardId: deleteTarget._id } : "skip"
  );

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formRarity, setFormRarity] = useState("");
  const [formCollector, setFormCollector] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formText, setFormText] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formIsFront, setFormIsFront] = useState(true);
  const [formIsVariant, setFormIsVariant] = useState(false);
  const [formCopyLimit, setFormCopyLimit] = useState("");
  const [formBackId, setFormBackId] = useState("");
  const [formFrontId, setFormFrontId] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormType("");
    setFormRarity("");
    setFormCollector("");
    setFormImage("");
    setFormText("");
    setFormKeywords("");
    setFormIsFront(true);
    setFormIsVariant(false);
    setFormCopyLimit("");
    setFormBackId("");
    setFormFrontId("");
    setSheetOpen(true);
  };

  const openEdit = (c: Doc<"cards">) => {
    setEditing(c);
    setFormName(c.name);
    setFormType(c.type ?? "");
    setFormRarity(c.rarity ?? "");
    setFormCollector(c.collectorNumber ?? "");
    setFormImage(c.imageUrl ?? "");
    setFormText(c.text ?? "");
    setFormKeywords(c.keywords ?? "");
    setFormIsFront(c.isFrontFace !== false);
    setFormIsVariant(c.isVariant === true);
    setFormCopyLimit(c.copyLimit !== undefined ? String(c.copyLimit) : "");
    setFormBackId(c.backCardId ?? "");
    setFormFrontId(c.frontCardId ?? "");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      return;
    }
    setFormBusy(true);
    try {
      const copyLimit =
        formCopyLimit.trim() === "" ? undefined : parseInt(formCopyLimit, 10);
      if (editing) {
        await updateCard({
          cardId: editing._id,
          updates: {
            name: formName.trim(),
            type: formType.trim() || undefined,
            rarity: formRarity.trim() || undefined,
            collectorNumber: formCollector.trim() || undefined,
            imageUrl: formImage.trim() || undefined,
            text: formText.trim() || undefined,
            keywords: formKeywords.trim() || undefined,
            isFrontFace: formIsFront,
            isVariant: formIsVariant,
            copyLimit: Number.isFinite(copyLimit) ? copyLimit : undefined,
            backCardId: parseOptionalId(formBackId),
            frontCardId: parseOptionalId(formFrontId),
            setCode,
            setName,
          },
        });
      } else {
        await createCard({
          card: {
            name: formName.trim(),
            setCode,
            setName,
            type: formType.trim() || undefined,
            rarity: formRarity.trim() || undefined,
            collectorNumber: formCollector.trim() || undefined,
            imageUrl: formImage.trim() || undefined,
            text: formText.trim() || undefined,
            keywords: formKeywords.trim() || undefined,
            isFrontFace: formIsFront,
            isVariant: formIsVariant,
            copyLimit: Number.isFinite(copyLimit) ? copyLimit : undefined,
            backCardId: parseOptionalId(formBackId),
            frontCardId: parseOptionalId(formFrontId),
          },
        });
      }
      setSheetOpen(false);
      bumpLocalCache();
      toast.success(editing ? "Card updated" : "Card created");
    } catch (e) {
      toastConvexError(e, "Could not save card");
    } finally {
      setFormBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setFormBusy(true);
    try {
      await deleteCard({ cardId: deleteTarget._id });
      setDeleteTarget(null);
      bumpLocalCache();
      toast.success("Card deleted");
    } catch (e) {
      toastConvexError(e, "Could not delete card");
    } finally {
      setFormBusy(false);
    }
  };

  const filtersAndTable = (
    <>
        <div className="flex flex-col gap-4 rounded-lg border bg-card/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="adm-card-search">Search</Label>
              <Input
                id="adm-card-search"
                placeholder="Name, text, #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={typeFilter || "__all__"}
                onValueChange={(v) => setTypeFilter(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select
                value={rarityFilter || "__all__"}
                onValueChange={(v) => setRarityFilter(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All rarities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All rarities</SelectItem>
                  {rarityOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adm-collector">Collector # contains</Label>
              <Input
                id="adm-collector"
                value={collectorQ}
                onChange={(e) => setCollectorQ(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="adm-front"
                checked={onlyFront}
                onCheckedChange={(v) => setOnlyFront(v === true)}
              />
              <Label htmlFor="adm-front" className="font-normal">
                Front faces only
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="adm-var"
                checked={includeVariants}
                onCheckedChange={(v) => setIncludeVariants(v === true)}
              />
              <Label htmlFor="adm-var" className="font-normal">
                Include variants
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="adm-sort" className="shrink-0">
                Sort
              </Label>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as AdminSetCardsSort)}
              >
                <SelectTrigger id="adm-sort" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collector_asc">Collector # (asc)</SelectItem>
                  <SelectItem value="collector_desc">Collector # (desc)</SelectItem>
                  <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z–A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="w-full max-w-full overflow-x-auto rounded-lg border">
          {isLoadingList ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="w-full min-w-0 [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-ring [&_button:focus-visible]:ring-offset-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>#</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead className="w-[120px]">Face / variant</TableHead>
                    <TableHead className="w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map((card) => (
                    <TableRow key={card._id}>
                      <TableCell className="font-medium max-w-[240px] truncate">{card.name}</TableCell>
                      <TableCell className="font-mono text-sm">{card.collectorNumber ?? "—"}</TableCell>
                      <TableCell>{card.type ?? "—"}</TableCell>
                      <TableCell>{card.rarity ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {card.isFrontFace === false ? "back" : "front"}
                        {card.isVariant ? " · var" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!formats?.length}
                              >
                                Legality
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(formats ?? []).map((f) => (
                                <DropdownMenuItem key={f._id} asChild>
                                  <Link
                                    href={`/admin/formats/${encodeURIComponent(f.key)}?tab=cards&focusCard=${card._id}`}
                                  >
                                    {f.name}
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(card)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteTarget(card)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {hasMore ? <LoadMoreIndicator loadMoreRef={loadMoreRef} /> : null}
            </div>
          )}
        </div>
    </>
  );

  const cardFormDialog = (
    <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-lg p-0">
        <DialogHeader className="px-4 pt-6 md:px-6">
          <DialogTitle>{editing ? "Edit card" : "Add card"}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4 px-4 md:px-6">
            <div className="space-y-2">
              <Label htmlFor="f-name">Name</Label>
              <Input id="f-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="f-type">Type</Label>
                <Input id="f-type" value={formType} onChange={(e) => setFormType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-rarity">Rarity</Label>
                <Input id="f-rarity" value={formRarity} onChange={(e) => setFormRarity(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-coll">Collector #</Label>
              <Input id="f-coll" value={formCollector} onChange={(e) => setFormCollector(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-img">Image (path or URL)</Label>
              <Input id="f-img" value={formImage} onChange={(e) => setFormImage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-text">Rules text</Label>
              <Input id="f-text" value={formText} onChange={(e) => setFormText(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-kw">Keywords</Label>
              <Input id="f-kw" value={formKeywords} onChange={(e) => setFormKeywords(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-cl">Copy limit</Label>
              <Input id="f-cl" value={formCopyLimit} onChange={(e) => setFormCopyLimit(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="f-back">Back card id</Label>
                <Input id="f-back" value={formBackId} onChange={(e) => setFormBackId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-front">Front card id</Label>
                <Input id="f-front" value={formFrontId} onChange={(e) => setFormFrontId(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="f-frontface"
                checked={formIsFront}
                onCheckedChange={(v) => setFormIsFront(v === true)}
              />
              <Label htmlFor="f-frontface" className="font-normal">
                Front face
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="f-var"
                checked={formIsVariant}
                onCheckedChange={(v) => setFormIsVariant(v === true)}
              />
              <Label htmlFor="f-var" className="font-normal">
                Variant
              </Label>
            </div>
        </DialogBody>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={formBusy}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const deleteDialog = (
    <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This will permanently remove <strong>{deleteTarget.name}</strong>.
                  {(deleteWarnings?.backLinked.length ?? 0) > 0 ? (
                    <span className="mt-2 block text-amber-600 dark:text-amber-400">
                      {deleteWarnings?.backLinked.length} card(s) use this as back face.
                    </span>
                  ) : null}
                  {(deleteWarnings?.frontLinked.length ?? 0) > 0 ? (
                    <span className="mt-2 block text-amber-600 dark:text-amber-400">
                      {deleteWarnings?.frontLinked.length} card(s) use this as front face.
                    </span>
                  ) : null}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={formBusy}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "embedded") {
    return (
      <div id="admin-set-cards" className="space-y-4">
        {filtersAndTable}
        {cardFormDialog}
        {deleteDialog}
      </div>
    );
  }

  return (
    <div ref={scrollRootRef} className="flex min-h-0 flex-col gap-4">
      <AdminPageHeader
        backHref={`/admin/sets${listQuery}`}
        backLabel="Sets"
        breadcrumbs={breadcrumbs}
        title={setName ? `Cards — ${setName}` : `Cards — ${setCode}`}
        description={
          <span>
            Cards for set <span className="font-mono">{setCode}</span>
            {versionDoc ? (
              <>
                {" "}
                · catalog v{versionDoc.version}
              </>
            ) : null}
            .{" "}
            <Link
              href={`/admin/sets/${encodeURIComponent(setCode)}${listQuery}`}
              className="text-primary hover:underline"
            >
              Set overview
            </Link>
            {" · "}
            <Link
              href={`/admin/sets/${encodeURIComponent(setCode)}/import${listQuery}`}
              className="text-primary hover:underline"
            >
              Bulk import
            </Link>
          </span>
        }
        subNav={<AdminSetSectionTabs setCode={setCode} searchSuffix={listQuery} />}
        count={filteredSorted.length}
        countLabel="cards"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={openCreate}>
              Add card
            </Button>
            <CatalogReleaseDialog
              triggerLabel="Release catalog"
              buttonVariant="outline"
            />
          </div>
        }
      />
      <div className="space-y-4 pb-8">{filtersAndTable}</div>
      {cardFormDialog}
      {deleteDialog}
    </div>
  );
}
