"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [isLoading, isAuthenticated, requireAuth, router]);

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  if (requireAuth && !isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}

function AuthLoadingSkeleton() {
  return (
    <>
      <div className="hidden h-screen w-full bg-sidebar md:flex">
        <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
          <div className="flex h-14 items-center px-4">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex-1 space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
          <div className="p-3">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-sidebar">
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4">
              <Skeleton className="h-8 w-64" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex h-[100dvh] w-full flex-col bg-background md:hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+11rem)]">
            <div className="space-y-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-4 w-full max-w-72" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
              ))}
            </div>

            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="relative overflow-visible">
            <div className="mx-0 overflow-hidden rounded-t-[8px] border-x border-t [border-color:var(--chrome-sheet-border)] bg-background/95 shadow-[var(--chrome-sheet-shadow)] backdrop-blur-md">
              <div className="flex justify-center">
                <Skeleton className="mt-2 h-2 w-24 rounded-full" />
              </div>
              <div className="space-y-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
                <div className="flex h-16 items-center justify-around gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-2 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
