"use client";

import { Ghost, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthDialogFlow } from "../dialog-flow";
import { FLAGS } from "@/lib/flags";
import { useSignInDialogModel } from "./hook";

export function SignInFormDialog({
  setFlow,
  onSuccess,
}: {
  setFlow: (flow: AuthDialogFlow) => void;
  onSuccess: () => void;
}) {
  const { submitting, handleSubmit, handleAnonymousSignIn } = useSignInDialogModel(onSuccess);

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">Sign in to continue to your account</p>
      </div>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="mt-4 flex items-center justify-between py-1">
          <label htmlFor="dialog-email">Email</label>
        </div>
        <Input name="email" id="dialog-email" autoComplete="email" />
        <div className="mt-4 flex items-center justify-between py-1">
          <label htmlFor="dialog-password">Password</label>
          <Button className="h-auto p-0" type="button" variant="link" onClick={() => setFlow("reset")}>
            Forgot your password?
          </Button>
        </div>
        <Input type="password" name="password" id="dialog-password" autoComplete="current-password" />
        <input name="flow" value="signIn" type="hidden" />

        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" type="button" onClick={() => setFlow("signUp")}>
            <UserPlus className="size-4" />
            Sign Up
          </Button>
          <Button type="submit" disabled={submitting}>
            Sign In
            <LogIn className="size-4" />
          </Button>
        </div>
      </form>

      {FLAGS.ANONYMOUS_AUTH_ENABLED ? (
        <div className="mt-6 border-t border-border pt-6">
          <Button variant="ghost" className="w-full" onClick={handleAnonymousSignIn} disabled={submitting}>
            <Ghost className="size-4" />
            Continue as Guest
          </Button>
        </div>
      ) : null}
    </>
  );
}
