"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { PASSWORD_REQUIREMENTS } from "../../../../convex/lib/password";
import { USERNAME_MAX } from "@shared/username";
import { AuthField } from "../auth-field";
import { useSignUpFormModel } from "./hook";

export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { submitting, usernameError, clearUsernameError, handleSubmit } = useSignUpFormModel(onSuccess);

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <AuthField
          id="sign-up-username"
          name="username"
          type="text"
          label="Username"
          autoComplete="username"
          maxLength={USERNAME_MAX}
          aria-required
          aria-invalid={usernameError ? true : undefined}
          aria-describedby={usernameError ? "sign-up-username-error" : undefined}
          onChange={clearUsernameError}
          autoFocus
        />
        {usernameError ? <FieldError id="sign-up-username-error">{usernameError}</FieldError> : null}
      </div>
      <AuthField
        id="sign-up-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
      />
      <AuthField
        id="sign-up-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        required
        hint={PASSWORD_REQUIREMENTS}
      />
      <AuthField
        id="sign-up-confirm-password"
        name="confirmPassword"
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        required
      />
      <input name="flow" value="signUp" type="hidden" />
      <Button type="submit" className="mt-2 w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
        <UserPlus className="size-4" />
      </Button>
    </form>
  );
}
