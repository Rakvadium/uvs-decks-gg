"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";

const PARAM = "deprecatedGlobalImport";

export function DeprecatedImportBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const show = searchParams.get(PARAM) === "1";

  const dismiss = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(PARAM);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

  if (!show) {
    return null;
  }

  return (
    <Alert className="relative mb-4 border-primary/30 bg-primary/5 pr-10">
      <Info className="h-4 w-4" />
      <AlertTitle>Global import URL updated</AlertTitle>
      <AlertDescription className="space-y-2 text-foreground/90">
        <p>
          The old <span className="font-mono">/admin/import</span> route is deprecated. Use{" "}
          <strong>Sets</strong>, open a set, then <strong>Import</strong> for set-scoped bulk
          import and job status. Bookmark{" "}
          <span className="font-mono">/admin/import?legacy=1</span> if you need the legacy helper
          page.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={dismiss}>
          Dismiss
        </Button>
      </AlertDescription>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
