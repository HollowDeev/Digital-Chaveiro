"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "./loja-context"

export type NivelAcesso = "dono" | "gerente" | "funcionario" | null

// Páginas que funcionários podem acessar
const PAGINAS_FUNCIONARIO = [
  "/pdv",
  "/estoque",
  "/caixa",
  "/servicos",
  "/clientes",
  "/configuracao",
]

// Páginas exclusivas do dono/gerente
const PAGINAS_DONO = [
  "/dashboard",
  "/funcionarios",
  "/relatorios",
  "/graficos",
]

interface PermissoesContextType {
  nivelAcesso: NivelAcesso
  loading: boolean
  userId: string | null
  podeAcessar: (pagina: string) => boolean
  isDono: boolean
  isGerente: boolean
  isFuncionario: boolean
  isAdmin: boolean // dono ou gerente
  PAGINAS_FUNCIONARIO: string[]
  PAGINAS_DONO: string[]
}

const PermissoesContext = createContext<PermissoesContextType | undefined>(undefined)

export function PermissoesProvider({ children }: { children: ReactNode }) {
  const { lojaAtual, loading: lojaLoading } = useLoja()
  const [nivelAcesso, setNivelAcesso] = useState<NivelAcesso>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const verificarPermissoes = useCallback(async () => {
    // Se a loja ainda está carregando, aguarda
    if (lojaLoading) {
      setLoading(true)
      return
    }

    // Se não há loja ativa, usuário sem permissões
    if (!lojaAtual) {
      setNivelAcesso(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setNivelAcesso(null)
        setLoading(false)
        return
      }

      setUserId(user.id)

      // Verificar se é dono da loja
      const { data: loja } = await supabase
        .from("lojas")
        .select("dono_id")
        .eq("id", lojaAtual.id)
        .single()

      if (loja?.dono_id === user.id) {
        setNivelAcesso("dono")
        setLoading(false)
        return
      }

      // Verificar nível de acesso em lojas_usuarios
      const { data: acesso } = await supabase
        .from("lojas_usuarios")
        .select("nivel_acesso")
        .eq("loja_id", lojaAtual.id)
        .eq("usuario_id", user.id)
        .single()

      if (acesso) {
        setNivelAcesso(acesso.nivel_acesso as NivelAcesso)
      } else {
        setNivelAcesso(null)
      }
    } catch (error) {
      console.error("Erro ao verificar permissões:", error)
      setNivelAcesso(null)
    } finally {
      setLoading(false)
    }
  }, [lojaAtual, lojaLoading])

  useEffect(() => {
    verificarPermissoes()
  }, [verificarPermissoes])

  const podeAcessar = useCallback((pagina: string): boolean => {
    if (!nivelAcesso) return false
    if (nivelAcesso === "dono") return true
    if (nivelAcesso === "gerente") return true
    // Funcionário só pode acessar páginas permitidas
    return PAGINAS_FUNCIONARIO.some(p => pagina.startsWith(p))
  }, [nivelAcesso])

  const isDono = nivelAcesso === "dono"
  const isGerente = nivelAcesso === "gerente"
  const isFuncionario = nivelAcesso === "funcionario"
  const isAdmin = isDono || isGerente

  const value: PermissoesContextType = {
    nivelAcesso,
    loading,
    userId,
    podeAcessar,
    isDono,
    isGerente,
    isFuncionario,
    isAdmin,
    PAGINAS_FUNCIONARIO,
    PAGINAS_DONO,
  }

  return (
    <PermissoesContext.Provider value={value}>
      {children}
    </PermissoesContext.Provider>
  )
}

export function usePermissoesContext() {
  const context = useContext(PermissoesContext)
  if (context === undefined) {
    throw new Error("usePermissoesContext deve ser usado dentro de um PermissoesProvider")
  }
  return context
}
