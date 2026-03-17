"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
    <div className="relative flex h-full min-h-0 flex-col">
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
        className="overflow-hidden p-0 md:max-h-[85vh] md:pb-0"
        showCloseButton={false}
        footer={
          <DialogClose asChild>
            <Button variant="outline">
              <span className="text-xs font-mono uppercase tracking-wider">Close</span>
            </Button>
          </DialogClose>
        }
      >
        <DialogTitle className="sr-only">Filter Cards</DialogTitle>

        <GalleryFilterDialogProvider filtersContext={filtersContext}>
          <GalleryFilterDialogLayout />
        </GalleryFilterDialogProvider>
      </DialogContent>
    </Dialog>
  );
}
