"use client"

import { createContext, useContext, useMemo, useState, ReactNode } from "react"

interface MobileShellState {
  isProfileSheetOpen: boolean
  isActionsSheetOpen: boolean
  isLargeTitleVisible: boolean
  navBarHeight: number
  tabBarHeight: number
  setProfileSheetOpen: (open: boolean) => void
  setActionsSheetOpen: (open: boolean) => void
  setLargeTitleVisible: (visible: boolean) => void
  setNavBarHeight: (height: number) => void
  setTabBarHeight: (height: number) => void
}

const MobileShellContext = createContext<MobileShellState | null>(null)

export function MobileShellProvider({ children }: { children: ReactNode }) {
  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false)
  const [isActionsSheetOpen, setActionsSheetOpen] = useState(false)
  const [isLargeTitleVisible, setLargeTitleVisible] = useState(false)
  const [navBarHeight, setNavBarHeight] = useState(56)
  const [tabBarHeight, setTabBarHeight] = useState(80)

  const value = useMemo(
    (): MobileShellState => ({
      isProfileSheetOpen,
      isActionsSheetOpen,
      isLargeTitleVisible,
      navBarHeight,
      tabBarHeight,
      setProfileSheetOpen,
      setActionsSheetOpen,
      setLargeTitleVisible,
      setNavBarHeight,
      setTabBarHeight,
    }),
    [isProfileSheetOpen, isActionsSheetOpen, isLargeTitleVisible, navBarHeight, tabBarHeight]
  )

  return <MobileShellContext.Provider value={value}>{children}</MobileShellContext.Provider>
}

export function useMobileShell() {
  const context = useContext(MobileShellContext)
  if (!context) {
    throw new Error("useMobileShell must be used within MobileShellProvider")
  }
  return context
}

export function useMobileShellOptional() {
  return useContext(MobileShellContext)
}
