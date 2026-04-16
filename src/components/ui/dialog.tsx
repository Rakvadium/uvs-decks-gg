"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const DialogOnOpenChangeContext = React.createContext<
  DialogPrimitive.DialogProps["onOpenChange"] | undefined
>(undefined)

function Dialog({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <DialogOnOpenChangeContext.Provider value={onOpenChange}>
      <DialogPrimitive.Root
        data-slot="dialog"
        onOpenChange={onOpenChange}
        {...props}
      />
    </DialogOnOpenChangeContext.Provider>
  )
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
  onPointerDown,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const onOpenChangeFromRoot = React.useContext(DialogOnOpenChangeContext)
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "fixed inset-0 z-50 bg-background/55 backdrop-blur-[2px]",
        className
      )}
      {...props}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (
          event.defaultPrevented ||
          !onOpenChangeFromRoot ||
          event.target !== event.currentTarget
        ) {
          return
        }
        onOpenChangeFromRoot(false)
      }}
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
  footerMobileOnly = false,
  showCloseButton = true,
  size = "default",
  presentation = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  size?: DialogSize
  footer?: React.ReactNode
  footerMobileOnly?: boolean
  presentation?: "default" | "plain"
}) {
  const hasFooter = footer != null
  const isPlain = presentation === "plain"
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 duration-200 overflow-x-hidden flex flex-col",
          !isPlain &&
            "shadow-lg md:shadow-[0_0_2px_var(--primary)/40,0_0_12px_var(--primary)/50,0_0_28px_var(--primary)/12]",
          !isPlain && "bg-card/95 backdrop-blur-lg border-primary/20",
          isPlain &&
            "border-0 bg-transparent shadow-none backdrop-blur-none md:border-0 md:shadow-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "inset-0 h-[100dvh] w-full rounded-none border-0",
          !isPlain &&
            "md:inset-auto md:top-[50%] md:left-[50%] md:h-auto md:max-h-[85vh] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border md:overflow-y-auto",
          isPlain &&
            "max-md:!pointer-events-none md:pointer-events-auto md:inset-auto md:top-[50%] md:left-[50%] md:h-auto md:max-h-[85vh] md:translate-x-[-50%] md:translate-y-[-50%] md:overflow-hidden md:rounded-none md:border-0",
          "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95",
          dialogSizeStyles[size],
          className
        )}
        {...props}
      >
        {!isPlain ? (
          <>
            <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </>
        ) : null}
        <div
          className={cn(
            "relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto",
            isPlain && "md:overflow-hidden",
            hasFooter &&
              (footerMobileOnly ? "pb-20 md:pb-0" : "pb-24 md:pb-0")
          )}
        >
          {children}
          {hasFooter && (
            <div
              data-slot="dialog-footer-slot"
              className={cn(
                "flex w-full flex-shrink-0",
                footerMobileOnly
                  ? "pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-end bg-transparent p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
                  : cn(
                      "flex-col-reverse gap-2 border-t border-border/30 pt-4 sm:flex-row sm:justify-end",
                      "max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-20 max-md:bg-card/95 max-md:backdrop-blur-lg max-md:p-4 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]",
                      "md:relative md:z-10 md:border-0 md:px-6 md:pt-4 md:pb-4"
                    )
              )}
            >
              {footer}
            </div>
          )}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="pointer-events-auto hidden md:flex absolute top-4 right-4 z-20 h-8 w-8 rounded-md items-center justify-center opacity-70 transition-all hover:opacity-100 hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/30 focus:outline-hidden disabled:pointer-events-none border border-transparent hover:border-primary/30"
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
