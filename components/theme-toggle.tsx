"use client"

import React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const current = resolvedTheme ?? theme

  return (
    <button
      aria-label="Mudar tema"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="p-2 rounded"
    >
      {current === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
