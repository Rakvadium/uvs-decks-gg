import * as React from "react"

import { cn } from "@/lib/utils"

const cardBaseClassName =
  "relative bg-card-elevated text-card-foreground flex flex-col gap-6 py-6 backdrop-blur-sm border border-surface rounded-surface overflow-hidden"

const cardFxClassName = cn(
  "group hover:shadow-[var(--chrome-card-shadow-hover)] hover:border-[var(--chrome-card-border-hover)] transition-[border-color,box-shadow] duration-150",
  "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-150 hover:before:opacity-100",
)

interface CardProps extends React.ComponentProps<"div"> {
  fx?: boolean
}

function Card({ className, fx = false, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        cardBaseClassName,
        "shadow-[var(--chrome-card-shadow)]",
        fx && cardFxClassName,
        className
      )}
      {...props}
    />
  )
}

function Surface({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(cardBaseClassName, "shadow-[var(--chrome-elevation-low)]", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header relative z-10 grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "chrome-heading-case leading-none font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground text-sm",
        className
      )}
      style={{
        fontFamily: "var(--chrome-card-description-font)",
        letterSpacing: "var(--chrome-card-description-tracking)",
      }}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "relative z-10 col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("relative z-10 px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "relative z-10 flex items-center px-6 [.border-t]:pt-6",
        "border-t border-hairline pt-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  Surface,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

export type { CardProps }
