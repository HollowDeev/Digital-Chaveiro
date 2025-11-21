/**
 * Custom hooks para buscar dados do Supabase
 * Substitui o uso de mock-data e fornece dados dinâmicos do banco
 */

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type {
  Produto,
  Servico,
  Cliente,
  Venda,
  ContaPagar,
  ContaReceber,
  Perda,
} from "@/lib/types"

/**
 * Hook para buscar todos os produtos da loja selecionada
 */
export function useProdutos(lojaId?: string) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProdutos = async () => {
    if (!lojaId) {
      setProdutos([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data, error: err } = await supabase
        .from("produtos")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome")

      if (err) throw err
      setProdutos(
        (data || []).map((p: any) => ({
          id: p.id,
          nome: p.nome,
          codigo: p.codigo_barras || "",
          preco: p.preco,
          custoUnitario: p.custo || 0,
          estoque: p.estoque,
          categoria: p.categoria || "",
          descricao: p.descricao || "",
          ativo: p.ativo,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar produtos"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProdutos()
  }, [lojaId])

  return { produtos, loading, error, refetch: fetchProdutos }
}

/**
 * Hook para buscar todos os serviços da loja selecionada
 */
export function useServicos(lojaId?: string) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchServicos = async () => {
    if (!lojaId) {
      setServicos([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data, error: err } = await supabase
        .from("servicos")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome")

      if (err) throw err
      setServicos(
        (data || []).map((s: any) => ({
          id: s.id,
          nome: s.nome,
          codigo: s.id.substring(0, 8), // Gera um código a partir do ID
          preco: s.preco,
          categoria: "Serviço",
          descricao: s.descricao || "",
          duracao: s.duracao_estimada || null,
          ativo: s.ativo,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar serviços"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicos()
  }, [lojaId])

  return { servicos, loading, error, refetch: fetchServicos }
}

/**
 * Hook para buscar todos os clientes da loja selecionada
 */
export function useClientes(lojaId?: string) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setClientes([])
      setLoading(false)
      return
    }

    const fetchClientes = async () => {
      const supabase = createClient()
      try {
        const { data, error: err } = await supabase
          .from("clientes")
          .select("*")
          .eq("loja_id", lojaId)
          .eq("ativo", true)
          .order("nome")

        if (err) throw err
        setClientes(
          (data || []).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            email: c.email,
            telefone: c.telefone,
            tipo: c.tipo as "pf" | "pj",
            cpf_cnpj: c.cpf_cnpj,
            endereco: c.endereco,
            cidade: c.cidade,
            estado: c.estado,
            cep: c.cep,
            ativo: c.ativo,
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro ao buscar clientes"))
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [lojaId])

  return { clientes, loading, error }
}

/**
 * Hook para buscar todas as vendas da loja selecionada
 */
export function useVendas(lojaId?: string) {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setVendas([])
      setLoading(false)
      return
    }

    const fetchVendas = async () => {
      const supabase = createClient()
      try {
        const { data, error: err } = await supabase
          .from("vendas")
          .select("*")
          .eq("loja_id", lojaId)
          .order("data_venda", { ascending: false })

        if (err) throw err
        setVendas(
          (data || []).map((v: any) => ({
            id: v.id,
            funcionarioId: v.funcionario_id,
            clienteId: v.cliente_id,
            total: v.total,
            desconto: v.desconto || 0,
            formaPagamento: v.forma_pagamento as "dinheiro" | "credito" | "debito" | "pix",
            status: v.status as "concluida" | "cancelada" | "pendente",
            data: v.data_venda,
            itens: [], // Será populado pelo hook de itens
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro ao buscar vendas"))
      } finally {
        setLoading(false)
      }
    }

    fetchVendas()
  }, [lojaId])

  return { vendas, loading, error }
}

/**
 * Hook para buscar contas a pagar da loja selecionada
 */
export function useContasPagar(lojaId?: string) {
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setContas([])
      setLoading(false)
      return
    }

    const fetchContas = async () => {
      const supabase = createClient()
      try {
        const { data, error: err } = await supabase
          .from("contas_pagar")
          .select("*")
          .eq("loja_id", lojaId)
          .order("data_vencimento")

        if (err) throw err
        setContas(
          (data || []).map((c: any) => ({
            id: c.id,
            descricao: c.descricao,
            valor: c.valor,
            dataVencimento: c.data_vencimento,
            status: c.status as "pendente" | "paga",
            categoria: c.categoria,
            fornecedor: c.fornecedor,
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro ao buscar contas a pagar"))
      } finally {
        setLoading(false)
      }
    }

    fetchContas()
  }, [lojaId])

  return { contas, loading, error }
}

/**
 * Hook para buscar contas a receber da loja selecionada
 */
export function useContasReceber(lojaId?: string) {
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setContas([])
      setLoading(false)
      return
    }

    const fetchContas = async () => {
      const supabase = createClient()
      try {
        const { data, error: err } = await supabase
          .from("contas_receber")
          .select("*")
          .eq("loja_id", lojaId)
          .order("data_vencimento")

        if (err) throw err
        setContas(
          (data || []).map((c: any) => ({
            id: c.id,
            clienteId: c.cliente_id,
            descricao: c.descricao,
            valor: c.valor,
            dataVencimento: c.data_vencimento,
            status: c.status as "pendente" | "recebida",
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro ao buscar contas a receber"))
      } finally {
        setLoading(false)
      }
    }

    fetchContas()
  }, [lojaId])

  return { contas, loading, error }
}

/**
 * Hook para buscar perdas/danos da loja selecionada
 */
export function usePerdas(lojaId?: string) {
  const [perdas, setPerdas] = useState<Perda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setPerdas([])
      setLoading(false)
      return
    }

    const fetchPerdas = async () => {
      const supabase = createClient()
      try {
        const { data, error: err } = await supabase
          .from("perdas")
          .select("*")
          .eq("loja_id", lojaId)
          .order("data_perda", { ascending: false })

        if (err) throw err
        setPerdas(
          (data || []).map((p: any) => ({
            id: p.id,
            descricao: p.descricao,
            quantidade: p.quantidade,
            custoUnitario: p.custo_unitario,
            custoTotal: p.custo_total,
            motivo: p.motivo,
            categoriaPerda: p.categoria_perda,
            data: p.data_perda,
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro ao buscar perdas"))
      } finally {
        setLoading(false)
      }
    }

    fetchPerdas()
  }, [lojaId])

  return { perdas, loading, error }
}
