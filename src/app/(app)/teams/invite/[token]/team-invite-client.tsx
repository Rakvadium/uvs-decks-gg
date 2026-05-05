"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/components/auth/auth-dialog";

export function TeamInviteClient() {
  const params = useParams();
  const router = useRouter();
  const raw = params?.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const accept = useMutation(api.teams.invites.acceptInvite);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onAccept() {
    if (!token) {
      setMessage("Missing invite link.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { teamId } = await accept({ token });
      router.replace(`/teams/${teamId}/announcements`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not accept invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the account that matches the invited email or in-app user id.
        </p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !isAuthenticated ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Sign in to accept this invite.</p>
          <Button type="button" onClick={openAuthDialog}>
            Sign in
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button type="button" disabled={busy || !token} onClick={() => void onAccept()}>
            {busy ? "Accepting…" : "Accept invite"}
          </Button>
        </div>
      )}
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
