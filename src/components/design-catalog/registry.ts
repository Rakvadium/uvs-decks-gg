/**
 * Table of contents for `/design`. It drives the nav, the anchors and the coverage test
 * (`tests/design-catalog.test.ts`): every export of every `src/components/ui/*.tsx` file must be
 * listed under some entry, and every runtime export must be imported by the catalog unless
 * `documentedOnly` says why it isn't rendered directly.
 */

export interface UiSource {
  /** File name under `src/components/ui/`. */
  file: string;
  /** Every export of the file, types included. */
  exports: readonly string[];
  /** Runtime exports the catalog lists but doesn't render on their own, with the reason. */
  documentedOnly?: Readonly<Record<string, string>>;
}

export interface CatalogEntry {
  id: string;
  label: string;
  ui?: readonly UiSource[];
}

export type ChapterGroup = "Start" | "Foundations" | "Components" | "Patterns";

export interface CatalogChapter {
  id: string;
  group: ChapterGroup;
  label: string;
  summary: string;
  entries: readonly CatalogEntry[];
}

export const CATALOG_CHAPTERS = [
  {
    id: "overview",
    group: "Start",
    label: "Overview",
    summary: "The eight color presets, and how to pin a theme, mode and chrome for this page.",
    entries: [{ id: "themes", label: "Themes" }],
  },
  {
    id: "colors",
    group: "Foundations",
    label: "Color tokens",
    summary:
      "Semantic tokens declared by the active preset (src/styles/themes) plus the status colors in base.css. Values are read from <html> at runtime.",
    entries: [{ id: "color-tokens", label: "Tokens" }],
  },
  {
    id: "typography",
    group: "Foundations",
    label: "Typography",
    summary: "Outfit is the only typeface. Size and weight come from the heading primitives; casing and tracking come from the chrome.",
    entries: [
      {
        id: "page-heading",
        label: "PageHeading",
        ui: [
          {
            file: "typography-headings.tsx",
            exports: [
              "PageHeading",
              "SectionHeading",
              "Kicker",
              "pageHeadingVariants",
              "sectionHeadingVariants",
              "kickerVariants",
            ],
          },
        ],
      },
      { id: "section-heading", label: "SectionHeading" },
      { id: "kicker", label: "Kicker" },
      { id: "chrome-casing", label: "Chrome casing" },
    ],
  },
  {
    id: "shape",
    group: "Foundations",
    label: "Radius & elevation",
    summary: "The radius ladder follows the chrome's --radius. Shadows come from theme and chrome tokens, never ad-hoc rgba.",
    entries: [
      { id: "radius", label: "Radius" },
      { id: "elevation", label: "Elevation" },
    ],
  },
  {
    id: "ladders",
    group: "Foundations",
    label: "Ladders",
    summary: "Named utilities from src/styles/system/ladders.css. Every table here is parsed from that file.",
    entries: [
      { id: "border-ladder", label: "Border ladder" },
      { id: "surface-ladder", label: "Surface ladder" },
      { id: "tone-ladder", label: "Tone ladder" },
    ],
  },
  {
    id: "layers",
    group: "Foundations",
    label: "Z-index & motion",
    summary: "The stacking order every overlay follows, and the three motion durations.",
    entries: [
      { id: "z-index", label: "Z-index stack" },
      { id: "motion", label: "Motion" },
    ],
  },
  {
    id: "actions",
    group: "Components",
    label: "Actions",
    summary: "Buttons and the two single-choice toggles.",
    entries: [
      {
        id: "button",
        label: "Button",
        ui: [{ file: "button.tsx", exports: ["Button", "buttonVariants", "ButtonProps"] }],
      },
      {
        id: "segmented-control",
        label: "SegmentedControl",
        ui: [{ file: "segmented-control.tsx", exports: ["SegmentedControl", "SegmentedControlItem"] }],
      },
      {
        id: "toggle-group",
        label: "ToggleGroup",
        ui: [
          {
            file: "toggle-group.tsx",
            exports: ["ToggleGroup", "ToggleGroupItem", "ToggleGroupProps", "ToggleGroupItemProps"],
          },
        ],
      },
    ],
  },
  {
    id: "display",
    group: "Components",
    label: "Display",
    summary: "Read-only surfaces: badges, cards, alerts, avatars, tables and data bars.",
    entries: [
      {
        id: "badge",
        label: "Badge",
        ui: [{ file: "badge.tsx", exports: ["Badge", "badgeVariants", "BadgeTone", "BadgeVariantLegacy"] }],
      },
      {
        id: "card",
        label: "Card",
        ui: [
          {
            file: "card.tsx",
            exports: [
              "Card",
              "Surface",
              "CardHeader",
              "CardFooter",
              "CardTitle",
              "CardAction",
              "CardDescription",
              "CardContent",
              "CardVariant",
              "CardProps",
            ],
          },
        ],
      },
      {
        id: "alert",
        label: "Alert",
        ui: [{ file: "alert.tsx", exports: ["Alert", "AlertTitle", "AlertDescription"] }],
      },
      {
        id: "avatar",
        label: "Avatar",
        ui: [{ file: "avatar.tsx", exports: ["Avatar", "AvatarImage", "AvatarFallback"] }],
      },
      {
        id: "table",
        label: "Table",
        ui: [
          {
            file: "table.tsx",
            exports: [
              "Table",
              "TableHeader",
              "TableBody",
              "TableFooter",
              "TableHead",
              "TableRow",
              "TableCell",
              "TableCaption",
            ],
          },
        ],
      },
      {
        id: "stat-bar",
        label: "StatBar",
        ui: [{ file: "stat-bar.tsx", exports: ["StatBar", "StatBarGroup"] }],
      },
      {
        id: "skeleton",
        label: "Skeleton",
        ui: [{ file: "skeleton.tsx", exports: ["Skeleton"] }],
      },
      {
        id: "separator",
        label: "Separator",
        ui: [{ file: "separator.tsx", exports: ["Separator"] }],
      },
      {
        id: "aspect-ratio",
        label: "AspectRatio",
        ui: [{ file: "aspect-ratio.tsx", exports: ["AspectRatio"] }],
      },
    ],
  },
  {
    id: "forms",
    group: "Components",
    label: "Forms",
    summary: "Inputs and the Field layout primitives. Interactive controls use the dual control border, not the structural ladder.",
    entries: [
      {
        id: "input",
        label: "Input",
        ui: [
          { file: "input.tsx", exports: ["Input"] },
          { file: "textarea.tsx", exports: ["Textarea"] },
          { file: "label.tsx", exports: ["Label"] },
        ],
      },
      {
        id: "field",
        label: "Field",
        ui: [
          {
            file: "field.tsx",
            exports: [
              "Field",
              "FieldLabel",
              "FieldDescription",
              "FieldError",
              "FieldGroup",
              "FieldLegend",
              "FieldSeparator",
              "FieldSet",
              "FieldContent",
              "FieldTitle",
            ],
          },
        ],
      },
      {
        id: "select",
        label: "Select",
        ui: [
          {
            file: "select.tsx",
            exports: [
              "Select",
              "SelectContent",
              "SelectGroup",
              "SelectItem",
              "SelectLabel",
              "SelectScrollDownButton",
              "SelectScrollUpButton",
              "SelectSeparator",
              "SelectTrigger",
              "SelectValue",
            ],
            documentedOnly: {
              SelectScrollUpButton: "SelectContent renders it when the list overflows.",
              SelectScrollDownButton: "SelectContent renders it when the list overflows.",
            },
          },
        ],
      },
      {
        id: "choice-controls",
        label: "Checkbox, Switch, Slider",
        ui: [
          { file: "checkbox.tsx", exports: ["Checkbox"] },
          { file: "switch.tsx", exports: ["Switch"] },
          { file: "slider.tsx", exports: ["Slider"] },
        ],
      },
      {
        id: "search-fields",
        label: "Search fields",
        ui: [
          { file: "gallery-search-field.tsx", exports: ["GallerySearchField", "galleryToolbarControlClassName"] },
          { file: "search-bar.tsx", exports: ["SearchBar", "useSearchBarProps", "SearchConfig", "SearchBarProps"] },
        ],
      },
    ],
  },
  {
    id: "overlays",
    group: "Components",
    label: "Overlays",
    summary: "Everything that portals above the page. Open each one to inspect it under the pinned theme.",
    entries: [
      {
        id: "dialog",
        label: "Dialog",
        ui: [
          {
            file: "dialog.tsx",
            exports: [
              "Dialog",
              "DialogBody",
              "DialogClose",
              "DialogContent",
              "DialogDescription",
              "DialogFooter",
              "DialogHeader",
              "DialogOverlay",
              "DialogPortal",
              "DialogTitle",
              "DialogTrigger",
              "overlayScrimClassName",
            ],
            documentedOnly: {
              DialogPortal: "DialogContent renders its own portal.",
              DialogOverlay: "DialogContent renders its own overlay.",
              overlayScrimClassName: "The scrim class every overlay (Dialog, AlertDialog, Sheet) shares.",
            },
          },
        ],
      },
      {
        id: "alert-dialog",
        label: "AlertDialog",
        ui: [
          {
            file: "alert-dialog.tsx",
            exports: [
              "AlertDialog",
              "AlertDialogPortal",
              "AlertDialogOverlay",
              "AlertDialogTrigger",
              "AlertDialogContent",
              "AlertDialogHeader",
              "AlertDialogFooter",
              "AlertDialogTitle",
              "AlertDialogDescription",
              "AlertDialogAction",
              "AlertDialogCancel",
            ],
            documentedOnly: {
              AlertDialogPortal: "AlertDialogContent renders its own portal.",
              AlertDialogOverlay: "AlertDialogContent renders its own overlay.",
            },
          },
        ],
      },
      {
        id: "sheet",
        label: "Sheet",
        ui: [
          {
            file: "sheet.tsx",
            exports: [
              "Sheet",
              "SheetPortal",
              "SheetOverlay",
              "SheetTrigger",
              "SheetClose",
              "SheetContent",
              "SheetHeader",
              "SheetFooter",
              "SheetTitle",
              "SheetDescription",
            ],
            documentedOnly: {
              SheetPortal: "SheetContent renders its own portal.",
              SheetOverlay: "SheetContent renders its own overlay.",
            },
          },
        ],
      },
      {
        id: "dropdown-menu",
        label: "DropdownMenu",
        ui: [
          {
            file: "dropdown-menu.tsx",
            exports: [
              "DropdownMenu",
              "DropdownMenuPortal",
              "DropdownMenuTrigger",
              "DropdownMenuContent",
              "DropdownMenuGroup",
              "DropdownMenuLabel",
              "DropdownMenuItem",
              "DropdownMenuCheckboxItem",
              "DropdownMenuRadioGroup",
              "DropdownMenuRadioItem",
              "DropdownMenuSeparator",
              "DropdownMenuShortcut",
              "DropdownMenuSub",
              "DropdownMenuSubTrigger",
              "DropdownMenuSubContent",
            ],
            documentedOnly: {
              DropdownMenuPortal: "DropdownMenuContent and DropdownMenuSubContent render their own portal.",
            },
          },
        ],
      },
      {
        id: "popover",
        label: "Popover & HoverCard",
        ui: [
          { file: "popover.tsx", exports: ["Popover", "PopoverTrigger", "PopoverContent", "PopoverAnchor"] },
          { file: "hover-card.tsx", exports: ["HoverCard", "HoverCardTrigger", "HoverCardContent"] },
        ],
      },
      {
        id: "tooltip",
        label: "Tooltip",
        ui: [{ file: "tooltip.tsx", exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"] }],
      },
      {
        id: "toast",
        label: "Toast (Sonner)",
        ui: [
          {
            file: "sonner.tsx",
            exports: ["Toaster"],
            documentedOnly: {
              Toaster: "Mounted once in src/app/providers.tsx. The demo fires toast() into it; a second Toaster would double every toast.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "navigation",
    group: "Components",
    label: "Disclosure",
    summary: "Tabs and collapsible regions.",
    entries: [
      {
        id: "tabs",
        label: "Tabs",
        ui: [{ file: "tabs.tsx", exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"] }],
      },
      {
        id: "collapsible",
        label: "Collapsible",
        ui: [{ file: "collapsible.tsx", exports: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"] }],
      },
    ],
  },
  {
    id: "patterns",
    group: "Patterns",
    label: "Shell patterns",
    summary: "Where page controls live: the desktop floating islands and the mobile slot system.",
    entries: [
      { id: "floating-islands", label: "Floating header islands" },
      { id: "mobile-shell", label: "Mobile shell slots" },
    ],
  },
] as const satisfies readonly CatalogChapter[];

export type ChapterId = (typeof CATALOG_CHAPTERS)[number]["id"];

export const CHAPTER_IDS = CATALOG_CHAPTERS.map((chapter) => chapter.id) as ChapterId[];

export function getChapter(id: ChapterId): CatalogChapter {
  return CATALOG_CHAPTERS.find((chapter) => chapter.id === id)!;
}

export function getEntry(id: string): CatalogEntry {
  for (const chapter of CATALOG_CHAPTERS as readonly CatalogChapter[]) {
    const entry = chapter.entries.find((row) => row.id === id);
    if (entry) return entry;
  }
  throw new Error(`Unknown catalog entry: ${id}`);
}

export const REPO_BLOB_URL = "https://github.com/Rakvadium/uvs-decks-gg/blob/dev";
