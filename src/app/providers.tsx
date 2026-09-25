"use client";

import { ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthDialogProvider } from "@/components/auth/auth-dialog";
import { SilentSso } from "@/components/auth/silent-sso";
import { CardDataProvider } from "@/lib/universus/card-data-provider";
import { ColorSchemeProvider } from "@/providers/ColorSchemeProvider";
import { installUnsavedChangesWarning } from "@/lib/navigation/leave-page";

// Convex's own warning fires for any in-flight request, including background mutations during
// auth redirects; ours skips intentional navigations (see leave-page.ts).
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});
installUnsavedChangesWarning(convex);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <SilentSso />
      <LazyMotion features={domAnimation} strict>
        <ColorSchemeProvider>
          <AuthDialogProvider>
            <CardDataProvider>
              <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </CardDataProvider>
          </AuthDialogProvider>
          <Toaster />
        </ColorSchemeProvider>
      </LazyMotion>
    </ConvexAuthNextjsProvider>
  );
}
