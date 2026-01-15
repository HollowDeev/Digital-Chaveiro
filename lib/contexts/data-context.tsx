"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "./loja-context"
import type {
  Produto,
  Servico,
  Cliente,
  Funcionario,
  Venda,
  ContaPagar,
  ContaReceber,
  Perda,
  CategoriaPerda,
} from "@/lib/types"

interface CaixaData {
  id: string
  status: string
  valorAbertura: number
  dataAbertura: string
  funcionarioAberturaId: string
  funcionarioAberturaNome: string
  movimentacoes: any[]
}

interface DataContextType {
  // Dados em cache
  produtos: Produto[]
  servicos: Servico[]
  clientes: Cliente[]
  funcionarios: Funcionario[]
  vendas: Venda[]
  contasPagar: ContaPagar[]
  contasReceber: ContaReceber[]
  perdas: Perda[]
  categoriasPerdas: CategoriaPerda[]
  caixaAberto: CaixaData | null

  // Status
  loading: boolean
  dataLoaded: boolean
  lastUpdated: Date | null

  // Funções de refetch individuais
  refetchProdutos: () => Promise<void>
  refetchServicos: () => Promise<void>
  refetchClientes: () => Promise<void>
  refetchFuncionarios: () => Promise<void>
  refetchVendas: () => Promise<void>
  refetchContasPagar: () => Promise<void>
  refetchContasReceber: () => Promise<void>
  refetchPerdas: () => Promise<void>
  refetchCategoriasPerdas: () => Promise<void>
  refetchCaixa: () => Promise<void>

  // Refetch geral
  refetchAll: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { lojaAtual } = useLoja()
  const lojaId = lojaAtual?.id

  // Estados de dados
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [perdas, setPerdas] = useState<Perda[]>([])
  const [categoriasPerdas, setCategoriasPerdas] = useState<CategoriaPerda[]>([])
  const [caixaAberto, setCaixaAberto] = useState<CaixaData | null>(null)

