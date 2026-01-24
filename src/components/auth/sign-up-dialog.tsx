"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { INVALID_PASSWORD } from "../../../convex/errors";
import { UserPlus, ArrowLeft } from "lucide-react";

export function SignUpFormDialog({
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
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your information below to create your account
        </p>
      </div>
      <form
        className="flex flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitting(true);
          const formData = new FormData(event.currentTarget);

          if (formData.get("password") !== formData.get("confirmPassword")) {
            toast.error("Passwords do not match");
            setSubmitting(false);
            return;
          }

          signIn("password", formData)
            .then(() => {
              toast.success("Account created successfully");
              setSubmitting(false);
              onSuccess();
            })
            .catch((error) => {
              console.error(error);
              let toastTitle: string;
              if (
                error instanceof ConvexError &&
                error.data === INVALID_PASSWORD
              ) {
                toastTitle =
                  "Invalid password - check the requirements and try again.";
              } else {
                toastTitle = "Could not create account";
              }
              toast.error(toastTitle);
              setSubmitting(false);
            });
        }}
      >
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-username">Username</label>
        </div>
        <Input
          type="text"
          id="dialog-username"
          name="username"
          autoComplete="new-password"
        />
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-signup-email">Email</label>
        </div>
        <Input name="email" id="dialog-signup-email" autoComplete="email" />
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-signup-password">Password</label>
        </div>
        <Input
          type="password"
          name="password"
          id="dialog-signup-password"
          autoComplete="new-password"
        />
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-confirmPassword">Confirm password</label>
        </div>
        <Input
          type="password"
          id="dialog-confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
        />
        <input name="flow" value="signUp" type="hidden" />
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setFlow("signIn");
            }}
          >
            <ArrowLeft className="size-4" />
            Back to Sign In
          </Button>
          <Button type="submit" disabled={submitting}>
            Sign up
            <UserPlus className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

