/**
 * Hook para verificação do caixa ao acessar PDV
 * Faz uma requisição ao banco para verificar se há caixa aberto
 * Só renderiza a página após confirmar o status do caixa
 */

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface CaixaAberto {
  id: string
  status: string
  valor_abertura: number
}

export function useCaixaVerification(lojaId?: string, enabled = true) {
  const [caixa, setCaixa] = useState<CaixaAberto | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [verificacaoCompleta, setVerificacaoCompleta] = useState(false)

  const verificarCaixa = async () => {
    if (!lojaId || !enabled) {
      setIsVerifying(false)
      setVerificacaoCompleta(true)
      return
    }

    try {
      setIsVerifying(true)
      setVerificacaoCompleta(false)
      const supabase = createClient()
      
      // Verificar se tem sessão antes de fazer query
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.warn("Não foi possível obter sessão para verificar caixa:", sessionError.message)
        setCaixa(null)
        setError(null)
        setVerificacaoCompleta(true)
        setIsVerifying(false)
        return
      }

      if (!session) {
        // Sem sessão, considera caixa fechado
        setCaixa(null)
        setError(null)
        setVerificacaoCompleta(true)
        setIsVerifying(false)
        return
      }

      // Query sem .single() para evitar erro 406
      const { data, error: err } = await supabase
        .from("caixas")
        .select("id, status, valor_abertura")
        .eq("loja_id", lojaId)
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false })
        .limit(1)

      if (err) {
        console.error("Erro ao verificar caixa - código:", err.code, "mensagem:", err.message)
        throw err
      } else {
        // data é um array, pegar o primeiro elemento ou null
        const caixaAberto = data && data.length > 0 ? data[0] : null
        setCaixa(caixaAberto || null)
        setError(null)
      }
    } catch (err) {
      // Log error details properly for debugging
      if (err instanceof Error) {
        console.error("Erro ao verificar caixa (catch):", err.message)
        setError(err)
      } else if (typeof err === 'object' && err !== null) {
        const errorStr = JSON.stringify(err)
        console.error("Erro ao verificar caixa (object):", errorStr)
        setError(new Error(errorStr))
      } else {
        const errorStr = String(err)
        console.error("Erro ao verificar caixa (unknown):", errorStr)
        setError(new Error(errorStr))
      }
      setCaixa(null)
    } finally {
      setIsVerifying(false)
      setVerificacaoCompleta(true)
    }
  }

  useEffect(() => {
    verificarCaixa()
  }, [lojaId, enabled])

  return {
    caixa,
    isVerifying,
    error,
    verificacaoCompleta,
    refetch: verificarCaixa
  }
}
