"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { usePermissoes } from "@/lib/hooks/usePermissoes"
import { useLoja } from "@/lib/contexts/loja-context"
import { Shield, AlertTriangle } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading: lojaLoading } = useLoja()
  const { nivelAcesso, loading: permissoesLoading, podeAcessar } = usePermissoes()

  const isLoading = lojaLoading || permissoesLoading

  useEffect(() => {
    if (isLoading) return

    // Se não tem permissão para acessar a página atual
    if (pathname && !podeAcessar(pathname)) {
      // Redireciona para o PDV (página padrão para funcionários)
      router.push("/pdv")
    }
  }, [isLoading, pathname, podeAcessar, router])

  // Mostra loading enquanto verifica permissões
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Se não tem acesso, mostra mensagem
  if (pathname && !podeAcessar(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Você não tem permissão para acessar esta página. 
            Entre em contato com o administrador se precisar de acesso.
          </p>
          <button
            onClick={() => router.push("/pdv")}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ir para o PDV
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
