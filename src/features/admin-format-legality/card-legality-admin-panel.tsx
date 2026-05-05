"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
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
import { toast } from "sonner";

type CardLegalityAdminPanelProps = {
  formatKey: string;
  focusCardId: string | null;
};

type SearchTier = "name" | "keywords" | "all";

type StatusFilter = "all" | "banned" | "restricted";

function msToDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CardLegalityAdminPanel({
  formatKey,
  focusCardId,
}: CardLegalityAdminPanelProps) {
  const enriched = useQuery(api.admin.listCardLegalityByFormatEnriched, {
    formatKey,
  });
  const upsert = useMutation(api.admin.upsertCardLegality);
  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tier, setTier] = useState<SearchTier>("name");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQ.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchQ]);

  const searchResults = useQuery(
    api.admin.searchCardsForLegalityAdmin,
    debouncedQ.length > 0
      ? { query: debouncedQ, searchTier: tier, limit: 40 }
      : "skip"
  );

  const filteredEnriched = useMemo(() => {
    if (!enriched) return [];
    if (statusFilter === "all") return enriched;
    return enriched.filter((r) => r.status === statusFilter);
  }, [enriched, statusFilter]);

  useEffect(() => {
    if (!focusCardId) return;
    const el = rowRefs.current.get(focusCardId);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusCardId, filteredEnriched]);

  const persistRow = async (
    cardId: Id<"cards">,
    status: "legal" | "banned" | "restricted",
    copyLimitOverride: number | undefined,
    effectiveDate: number | undefined
  ) => {
    try {
      await upsert({
        formatKey,
        cardId,
        status,
        copyLimitOverride,
        effectiveDate,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="space-y-8 px-1 pb-8">
      <div className="rounded-lg border bg-card/30 p-4 space-y-4">
        <h3 className="text-sm font-medium">Search catalog</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="leg-search">Card search</Label>
            <Input
              id="leg-search"
              placeholder="Name or keywords…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select
              value={tier}
              onValueChange={(v) => setTier(v as SearchTier)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="keywords">Keywords</SelectItem>
                <SelectItem value="all">All text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {debouncedQ && searchResults ? (
          <div className="rounded-md border max-h-[280px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {c.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.setCode ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(v) => {
                          void persistRow(
                            c._id,
                            v as "banned" | "restricted" | "legal",
                            v === "restricted" ? 1 : undefined,
                            undefined
                          );
                        }}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Set status…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banned">Banned</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                          <SelectItem value="legal">Legal (clear)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          void persistRow(c._id, "banned", undefined, undefined)
                        }
                      >
                        Ban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {searchResults.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No matches.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-sm font-medium">Overrides for this format</h3>
          <div className="space-y-2">
            <Label>Filter</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All overrides</SelectItem>
                <SelectItem value="banned">Banned only</SelectItem>
                <SelectItem value="restricted">Restricted only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {enriched === undefined ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading…
          </p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead>Set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Copy cap</TableHead>
                  <TableHead className="min-w-[180px]">Effective (local)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnriched.map((r) => (
                  <TableRow
                    key={r._id}
                    ref={(el) => {
                      if (el) rowRefs.current.set(r.cardId, el);
                      else rowRefs.current.delete(r.cardId);
                    }}
                    className={
                      focusCardId === r.cardId
                        ? "bg-primary/10"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium max-w-[220px] truncate">
                      {r.cardName}
                      <span className="block font-mono text-[10px] text-muted-foreground truncate">
                        {r.cardId}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.cardSetCode ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => {
                          const st = v as "legal" | "banned" | "restricted";
                          void persistRow(
                            r.cardId,
                            st,
                            st === "restricted"
                              ? (r.copyLimitOverride ?? 1)
                              : undefined,
                            st === "legal" ? undefined : r.effectiveDate
                          );
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banned">Banned</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                          <SelectItem value="legal">Legal (clear)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-20 font-mono text-xs"
                        defaultValue={
                          r.copyLimitOverride !== undefined
                            ? String(r.copyLimitOverride)
                            : ""
                        }
                        key={`cap-${r._id}-${r.copyLimitOverride ?? "none"}`}
                        placeholder="1"
                        disabled={r.status !== "restricted"}
                        onBlur={(ev) => {
                          if (r.status !== "restricted") return;
                          const raw = ev.target.value.trim();
                          const n =
                            raw === "" ? 1 : parseInt(raw, 10);
                          if (!Number.isFinite(n)) return;
                          void persistRow(
                            r.cardId,
                            "restricted",
                            n,
                            r.effectiveDate
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="datetime-local"
                        className="font-mono text-xs max-w-[200px]"
                        defaultValue={
                          r.effectiveDate !== undefined
                            ? msToDatetimeLocal(r.effectiveDate)
                            : ""
                        }
                        key={`eff-${r._id}-${r.effectiveDate ?? "none"}`}
                        onBlur={(ev) => {
                          const v = ev.target.value;
                          if (!v.trim()) {
                            void persistRow(
                              r.cardId,
                              r.status,
                              r.copyLimitOverride,
                              undefined
                            );
                            return;
                          }
                          const ms = new Date(v).getTime();
                          if (!Number.isFinite(ms)) return;
                          void persistRow(
                            r.cardId,
                            r.status,
                            r.copyLimitOverride,
                            ms
                          );
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredEnriched.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No rows match this filter.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
