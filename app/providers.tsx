"use client"

import React from "react"
import { ThemeProvider } from "next-themes"
import { LojaProvider } from "@/lib/contexts/loja-context"
import { DataProvider } from "@/lib/contexts/data-context"
import { PermissoesProvider } from "@/lib/contexts/permissoes-context"

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
            <LojaProvider>
                <PermissoesProvider>
                    <DataProvider>
                        {children}
                    </DataProvider>
                </PermissoesProvider>
            </LojaProvider>
        </ThemeProvider>
    )
}

