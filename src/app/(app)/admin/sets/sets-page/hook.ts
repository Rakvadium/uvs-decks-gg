import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { AdminSetRow } from "./types";

function startOfDayMs(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDayMs(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function sortDefaultRows(a: AdminSetRow, b: AdminSetRow): number {
  const an = a.set.setNumber;
  const bn = b.set.setNumber;
  if (an != null && bn != null && an !== bn) {
    return bn - an;
  }
  if (an != null && bn == null) {
    return -1;
  }
  if (an == null && bn != null) {
    return 1;
  }
  const at = a.set.releasedAt ?? 0;
  const bt = b.set.releasedAt ?? 0;
  if (at !== bt) {
    return bt - at;
  }
  return a.set.code.localeCompare(b.set.code);
}

export function useAdminSetsListModel() {
  const rows = useQuery(api.sets.listWithCardCountAudit, {});

  const [q, setQ] = useState("");
  const [includeReleased, setIncludeReleased] = useState(true);
  const [includeFuture, setIncludeFuture] = useState(true);
  const [rotatingOnly, setRotatingOnly] = useState(false);
  const [releasedFrom, setReleasedFrom] = useState("");
  const [releasedTo, setReleasedTo] = useState("");

  const filtered = useMemo(() => {
    if (rows === undefined) {
      return undefined;
    }
    const t = q.trim().toLowerCase();
    return rows
      .filter((row) => {
        const s = row.set;
        const released = !s.isFuture;
        const future = s.isFuture === true;
        if (!((includeReleased && released) || (includeFuture && future))) {
          return false;
        }
        if (rotatingOnly && !s.isRotating) {
          return false;
        }
        if (releasedFrom || releasedTo) {
          const r = s.releasedAt;
          if (r === undefined) {
            return false;
          }
          if (releasedFrom) {
            if (r < startOfDayMs(releasedFrom)) {
              return false;
            }
          }
          if (releasedTo) {
            if (r > endOfDayMs(releasedTo)) {
              return false;
            }
          }
        }
        if (t) {
          const inCode = s.code.toLowerCase().includes(t);
          const inName = s.name.toLowerCase().includes(t);
          if (!inCode && !inName) {
            return false;
          }
        }
        return true;
      })
      .sort(sortDefaultRows);
  }, [
    rows,
    q,
    includeReleased,
    includeFuture,
    rotatingOnly,
    releasedFrom,
    releasedTo,
  ]);

  return {
    rawRows: rows,
    rows: filtered,
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
  };
}
