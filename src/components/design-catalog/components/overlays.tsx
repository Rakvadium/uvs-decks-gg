"use client";

import { useState, type ComponentProps } from "react";
import { toast } from "sonner";
import { Copy, Download, Pencil, Share2, Trash2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CatalogEntrySection, Preview, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

type DialogSize = NonNullable<ComponentProps<typeof DialogContent>["size"]>;

// Record, not array: typecheck fails if DialogContent gains or drops a size.
const DIALOG_SIZES: Record<DialogSize, string> = {
  default: "50vw",
  sm: "30vw",
  md: "50vw",
  lg: "70vw",
  xl: "85vw",
  full: "95vw",
  "content-sm": "max-w-md",
  "content-md": "max-w-lg",
  "content-lg": "max-w-2xl",
  "content-xl": "max-w-3xl",
};

type FooterMode = "prop" | "component" | "none";

function dialogSnippet(size: DialogSize, footer: FooterMode, showClose: boolean) {
  const props = [size !== "default" ? `size="${size}"` : null, showClose ? null : "showCloseButton={false}"].filter(Boolean);
  const footerProp =
    footer === "prop"
      ? `\n    footer={\n      <>\n        <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>\n        <Button>Save</Button>\n      </>\n    }`
      : "";
  const open = `  <DialogContent${props.length ? ` ${props.join(" ")}` : ""}${footerProp}>`;
  const footerChild =
    footer === "component"
      ? `\n    <DialogFooter>\n      <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>\n      <Button>Save</Button>\n    </DialogFooter>`
      : "";
  return `<Dialog>\n  <DialogTrigger asChild><Button>Rename deck</Button></DialogTrigger>\n${open}\n    <DialogHeader>\n      <DialogTitle>Rename deck</DialogTitle>\n      <DialogDescription>…</DialogDescription>\n    </DialogHeader>\n    <DialogBody>…</DialogBody>${footerChild}\n  </DialogContent>\n</Dialog>`;
}

export function DialogEntry() {
  const [size, setSize] = useState<DialogSize>("content-md");
  const [footer, setFooter] = useState<FooterMode>("prop");
  const [showClose, setShowClose] = useState(true);
  const actions = (
    <>
      <DialogClose asChild>
        <Button variant="outline">Close</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button>Save</Button>
      </DialogClose>
    </>
  );

  return (
    <CatalogEntrySection
      id="dialog"
      description={
        <p>
          Full-screen on phones, centered from <Code>md</Code>. Dismiss is always an outline <em>Close</em>; commit is the
          filled default. Prefer the <Code>footer</Code> prop: on phones it pins above the safe area.
        </p>
      }
    >
      <Preview>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="catalog-dialog-size" className="text-xs font-normal text-muted-foreground">
              size
            </Label>
            <Select value={size} onValueChange={(value) => setSize(value as DialogSize)}>
              <SelectTrigger id="catalog-dialog-size" size="sm" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DIALOG_SIZES) as DialogSize[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key} · {DIALOG_SIZES[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catalog-dialog-footer" className="text-xs font-normal text-muted-foreground">
              footer
            </Label>
            <Select value={footer} onValueChange={(value) => setFooter(value as FooterMode)}>
              <SelectTrigger id="catalog-dialog-footer" size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prop">footer prop</SelectItem>
                <SelectItem value="component">&lt;DialogFooter&gt;</SelectItem>
                <SelectItem value="none">none</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex h-8 items-center gap-2">
            <Switch id="catalog-dialog-close" checked={showClose} onCheckedChange={setShowClose} />
            <Label htmlFor="catalog-dialog-close" className="text-xs font-normal text-muted-foreground">
              showCloseButton
            </Label>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" data-catalog-open="dialog">
                <Pencil />
                Open dialog
              </Button>
            </DialogTrigger>
            <DialogContent size={size} showCloseButton={showClose} footer={footer === "prop" ? actions : undefined}>
              <DialogHeader>
                <DialogTitle>Rename deck</DialogTitle>
                <DialogDescription>The new name shows on your profile and in shared links.</DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-2">
                <Label htmlFor="catalog-dialog-name">Deck name</Label>
                <Input id="catalog-dialog-name" defaultValue="Spellbook Control" />
              </DialogBody>
              {footer === "component" ? <DialogFooter>{actions}</DialogFooter> : null}
            </DialogContent>
          </Dialog>
        </div>
      </Preview>
      <CodeBlock code={dialogSnippet(size, footer, showClose)} />
    </CatalogEntrySection>
  );
}

export function AlertDialogEntry() {
  return (
    <CatalogEntrySection
      id="alert-dialog"
      description={<p>For confirmations that need an explicit answer: no outside-click dismiss. The action takes <Code>buttonVariants</Code> for its role.</p>}
    >
      <Preview>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructiveOutline" data-catalog-open="alert-dialog">
              <Trash2 />
              Delete deck
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Spellbook Control?</AlertDialogTitle>
              <AlertDialogDescription>This removes the deck and its history. It can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Preview>
      <CodeBlock
        code={`import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"\n\n<AlertDialogFooter>\n  <AlertDialogCancel>Close</AlertDialogCancel>\n  <AlertDialogAction className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>\n</AlertDialogFooter>`}
      />
    </CatalogEntrySection>
  );
}

type SheetSide = NonNullable<ComponentProps<typeof SheetContent>["side"]>;
const SHEET_SIDES: Record<SheetSide, string> = { top: "Banners", right: "Default · detail panels", bottom: "Mobile pickers", left: "Navigation" };

export function SheetEntry() {
  return (
    <CatalogEntrySection id="sheet" description={<p>An edge-anchored dialog. <Code>side=&quot;bottom&quot;</Code> rounds its top corners for phone pickers.</p>}>
      <Preview>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(SHEET_SIDES) as SheetSide[]).map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-catalog-open={`sheet-${side}`}>
                  side=&quot;{side}&quot;
                </Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader className="p-4">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>{SHEET_SIDES[side]}.</SheetDescription>
                </SheetHeader>
                <div className="space-y-2 px-4">
                  <Label htmlFor={`catalog-sheet-${side}`}>Card name</Label>
                  <Input id={`catalog-sheet-${side}`} placeholder="Search cards…" autoComplete="off" />
                </div>
                <SheetFooter className="gap-2 p-4">
                  <SheetClose asChild>
                    <Button variant="outline">Close</Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button>Apply</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </Preview>
      <CodeBlock
        code={`import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"\n\n<Sheet>\n  <SheetTrigger asChild><Button variant="outline">Filters</Button></SheetTrigger>\n  <SheetContent side="bottom">\n    <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>\n    <SheetFooter><SheetClose asChild><Button variant="outline">Close</Button></SheetClose></SheetFooter>\n  </SheetContent>\n</Sheet>`}
      />
    </CatalogEntrySection>
  );
}

export function DropdownMenuEntry() {
  const [showStats, setShowStats] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [sort, setSort] = useState("name");
  return (
    <CatalogEntrySection
      id="dropdown-menu"
      description={<p>Every part in one menu: label, grouped items with shortcuts, checkbox and radio items, a submenu, a disabled item and a destructive one.</p>}
    >
      <Preview>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-catalog-open="dropdown-menu">
              Deck actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start">
            <DropdownMenuLabel>Spellbook Control</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Pencil />
                Edit
                <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy />
                Duplicate
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Share2 />
                  Export
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    <Download />
                    Text list
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download />
                    Image
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem disabled>
                <Upload />
                Import (disabled)
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel inset>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={showStats} onCheckedChange={setShowStats}>
              Stats panel
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showNotes} onCheckedChange={setShowNotes}>
              Notes
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel inset>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cost">Cost</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Preview>
      <CodeBlock
        code={`<DropdownMenu>\n  <DropdownMenuTrigger asChild><Button variant="outline">Deck actions</Button></DropdownMenuTrigger>\n  <DropdownMenuContent align="start">\n    <DropdownMenuItem>Edit<DropdownMenuShortcut>E</DropdownMenuShortcut></DropdownMenuItem>\n    <DropdownMenuCheckboxItem checked={on} onCheckedChange={setOn}>Stats</DropdownMenuCheckboxItem>\n    <DropdownMenuSeparator />\n    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>`}
      />
    </CatalogEntrySection>
  );
}

