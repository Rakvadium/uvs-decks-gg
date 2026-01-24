import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export default convex