  // Status
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Funções de fetch individuais
  const fetchProdutos = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
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
          imagem: p.imagem_url || "",
          ativo: p.ativo,
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar produtos:", err)
    }
  }, [lojaId])

  const fetchServicos = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select(`*, servicos_custos(*)`)
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome")

      if (error) throw error
      setServicos(
        (data || []).map((s: any) => ({
          id: s.id,
          nome: s.nome,
          codigo: s.codigo || "",
          preco: s.preco,
          duracao: s.duracao || 0,
          categoria: s.categoria || "",
          descricao: s.descricao || "",
          ativo: s.ativo,
          custos: (s.servicos_custos || []).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            valor: c.valor,
            descricao: c.descricao || "",
          })),
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar serviços:", err)
    }
  }, [lojaId])

  const fetchClientes = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("loja_id", lojaId)
        .order("nome")

      if (error) throw error
      setClientes(
        (data || []).map((c: any) => ({
          id: c.id,
          nome: c.nome,
          email: c.email || "",
          telefone: c.telefone || "",
          cpf: c.cpf || c.cpf_cnpj || "",
          cpf_cnpj: c.cpf_cnpj || c.cpf || "",
          endereco: c.endereco || "",
          dataCadastro: c.created_at,
          ultimaCompra: c.ultima_compra || undefined,
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar clientes:", err)
    }
  }, [lojaId])

  const fetchFuncionarios = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("lojas_usuarios")
        .select("*")
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setFuncionarios(
        (data || []).map((fu: any) => ({
          id: fu.id,
          nome: fu.nome || `Usuário ${fu.user_id?.substring(0, 8) || 'desconhecido'}`,
          email: fu.email || "",
          telefone: fu.telefone || "",
          cargo: fu.cargo || (fu.nivel_acesso === "dono" ? "Dono" : fu.nivel_acesso === "gerente" ? "Gerente" : "Funcionário"),
          nivel_acesso: fu.nivel_acesso,
          salario: fu.salario || 0,
          dataAdmissao: fu.data_admissao || fu.created_at,
          ativo: fu.ativo !== false,
          user_id: fu.user_id,
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err)
    }
  }, [lojaId])

  const fetchVendas = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select("*")
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setVendas(
        (data || []).map((v: any) => ({
          id: v.id,
          data: v.created_at,
          cliente: v.cliente_id,
          clienteId: v.cliente_id,
          itens: [],
          subtotal: v.subtotal || v.total,
          desconto: v.desconto || 0,
          total: v.total,
          formaPagamento: v.forma_pagamento,
          funcionarioId: v.funcionario_id,
          status: v.status || "finalizada",
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar vendas:", err)
    }
  }, [lojaId])

  const fetchContasPagar = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("contas_pagar")
        .select("*")
        .eq("loja_id", lojaId)
        .order("data_vencimento", { ascending: true })

      if (error) throw error
      setContasPagar(
        (data || []).map((c: any) => ({
          id: c.id,
          descricao: c.descricao,
          valor: c.valor,
          dataVencimento: c.data_vencimento,
          dataPagamento: c.data_pagamento,
          categoria: c.categoria,
          status: c.status,
          observacoes: c.observacoes,
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar contas a pagar:", err)
    }
  }, [lojaId])

  const fetchContasReceber = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("contas_receber")
        .select("*")
        .eq("loja_id", lojaId)
        .order("data_vencimento", { ascending: true })

      if (error) throw error
      setContasReceber(
        (data || []).map((c: any) => ({
          id: c.id,
          descricao: c.descricao,
          valor: c.valor,
          clienteId: c.cliente_id,
          clienteNome: c.cliente_nome || "",
          dataVencimento: c.data_vencimento,
          dataRecebimento: c.data_recebimento,
          status: c.status,
          observacoes: c.observacoes,
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar contas a receber:", err)
    }
  }, [lojaId])

  const fetchPerdas = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("perdas")
        .select("*, produtos(nome), categorias_perdas(nome)")
        .eq("loja_id", lojaId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPerdas(
        (data || []).map((p: any) => ({
          id: p.id,
          produtoId: p.produto_id,
          produtoNome: p.produtos?.nome || "",
          quantidade: p.quantidade,
          custoUnitario: p.custo_unitario,
          custoTotal: p.custo_total,
          motivo: p.motivo,
          categoriaId: p.categoria_id,
          categoria: p.categorias_perdas?.nome || "",
          categoriaNome: p.categorias_perdas?.nome || "",
          funcionarioId: p.funcionario_id,
          data: p.created_at,
          observacoes: p.observacoes,
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar perdas:", err)
    }
  }, [lojaId])

  const fetchCategoriasPerdas = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("categorias_perdas")
        .select("*")
        .eq("loja_id", lojaId)
        .order("nome")

      if (error) throw error
      setCategoriasPerdas(
        (data || []).map((c: any) => ({
          id: c.id,
          nome: c.nome,
          descricao: c.descricao || "",
        }))
      )
    } catch (err) {
      console.error("Erro ao buscar categorias de perdas:", err)
    }
  }, [lojaId])

  const fetchCaixa = useCallback(async () => {
    if (!lojaId) return
    const supabase = createClient()
    try {
      const { data: caixaData, error: caixaError } = await supabase
        .from("caixas")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false })
        .limit(1)
        .single()

      if (caixaError && caixaError.code !== "PGRST116") throw caixaError

      if (!caixaData) {
        setCaixaAberto(null)
        return
      }

      const { data: movimentacoesData } = await supabase
        .from("caixa_movimentacoes")
        .select("*")
        .eq("caixa_id", caixaData.id)
        .order("data", { ascending: true })

      setCaixaAberto({
        id: caixaData.id,
        status: caixaData.status,
        valorAbertura: caixaData.valor_abertura,
        dataAbertura: caixaData.data_abertura,
        funcionarioAberturaId: caixaData.funcionario_abertura_id,
        funcionarioAberturaNome: `Funcionário ${caixaData.funcionario_abertura_id.substring(0, 8)}`,
        movimentacoes: (movimentacoesData || []).map((mov: any) => ({
          id: mov.id,
          tipo: mov.tipo,
          categoria: mov.categoria,
          descricao: mov.descricao,
          valor: mov.valor,
          funcionarioId: mov.funcionario_id,
          data: mov.data,
        })),
      })
    } catch (err) {
      console.error("Erro ao buscar caixa:", err)
    }
  }, [lojaId])

  // Refetch geral - carrega todos os dados
  const refetchAll = useCallback(async () => {
    if (!lojaId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      await Promise.all([
        fetchProdutos(),
        fetchServicos(),
        fetchClientes(),
        fetchFuncionarios(),
        fetchVendas(),
        fetchContasPagar(),
        fetchContasReceber(),
        fetchPerdas(),
        fetchCategoriasPerdas(),
        fetchCaixa(),
      ])
      setDataLoaded(true)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }, [
    lojaId,
    fetchProdutos,
    fetchServicos,
    fetchClientes,
    fetchFuncionarios,
    fetchVendas,
    fetchContasPagar,
    fetchContasReceber,
    fetchPerdas,
    fetchCategoriasPerdas,
    fetchCaixa,
  ])

  // Carregar dados quando a loja muda
  useEffect(() => {
    if (lojaId) {
      // Só recarrega se ainda não tiver dados ou se a loja mudou
      if (!dataLoaded) {
        refetchAll()
      }
    } else {
      // Limpar dados se não há loja
      setProdutos([])
      setServicos([])
      setClientes([])
      setFuncionarios([])
      setVendas([])
      setContasPagar([])
      setContasReceber([])
      setPerdas([])
      setCategoriasPerdas([])
      setCaixaAberto(null)
      setDataLoaded(false)
      setLoading(false)
    }
  }, [lojaId])

  // Reset dataLoaded quando loja muda para forçar recarregamento
  useEffect(() => {
    setDataLoaded(false)
  }, [lojaId])

  return (
    <DataContext.Provider
      value={{
        // Dados
        produtos,
        servicos,
        clientes,
        funcionarios,
        vendas,
        contasPagar,
        contasReceber,
        perdas,
        categoriasPerdas,
        caixaAberto,
        // Status
        loading,
        dataLoaded,
        lastUpdated,
        // Refetch
        refetchProdutos: fetchProdutos,
        refetchServicos: fetchServicos,
        refetchClientes: fetchClientes,
        refetchFuncionarios: fetchFuncionarios,
        refetchVendas: fetchVendas,
        refetchContasPagar: fetchContasPagar,
        refetchContasReceber: fetchContasReceber,
        refetchPerdas: fetchPerdas,
        refetchCategoriasPerdas: fetchCategoriasPerdas,
        refetchCaixa: fetchCaixa,
        refetchAll,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData deve ser usado dentro de um DataProvider")
  }
  return context
}
