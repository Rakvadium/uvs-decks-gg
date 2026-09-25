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

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
