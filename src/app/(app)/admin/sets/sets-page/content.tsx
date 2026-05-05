"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddSetDialog } from "./add-set-dialog";
import { EditSetDialog } from "./edit-set-dialog";
import { useAdminSetsListModel } from "./hook";
import type { AdminSetRow } from "./types";
import { VirtualizedSetsTable } from "./virtualized-sets-table";
import { DeprecatedImportBanner } from "./deprecated-import-banner";
import { Plus } from "lucide-react";

export default function AdminSetsPageContent() {
  const {
    rawRows,
    rows,
    q,
    setQ,
    includeReleased,
    setIncludeReleased,
    includeFuture,
    setIncludeFuture,
    rotatingOnly,
    setRotatingOnly,
    releasedFrom,
    setReleasedFrom,
    releasedTo,
    setReleasedTo,
  } = useAdminSetsListModel();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSetRow | null>(null);

  const count = rawRows === undefined ? null : rawRows.length;

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <DeprecatedImportBanner />
      <AdminPageHeader
        backHref="/admin"
        backLabel="Admin"
        title="Sets"
        description="Manage card sets"
        count={count}
        countLabel="sets"
        actions={
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add set
          </Button>
        }
        search={
          <div className="flex w-full max-w-4xl flex-col gap-4 rounded-lg border bg-card/40 p-4">
            <Input
              placeholder="Search code or name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-md"
            />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="f-rel"
                  checked={includeReleased}
                  onCheckedChange={(v) => setIncludeReleased(v === true)}
                />
                <Label htmlFor="f-rel" className="font-normal">
                  Released
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="f-fut"
                  checked={includeFuture}
                  onCheckedChange={(v) => setIncludeFuture(v === true)}
                />
                <Label htmlFor="f-fut" className="font-normal">
                  Future
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="f-rot"
                  checked={rotatingOnly}
                  onCheckedChange={(v) => setRotatingOnly(v === true)}
                />
                <Label htmlFor="f-rot" className="font-normal">
                  Rotating only
                </Label>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Released from
                </Label>
                <Input
                  type="date"
                  value={releasedFrom}
                  onChange={(e) => setReleasedFrom(e.target.value)}
                  className="w-[10rem]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">through</Label>
                <Input
                  type="date"
                  value={releasedTo}
                  onChange={(e) => setReleasedTo(e.target.value)}
                  className="w-[10rem]"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className="min-h-0 flex-1">
        <VirtualizedSetsTable
          rows={rows}
          onEdit={(r) => setEditing(r)}
        />
      </div>

      <AddSetDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditSetDialog
        row={editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      />
    </div>
  );
}
