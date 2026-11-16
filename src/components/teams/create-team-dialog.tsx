"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { Link2, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useStartAuth } from "@/components/auth/use-start-auth";
import { FloatingActionPill } from "@/components/shell/floating-page-bar";
import { Button } from "@/components/ui/button";
import { CreateEntityDialog, createEntityLabelClassName } from "@/components/ui/create-entity-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CreateTeamButtonProps = {
  className?: string;
  placement?: "header" | "inline";
};

export function CreateTeamButton({ className, placement = "inline" }: CreateTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const startAuth = useStartAuth();

  const onOpen = useCallback(() => {
    if (!isAuthenticated) {
      startAuth();
      return;
    }
    setOpen(true);
  }, [isAuthenticated, startAuth]);

  const label = (
    <>
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">Create team</span>
    </>
  );

  return (
    <>
      {placement === "header" ? (
        <FloatingActionPill className={className} onClick={onOpen}>
          {label}
        </FloatingActionPill>
      ) : (
        <Button type="button" className={cn("gap-1.5", className)} onClick={onOpen}>
          {label}
        </Button>
      )}
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
    if (!trimmed) return;
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
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={UsersRound}
      title="Create a team"
      description="You will be the captain. You can upload a logo, invite members, and manage shared decks from the team hub."
      name={{
        id: "create-team-name",
        label: "Name",
        placeholder: "Team name…",
        value: name,
        onChange: setName,
      }}
      submitLabel="Create team"
      submitting={submitting}
      onSubmit={() => void handleSubmit()}
    >
      <div className="space-y-2">
        <Label htmlFor="create-team-slug" className={createEntityLabelClassName}>
          URL slug (optional)
        </Label>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="create-team-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-team"
            className="pl-10"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-team-description" className={createEntityLabelClassName}>
          Description (optional)
        </Label>
        <Textarea
          id="create-team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this team for?"
          rows={3}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Tip: A short blurb helps members know what the team is for. You can change this later in the team hub.
        </p>
      </div>
    </CreateEntityDialog>
  );
}
