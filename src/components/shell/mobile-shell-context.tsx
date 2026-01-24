"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface MobileShellState {
  isProfileSheetOpen: boolean
  isActionsSheetOpen: boolean
  setProfileSheetOpen: (open: boolean) => void
  setActionsSheetOpen: (open: boolean) => void
}

const MobileShellContext = createContext<MobileShellState | null>(null)

export function MobileShellProvider({ children }: { children: ReactNode }) {
  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false)
  const [isActionsSheetOpen, setActionsSheetOpen] = useState(false)

  return (
    <MobileShellContext.Provider
      value={{
        isProfileSheetOpen,
        isActionsSheetOpen,
        setProfileSheetOpen,
        setActionsSheetOpen,
      }}
    >
      {children}
    </MobileShellContext.Provider>
  )
}

export function useMobileShell() {
  const context = useContext(MobileShellContext)
  if (!context) {
    throw new Error("useMobileShell must be used within MobileShellProvider")
  }
  return context
}
