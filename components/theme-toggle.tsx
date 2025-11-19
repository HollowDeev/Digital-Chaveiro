"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const current = resolvedTheme ?? theme
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by not rendering theme-dependent icon until mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <button
      aria-label="Mudar tema"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="p-2 rounded"
    >
      {mounted ? (current === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : (
        // Render a placeholder element with same dimensions to avoid layout shift
        <span className="inline-block w-4 h-4" aria-hidden />
      )}
    </button>
  )
}
