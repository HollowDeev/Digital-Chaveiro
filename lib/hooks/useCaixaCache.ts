/**
 * Hook para gerenciar cache do estado do caixa (aberto/fechado)
 * Salva localmente e renderiza sem fazer requisições desnecessárias
 */

import { useEffect, useState } from "react"

interface CaixaCache {
  caixaAberto: boolean
  caixaId?: string
  funcionarioId?: string
  timestamp: number
}

const CACHE_KEY = "digital_chaveiro_caixa_cache"
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 horas

export function useCaixaCache() {
  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null)
  const [caixaId, setCaixaId] = useState<string | undefined>(undefined)
  const [funcionarioId, setFuncionarioId] = useState<string | undefined>(undefined)
  const [isHydrated, setIsHydrated] = useState(false)

  // Carregar do cache ao montar
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const data: CaixaCache = JSON.parse(cached)
        const now = Date.now()
        
        // Verificar se cache não expirou
        if (now - data.timestamp < CACHE_EXPIRY) {
          setCaixaAberto(data.caixaAberto)
          setCaixaId(data.caixaId)
          setFuncionarioId(data.funcionarioId)
        } else {
          // Cache expirou, limpar
          limparCache()
        }
      } catch (err) {
        console.error("Erro ao ler cache do caixa:", err)
        limparCache()
      }
    }
    setIsHydrated(true)
  }, [])

  const salvarCache = (aberto: boolean, cId?: string, funcId?: string) => {
    const data: CaixaCache = {
      caixaAberto: aberto,
      caixaId: cId,
      funcionarioId: funcId,
      timestamp: Date.now()
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      setCaixaAberto(aberto)
      setCaixaId(cId)
      setFuncionarioId(funcId)
    } catch (err) {
      console.error("Erro ao salvar cache do caixa:", err)
    }
  }

  const limparCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY)
      setCaixaAberto(false)
      setCaixaId(undefined)
      setFuncionarioId(undefined)
    } catch (err) {
      console.error("Erro ao limpar cache do caixa:", err)
    }
  }

  return {
    caixaAberto,
    caixaId,
    funcionarioId,
    isHydrated,
    salvarCache,
    limparCache
  }
}
