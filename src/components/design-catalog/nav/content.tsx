"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Kicker } from "@/components/ui/typography-headings";
import { CATALOG_CHAPTERS, type CatalogChapter, type ChapterGroup } from "../registry";

const GROUP_ORDER: ChapterGroup[] = ["Start", "Foundations", "Components", "Patterns"];

/** The entry nearest the top of the viewport (under the sticky header). */
export function useActiveEntry(watchKey: string | null): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-catalog-entry]"));
    if (nodes.length === 0) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const id = record.target.getAttribute("data-catalog-entry");
          if (!id) continue;
          if (record.isIntersecting) visible.set(id, record.boundingClientRect.top);
          else visible.delete(id);
        }
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (top) setActive(top[0]);
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [watchKey]);
  return active;
}

export function CatalogNav({
  chapters,
  active,
  onNavigate,
  className,
}: {
  chapters: readonly CatalogChapter[];
  active: string | null;
  /** Called instead of the default hash jump (the mobile sheet closes first, then scrolls). */
  onNavigate?: (id: string) => void;
  className?: string;
}) {
  const groups = GROUP_ORDER.map((group) => ({ group, chapters: chapters.filter((chapter) => chapter.group === group) })).filter(
    (row) => row.chapters.length > 0,
  );

  const linkProps = (id: string) => ({
    href: `#${id}`,
    onClick: onNavigate
      ? (event: React.MouseEvent) => {
          event.preventDefault();
          onNavigate(id);
        }
      : undefined,
  });

  return (
    <nav aria-label="Catalog sections" className={cn("space-y-6 text-sm", className)}>
      {groups.map(({ group, chapters: rows }) => (
        <div key={group} className="space-y-2">
          <Kicker size="meta" className="px-2.5">
            {group}
          </Kicker>
          <ul className="space-y-3">
            {rows.map((chapter) => (
              <li key={chapter.id}>
                <a
                  {...linkProps(`chapter-${chapter.id}`)}
                  className="block rounded-md px-2.5 py-1 font-semibold text-foreground outline-none transition-colors duration-150 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {chapter.label}
                </a>
                <ul className="mt-0.5 space-y-px border-l border-hairline pl-2 ml-2.5">
                  {chapter.entries.map((entry) => {
                    const isActive = active === entry.id;
                    return (
                      <li key={entry.id}>
                        <a
                          {...linkProps(entry.id)}
                          aria-current={isActive ? "location" : undefined}
                          className={cn(
                            "-ml-px block rounded-r-md border-l-2 py-1 pl-2.5 pr-2 text-[13px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "border-primary bg-primary-wash text-primary"
                              : "border-transparent text-muted-foreground hover:border-primary-soft hover:text-foreground",
                          )}
                        >
                          {entry.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export const ALL_CHAPTERS = CATALOG_CHAPTERS as readonly CatalogChapter[];
