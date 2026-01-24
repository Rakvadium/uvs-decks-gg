"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Shield } from "lucide-react";

function AdminRoleCheck({ children }: { children: ReactNode }) {
  const user = useQuery(api.user.currentUser);

  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "Admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <Shield className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You need Admin privileges to access this page.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoleCheck>
      <div className="p-6">
        {children}
      </div>
    </AdminRoleCheck>
  );
}
