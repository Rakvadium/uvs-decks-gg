"use client";

import { Switch } from "@/components/ui/switch";
import { STANDARD_FORMAT_KEY } from "../../../../shared/standard-rotation";
import { useGalleryFilterDialogContext } from "./context";

export function StandardNextRotationToggle({ className }: { className?: string }) {
  const { filters, meta, actions } = useGalleryFilterDialogContext();
  const activeFormat = filters.format ?? meta.defaultFormatKey ?? STANDARD_FORMAT_KEY;
  if (activeFormat !== STANDARD_FORMAT_KEY) return null;

  const checked = filters.standardNextRotation === true;

  return (
    <div className={className ?? "flex items-center justify-between gap-3"}>
      <div className="min-w-0">
        <p className="chrome-label-case text-[10px] text-muted-foreground">Next rotation</p>
        <p className="text-[10px] text-muted-foreground">
          Cards that leave Standard at the next rotation
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(next) =>
          actions.updateFilter("standardNextRotation", next ? true : undefined)
        }
        aria-label="Show cards that leave Standard at the next rotation"
      />
    </div>
  );
}
