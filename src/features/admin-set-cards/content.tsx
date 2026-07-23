"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../convex/_generated/dataModel";
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
import { CardFormDialog } from "./card-form";
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

export default function SetAdminCards({
  setCode,
  setName,
  breadcrumbs,
  searchSuffix = "",
  variant = "standalone",
}: SetAdminCardsProps) {
  const listQuery = searchSuffix;
  const {
    sourceCards,
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

  const deleteCard = useMutation(api.admin.deleteCard);
  const revealCard = useMutation(api.admin.revealCard);
  const hideCardReveal = useMutation(api.admin.hideCardReveal);
  const formats = useQuery(api.formats.list);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"cards"> | null>(null);
  const [createBackParent, setCreateBackParent] = useState<Doc<"cards"> | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Doc<"cards"> | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const deleteWarnings = useQuery(
    api.admin.getCardDeleteWarnings,
    deleteTarget ? { cardId: deleteTarget._id } : "skip"
  );

  const pickerCards = useMemo(
    () =>
      sourceCards.map((c) => ({
        _id: c._id,
        name: c.name,
        collectorNumber: c.collectorNumber,
        isFrontFace: c.isFrontFace,
      })),
    [sourceCards]
  );

  const openCreate = () => {
    setEditing(null);
    setCreateBackParent(null);
    setSheetOpen(true);
  };

  const openEdit = (c: Doc<"cards">) => {
    setEditing(c);
    setCreateBackParent(null);
    setSheetOpen(true);
  };

  const handleDialogOpenChange = (next: boolean) => {
    setSheetOpen(next);
    if (!next) {
      setCreateBackParent(null);
    }
  };

  const handleRequestCreateBackFace = (front: Doc<"cards">) => {
    setEditing(null);
    setCreateBackParent(front);
    setSheetOpen(true);
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

  const handleRevealCard = async (card: Doc<"cards">) => {
    setFormBusy(true);
    try {
      await revealCard({ cardId: card._id });
      bumpLocalCache();
      toast.success("Card revealed");
    } catch (e) {
      toastConvexError(e, "Could not reveal card");
    } finally {
      setFormBusy(false);
    }
  };

  const handleHideCardReveal = async (card: Doc<"cards">) => {
    setFormBusy(true);
    try {
      await hideCardReveal({ cardId: card._id });
      bumpLocalCache();
      toast.success("Card hidden from public reveal");
    } catch (e) {
      toastConvexError(e, "Could not hide card");
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
                    <TableHead className="w-[140px]">Reveal</TableHead>
                    <TableHead className="w-[280px] text-right">Actions</TableHead>
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
                      <TableCell className="text-xs">
                        {card.isRevealHidden === true ? (
                          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-mono uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            Unrevealed
                          </span>
                        ) : card.revealedAt ? (
                          <span className="text-muted-foreground">
                            {new Date(card.revealedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Visible</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {card.isRevealHidden === true ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={formBusy}
                              onClick={() => void handleRevealCard(card)}
                            >
                              Reveal
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={formBusy}
                              onClick={() => void handleHideCardReveal(card)}
                            >
                              Hide
                            </Button>
                          )}
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
    <CardFormDialog
      open={sheetOpen}
      onOpenChange={handleDialogOpenChange}
      editing={editing}
      setCode={setCode}
      setName={setName}
      pickerCards={pickerCards}
      linkAsBackOf={createBackParent?._id ?? null}
      presetBackFace={createBackParent != null}
      typeOptions={typeOptions}
      rarityOptions={rarityOptions}
      onSaved={bumpLocalCache}
      onRequestCreateBackFace={handleRequestCreateBackFace}
    />
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
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={openCreate}>
            Add card
          </Button>
        </div>
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
