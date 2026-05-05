"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
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
import { Plus } from "lucide-react";

export default function AdminFormatsPageClient() {
  const router = useRouter();
  const formats = useQuery(api.formats.list);

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
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/admin/formats/new">
              <Plus className="h-4 w-4" />
              New format
            </Link>
          </Button>
        }
      />

      {formats.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No formats yet.</p>
          <Button asChild className="mt-4" variant="secondary">
            <Link href="/admin/formats/new">Create a format</Link>
          </Button>
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
