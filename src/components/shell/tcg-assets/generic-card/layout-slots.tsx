import type React from "react";
import { cn } from "@/lib/utils";

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("absolute left-4 right-4 top-4 z-10", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-lg font-bold text-white drop-shadow-lg", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-white/90 drop-shadow-md", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("absolute right-4 top-4 z-20", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("absolute inset-0 z-10 flex items-center justify-center", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("absolute bottom-4 left-4 right-4 z-10", className)}
      {...props}
    />
  );
}

function CardOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-overlay"
      className={cn("absolute inset-0 z-5", className)}
      {...props}
    />
  );
}

export {
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  CardOverlay,
};
