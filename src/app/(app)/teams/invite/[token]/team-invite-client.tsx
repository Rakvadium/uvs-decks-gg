"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthDialog } from "@/components/auth/auth-dialog";

type InviteModalStep = "choose" | "leaveWarning";

export function TeamInviteClient() {
  const params = useParams();
  const router = useRouter();
  const raw = params?.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const accept = useMutation(api.teams.invites.acceptInvite);
  const decline = useMutation(api.teams.invites.declineInvite);
  const details = useQuery(api.teams.invites.getInviteDetails, token ? { token } : "skip");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [modalStep, setModalStep] = useState<InviteModalStep>("choose");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const expired = useMemo(() => {
    if (!details || details.status !== "pending") return false;
    return Date.now() > details.expiresAt;
  }, [details]);

  useEffect(() => {
    if (!details || details.status !== "pending" || expired) return;
    if (!isAuthenticated) return;
    if (details.viewer.signedIn && details.viewer.alreadyMemberOfInvitedTeam) return;
    setInviteOpen(true);
    setModalStep("choose");
  }, [details, expired, isAuthenticated]);

  const runAccept = useCallback(
    async (leaveCurrentTeamConfirmed: boolean) => {
      if (!token) return;
      setBusy(true);
      setMessage(null);
      try {
        const { teamId } = await accept({ token, leaveCurrentTeamConfirmed });
        setInviteOpen(false);
        router.replace(`/teams/${teamId}/announcements`);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not accept invite");
      } finally {
        setBusy(false);
      }
    },
    [accept, router, token],
  );

  const onAcceptChoose = useCallback(() => {
    if (!details || !details.viewer.signedIn) return;
    if (details.viewer.needsLeaveCurrentTeamConfirmation) {
      setModalStep("leaveWarning");
      return;
    }
    void runAccept(false);
  }, [details, runAccept]);

  const onLeaveBack = useCallback(() => {
    if (busy) return;
    setModalStep("choose");
  }, [busy]);

  const onDecline = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await decline({ token });
      setInviteOpen(false);
      setModalStep("choose");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not decline invite");
    } finally {
      setBusy(false);
    }
  }, [decline, token]);

  const onDialogOpenChange = useCallback(
    (open: boolean) => {
      if (busy) return;
      if (!open) {
        setInviteOpen(false);
        setModalStep("choose");
      } else {
        setInviteOpen(true);
      }
    },
    [busy],
  );

  if (!token) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <p className="text-sm text-muted-foreground">This invite link is missing a token.</p>
      </div>
    );
  }

  if (details === undefined || authLoading) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (details === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <p className="text-sm text-destructive" role="alert">
          This invite link is invalid.
        </p>
      </div>
    );
  }

  let body: ReactNode;
  if (details.status === "pending" && expired) {
    body = <p className="text-sm text-muted-foreground">This invite has expired.</p>;
  } else if (details.status === "accepted") {
    body = (
      <p className="text-sm text-muted-foreground">Someone has already accepted this invite.</p>
    );
  } else if (details.status === "declined") {
    body = (
      <p className="text-sm text-muted-foreground">This invite was declined and is no longer valid.</p>
    );
  } else if (!isAuthenticated) {
    body = (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Sign in to respond to this invite.</p>
        <Button type="button" onClick={() => openAuthDialog()}>
          Sign in
        </Button>
      </div>
    );
  } else if (details.viewer.signedIn && details.viewer.alreadyMemberOfInvitedTeam) {
    body = (
      <p className="text-sm text-muted-foreground">
        You are already a member of {details.teamName}.
      </p>
    );
  } else {
    body = (
      <p className="text-sm text-muted-foreground">
        Use the dialog to accept or decline this invitation.
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team invite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You have been invited to join{" "}
          <span className="font-medium text-foreground">{details.teamName}</span>.
        </p>
      </div>
      {body}
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      <Dialog open={inviteOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent size="md" showCloseButton footer={null}>
          {modalStep === "choose" ? (
            <>
              <DialogHeader>
                <DialogTitle>Join {details.teamName}?</DialogTitle>
                <DialogDescription>
                  You have been invited to join this team. This link works once — after you accept or decline, it will
                  not be available again.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <p className="text-sm text-muted-foreground">Choose whether to join this team.</p>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={busy} onClick={() => void onDecline()}>
                  {busy ? "Working…" : "Decline"}
                </Button>
                <Button type="button" disabled={busy} onClick={() => void onAcceptChoose()}>
                  Accept
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Leave your current team?</DialogTitle>
                <DialogDescription>
                  {details.viewer.signedIn && details.viewer.currentTeamName ? (
                    <>
                      You are already part of{" "}
                      <span className="font-medium text-foreground">{details.viewer.currentTeamName}</span>. Are you
                      sure you want to join{" "}
                      <span className="font-medium text-foreground">{details.teamName}</span> instead? If you are the
                      captain with teammates, captaincy moves to the next eligible member.
                    </>
                  ) : (
                    <>You are already on another team. Joining this team will remove you from your current team.</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={busy} onClick={onLeaveBack}>
                  Back
                </Button>
                <Button type="button" disabled={busy} onClick={() => void runAccept(true)}>
                  {busy ? "Working…" : "Leave and join"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
