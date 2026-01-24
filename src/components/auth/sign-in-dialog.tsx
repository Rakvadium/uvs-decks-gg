"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { LogIn, UserPlus, Ghost } from "lucide-react";
import { FLAGS } from "@/lib/flags";

export function SignInFormDialog({
  setFlow,
  onSuccess,
}: {
  setFlow: (flow: "signIn" | "signUp" | "reset") => void;
  onSuccess: () => void;
}) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to continue to your account
        </p>
      </div>
      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitting(true);
          const formData = new FormData(event.currentTarget);

          signIn("password", formData)
            .then(() => {
              toast.success("Signed in successfully");
              setSubmitting(false);
              onSuccess();
            })
            .catch((error) => {
              console.error(error);
              toast.error("Could not sign in");
              setSubmitting(false);
            });
        }}
      >
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-email">Email</label>
        </div>
        <Input name="email" id="dialog-email" autoComplete="email" />
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-password">Password</label>
          <Button
            className="p-0 h-auto"
            type="button"
            variant="link"
            onClick={() => setFlow("reset")}
          >
            Forgot your password?
          </Button>
        </div>
        <Input
          type="password"
          name="password"
          id="dialog-password"
          autoComplete="current-password"
        />
        <input name="flow" value="signIn" type="hidden" />

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setFlow("signUp");
            }}
          >
            <UserPlus className="size-4" />
            Sign Up
          </Button>
          <Button type="submit" disabled={submitting}>
            Sign In
            <LogIn className="size-4" />
          </Button>
        </div>
      </form>

      {FLAGS.ANONYMOUS_AUTH_ENABLED && (
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setSubmitting(true);
              signIn("anonymous")
                .then(() => {
                  toast.success("Signed in anonymously");
                  onSuccess();
                })
                .catch((error) => {
                  console.error(error);
                  toast.error("Could not sign in anonymously");
                })
                .finally(() => setSubmitting(false));
            }}
            disabled={submitting}
          >
            <Ghost className="size-4" />
            Continue as Guest
          </Button>
        </div>
      )}
    </>
  );
}

