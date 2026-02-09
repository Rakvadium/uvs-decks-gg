"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
        <DialogContent className="max-w-md overflow-hidden p-0" showCloseButton={false}>
          <div className="relative flex h-full min-h-0 flex-col">
            <VisuallyHidden>
              <DialogTitle>Sign In or Create Account</DialogTitle>
            </VisuallyHidden>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24 pt-6 md:pb-20">
              <AuthFormWithClose onSuccess={handleSuccess} />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
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
