"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGalleryFiltersOptional } from "@/providers/GalleryFiltersProvider";
import { GalleryFilterDialogBody } from "./body";
import { GalleryFilterDialogProvider } from "./context";
import { GalleryFilterDialogHeader } from "./header";

interface GalleryFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function GalleryFilterDialogLayout() {
  return (
    <div className="relative flex h-full flex-col pb-20 md:pb-0">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <GalleryFilterDialogHeader />
      <GalleryFilterDialogBody />
    </div>
  );
}

export function GalleryFilterDialog({
  open,
  onOpenChange,
}: GalleryFilterDialogProps) {
  const filtersContext = useGalleryFiltersOptional();

  if (!filtersContext) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="max-h-[85vh] overflow-hidden p-0 md:pb-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Filter Cards</DialogTitle>

        <GalleryFilterDialogProvider filtersContext={filtersContext}>
          <GalleryFilterDialogLayout />
        </GalleryFilterDialogProvider>

        <DialogFooter className="md:hidden">
          <DialogClose asChild>
            <div className="flex w-full items-center justify-end">
              <Button className="ml-auto gap-2">
                <span className="text-xs font-mono uppercase tracking-wider">Close</span>
              </Button>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
