"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "fixed inset-0 z-50 bg-background/55 backdrop-blur-[2px]",
        className
      )}
      {...props}
    />
  )
}

const dialogSizeStyles = {
  default: "md:w-[50vw] md:min-w-[50vw] md:max-w-[50vw]",
  sm: "md:w-[30vw] md:min-w-[30vw] md:max-w-[30vw]",
  md: "md:w-[50vw] md:min-w-[50vw] md:max-w-[50vw]",
  lg: "md:w-[70vw] md:min-w-[70vw] md:max-w-[70vw]",
  xl: "md:w-[85vw] md:min-w-[85vw] md:max-w-[85vw]",
  full: "md:w-[95vw] md:min-w-[95vw] md:max-w-[95vw]",
}

type DialogSize = keyof typeof dialogSizeStyles

function DialogContent({
  className,
  children,
  footer,
  showCloseButton = true,
  size = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  size?: DialogSize
  footer?: React.ReactNode
}) {
  const hasFooter = footer != null
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 shadow-lg duration-200 overflow-x-hidden md:shadow-[0_0_2px_var(--primary)/40,0_0_12px_var(--primary)/50,0_0_28px_var(--primary)/12]",
          "bg-card/95 backdrop-blur-lg border-primary/20",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "inset-0 h-[100dvh] w-full rounded-none border-0 flex flex-col",
          "md:inset-auto md:top-[50%] md:left-[50%] md:h-auto md:max-h-[85vh] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border md:overflow-y-auto",
          "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95",
          dialogSizeStyles[size],
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none rounded-lg" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div
          className={cn(
            "relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col",
            hasFooter && "pb-24 md:pb-0"
          )}
        >
          {children}
          {hasFooter && (
            <div
              data-slot="dialog-footer-slot"
              className={cn(
                "flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end w-full flex-shrink-0 border-t border-border/30",
                "max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-20 max-md:bg-card/95 max-md:backdrop-blur-lg max-md:p-4 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]",
                "md:relative md:z-10 md:border-0 md:px-6 md:pt-4 md:pb-4"
              )}
            >
              {footer}
            </div>
          )}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="hidden md:flex absolute top-4 right-4 z-20 h-8 w-8 rounded-md items-center justify-center opacity-70 transition-all hover:opacity-100 hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/30 focus:outline-hidden disabled:pointer-events-none border border-transparent hover:border-primary/30"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2 text-center sm:text-left pb-4 border-b border-border/30",
        className
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "py-4",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end border-t border-border/30",
        "md:relative md:z-10",
        "fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-lg p-4 border-t border-border/30 md:border-0 md:p-0 md:pt-4",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg leading-none font-semibold",
        className
      )}
      style={{
        fontFamily: "var(--chrome-card-title-font)",
        textTransform: "var(--chrome-heading-transform)" as React.CSSProperties["textTransform"],
        letterSpacing: "var(--chrome-heading-letter-spacing)",
        ...style,
      }}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm font-mono", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
