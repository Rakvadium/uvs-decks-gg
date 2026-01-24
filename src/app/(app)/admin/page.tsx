"use client";

import Link from "next/link";
import { CreditCard, Layers, Upload } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function AdminPage() {
  const cardCount = useQuery(api.admin.getCardCount);
  const sets = useQuery(api.sets.list);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage UniVersus cards, sets, and data</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/cards">
            <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">Cards</h2>
                  <p className="text-sm text-muted-foreground">
                    {cardCount !== undefined ? `${cardCount.toLocaleString()} cards` : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/sets">
            <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <Layers className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">Sets</h2>
                  <p className="text-sm text-muted-foreground">
                    {sets !== undefined ? `${sets.length} sets` : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/import">
            <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <Upload className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">Import</h2>
                  <p className="text-sm text-muted-foreground">Import card data</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
