"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "@/lib/contexts/loja-context"

export type NivelAcesso = "dono" | "gerente" | "funcionario" | null

// Páginas que funcionários podem acessar
const PAGINAS_FUNCIONARIO = [
  "/pdv",
  "/estoque",
  "/caixa",
  "/servicos",
  "/clientes",
  "/configuracao", // apenas configurações da conta
]

// Páginas exclusivas do dono
const PAGINAS_DONO = [
  "/dashboard",
  "/funcionarios",
  "/relatorios",
  "/graficos",
]

export function usePermissoes() {
  const { lojaAtual } = useLoja()
  const [nivelAcesso, setNivelAcesso] = useState<NivelAcesso>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const verificarPermissoes = async () => {
      if (!lojaAtual) {
        setLoading(false)
        return
      }

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
    }

    verificarPermissoes()
  }, [lojaAtual])

  // Verifica se o usuário pode acessar uma determinada página
  const podeAcessar = (pagina: string): boolean => {
    if (!nivelAcesso) return false
    
    // Dono pode acessar tudo
    if (nivelAcesso === "dono") return true
    
    // Gerente pode acessar tudo exceto algumas configurações específicas
    if (nivelAcesso === "gerente") return true
    
    // Funcionário só pode acessar páginas permitidas
    return PAGINAS_FUNCIONARIO.some(p => pagina.startsWith(p))
  }

  // Verifica se é dono
  const isDono = nivelAcesso === "dono"
  
  // Verifica se é gerente
  const isGerente = nivelAcesso === "gerente"
  
  // Verifica se é funcionário
  const isFuncionario = nivelAcesso === "funcionario"

  return {
    nivelAcesso,
    loading,
    userId,
    podeAcessar,
    isDono,
    isGerente,
    isFuncionario,
    PAGINAS_FUNCIONARIO,
    PAGINAS_DONO,
  }
}
