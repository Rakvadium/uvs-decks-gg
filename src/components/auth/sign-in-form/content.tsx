"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "../auth-field";
import type { AuthFlow } from "../flow";
import { useSignInFormModel } from "./hook";

export function SignInForm({
  setFlow,
  onSuccess,
}: {
  setFlow: (flow: AuthFlow) => void;
  onSuccess: () => void;
}) {
  const { submitting, handleSubmit } = useSignInFormModel(onSuccess);

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <AuthField
        id="sign-in-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        autoFocus
      />
      <AuthField
        id="sign-in-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        labelAction={
          <Button
            className="h-auto p-0 text-xs"
            type="button"
            variant="link"
            onClick={() => setFlow("reset")}
          >
            Forgot password?
          </Button>
        }
      />
      <input name="flow" value="signIn" type="hidden" />
      <Button type="submit" className="mt-2 w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
        <LogIn className="size-4" />
      </Button>
    </form>
  );
}
