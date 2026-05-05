"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { AlertTriangle, Pencil, Rocket } from "lucide-react";
import {
  AdminPageHeader,
  AdminSetSectionTabs,
  CatalogReleaseDialog,
} from "@/components/admin";
import { AdminSetBreadcrumbs } from "../admin-set-breadcrumbs";
import { EditSetDialog } from "../sets-page/edit-set-dialog";
import type { AdminSetRow } from "../sets-page/types";
import SetAdminCards from "@/features/admin-set-cards/content";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminSetDetailPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = typeof params.code === "string" ? params.code : "";
  const set = useQuery(api.sets.getByCode, code ? { code } : "skip");
  const audit = useQuery(
    api.sets.getSetCardCountAudit,
    code ? { code } : "skip"
  );
  const catalogVersion = useQuery(api.admin.getCardDataVersion, {});
  const updateSet = useMutation(api.admin.updateSet);
  const listSearch = searchParams.get("search");
  const listQuery =
    listSearch !== null && listSearch !== ""
      ? `?search=${encodeURIComponent(listSearch)}`
      : "";
  const [releasing, setReleasing] = useState(false);
  const [releaseStatusMsg, setReleaseStatusMsg] = useState("");
  const [editRow, setEditRow] = useState<AdminSetRow | null>(null);

  useEffect(() => {
    const id = "admin-set-cards";
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${id}`) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  }, [set?._id]);

  if (!code) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Missing set code.</p>
        <Link href="/admin/sets" className="text-primary hover:underline">
          Back to sets
        </Link>
      </div>
    );
  }

  if (set === undefined || audit === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 max-w-sm animate-pulse rounded-md bg-muted" />
        <div className="h-4 max-w-md animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-lg border border-dashed" />
          <div className="h-40 rounded-lg border border-dashed" />
        </div>
      </div>
    );
  }

  if (set === null) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          No set found for code <span className="font-mono">{code}</span>.
        </p>
        <Link href="/admin/sets" className="text-primary hover:underline">
          Back to sets
        </Link>
      </div>
    );
  }

  const importHref = `/admin/sets/${encodeURIComponent(set.code)}/import${listQuery}`;

  const onRelease = async () => {
    setReleasing(true);
    try {
      await updateSet({
        setId: set._id,
        isFuture: false,
        releasedAt: set.releasedAt ?? Date.now(),
      });
      const msg = "Set marked as released";
      setReleaseStatusMsg(msg);
      window.setTimeout(() => setReleaseStatusMsg(""), 5000);
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update set");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {releaseStatusMsg}
      </div>
      <AdminPageHeader
        backHref={`/admin/sets${listQuery}`}
        backLabel="Sets"
        breadcrumbs={
          <AdminSetBreadcrumbs setCode={set.code} setName={set.name} tail={null} />
        }
        title={set.name}
        description={
          <div className="space-y-1">
            <p className="font-mono text-sm text-muted-foreground">{set.code}</p>
            {set.updatedAt ? (
              <p className="text-xs text-muted-foreground">
                Updated {new Date(set.updatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        }
        subNav={<AdminSetSectionTabs setCode={set.code} searchSuffix={listQuery} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                setEditRow({
                  set,
                  actualListCardCount: audit?.actualListCardCount ?? 0,
                  mismatch: audit?.mismatch ?? false,
                })
              }
            >
              <Pencil className="h-4 w-4" />
              Edit set
            </Button>
            {set.isFuture ? (
              <Button
                type="button"
                size="sm"
                className="gap-2"
                onClick={onRelease}
                disabled={releasing}
              >
                <Rocket className="h-4 w-4" />
                Mark released
              </Button>
            ) : null}
          </div>
        }
      />
      <EditSetDialog
        row={editRow}
        onOpenChange={(open) => {
          if (!open) {
            setEditRow(null);
          }
        }}
      />

      {audit?.mismatch ? (
        <Alert className="border-amber-500/50 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Card count mismatch</AlertTitle>
          <AlertDescription>
            Stored count is {set.cardCount ?? "unset"} but the catalog lists{" "}
            {audit.actualListCardCount} main cards for this set. Counts refresh when
            cards are added, removed, or moved.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2 text-sm">
        <Badge variant={set.isFuture ? "secondary" : "default"}>
          {set.isFuture ? "Future" : "Released"}
        </Badge>
        {set.isRotating ? (
          <Badge variant="outline" className="font-normal">
            Rotating
          </Badge>
        ) : null}
        {set.setNumber != null ? (
          <span className="text-muted-foreground">
            Set #{" "}
            <span className="tabular-nums text-foreground">{set.setNumber}</span>
          </span>
        ) : null}
        {set.releasedAt != null ? (
          <span className="text-muted-foreground">
            Released{" "}
            <span className="text-foreground">
              {new Date(set.releasedAt).toLocaleDateString()}
            </span>
          </span>
        ) : null}
        <span className="text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">
            {audit?.actualListCardCount ?? "—"}
          </span>{" "}
          list cards
        </span>
        {set.cardCount != null && set.cardCount !== audit?.actualListCardCount ? (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            stored count {set.cardCount}
          </span>
        ) : null}
        {set.legality ? (
          <span
            className="max-w-[min(100%,14rem)] truncate text-xs text-muted-foreground"
            title={set.legality}
          >
            {set.legality}
          </span>
        ) : null}
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <span className="text-xs text-muted-foreground">
            Catalog v
            <span className="tabular-nums">
              {catalogVersion != null ? catalogVersion.version : "—"}
            </span>
            {catalogVersion != null ? (
              <>
                {" "}
                · {catalogVersion.cardCount.toLocaleString()} published
              </>
            ) : null}
          </span>
          <CatalogReleaseDialog triggerLabel="Publish catalog" buttonSize="sm" />
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/formats">Formats</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={importHref}>Import JSON</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Cards</h2>
        <SetAdminCards
          variant="embedded"
          setCode={set.code}
          setName={set.name}
          searchSuffix={listQuery}
        />
      </div>
    </div>
  );
}
