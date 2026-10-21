"use client";

import { useRef, useState } from "react";
import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CatalogChapter } from "../registry";
import { CatalogNav } from "./content";

/** Scrolls to an entry and moves focus to its heading link, like a hash jump would. */
export function jumpTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ block: "start" });
  target.querySelector<HTMLElement>("h2 a, h3 a")?.focus({ preventScroll: true });
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
}

export function MobileSectionsSheet({ chapters, active }: { chapters: readonly CatalogChapter[]; active: string | null }) {
  const [open, setOpen] = useState(false);
  const pending = useRef<string | null>(null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <ListTree />
          Sections
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-xs gap-0 overflow-y-auto p-0"
        onCloseAutoFocus={(event) => {
          const id = pending.current;
          pending.current = null;
          if (!id) return;
          // Scroll after the sheet's scroll lock lifts, then hand focus to the target instead of the trigger.
          event.preventDefault();
          jumpTo(id);
        }}
      >
        <SheetHeader className="border-b border-hairline p-4 pr-12">
          <SheetTitle>Sections</SheetTitle>
          <SheetDescription>Jump to a foundation, component or pattern.</SheetDescription>
        </SheetHeader>
        <CatalogNav
          chapters={chapters}
          active={active}
          className="p-4"
          onNavigate={(id) => {
            pending.current = id;
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
