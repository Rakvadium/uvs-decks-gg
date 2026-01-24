"use client";

import { ReactNode, useEffect, useState } from "react";
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
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (!isLoading) {
      setShowContent(true);
    }
  }, [isLoading, isAuthenticated, requireAuth, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!showContent && isLoading) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}

function AuthLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full bg-sidebar">
      <div className="flex h-full w-64 flex-col bg-sidebar">
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

      <div className="flex flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between bg-sidebar px-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="flex flex-1">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute -top-3 left-0 z-10 h-3 w-3">
              <div className="h-full w-full rounded-br-xl bg-sidebar" />
            </div>
            <div className="pointer-events-none absolute -top-3 right-0 z-10 h-3 w-3">
              <div className="h-full w-full rounded-bl-xl bg-sidebar" />
            </div>
            <div className="h-full rounded-tl-xl rounded-tr-xl bg-background p-6">
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
    </div>
  );
}
