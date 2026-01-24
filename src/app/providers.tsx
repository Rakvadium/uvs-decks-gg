"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthDialogProvider } from "@/components/auth/auth-dialog";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthDialogProvider>
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          </AuthDialogProvider>
          <Toaster />
        </ThemeProvider>
      </QueryProvider>
    </ConvexAuthNextjsProvider>
  );
}
