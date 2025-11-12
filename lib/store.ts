// Store simples para gerenciar estado da aplicação
"use client"

import { create } from "zustand"
import type {
  Produto,
  Servico,
  Cliente,
  Funcionario,
  Venda,
  Caixa,
  ItemVenda,
  ResumoVendas,
  ContaPagar,
  ContaReceber,
  VendaPrazo,
  CategoriaDespesa,
  Perda,
  CategoriaPerda, // Importando CategoriaPerda
} from "./types"
import {
  produtosMock,
  servicosMock,
  clientesMock,
  funcionariosMock,
  vendasMock,
  caixaAtualMock,
  contasPagarMock,
  contasReceberMock,
  vendasPrazoMock,
  categoriasDespesasMock,
  perdasMock,
  categoriasPerdasMock, // Importando mock de categorias de perdas
} from "./mock-data"

type Store = {
  // Dados
  produtos: Produto[]
  servicos: Servico[]
  clientes: Cliente[]
  funcionarios: Funcionario[]
  vendas: Venda[]
  caixaAtual: Caixa | null

  // Contas e categorias
  contasPagar: ContaPagar[]
  contasReceber: ContaReceber[]
  vendasPrazo: VendaPrazo[]
  categoriasDespesas: CategoriaDespesa[]
  perdas: Perda[]
  categoriasPerdas: CategoriaPerda[] // Adicionando categorias de perdas

  // PDV State
  vendaAtual: {
    clienteId?: string
    funcionarioId?: string // Adicionando funcionário à venda atual
    itens: ItemVenda[]
    desconto: number
  }

  // Actions
  setProdutos: (produtos: Produto[]) => void
  setServicos: (servicos: Servico[]) => void
  setClientes: (clientes: Cliente[]) => void
  setFuncionarios: (funcionarios: Funcionario[]) => void
  setVendas: (vendas: Venda[]) => void
  setCaixaAtual: (caixa: Caixa | null) => void

  // Contas Actions
  setContasPagar: (contas: ContaPagar[]) => void
  setContasReceber: (contas: ContaReceber[]) => void
  setVendasPrazo: (vendas: VendaPrazo[]) => void
  setCategoriasDespesas: (categorias: CategoriaDespesa[]) => void
  adicionarContaPagar: (conta: ContaPagar) => void
  adicionarContaReceber: (conta: ContaReceber) => void
  adicionarVendaPrazo: (venda: VendaPrazo) => void
  adicionarCategoriaDespesa: (categoria: CategoriaDespesa) => void
  pagarConta: (contaId: string) => void
  receberConta: (contaId: string) => void
  pagarParcelaVendaPrazo: (vendaId: string, parcelaId: string) => void

  setPerdas: (perdas: Perda[]) => void
  adicionarPerda: (perda: Perda) => void
  setCategoriasPerdas: (categorias: CategoriaPerda[]) => void // Action para categorias de perdas
  adicionarCategoriaPerda: (categoria: CategoriaPerda) => void // Action para adicionar categoria

  // PDV Actions
  adicionarItem: (item: ItemVenda) => void
  removerItem: (index: number) => void
  atualizarQuantidade: (index: number, quantidade: number) => void
  setDesconto: (desconto: number) => void
  setCliente: (clienteId?: string) => void
  setFuncionarioVenda: (funcionarioId: string) => void // Action para definir funcionário da venda
  limparVenda: () => void
  finalizarVenda: (formaPagamento: Venda["formaPagamento"]) => void

  // Resumo
  getResumoVendas: () => ResumoVendas
  getHistoricoFuncionario: (funcionarioId: string) => any // Função para obter histórico do funcionário
}

