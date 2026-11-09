import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Named z-index stack from src/styles/system/ladders.css. tailwind-merge only knows numeric
// and arbitrary z values, so without this a named z never conflicts with another z class.
// The ladder's color utilities (bg-*, border-*, ring-*) already merge as colors.
const NAMED_Z_INDEX = [
  "sticky",
  "shell",
  "modal",
  "dialog-float",
  "chrome",
  "popover",
  "select",
  "nested-overlay",
  "nested-dialog",
  "dock",
  "drag",
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      z: [{ z: [...NAMED_Z_INDEX] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
