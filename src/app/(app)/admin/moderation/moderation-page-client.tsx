"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { AdminContentSubNav, AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function AdminModerationPageClient() {
  const assets = useQuery(api.mediaAssets.listMediaAssetsNeedingReview);
  const approve = useMutation(api.mediaAssets.approveMediaAssetReview);
  const reject = useMutation(api.mediaAssets.rejectMediaAssetReview);
  const [busyId, setBusyId] = useState<Id<"mediaAssets"> | null>(null);

  const run = async (assetId: Id<"mediaAssets">, action: "approve" | "reject") => {
    setBusyId(assetId);
    try {
      if (action === "approve") {
        await approve({ assetId });
        toast.success("Asset approved and finalized.");
      } else {
        await reject({ assetId });
        toast.success("Asset rejected.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Action failed";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Media review"
        description="Image uploads flagged for human review. Approve finalizes the asset like automatic approval (e.g. team logo on the team). Reject does not attach the file."
        backHref="/admin/content"
        backLabel="Content"
        subNav={<AdminContentSubNav />}
      />

      <div className="rounded-lg border">
          {assets === undefined ? (
            <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading…</div>
          ) : assets.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">No assets need review.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Preview</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      {row.previewUrl ? (
                        <img
                          src={row.previewUrl}
                          alt=""
                          className="h-20 w-20 rounded-md object-cover border bg-muted"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-md border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{row.kind}</TableCell>
                    <TableCell>{row.teamName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {row.moderationProvider ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busyId === row._id}
                          onClick={() => void run(row._id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === row._id}
                          onClick={() => void run(row._id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>
    </div>
  );
}