export function PopoverEntry() {
  return (
    <CatalogEntrySection
      id="popover"
      description={
        <p>
          <Code>Popover</Code> is click-to-open (<Code>z-popover</Code>); <Code>PopoverAnchor</Code> positions it against
          another element than the trigger. <Code>HoverCard</Code> previews on hover or focus (<Code>z-chrome</Code>).
        </p>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Preview label="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-catalog-open="popover">
                Card quantity
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="space-y-2">
              <Label htmlFor="catalog-popover-qty">Copies in deck</Label>
              <Input id="catalog-popover-qty" type="number" defaultValue={3} min={0} max={4} />
            </PopoverContent>
          </Popover>
        </Preview>
        <Preview label="PopoverAnchor">
          <Popover>
            <div className="flex items-center gap-2">
              <PopoverAnchor asChild>
                <div className="flex-1 rounded-md border border-dashed border-placeholder px-3 py-2 text-xs text-muted-foreground">
                  Anchor
                </div>
              </PopoverAnchor>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost">
                  Open
                </Button>
              </PopoverTrigger>
            </div>
            <PopoverContent align="start" className="text-sm">
              Positioned against the dashed anchor, not the button.
            </PopoverContent>
          </Popover>
        </Preview>
        <Preview label="HoverCard">
          <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
              <a href="#popover" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                @agent
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="flex gap-3">
              <Avatar className="size-10">
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">agent</div>
                <div className="text-muted-foreground">12 public decks · joined 2026</div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </Preview>
      </div>
      <CodeBlock
        code={`<Popover>\n  <PopoverTrigger asChild><Button variant="outline">Card quantity</Button></PopoverTrigger>\n  <PopoverContent align="start">…</PopoverContent>\n</Popover>\n\n<HoverCard openDelay={150}>\n  <HoverCardTrigger asChild><a href={profileUrl}>@agent</a></HoverCardTrigger>\n  <HoverCardContent>…</HoverCardContent>\n</HoverCard>`}
      />
    </CatalogEntrySection>
  );
}

type TooltipSide = NonNullable<ComponentProps<typeof TooltipContent>["side"]>;
const TOOLTIP_SIDES: TooltipSide[] = ["top", "right", "bottom", "left"];

export function TooltipEntry() {
  return (
    <CatalogEntrySection
      id="tooltip"
      description={
        <p>
          The app mounts one <Code>TooltipProvider</Code> with <Code>delayDuration={"{0}"}</Code>; nest another to change
          the delay for a region. Tooltips open on hover and on keyboard focus. Never put the only label in a tooltip:
          icon buttons still need <Code>aria-label</Code>.
        </p>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Preview label="Sides">
          <div className="flex flex-wrap gap-3">
            {TOOLTIP_SIDES.map((side) => (
              <Tooltip key={side}>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    {side}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={side}>Opens {side}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </Preview>
        <Preview label="Nested provider · 500ms delay">
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Duplicate deck">
                  <Copy />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate deck</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Preview>
      </div>
      <CodeBlock
        code={`<Tooltip>\n  <TooltipTrigger asChild>\n    <Button variant="ghost" size="icon" aria-label="Duplicate deck"><Copy /></Button>\n  </TooltipTrigger>\n  <TooltipContent side="bottom">Duplicate deck</TooltipContent>\n</Tooltip>`}
      />
    </CatalogEntrySection>
  );
}

const TOASTS: { label: string; fire: () => void; className?: string }[] = [
  { label: "Default", fire: () => toast("Deck saved") },
  { label: "Success", fire: () => toast.success("Imported 60 cards") },
  { label: "Info", fire: () => toast.info("New set in the gallery") },
  { label: "Warning", fire: () => toast.warning("2 cards are restricted") },
  { label: "Error", fire: () => toast.error("Couldn't reach the server") },
  {
    label: "With action",
    fire: () => toast("Deck deleted", { action: { label: "Undo", onClick: () => toast.success("Restored") } }),
  },
  {
    label: "Loading → done",
    fire: () => {
      toast.promise(new Promise((resolve) => window.setTimeout(resolve, 1200)), {
        loading: "Uploading…",
        success: "Uploaded",
        error: "Upload failed",
      });
    },
  },
];

export function ToastEntry() {
  return (
    <CatalogEntrySection
      id="toast"
      description={
        <p>
          Fire with <Code>toast()</Code> from <Code>sonner</Code>; the single <Code>Toaster</Code> styles them with{" "}
          <Code>--popover</Code> / <Code>--border</Code> / <Code>--radius</Code>. Its light/dark flag follows your saved
          appearance, not this page&apos;s pin.
        </p>
      }
    >
      <Preview>
        <div className="flex flex-wrap gap-2">
          {TOASTS.map((row) => (
            <Button key={row.label} variant="outline" size="sm" onClick={row.fire} className={cn(row.className)}>
              {row.label}
            </Button>
          ))}
        </div>
        <SpecimenLabel className="mt-3 block">Toasts stack at the bottom of the screen.</SpecimenLabel>
      </Preview>
      <CodeBlock code={`import { toast } from "sonner"\n\ntoast.success("Imported 60 cards")\ntoast("Deck deleted", { action: { label: "Undo", onClick: restore } })\ntoast.promise(upload(), { loading: "Uploading…", success: "Uploaded", error: "Upload failed" })`} />
    </CatalogEntrySection>
  );
}

export function OverlaysChapter() {
  return (
    <>
      <DialogEntry />
      <AlertDialogEntry />
      <SheetEntry />
      <DropdownMenuEntry />
      <PopoverEntry />
      <TooltipEntry />
      <ToastEntry />
    </>
  );
}
