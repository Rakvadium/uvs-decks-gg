import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/typography-headings";

/** Minimal full-screen status used by the auth handoff pages. */
export function AuthStatusScreen({
  heading,
  status,
  error,
  children,
}: {
  heading: string;
  status: string;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-background px-6"
      aria-busy={!error}
    >
      <div className="w-full max-w-md space-y-3 text-center">
        <PageHeading size="md">{heading}</PageHeading>
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {children ? <div className="flex flex-col items-center gap-3 pt-2">{children}</div> : null}
      </div>
    </main>
  );
}
