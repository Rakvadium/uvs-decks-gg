"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin";
import { Database, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminFormatsPageClient() {
  const router = useRouter();
  const formats = useQuery(api.formats.list);
  const seedFormats = useMutation(api.admin.seedFormats);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedFormats = useCallback(async () => {
    setIsSeeding(true);
    try {
      const result = await seedFormats({});
      toast.success(`Created ${result.created} format(s). Skipped ${result.skipped} (already present; Standard is re-synced when skipped).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setIsSeeding(false);
    }
  }, [seedFormats]);

  const rows = formats
    ? [...formats].sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
    : undefined;

  if (formats === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:h-full">
      <AdminPageHeader
        title="Formats"
        description="Play formats, deck size rules, and sub-formats. Open a row to edit or add a new format."
        count={formats.length}
        countLabel="formats"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isSeeding}
              onClick={() => void handleSeedFormats()}
            >
              <Database className="h-4 w-4" />
              Seed formats
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/admin/formats/new">
                <Plus className="h-4 w-4" />
                New format
              </Link>
            </Button>
          </div>
        }
      />

      {formats.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No formats yet.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              disabled={isSeeding}
              onClick={() => void handleSeedFormats()}
            >
              <Database className="h-4 w-4" />
              Seed default formats
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/formats/new">Create a format</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right tabular-nums">Min</TableHead>
                <TableHead>Sideboard</TableHead>
                <TableHead className="text-right tabular-nums">Copy</TableHead>
                <TableHead>Default</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows?.map((format) => (
                <TableRow
                  key={format._id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/admin/formats/${encodeURIComponent(format.key)}`)
                  }
                >
                  <TableCell className="font-mono text-sm">{format.key}</TableCell>
                  <TableCell className="font-medium">{format.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {format.minDeckSize}
                    {format.maxDeckSize != null ? `–${format.maxDeckSize}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-sm text-muted-foreground">
                    {format.sideboardRule}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {format.defaultCopyLimit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={format.isDefault ? "default" : "secondary"}>
                      {format.isDefault ? "Default" : "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
