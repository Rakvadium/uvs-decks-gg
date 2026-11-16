"use client";

import { Button } from "@/components/ui/button";
import { MOBILE_SAFE_BOTTOM } from "@/components/shell/mobile-glass";
import { cn } from "@/lib/utils";
import { useGalleryFilterDialogContext } from "../filter-dialog/context";

export function GalleryMobileFilterFooter({ onClose, inline = false }: { onClose: () => void; inline?: boolean }) {
  const { meta } = useGalleryFilterDialogContext();
  const count = meta.filteredCount;

  return (
    <div className={cn("shrink-0 border-t border-hairline px-4 pt-3", inline ? "pb-3" : MOBILE_SAFE_BOTTOM)}>
      <Button type="button" className="h-11 w-full" onClick={onClose}>
        Show {count.toLocaleString()} {count === 1 ? "card" : "cards"}
      </Button>
    </div>
  );
}
