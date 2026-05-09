"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { Link2, Loader2, PenLine, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CreateTeamButtonProps = {
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

export function CreateTeamButton({ className, size = "sm", variant = "outline" }: CreateTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();

  const onOpen = useCallback(() => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }
    setOpen(true);
  }, [isAuthenticated, openAuthDialog]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("h-9 gap-1.5 font-mono text-xs uppercase tracking-wider", className)}
        onClick={onOpen}
      >
        <Plus className="h-3.5 w-3.5" />
        Create team
      </Button>
      {isAuthenticated ? <CreateTeamFormDialog open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}

type CreateTeamFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateTeamFormDialog({ open, onOpenChange }: CreateTeamFormDialogProps) {
  const router = useRouter();
  const createTeam = useMutation(api.teams.permissions.create);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) return;
    setName("");
    setSlug("");
    setDescription("");
  }, [open]);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Team name is required");
      return;
    }
    setSubmitting(true);
    try {
      const teamId = await createTeam({
        name: trimmed,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success("Team created");
      setName("");
      setSlug("");
      setDescription("");
      onOpenChange(false);
      router.push(`/teams/${teamId}/announcements`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create team");
    } finally {
      setSubmitting(false);
    }
  }, [createTeam, name, slug, description, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        contentPadding="none"
        className="overflow-hidden p-0"
        showCloseButton={false}
        footer={
          <>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11 px-6" disabled={submitting}>
                Close
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-11 px-6"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create team
            </Button>
          </>
        }
      >
        <div className="relative flex h-full min-h-0 max-h-[85vh] flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 right-10 h-24 w-24 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-6">
            <DialogHeader className="border-border/20 pb-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 shadow-[0_0_2px_var(--primary)/40,0_0_6px_var(--primary)/40]">
                  <UsersRound className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl">Create a team</DialogTitle>
                  <DialogDescription className="text-sm">
                    You will be the captain. You can upload a logo, invite members, and manage shared decks
                    from the team hub.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-5 pt-2">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Name
                </label>
                <div className="relative mt-2">
                  <PenLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Team name…"
                    className="h-12 border-border/60 bg-background/40 pl-10 text-base focus-visible:ring-primary/25"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSubmit();
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  URL slug (optional)
                </label>
                <div className="relative mt-2">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-team"
                    className="h-12 border-border/60 bg-background/40 pl-10 font-mono text-sm focus-visible:ring-primary/25"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this team for?"
                  rows={3}
                  className="mt-2 min-h-[4.5rem] resize-y border-border/60 bg-background/40 focus-visible:ring-primary/25"
                />
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Tip: A short blurb helps members know what the team is for. You can change this later in the
                  team hub.
                </p>
              </div>
            </DialogBody>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
