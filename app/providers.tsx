"use client"

import React from "react"
import { ThemeProvider } from "next-themes"
import { LojaProvider } from "@/lib/contexts/loja-context"

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
            <LojaProvider>
                {children}
            </LojaProvider>
        </ThemeProvider>
    )
}
