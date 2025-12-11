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
        .select(`
          *,
          servicos_custos (
            id,
            nome,
            valor,
            descricao
          )
        `)
        .eq("loja_id", lojaId)
        .order("nome")

      console.log("Query servicos - lojaId:", lojaId) // Debug
      console.log("Serviços do banco:", data) // Debug
      console.log("Erro ao buscar serviços:", err) // Debug
      
      if (err) throw err
      setServicos(
        (data || []).map((s: any) => ({
          id: s.id,
          nome: s.nome,
          codigo: s.id.substring(0, 8).toUpperCase(),
          preco: Number(s.preco) || 0,
          categoria: s.categoria || "Geral",
          descricao: s.descricao || "",
          duracao: s.duracao_estimada || 0,
          ativo: s.ativo !== false,
          custos: s.servicos_custos || [],
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

  const fetchClientes = async () => {
    if (!lojaId) {
      setClientes([])
      setLoading(false)
      return
    }

    setLoading(true)
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
          observacoes: c.observacoes,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar clientes"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [lojaId])

  return { clientes, loading, error, refetch: fetchClientes }
}

/**
 * Hook para buscar todos os funcionários da loja selecionada
 * Busca dados completos da tabela lojas_usuarios incluindo nome, cargo, salário, etc.
 */
export function useFuncionarios(lojaId?: string) {
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setFuncionarios([])
      setLoading(false)
      return
    }

    const fetchFuncionarios = async () => {
      const supabase = createClient()
      try {
        // Buscar todos os usuários vinculados à loja
        // lojas_usuarios só tem: id, loja_id, usuario_id, nivel_acesso, created_at
        const { data, error: err } = await supabase
          .from("lojas_usuarios")
          .select("*")
          .eq("loja_id", lojaId)
          .order("created_at", { ascending: false })

        if (err) throw err

        // Mapear para estrutura de funcionário
        // Os dados de nome, email, telefone, etc viriam de auth.users, não estão em lojas_usuarios
        const funcionariosMapeados = (data || []).map((fu: any) => ({
          id: fu.usuario_id,
          nome: `Usuário ${fu.usuario_id.substring(0, 8)}`, // Será atualizado se conseguir dados de auth.users
          email: "",
          telefone: "",
          cargo: fu.nivel_acesso === "dono" ? "Dono" : fu.nivel_acesso === "gerente" ? "Gerente" : "Funcionário",
          nivel_acesso: fu.nivel_acesso,
          salario: 0,
          dataAdmissao: fu.created_at,
          ativo: true,
        }))

        setFuncionarios(funcionariosMapeados)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro ao buscar funcionários"))
      } finally {
        setLoading(false)
      }
    }

    fetchFuncionarios()
  }, [lojaId])

  return { funcionarios, loading, error }
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
          .order("created_at", { ascending: false })

        if (err) throw err
        setVendas(
          (data || []).map((v: any) => ({
            id: v.id,
            funcionarioId: v.funcionario_id,
            clienteId: v.cliente_id,
            total: Number(v.total) || 0,
            desconto: Number(v.desconto) || 0,
            formaPagamento: v.forma_pagamento as "dinheiro" | "credito" | "debito" | "pix",
            status: v.status as "concluida" | "cancelada" | "pendente",
            data: v.created_at,
            itens: [],
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
 * Hook para buscar caixa aberto da loja selecionada
 */
export function useCaixaAberto(lojaId?: string) {
  const [caixaAtual, setCaixaAtual] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCaixa = async () => {
    if (!lojaId) {
      setCaixaAtual(null)
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      // Buscar caixa aberto
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
        setCaixaAtual(null)
        setLoading(false)
        return
      }

      // Buscar movimentações do caixa
      const { data: movimentacoesData, error: movError } = await supabase
        .from("caixa_movimentacoes")
        .select("*")
        .eq("caixa_id", caixaData.id)
        .order("data", { ascending: true })

      if (movError) throw movError

      // Mapear movimentações com ID do funcionário (nome não disponível em lojas_usuarios)
      const movimentacoesComNome = (movimentacoesData || []).map((mov: any) => ({
        id: mov.id,
        tipo: mov.tipo as "entrada" | "saida",
        categoria: mov.categoria,
        descricao: mov.descricao,
        valor: mov.valor,
        funcionarioNome: `Funcionário ${mov.funcionario_id.substring(0, 8)}`,
        funcionarioId: mov.funcionario_id,
        data: mov.data,
      }))

      setCaixaAtual({
        id: caixaData.id,
        status: caixaData.status,
        valorAbertura: caixaData.valor_abertura,
        dataAbertura: caixaData.data_abertura,
        funcionarioAberturaNome: `Funcionário ${caixaData.funcionario_abertura_id.substring(0, 8)}`,
        funcionarioAberturaId: caixaData.funcionario_abertura_id,
        movimentacoes: movimentacoesComNome,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar caixa"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaixa()
  }, [lojaId])

  return { caixaAtual, loading, error, refetch: fetchCaixa }
}

/**
 * Hook para buscar vendas da loja com filtro de data
 */
export function useVendasComFiltro(lojaId?: string, dataInicio?: Date, dataFim?: Date) {
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVendas = async () => {
    if (!lojaId) {
      setVendas([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      let query = supabase
        .from("vendas")
        .select(`
          *,
          vendas_itens (
            *,
            produtos (nome, codigo_barras),
            servicos (nome)
          ),
          clientes (nome, email, telefone)
        `)
        .eq("loja_id", lojaId)
        .order("data_venda", { ascending: false })

      if (dataInicio) {
        query = query.gte("data_venda", dataInicio.toISOString())
      }

      if (dataFim) {
        const dataFimFinal = new Date(dataFim)
        dataFimFinal.setHours(23, 59, 59, 999)
        query = query.lte("data_venda", dataFimFinal.toISOString())
      }

      const { data, error: err } = await query

      if (err) throw err

      const vendasMapeadas = (data || []).map((v: any) => ({
        id: v.id,
        lojaId: v.loja_id,
        clienteId: v.cliente_id,
        clienteNome: v.clientes?.nome || "Cliente não identificado",
        funcionarioId: v.funcionario_id,
        subtotal: v.subtotal,
        desconto: v.desconto,
        total: v.total,
        formaPagamento: v.forma_pagamento,
        status: v.status,
        dataVenda: v.data_venda,
        itens: (v.vendas_itens || []).map((item: any) => ({
          id: item.id,
          produtoId: item.produto_id,
          servicoId: item.servico_id,
          nome: item.produtos?.nome || item.servicos?.nome || "Item",
          quantidade: item.quantidade,
          precoUnitario: item.preco_unitario,
          subtotal: item.subtotal,
        })),
      }))

      setVendas(vendasMapeadas)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar vendas"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendas()
  }, [lojaId, dataInicio, dataFim])

  return { vendas, loading, error, refetch: fetchVendas }
}

/**
 * Hook para buscar categorias de perdas da loja
 */
export function useCategoriasPerdas(lojaId?: string) {
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategorias = async () => {
    if (!lojaId) {
      setCategorias([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data, error: fetchError } = await supabase
        .from("categorias_perdas")
        .select("*")
        .eq("loja_id", lojaId)
        .order("nome")

      if (fetchError) throw fetchError
      setCategorias(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar categorias de perdas"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [lojaId])

  return { categorias, loading, error, refetch: fetchCategorias }
}

/**
 * Hook para buscar perdas da loja com filtro de data
 */
export function usePerdas(lojaId?: string, dataInicio?: Date, dataFim?: Date) {
  const [perdas, setPerdas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPerdas = async () => {
    if (!lojaId) {
      setPerdas([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      let query = supabase
        .from("perdas")
        .select(`
          *,
          produtos (nome, codigo_barras),
          categorias_perdas (nome),
          lojas_usuarios (nome)
        `)
        .eq("loja_id", lojaId)
        .order("data_perda", { ascending: false })

      if (dataInicio) {
        query = query.gte("data_perda", dataInicio.toISOString())
      }
      if (dataFim) {
        query = query.lte("data_perda", dataFim.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setPerdas(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar perdas"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerdas()
  }, [lojaId, dataInicio, dataFim])

  return { perdas, loading, error, refetch: fetchPerdas }
}

/**
 * Hook para buscar serviços realizados da loja
 */
export function useServicosRealizados(lojaId?: string, status?: string) {
  const [servicosRealizados, setServicosRealizados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchServicosRealizados = async () => {
    if (!lojaId) {
      setServicosRealizados([])
      setLoading(false)
      return
    }

    return (async () => {
      setLoading(true)
      const supabase = createClient()
      try {
        let query = supabase
          .from("servicos_realizados")
          .select(`
            *,
            servico:servicos(nome, preco),
            cliente:clientes(nome, telefone),
            venda:vendas(total)
          `)
          .eq("loja_id", lojaId)
          .order("created_at", { ascending: false })

        if (status) {
          query = query.eq("status", status)
        }

        const { data, error: err } = await query

        if (err) throw err
        
        // Enriquecer com fotos de comprovação para cada serviço
        const servicosComFotos = await Promise.all(
          (data || []).map(async (servico) => {
            const { data: fotos } = await supabase
              .from("servicos_arquivos")
              .select("id, url, nome_arquivo")
              .eq("servico_realizado_id", servico.id)
              .eq("tipo", "comprovacao")
            
            return {
              ...servico,
              fotos_comprovacao: fotos || []
            }
          })
        )
        
        setServicosRealizados(servicosComFotos)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao buscar serviços realizados")
        )
      } finally {
        setLoading(false)
      }
    })()
  }

  const removeServicoLocal = (id: string) => {
    setServicosRealizados((prev) => prev.filter((servico) => servico.id !== id))
  }

  useEffect(() => {
    fetchServicosRealizados()
  }, [lojaId, status])

  return { servicosRealizados, loading, error, refetch: fetchServicosRealizados, removeServicoLocal }
}

/**
 * Hook para buscar motivos de problemas
 */
export function useMotivosProblemas(lojaId?: string) {
  const [motivos, setMotivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMotivos = async () => {
    if (!lojaId) {
      setMotivos([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data, error: err } = await supabase
        .from("motivos_problemas_servicos")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome")

      if (err) throw err
      setMotivos(data || [])
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erro ao buscar motivos de problemas")
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMotivos()
  }, [lojaId])

  return { motivos, loading, error, refetch: fetchMotivos }
}

/**
 * Hook para buscar problemas de um serviço
 */
export function useProblemasServico(servicoRealizadoId?: string) {
  const [problemas, setProblemas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProblemas = async () => {
    if (!servicoRealizadoId) {
      setProblemas([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data, error: err } = await supabase
        .from("servicos_problemas")
        .select(`
          *,
          motivo:motivos_problemas_servicos(nome, descricao),
          funcionario_culpado:lojas_usuarios(usuario_id)
        `)
        .eq("servico_realizado_id", servicoRealizadoId)
        .order("created_at", { ascending: false })

      if (err) throw err
      setProblemas(data || [])
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erro ao buscar problemas do serviço")
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProblemas()
  }, [servicoRealizadoId])

  return { problemas, loading, error, refetch: fetchProblemas }
}

/**
 * Hook para buscar arquivos de um serviço
 */
export function useArquivosServico(servicoRealizadoId?: string) {
  const [arquivos, setArquivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchArquivos = async () => {
    if (!servicoRealizadoId) {
      setArquivos([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    try {
      const { data, error: err } = await supabase
        .from("servicos_arquivos")
        .select("*")
        .eq("servico_realizado_id", servicoRealizadoId)
        .order("created_at", { ascending: false })

      if (err) throw err
      setArquivos(data || [])
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Erro ao buscar arquivos do serviço")
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArquivos()
  }, [servicoRealizadoId])

  return { arquivos, loading, error, refetch: fetchArquivos }
}
