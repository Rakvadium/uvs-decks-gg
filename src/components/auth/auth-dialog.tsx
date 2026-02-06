"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { AuthDialogFlow } from "./dialog-flow";
import { SignInFormDialog } from "./sign-in-dialog";
import { SignUpFormDialog } from "./sign-up-dialog";
import { ResetPasswordFormDialog } from "./reset-password-dialog";

interface AuthDialogContextValue {
  isOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider");
  }
  return context;
}

interface AuthDialogProviderProps {
  children: ReactNode;
}

export function AuthDialogProvider({ children }: AuthDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const openAuthDialog = useCallback(() => setIsOpen(true), []);
  const closeAuthDialog = useCallback(() => setIsOpen(false), []);

  const handleSuccess = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/") {
      router.push("/home");
    }
  }, [pathname, router]);

  return (
    <AuthDialogContext.Provider value={{ isOpen, openAuthDialog, closeAuthDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-8">
          <VisuallyHidden>
            <DialogTitle>Sign In or Create Account</DialogTitle>
          </VisuallyHidden>
          <AuthFormWithClose onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

function AuthFormWithClose({ onSuccess }: { onSuccess: () => void }) {
  const [flow, setFlow] = useState<AuthDialogFlow>("signIn");

  return (
    <>
      {flow === "signIn" && <SignInFormDialog setFlow={setFlow} onSuccess={onSuccess} />}
      {flow === "signUp" && <SignUpFormDialog setFlow={setFlow} onSuccess={onSuccess} />}
      {flow === "reset" && <ResetPasswordFormDialog setFlow={setFlow} />}
    </>
  );
}
