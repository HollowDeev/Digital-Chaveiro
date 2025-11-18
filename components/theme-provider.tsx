"use client"

import React from "react"
import { ThemeProvider as NextThemeProvider } from "next-themes"

type ThemeProviderProps = {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Apenas um wrapper cliente que garante que useTheme será sempre usado dentro de um ThemeProvider
  return (
    <NextThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      {children}
    </NextThemeProvider>
  )
}
