"use client"

import * as React from "react"
import { Loader2, PenLine, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CreateEntityNameField = {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  hint?: React.ReactNode
}

export type CreateEntityDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: LucideIcon
  title: string
  description: React.ReactNode
  name: CreateEntityNameField
  submitLabel: string
  submitting: boolean
  onSubmit: () => void
  children?: React.ReactNode
}

export const createEntityLabelClassName = "chrome-label-case text-xs text-muted-foreground"

function CreateEntityDialog({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  name,
  submitLabel,
  submitting,
  onSubmit,
  children,
}: CreateEntityDialogProps) {
  const formId = React.useId()
  const canSubmit = name.value.trim().length > 0 && !submitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        footer={
          <>
            <DialogCancel disabled={submitting} />
            <Button type="submit" form={formId} disabled={!canSubmit}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              {submitLabel}
            </Button>
          </>
        }
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-surface border border-primary-soft bg-primary-wash text-primary">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogBody>
          <form
            id={formId}
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (canSubmit) onSubmit()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={name.id} className={createEntityLabelClassName}>
                {name.label}
              </Label>
              <div className="relative">
                <PenLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={name.id}
                  name={name.id}
                  autoComplete="off"
                  placeholder={name.placeholder}
                  value={name.value}
                  onChange={(event) => name.onChange(event.target.value)}
                  className="pl-10"
                />
              </div>
              {name.hint ? <p className="text-xs text-muted-foreground">{name.hint}</p> : null}
            </div>
            {children}
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export { CreateEntityDialog }
