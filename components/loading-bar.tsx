/**
 * Componente de Loading Bar para requisições
 * Mostra uma barra de progresso durante navegação de páginas
 */

"use client"

import { useEffect, useState } from "react"

export function LoadingBar() {
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Detectar mudanças no histórico/navegação
        const handleStart = () => {
            setIsLoading(true)
            setProgress(10)
        }

        const handleStop = () => {
            setProgress(100)
            setTimeout(() => {
                setIsLoading(false)
                setProgress(0)
            }, 300)
        }

        // Observer para detectar mudanças no DOM (navegação no Next.js)
        const observer = new MutationObserver(() => {
            if (document.readyState === "loading") {
                handleStart()
            } else {
                handleStop()
            }
        })

        observer.observe(document, { childList: true, subtree: true })

        // Cleanup
        return () => {
            observer.disconnect()
        }
    }, [])

    // Incrementar progresso enquanto estiver loading
    useEffect(() => {
        if (!isLoading) return

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev
                return prev + Math.random() * 30
            })
        }, 500)

        return () => clearInterval(interval)
    }, [isLoading])

    if (!isLoading && progress === 0) return null

    return (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
            <div
                className="h-full bg-gradient-to-r from-primary via-primary to-transparent transition-all duration-300"
                style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 10px rgba(var(--primary-rgb), 0.8)"
                }}
            />
        </div>
    )
}
