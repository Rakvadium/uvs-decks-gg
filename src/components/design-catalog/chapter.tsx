"use client";

import type { ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kicker, SectionHeading } from "@/components/ui/typography-headings";
import { useCatalogAppearance } from "./appearance/context";
import type { CatalogChapter } from "./registry";

export function ChapterSection({ chapter, number, children }: { chapter: CatalogChapter; number: number; children: ReactNode }) {
  const { focus, setFocus, hrefWith } = useCatalogAppearance();
  const headingId = `chapter-${chapter.id}-title`;

  return (
    <section id={`chapter-${chapter.id}`} aria-labelledby={headingId} className="scroll-mt-36 lg:scroll-mt-24">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-surface pb-5">
        <div className="min-w-0 max-w-3xl space-y-2">
          <Kicker tone="primary">
            {chapter.group} · {String(number).padStart(2, "0")}
          </Kicker>
          <SectionHeading id={headingId} size="xl">
            {chapter.label}
          </SectionHeading>
          <p className="text-sm leading-relaxed text-muted-foreground">{chapter.summary}</p>
        </div>
        {focus !== chapter.id ? (
          <Button variant="outline" size="sm" asChild>
            <a
              href={hrefWith({ focus: chapter.id })}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                setFocus(chapter.id);
                window.scrollTo({ top: 0 });
              }}
            >
              <Maximize2 />
              Show alone
            </a>
          </Button>
        ) : null}
      </header>
      <div className="space-y-12">{children}</div>
    </section>
  );
}