export const useStore = create<Store>((set, get) => ({
  // Initial data
  produtos: produtosMock,
  servicos: servicosMock,
  clientes: clientesMock,
  funcionarios: funcionariosMock,
  vendas: vendasMock,
  caixaAtual: caixaAtualMock,

  contasPagar: contasPagarMock,
  contasReceber: contasReceberMock,
  vendasPrazo: vendasPrazoMock,
  categoriasDespesas: categoriasDespesasMock,
  perdas: perdasMock,
  categoriasPerdas: categoriasPerdasMock, // Inicializando categorias de perdas

  vendaAtual: {
    itens: [],
    desconto: 0,
  },

  // Setters
  setProdutos: (produtos) => set({ produtos }),
  setServicos: (servicos) => set({ servicos }),
  setClientes: (clientes) => set({ clientes }),
  setFuncionarios: (funcionarios) => set({ funcionarios }),
  setVendas: (vendas) => set({ vendas }),
  setCaixaAtual: (caixaAtual) => set({ caixaAtual }),

  // Contas Setters
  setContasPagar: (contasPagar) => set({ contasPagar }),
  setContasReceber: (contasReceber) => set({ contasReceber }),
  setVendasPrazo: (vendasPrazo) => set({ vendasPrazo }),
  setCategoriasDespesas: (categoriasDespesas) => set({ categoriasDespesas }),

  setCategoriasPerdas: (categoriasPerdas) => set({ categoriasPerdas }),

  adicionarCategoriaPerda: (categoria) =>
    set((state) => ({
      categoriasPerdas: [...state.categoriasPerdas, categoria],
    })),

  // PDV Actions
  adicionarItem: (item) =>
    set((state) => ({
      vendaAtual: {
        ...state.vendaAtual,
        itens: [...state.vendaAtual.itens, item],
      },
    })),

  removerItem: (index) =>
    set((state) => ({
      vendaAtual: {
        ...state.vendaAtual,
        itens: state.vendaAtual.itens.filter((_, i) => i !== index),
      },
    })),

  atualizarQuantidade: (index, quantidade) =>
    set((state) => {
      const novosItens = [...state.vendaAtual.itens]
      if (novosItens[index]) {
        novosItens[index] = {
          ...novosItens[index],
          quantidade,
          subtotal: novosItens[index].preco * quantidade,
        }
      }
      return {
        vendaAtual: {
          ...state.vendaAtual,
          itens: novosItens,
        },
      }
    }),

  setDesconto: (desconto) =>
    set((state) => ({
      vendaAtual: {
        ...state.vendaAtual,
        desconto,
      },
    })),

  setCliente: (clienteId) =>
    set((state) => ({
      vendaAtual: {
        ...state.vendaAtual,
        clienteId,
      },
    })),

  setFuncionarioVenda: (funcionarioId) =>
    set((state) => ({
      vendaAtual: {
        ...state.vendaAtual,
        funcionarioId,
      },
    })),

  limparVenda: () =>
    set((state) => ({
      vendaAtual: {
        itens: [],
        desconto: 0,
        funcionarioId: state.vendaAtual.funcionarioId,
      },
    })),

  finalizarVenda: (formaPagamento) => {
    const state = get()
    const { vendaAtual, funcionarios, clientes, vendas, caixaAtual } = state

    if (vendaAtual.itens.length === 0) return
    if (!vendaAtual.funcionarioId) return

    const subtotal = vendaAtual.itens.reduce((acc, item) => acc + item.subtotal, 0)
    const total = subtotal - vendaAtual.desconto

    const funcionario = funcionarios.find((f) => f.id === vendaAtual.funcionarioId)
    if (!funcionario) return

    const novaVenda: Venda = {
      id: `${vendas.length + 1}`,
      data: new Date().toISOString(),
      clienteId: vendaAtual.clienteId,
      clienteNome: vendaAtual.clienteId ? clientes.find((c) => c.id === vendaAtual.clienteId)?.nome : undefined,
      funcionarioId: funcionario.id,
      funcionarioNome: funcionario.nome,
      itens: vendaAtual.itens,
      subtotal,
      desconto: vendaAtual.desconto,
      total,
      formaPagamento,
      status: "concluida",
    }

    // Atualizar vendas
    set({ vendas: [...vendas, novaVenda] })

    // Atualizar caixa
    if (caixaAtual) {
      const novaMovimentacao = {
        id: `${caixaAtual.movimentacoes.length + 1}`,
        data: new Date().toISOString(),
        tipo: "entrada" as const,
        categoria: "venda" as const,
        valor: total,
        descricao: `Venda #${novaVenda.id}`,
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        vendaId: novaVenda.id,
      }

      set({
        caixaAtual: {
          ...caixaAtual,
          movimentacoes: [...caixaAtual.movimentacoes, novaMovimentacao],
        },
      })
    }

    // Limpar venda atual
    get().limparVenda()
  },

  // Contas Actions
  adicionarContaPagar: (conta) =>
    set((state) => ({
      contasPagar: [...state.contasPagar, conta],
    })),

  adicionarContaReceber: (conta) =>
    set((state) => ({
      contasReceber: [...state.contasReceber, conta],
    })),

  adicionarVendaPrazo: (venda) =>
    set((state) => ({
      vendasPrazo: [...state.vendasPrazo, venda],
    })),

  adicionarCategoriaDespesa: (categoria) =>
    set((state) => ({
      categoriasDespesas: [...state.categoriasDespesas, categoria],
    })),

  pagarConta: (contaId) =>
    set((state) => ({
      contasPagar: state.contasPagar.map((conta) =>
        conta.id === contaId
          ? {
              ...conta,
              status: "paga" as const,
              dataPagamento: new Date().toISOString(),
            }
          : conta,
      ),
    })),

  receberConta: (contaId) =>
    set((state) => ({
      contasReceber: state.contasReceber.map((conta) =>
        conta.id === contaId
          ? {
              ...conta,
              status: "recebida" as const,
              dataRecebimento: new Date().toISOString(),
            }
          : conta,
      ),
    })),

  pagarParcelaVendaPrazo: (vendaId, parcelaId) =>
    set((state) => ({
      vendasPrazo: state.vendasPrazo.map((venda) => {
        if (venda.id === vendaId) {
          const novasParcelas = venda.parcelas.map((p) =>
            p.id === parcelaId
              ? {
                  ...p,
                  status: "paga" as const,
                  dataPagamento: new Date().toISOString(),
                }
              : p,
          )
          const valorPago = novasParcelas.filter((p) => p.status === "paga").reduce((acc, p) => acc + p.valor, 0)
          const valorRestante = venda.valorTotal - valorPago
          const todasPagas = novasParcelas.every((p) => p.status === "paga")

          return {
            ...venda,
            parcelas: novasParcelas,
            valorPago,
            valorRestante,
            status: todasPagas ? ("quitada" as const) : valorPago > 0 ? ("parcial" as const) : ("pendente" as const),
          }
        }
        return venda
      }),
    })),

  setPerdas: (perdas) => set({ perdas }),

  adicionarPerda: (perda) =>
    set((state) => {
      // Atualizar estoque do produto
      const produtosAtualizados = state.produtos.map((p) =>
        p.id === perda.produtoId
          ? {
              ...p,
              estoque: p.estoque - perda.quantidade,
            }
          : p,
      )

      return {
        perdas: [...state.perdas, perda],
        produtos: produtosAtualizados,
      }
    }),

  getHistoricoFuncionario: (funcionarioId: string) => {
    const { vendas, perdas } = get()

    // Filtrar vendas do funcionário
    const vendasFuncionario = vendas.filter((v) => v.funcionarioId === funcionarioId && v.status === "concluida")

    // Filtrar perdas do funcionário
    const perdasFuncionario = perdas.filter((p) => p.funcionarioId === funcionarioId)

    // Calcular totais
    const totalVendas = vendasFuncionario.length
    const totalPerdas = perdasFuncionario.length
    const valorTotalVendas = vendasFuncionario.reduce((acc, v) => acc + v.total, 0)
    const custoTotalPerdas = perdasFuncionario.reduce((acc, p) => acc + p.custoTotal, 0)

    // Agrupar vendas por semana
    const vendasPorSemana: { [key: string]: Venda[] } = {}
    const vendasPorMes: { [key: string]: Venda[] } = {}

    vendasFuncionario.forEach((venda) => {
      const data = new Date(venda.data)
      const semana = `Semana ${getWeekNumber(data)} - ${data.getFullYear()}`
      const mes = `${data.toLocaleString("pt-BR", { month: "long" })} ${data.getFullYear()}`

      if (!vendasPorSemana[semana]) vendasPorSemana[semana] = []
      if (!vendasPorMes[mes]) vendasPorMes[mes] = []

      vendasPorSemana[semana].push(venda)
      vendasPorMes[mes].push(venda)
    })

    // Agrupar perdas por semana
    const perdasPorSemana: { [key: string]: Perda[] } = {}
    const perdasPorMes: { [key: string]: Perda[] } = {}

    perdasFuncionario.forEach((perda) => {
      const data = new Date(perda.data)
      const semana = `Semana ${getWeekNumber(data)} - ${data.getFullYear()}`
      const mes = `${data.toLocaleString("pt-BR", { month: "long" })} ${data.getFullYear()}`

      if (!perdasPorSemana[semana]) perdasPorSemana[semana] = []
      if (!perdasPorMes[mes]) perdasPorMes[mes] = []

      perdasPorSemana[semana].push(perda)
      perdasPorMes[mes].push(perda)
    })

    return {
      vendas: vendasFuncionario,
      perdas: perdasFuncionario,
      totalVendas,
      totalPerdas,
      valorTotalVendas,
      custoTotalPerdas,
      vendasPorSemana,
      vendasPorMes,
      perdasPorSemana,
      perdasPorMes,
    }
  },

  getResumoVendas: () => {
    const { vendas } = get()
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Filtrar vendas do dia
    const vendasHoje = vendas.filter((v) => {
      const dataVenda = new Date(v.data)
      dataVenda.setHours(0, 0, 0, 0)
      return dataVenda.getTime() === hoje.getTime() && v.status === "concluida"
    })

    const totalVendas = vendasHoje.length
    const receitaTotal = vendasHoje.reduce((acc, v) => acc + v.total, 0)
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0

    // Agrupar por forma de pagamento
    const porFormaPagamento: { [key: string]: number } = {}
    vendasHoje.forEach((venda) => {
      const forma = venda.formaPagamento
      porFormaPagamento[forma] = (porFormaPagamento[forma] || 0) + venda.total
    })

    return {
      totalVendas,
      receitaTotal,
      ticketMedio,
      porFormaPagamento,
    }
  },
}))

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
