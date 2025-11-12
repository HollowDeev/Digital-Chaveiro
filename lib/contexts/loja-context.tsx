"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface Loja {
  id: string
  nome: string
  cnpj: string | null
  endereco: string | null
  telefone: string | null
  created_at: string
}

interface LojaContextType {
  lojaAtual: Loja | null
  lojas: Loja[]
  setLojaAtual: (loja: Loja) => void
  carregarLojas: () => Promise<void>
  loading: boolean
}

const LojaContext = createContext<LojaContextType | undefined>(undefined)

export function LojaProvider({ children }: { children: ReactNode }) {
  const [lojaAtual, setLojaAtualState] = useState<Loja | null>(null)
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const carregarLojas = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Buscar lojas onde o usuário é dono
      const { data: lojasOwner } = await supabase.from("lojas").select("*").eq("owner_id", user.id)

      // Buscar lojas onde o usuário tem acesso
      const { data: acessos } = await supabase
        .from("loja_usuarios")
        .select("loja_id, lojas(*)")
        .eq("usuario_id", user.id)

      const lojasAcesso = acessos?.map((a: any) => a.lojas) || []
      const todasLojas = [...(lojasOwner || []), ...lojasAcesso]

      setLojas(todasLojas)

      if (todasLojas.length > 0 && !lojaAtual) {
        const lojaIdSalva = localStorage.getItem("loja_atual_id")
        const lojaSalva = todasLojas.find((l) => l.id === lojaIdSalva)
        setLojaAtualState(lojaSalva || todasLojas[0])
      }
    } catch (error) {
      console.error("Erro ao carregar lojas:", error)
    } finally {
      setLoading(false)
    }
  }

  const setLojaAtual = (loja: Loja) => {
    setLojaAtualState(loja)
    localStorage.setItem("loja_atual_id", loja.id)
  }

  useEffect(() => {
    carregarLojas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LojaContext.Provider value={{ lojaAtual, lojas, setLojaAtual, carregarLojas, loading }}>
      {children}
    </LojaContext.Provider>
  )
}

export function useLoja() {
  const context = useContext(LojaContext)
  if (context === undefined) {
    throw new Error("useLoja deve ser usado dentro de um LojaProvider")
  }
  return context
}
