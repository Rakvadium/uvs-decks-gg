"use client";

import { FolderKanban } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";

export function GalleryGuestDecksIcon({ className }: { className?: string }) {
  return <FolderKanban className={className} />;
}

export function GalleryGuestDecksSidebar() {
  const { openAuthDialog } = useAuthDialog();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in to use deck tools from the gallery sidebar: pick an active deck, add cards from the catalog,
          and keep everything synced while you browse.
        </p>
        <ul className="space-y-2 text-sm leading-snug text-foreground/90">
          <li>Browse all your decks and switch between them without leaving this panel.</li>
          <li>Create new deck lists when you spot a lineup you want to try.</li>
          <li>Manage the deck you&apos;re actively building alongside the gallery search.</li>
        </ul>
      </div>
      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-border/40 pt-6">
        <Button type="button" onClick={() => openAuthDialog("signIn")}>
          Sign in
        </Button>
        <Button
          variant="outline"
          type="button"
          className="border-primary/30 hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
          onClick={() => openAuthDialog("signUp")}
        >
          Create account
        </Button>
      </div>
    </div>
  );
}
