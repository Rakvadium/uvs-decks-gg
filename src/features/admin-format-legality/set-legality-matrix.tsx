"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

function effectiveSetLegal(
  entry: Doc<"setLegality"> | undefined,
  now: number
): boolean {
  if (!entry) return true;
  if (entry.rotatesOutAt !== undefined && entry.rotatesOutAt < now) {
    return false;
  }
  return entry.isLegal;
}

function msToDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type SetLegalityMatrixProps = {
  formatKey: string;
};

export function SetLegalityMatrix({ formatKey }: SetLegalityMatrixProps) {
  const sets = useQuery(api.sets.list);
  const rows = useQuery(api.admin.listSetLegalityByFormat, { formatKey });
  const upsert = useMutation(api.admin.upsertSetLegality);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const byCode = useMemo(() => {
    const m = new Map<string, Doc<"setLegality">>();
    if (!rows) return m;
    for (const r of rows) {
      m.set(r.setCode, r);
    }
    return m;
  }, [rows]);

  const sortedSets = useMemo(() => {
    if (!sets) return [];
    return [...sets].sort((a, b) => {
      const an = a.setNumber ?? -1;
      const bn = b.setNumber ?? -1;
      if (bn !== an) return bn - an;
      return a.code.localeCompare(b.code);
    });
  }, [sets]);

  const now = Date.now();

  const persist = async (
    setCode: string,
    nextLegal: boolean,
    rotatesOutAt: number | undefined
  ) => {
    setBusyCode(setCode);
    try {
      await upsert({
        formatKey,
        setCode,
        isLegal: nextLegal,
        rotatesOutAt,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyCode(null);
    }
  };

  if (sets === undefined || rows === undefined) {
    return (
      <div className="animate-pulse px-1 py-8 text-sm text-muted-foreground">
        Loading sets…
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1">
      <p className="text-sm text-muted-foreground">
        Overrides default set inclusion for this format. After the rotation
        timestamp, the set is treated as not legal regardless of the toggle,
        using the same clock as deck validation.
      </p>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Set</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="whitespace-nowrap">Legal now</TableHead>
              <TableHead className="min-w-[200px]">
                Rotates out (local)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSets.map((s) => {
              const entry = byCode.get(s.code);
              const legal = effectiveSetLegal(entry, now);
              const rotVal =
                entry?.rotatesOutAt !== undefined
                  ? msToDatetimeLocal(entry.rotatesOutAt)
                  : "";

              return (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-sm">{s.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={legal}
                        disabled={busyCode === s.code}
                        onCheckedChange={(on) => {
                          if (on) {
                            void persist(s.code, true, undefined);
                          } else {
                            void persist(s.code, false, undefined);
                          }
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {legal ? "yes" : "no"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="datetime-local"
                      className="font-mono text-xs max-w-[220px]"
                      defaultValue={rotVal}
                      key={`${s.code}-${rotVal}`}
                      disabled={busyCode === s.code}
                      onBlur={(ev) => {
                        const v = ev.target.value;
                        if (!v.trim()) {
                          if (entry?.rotatesOutAt !== undefined) {
                            void persist(
                              s.code,
                              entry.isLegal,
                              undefined
                            );
                          }
                          return;
                        }
                        const ms = new Date(v).getTime();
                        if (!Number.isFinite(ms)) return;
                        void persist(
                          s.code,
                          entry?.isLegal ?? true,
                          ms
                        );
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
