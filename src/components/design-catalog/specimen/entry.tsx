import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Kicker, SectionHeading } from "@/components/ui/typography-headings";
import { cn } from "@/lib/utils";
import { getEntry, REPO_BLOB_URL } from "../registry";
import { Code } from "./code-block";

/** One catalog entry: anchor, title, source files, the full export list, then its specimens. */
export function CatalogEntrySection({
  id,
  description,
  sourcePaths,
  children,
}: {
  id: string;
  description?: ReactNode;
  /** Extra non-ui source files (shell primitives, CSS) to link next to the title. */
  sourcePaths?: string[];
  children: ReactNode;
}) {
  const entry = getEntry(id);
  const headingId = `${id}-title`;
  const files = [...(entry.ui ?? []).map((ui) => `src/components/ui/${ui.file}`), ...(sourcePaths ?? [])];

  return (
    <article
      id={id}
      aria-labelledby={headingId}
      data-catalog-entry={id}
      className="scroll-mt-36 space-y-5 border-t border-hairline pt-10 first:border-t-0 first:pt-2 lg:scroll-mt-24"
    >
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <SectionHeading as="h3" size="lg" id={headingId}>
            <a
              href={`#${id}`}
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {entry.label}
            </a>
          </SectionHeading>
          {files.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {files.map((file) => (
                <li key={file}>
                  <a
                    href={`${REPO_BLOB_URL}/${file}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground outline-none transition-colors duration-150 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="normal-case tracking-normal">{file}</span>
                    <ExternalLink className="size-3" aria-hidden />
                    <span className="sr-only">(opens GitHub)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {description ? <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</div> : null}
        {entry.ui?.length ? <ExportList id={id} /> : null}
      </header>
      {children}
    </article>
  );
}

function ExportList({ id }: { id: string }) {
  const entry = getEntry(id);
  const documented = (entry.ui ?? []).flatMap((ui) => Object.entries(ui.documentedOnly ?? {}));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Kicker size="meta" className="mr-1">
          Exports
        </Kicker>
        {(entry.ui ?? []).flatMap((ui) =>
          ui.exports.map((name) => (
            <Code key={`${ui.file}:${name}`} className={cn(documented.some(([doc]) => doc === name) && "border-dashed")}>
              {name}
            </Code>
          )),
        )}
      </div>
      {documented.length > 0 ? (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {documented.map(([name, reason]) => (
            <li key={name}>
              <span className="normal-case tracking-normal text-foreground">{name}</span>: {reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A framed canvas on a dot grid, so translucent surfaces and shadows read against something. */
export function Preview({
  label,
  className,
  children,
  plain = false,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
  plain?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-lg border border-hairline bg-background",
        !plain &&
          "bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_10%,transparent)_1px,transparent_0)] [background-size:16px_16px]",
        label ? "px-4 pb-5 pt-9 md:px-6 md:pb-6" : "p-4 md:p-6",
        className,
      )}
    >
      {label ? (
        <Kicker size="meta" className="absolute left-4 top-3 md:left-6">
          {label}
        </Kicker>
      ) : null}
      {children}
    </div>
  );
}

/** Caption under a specimen inside a grid cell. */
export function SpecimenLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[11px] leading-tight text-muted-foreground", className)}>{children}</span>;
}

/**
 * Rows × columns of live specimens. On narrow screens the grid scrolls sideways inside a focusable
 * region instead of squashing the components.
 */
export function SpecimenGrid({
  columns,
  rows,
  label,
  rowHeader = "",
  cellClassName,
}: {
  /** A string, or a title (shown as code) with a role note under it. */
  columns: (string | { title: string; note?: string })[];
  rows: { label: ReactNode; cells: ReactNode[] }[];
  label: string;
  rowHeader?: string;
  cellClassName?: string;
}) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="relative overflow-x-auto rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <table className="w-max min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <th scope="col" className="pb-3 pr-4 align-bottom">
              <Kicker size="meta">{rowHeader}</Kicker>
            </th>
            {columns.map((column) => {
              const { title, note } = typeof column === "string" ? { title: column, note: undefined } : column;
              return (
                <th key={title} scope="col" className="px-3 pb-3 text-left align-bottom">
                  <span className="block whitespace-nowrap text-[11px] font-semibold normal-case tracking-normal text-foreground">
                    {title}
                  </span>
                  {note ? <span className="block text-[11px] font-normal leading-tight text-muted-foreground">{note}</span> : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row" className="border-t border-hairline py-3 pr-4 align-middle text-xs font-medium text-foreground">
                {row.label}
              </th>
              {row.cells.map((cell, cellIndex) => (
                <td key={cellIndex} className={cn("border-t border-hairline px-3 py-3 align-middle", cellClassName)}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
