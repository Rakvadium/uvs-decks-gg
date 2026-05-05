"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertTriangle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AdminSetRow } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

const ROW = 48;

type VirtualizedSetsTableProps = {
  rows: AdminSetRow[] | undefined;
  onEdit: (row: AdminSetRow) => void;
};

export function VirtualizedSetsTable({
  rows,
  onEdit,
}: VirtualizedSetsTableProps) {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);
  const list = rows ?? [];
  const rowVirtualizer = useVirtualizer({
    count: list.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW,
    overscan: 10,
    getItemKey: (index) => list[index]?.set._id ?? index,
  });

  if (rows === undefined) {
    return (
      <div className="w-full max-w-full rounded-lg border">
        <div className="space-y-2 p-3">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto_auto_auto] gap-2 border-b pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, r) => (
            <div
              key={r}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto_auto_auto] gap-2"
            >
              {Array.from({ length: 7 }).map((__, c) => (
                <Skeleton key={c} className="h-10" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No sets match the current filters.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-full rounded-lg border">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto_auto_auto] gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <div>Code</div>
          <div>Name</div>
          <div className="text-right">#</div>
          <div className="text-right">Cards</div>
          <div>Status</div>
          <div>Rotates</div>
          <div className="text-right">Edit</div>
        </div>
        <div ref={parentRef} className="max-h-[min(70vh,640px)] overflow-y-auto">
          <div
            className="relative w-full"
            style={{ height: rowVirtualizer.getTotalSize() }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const r = list[virtualRow.index];
              const set = r.set;
              const href = `/admin/sets/${encodeURIComponent(set.code)}`;
              return (
                <div
                  key={virtualRow.key}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    role="link"
                    tabIndex={0}
                    className={cn(
                      "grid h-full w-full cursor-pointer grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto_auto_auto] items-center gap-2 border-b px-3 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
                      virtualRow.index % 2 ? "bg-muted/15" : ""
                    )}
                    onClick={() => router.push(href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(href);
                      }
                    }}
                  >
                    <div className="min-w-0 truncate font-mono text-xs">{set.code}</div>
                    <div className="min-w-0 truncate font-medium">{set.name}</div>
                    <div className="text-right tabular-nums text-xs">
                      {set.setNumber ?? "—"}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-right text-xs tabular-nums">
                      {r.mismatch ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Stored {set.cardCount ?? "—"} vs actual list count{" "}
                              {r.actualListCardCount}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                      {r.actualListCardCount}
                    </div>
                    <div>
                      <Badge
                        variant={set.isFuture ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {set.isFuture ? "Future" : "Released"}
                      </Badge>
                    </div>
                    <div>
                      {set.isRotating ? (
                        <Badge variant="outline" className="text-xs">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(r);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {set.name}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
