"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { useCardReferenceData } from "@/lib/universus/card-data-provider";
import { cn } from "@/lib/utils";
import {
  STANDARD_FORMAT_KEY,
  buildRotationSnapshot,
  showsFutureTag,
  showsRotatingTag,
} from "../../../shared/standard-rotation";
import { useUtcDayNumber, utcNoonFromDayNumber } from "@/lib/universus/use-utc-day";

export function useCardReleaseTags(setCode: string | undefined): {
  future: boolean;
  rotating: boolean;
} {
  const { getSetByCode, sets } = useCardReferenceData();
  const gallery = useGalleryFiltersOptional();
  const rotationDay = useUtcDayNumber();
  const snapshot = useMemo(
    () => buildRotationSnapshot(sets, utcNoonFromDayNumber(rotationDay)),
    [sets, rotationDay]
  );
  const set = setCode ? getSetByCode(setCode) : undefined;
  const formatKey = gallery?.state.effectiveFormat;
  const nextRotationFilter =
    gallery?.state.filters.standardNextRotation === true && formatKey === STANDARD_FORMAT_KEY;

  return {
    future: showsFutureTag(set, snapshot.now),
    rotating: showsRotatingTag({
      set,
      snapshot,
      formatKey,
      nextRotationFilter,
    }),
  };
}

export function CardReleaseTags({
  setCode,
  className,
  overlay = false,
}: {
  setCode?: string;
  className?: string;
  overlay?: boolean;
}) {
  const { future, rotating } = useCardReleaseTags(setCode);
  if (!future && !rotating) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-1",
        overlay && "pointer-events-none absolute right-1.5 top-1.5 z-10",
        className
      )}
    >
      {future ? (
        <Badge tone="info" className="px-1.5 py-0 text-[10px]">
          Future
        </Badge>
      ) : null}
      {rotating ? (
        <Badge tone="warning" className="px-1.5 py-0 text-[10px]">
          Rotating
        </Badge>
      ) : null}
    </div>
  );
}
