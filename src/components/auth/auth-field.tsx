"use client";

import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  /** Rendered at the end of the label row (e.g. "Forgot password?"). */
  labelAction?: ReactNode;
  hint?: ReactNode;
};

export function AuthField({ id, label, labelAction, hint, ...inputProps }: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <Input id={id} aria-describedby={hintId} {...inputProps} />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
