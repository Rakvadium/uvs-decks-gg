"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { toastConvexError } from "@/lib/convex-error-toast";
import {
  USER_FEEDBACK_KIND_OPTIONS,
  type UserFeedbackKind,
} from "@/lib/user-feedback";

interface FeedbackDialogContextValue {
  openFeedbackDialog: () => void;
}

const FeedbackDialogContext = createContext<FeedbackDialogContextValue | null>(
  null
);

export function useFeedbackDialogControl() {
  const ctx = useContext(FeedbackDialogContext);
  if (!ctx) {
    throw new Error(
      "useFeedbackDialogControl must be used within FeedbackDialogProvider"
    );
  }
  return ctx;
}

function FeedbackFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const submitFeedback = useMutation(api.feedback.submit);
  const [kind, setKind] = useState<UserFeedbackKind>("general");
  const [message, setMessage] = useState("");
  const [submitAnonymously, setSubmitAnonymously] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind("general");
    setMessage("");
    setSubmitAnonymously(true);
    setPending(false);
  }, [open]);

  const handleSubmit = async () => {
    const text = message.trim();
    if (!text) {
      toast.error("Please enter a message");
      return;
    }
    setPending(true);
    try {
      await submitFeedback({
        kind,
        pagePath: pathname,
        message: text,
        submitAnonymously,
      });
      toast.success("Thanks for your feedback");
      onOpenChange(false);
    } catch (e) {
      toastConvexError(e, "Could not submit feedback");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        className="max-w-md overflow-hidden p-0"
        footer={
          <>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={pending || !message.trim()}
            >
              {pending ? "Sending…" : "Submit"}
            </Button>
          </>
        }
      >
        <div className="relative min-h-0 flex-1 px-6 pt-6">
          <DialogHeader className="border-0 pb-2 text-left">
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription className="sr-only">
              Choose a category, describe your feedback, and optionally stay
              anonymous.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5 pt-0">
            <div className="space-y-2">
              <Label htmlFor="feedback-kind">Category</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as UserFeedbackKind)}
              >
                <SelectTrigger id="feedback-kind" className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {USER_FEEDBACK_KIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Tell us what you think…"
                className="resize-y min-h-[120px]"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-muted/20 px-3 py-2.5">
              <Label
                htmlFor="feedback-anon"
                className="cursor-pointer text-sm font-medium leading-none"
              >
                Submit anonymously
              </Label>
              <Switch
                id="feedback-anon"
                checked={submitAnonymously}
                onCheckedChange={setSubmitAnonymously}
              />
            </div>
          </DialogBody>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FeedbackDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openFeedbackDialog = useCallback(() => setOpen(true), []);
  const value = useMemo(
    () => ({ openFeedbackDialog }),
    [openFeedbackDialog]
  );

  return (
    <FeedbackDialogContext.Provider value={value}>
      {children}
      <FeedbackFormDialog open={open} onOpenChange={setOpen} />
    </FeedbackDialogContext.Provider>
  );
}
