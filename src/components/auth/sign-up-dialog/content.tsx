"use client";

import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthDialogFlow } from "../dialog-flow";
import { useSignUpDialogModel } from "./hook";

export function SignUpFormDialog({
  setFlow,
  onSuccess,
}: {
  setFlow: (flow: AuthDialogFlow) => void;
  onSuccess: () => void;
}) {
  const { submitting, handleSubmit } = useSignUpDialogModel(onSuccess);

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-2 text-muted-foreground">Enter your information below to create your account</p>
      </div>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="mt-4 flex items-center justify-between py-1">
          <label htmlFor="dialog-username">Username</label>
        </div>
        <Input type="text" id="dialog-username" name="username" autoComplete="new-password" />
        <div className="mt-4 flex items-center justify-between py-1">
          <label htmlFor="dialog-signup-email">Email</label>
        </div>
        <Input name="email" id="dialog-signup-email" autoComplete="email" />
        <div className="mt-4 flex items-center justify-between py-1">
          <label htmlFor="dialog-signup-password">Password</label>
        </div>
        <Input type="password" name="password" id="dialog-signup-password" autoComplete="new-password" />
        <div className="mt-4 flex items-center justify-between py-1">
          <label htmlFor="dialog-confirmPassword">Confirm password</label>
        </div>
        <Input type="password" id="dialog-confirmPassword" name="confirmPassword" autoComplete="new-password" />
        <input name="flow" value="signUp" type="hidden" />
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" type="button" onClick={() => setFlow("signIn")}>
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
