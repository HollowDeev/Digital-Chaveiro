"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "@/lib/contexts/loja-context"
import { useData } from "@/lib/contexts/data-context"
import { useCaixaCache } from "@/lib/hooks/useCaixaCache"
import { useCaixaVerification } from "@/lib/hooks/useCaixaVerification"
import { useStore } from "@/lib/store"
import { ShoppingCart, Wrench, Plus, Trash2, DollarSign, Search, Minus, X, Check, CreditCard, Banknote, Smartphone, Percent, Package, Zap, TrendingUp, Users, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export default function PDVPage() {
  // 1. Hooks e Store
  const { lojaAtual } = useLoja()
  const lojaId = lojaAtual?.id
  const [userId, setUserId] = useState<string | undefined>()
  
  // Usar dados do cache global
  const { 
    produtos, 
    servicos, 
    clientes, 
    funcionarios, 
    categoriasPerdas,
    caixaAberto: caixaAbertoDB,
    loading: dataLoading,
    refetchCaixa,
    refetchProdutos,
    refetchCategoriasPerdas
  } = useData()

  // Cache do caixa
  const { caixaAberto: caixaAbertoCached, isHydrated, salvarCache, limparCache } = useCaixaCache()

  // Verificação silenciosa do caixa
  const { caixa: caixaVerificado, isVerifying: isVerifyingCaixa, verificacaoCompleta, refetch: refetchCaixaVerification } = useCaixaVerification(lojaId)

  const {
    vendaAtual,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    setDesconto,
    setCliente,
    setFuncionarioVenda,
    limparVenda,
    finalizarVenda,
    getResumoVendas,
    adicionarVendaPrazo,
    adicionarContaReceber,
    abrirCaixa,
    caixaAtual,
  } = useStore()

  // 2. Estados
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0)
  const [searchClienteQuery, setSearchClienteQuery] = useState("")
  const [showClienteResults, setShowClienteResults] = useState(false)
  const [clienteSelecionadoNome, setClienteSelecionadoNome] = useState("")
  const [descontoTipo, setDescontoTipo] = useState<'valor' | 'percentual'>('valor')
  const [descontoInput, setDescontoInput] = useState("")
  const [valorRecebido, setValorRecebido] = useState("")
  const [viewMode, setViewMode] = useState<'vendidos' | 'produtos' | 'servicos'>('vendidos')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const [dialogAbrirCaixa, setDialogAbrirCaixa] = useState(false)
  const [funcionarioIdCaixa, setFuncionarioIdCaixa] = useState("")
  const [valorAberturaCaixa, setValorAberturaCaixa] = useState(0)
  const [dialogPagamento, setDialogPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outros">("dinheiro")
  const [vendaAPrazo, setVendaAPrazo] = useState(false)
  const [numeroParcelas, setNumeroParcelas] = useState(1)
  const [dataVencimento, setDataVencimento] = useState("")
  const [pagarServicoDepois, setPagarServicoDepois] = useState(true)

  // Modal de Perda
  const [dialogNovaPerda, setDialogNovaPerda] = useState(false)
  const [novaPerda, setNovaPerda] = useState({
    produtoId: "",
    tipo: "produto" as 'produto' | 'servico',
    quantidade: "",
    valor: "",
    funcionarioId: "",
    categoriaId: "",
    observacoes: ""
  })
  const [perdaTipoValor, setPerdaTipoValor] = useState<'custo' | 'preco'>('custo')
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("")
  const [salvandoCategoria, setSalvandoCategoria] = useState(false)

  // Modal de Imagem do Produto
  const [imagemModalAberta, setImagemModalAberta] = useState(false)
  const [imagemModalUrl, setImagemModalUrl] = useState("")
  const [imagemModalNome, setImagemModalNome] = useState("")

  // 3. Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const descontoInputRef = useRef<HTMLInputElement>(null)
  const clienteSearchInputRef = useRef<HTMLInputElement>(null)

  // 4. Cálculos
  const subtotal = vendaAtual.itens.reduce((acc, item) => acc + item.subtotal, 0)
  const subtotalProdutos = vendaAtual.itens.filter(item => item.tipo === 'produto').reduce((acc, item) => acc + item.subtotal, 0)
  const subtotalServicos = vendaAtual.itens.filter(item => item.tipo === 'servico').reduce((acc, item) => acc + item.subtotal, 0)
  const descontoProdutos = subtotal > 0 ? (subtotalProdutos / subtotal) * vendaAtual.desconto : 0
  const descontoServicos = subtotal > 0 ? (subtotalServicos / subtotal) * vendaAtual.desconto : 0
  const totalProdutos = subtotalProdutos - descontoProdutos
  const totalServicos = subtotalServicos - descontoServicos

  // Se só tem serviços com pagamento posterior, total a pagar agora é 0, mas registramos o valor total
  // Se tem mix de produtos e serviços com pagamento posterior, cobra só os produtos
  // Se não tem pagamento posterior, cobra tudo
  const total = pagarServicoDepois ? totalProdutos : subtotal - vendaAtual.desconto
  const totalRegistroVenda = subtotal - vendaAtual.desconto // Sempre registrar o valor total da venda

  const resumo = getResumoVendas()
  const produtosMaisVendidos = produtos.filter(p => p.ativo).slice(0, 12)
  const dataMinima = new Date().toISOString().split("T")[0]

  // 5. Funções
  const mostrarToast = useCallback((mensagem: string) => {
    setToastMessage(mensagem)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }, [])

  const filtroClienteResultados = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchClienteQuery.toLowerCase()) ||
    cliente.telefone?.includes(searchClienteQuery) ||
    cliente.endereco?.toLowerCase().includes(searchClienteQuery.toLowerCase())
  )

  const handleSelecionarCliente = (cliente: any) => {
    setCliente(cliente.id)
    setClienteSelecionadoNome(cliente.nome)
    setSearchClienteQuery(cliente.nome)
    setShowClienteResults(false)
  }

  const handleLimparCliente = () => {
    setCliente("none")
    setClienteSelecionadoNome("")
    setSearchClienteQuery("")
    setShowClienteResults(false)
  }

  const handleRegistrarPerda = async () => {
    if (!novaPerda.produtoId || !novaPerda.quantidade || !novaPerda.funcionarioId || !novaPerda.categoriaId || !novaPerda.valor) {
      mostrarToast("⚠️ Preencha todos os campos obrigatórios")
      return
    }

    const quantidade = Number.parseInt(novaPerda.quantidade)
    const valor = Number.parseFloat(novaPerda.valor)

    if (isNaN(quantidade) || quantidade <= 0 || isNaN(valor) || valor <= 0) {
      mostrarToast("⚠️ Quantidade e valor devem ser maiores que zero")
      return
    }

    const funcionario = funcionarios.find(f => f.id === novaPerda.funcionarioId)
    const categoria = categoriasPerdas.find(c => c.id === novaPerda.categoriaId)

    if (!funcionario || !categoria) {
      mostrarToast("⚠️ Funcionário ou categoria inválidos")
      return
    }

    if (!lojaId) {
      mostrarToast("⚠️ Loja não identificada")
      return
    }

    try {
      const supabase = createClient()

      // Inserir perda no banco de dados
      const { error: perdaError } = await supabase.from("perdas").insert({
        loja_id: lojaId,
        produto_id: novaPerda.produtoId,
        categoria_id: novaPerda.categoriaId,
        quantidade: quantidade,
        custo_unitario: valor / quantidade,
        custo_total: valor,
        motivo: categoria.nome,
        funcionario_id: novaPerda.funcionarioId,
        observacoes: novaPerda.observacoes || null,
      })

      if (perdaError) throw perdaError

      // Atualizar estoque do produto (reduzir)
      if (novaPerda.tipo === 'produto') {
        const produto = produtos.find(p => p.id === novaPerda.produtoId)
        if (produto) {
          const novoEstoque = Math.max(0, produto.estoque - quantidade)
          await supabase
            .from("produtos")
            .update({ estoque: novoEstoque })
            .eq("id", novaPerda.produtoId)
        }
      }

      mostrarToast("✅ Perda registrada!")
      setDialogNovaPerda(false)
      setNovaPerda({ produtoId: "", tipo: "produto", quantidade: "", valor: "", funcionarioId: "", categoriaId: "", observacoes: "" })
    } catch (error: any) {
      console.error("Erro ao registrar perda:", error)
      mostrarToast("❌ Erro ao registrar perda: " + (error.message || "Erro desconhecido"))
    }
  }

  const adicionarItemRapido = useCallback((produtoId: string, tipo: 'produto' | 'servico') => {
    if (tipo === 'produto') {
      const produto = produtos.find(p => p.id === produtoId)
      if (produto) {
        if (produto.estoque <= 0) {
          mostrarToast(`⚠️ ${produto.nome} sem estoque!`)
          return
        }
        adicionarItem({
          tipo: "produto",
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          quantidade: 1,
          subtotal: produto.preco,
        })
        mostrarToast(`✅ ${produto.nome} adicionado`)
      }
    } else {
      const servico = servicos.find(s => s.id === produtoId)
      if (servico) {
        adicionarItem({
          tipo: "servico",
          id: servico.id,
          nome: servico.nome,
          preco: servico.preco,
          quantidade: 1,
          subtotal: servico.preco,
        })
        mostrarToast(`✅ ${servico.nome} adicionado`)
      }
    }
  }, [produtos, servicos, adicionarItem, mostrarToast])

  const calcularTroco = () => {
    if (formaPagamento !== 'dinheiro') return 0
    const recebido = Number.parseFloat(valorRecebido) || 0
    return Math.max(0, recebido - total)
  }

  // Função auxiliar para calcular soma dos custos de um serviço
  const calcularSomaCustosServico = (servicoId: string): number => {
    const servico = servicos.find(s => s.id === servicoId)
    if (!servico || !servico.custos || servico.custos.length === 0) {
      return 0
    }
    const soma = servico.custos.reduce((acc, custo) => {
      const valor = typeof custo.valor === 'string' ? parseFloat(custo.valor) : Number(custo.valor)
      return acc + valor
    }, 0)
    return soma
  }

  const handleAbrirCaixa = async () => {
    if (!funcionarioIdCaixa) {
      mostrarToast("⚠️ Selecione um funcionário")
      return
    }

    if (!lojaId || !userId) {
      mostrarToast("⚠️ Erro ao identificar loja ou usuário")
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("caixas").insert({
        loja_id: lojaId,
        funcionario_abertura_id: userId,
        valor_abertura: valorAberturaCaixa,
        status: "aberto",
      }).select().single()

      if (error) throw error

      // Atualizar Zustand para compatibilidade
      abrirCaixa(funcionarioIdCaixa, valorAberturaCaixa)

      // Salvar no cache local
      if (data) {
        salvarCache(true, data.id, funcionarioIdCaixa)
      }

      // Atualizar dados do Supabase
      refetchCaixa()

      // Atualizar verificação do caixa para atualizar a tela
      refetchCaixaVerification()

      setDialogAbrirCaixa(false)
      setFuncionarioIdCaixa("")
      setValorAberturaCaixa(0)
      mostrarToast("✅ Caixa aberto com sucesso!")
    } catch (err: any) {
      console.error("Erro ao abrir caixa:", err)
      mostrarToast("❌ Erro ao abrir caixa: " + (err.message || "Erro desconhecido"))
    }
  }

  const handleFinalizarVenda = async () => {
    console.log("=== DEBUG INICIAL handleFinalizarVenda ===")
    console.log("userId do state:", userId)
    console.log("lojaId:", lojaId)

    if (!vendaAtual.funcionarioId) {
      mostrarToast("⚠️ Selecione o vendedor!")
      return
    }

    if (!lojaId || !userId) {
      mostrarToast("⚠️ Erro ao identificar usuário ou loja")
      return
    }

    try {
      const supabase = createClient()

      console.log("Iniciando finalização de venda...", {
        lojaId,
        userId,
        vendaAPrazo,
        totalItens: vendaAtual.itens.length,
        total
      })

      console.log("VERIFICAÇÃO CRÍTICA:", {
        lojaIdDefinido: !!lojaId,
        userIdDefinido: !!userId,
        lojaIdValor: lojaId,
        userIdValor: userId,
      })

      // Buscar user diretamente para confirmar
      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log("User autenticado no Supabase:", authUser?.id, authUser?.email)

      if (!authUser) {
        mostrarToast("⚠️ Usuário não autenticado!")
        return
      }

      if (vendaAPrazo) {
        if (!vendaAtual.clienteId || vendaAtual.clienteId === "none") {
          mostrarToast("⚠️ Selecione um cliente para venda a prazo!")
          return
        }
        if (!dataVencimento) {
          mostrarToast("⚠️ Defina a data de vencimento!")
          return
        }

        // 1. SALVAR VENDA A PRAZO NO BANCO
        console.log("Tentando criar venda com dados:", {
          loja_id: lojaId,
          cliente_id: vendaAtual.clienteId,
          funcionario_id: userId,
          desconto: vendaAtual.desconto || 0,
          total: totalRegistroVenda,
          forma_pagamento: formaPagamento,
          tipo: "aprazo",
          status: "pendente",
        })

        const { data: vendaData, error: vendaError } = await supabase
          .from("vendas")
          .insert({
            loja_id: lojaId,
            cliente_id: vendaAtual.clienteId,
            funcionario_id: userId,
            desconto: vendaAtual.desconto || 0,
            total: totalRegistroVenda,
            forma_pagamento: formaPagamento,
            tipo: "aprazo",
            status: "pendente",
          })
          .select()
          .single()

        console.log("Resultado da criação da venda:", { vendaData, vendaError })

        if (vendaError) {
          console.error("Erro ao criar venda:", vendaError)
          throw vendaError
        }

        console.log("Venda criada com sucesso! ID:", vendaData.id)

        // 2. SALVAR ITENS DA VENDA
        console.log("Salvando itens da venda:", vendaAtual.itens.length, "itens")

        const itensVenda = vendaAtual.itens.map((item) => ({
          venda_id: vendaData.id,
          tipo: item.tipo,
          item_id: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.subtotal,
        }))

        console.log("Itens preparados para inserção:", itensVenda)

        const { error: itensError } = await supabase.from("vendas_itens").insert(itensVenda)

        if (itensError) {
          console.error("Erro ao inserir itens da venda:", itensError)
          throw itensError
        }

        console.log("Itens da venda salvos com sucesso")

        // 3. CRIAR SERVIÇOS REALIZADOS (apenas para serviços)
        const servicosParaCriar = vendaAtual.itens.filter(item => item.tipo === "servico")
        console.log("Criando serviços realizados:", servicosParaCriar.length, "serviços")

        for (const item of vendaAtual.itens) {
          if (item.tipo === "servico") {
            // Buscar duração estimada do serviço
            const servico = servicos.find((s) => s.id === item.id)
            let dataPrevista = null

            if (servico?.duracaoEstimada) {
              const minutosEstimados = servico.duracaoEstimada
              dataPrevista = new Date(Date.now() + minutosEstimados * 60 * 1000).toISOString()
            }

            const servicoRealizadoData = {
              loja_id: lojaId,
              venda_id: vendaData.id,
              servico_id: item.id,
              cliente_id: vendaAtual.clienteId && vendaAtual.clienteId !== "none" ? vendaAtual.clienteId : null,
              status: "aberto",
              data_inicio: new Date().toISOString(),
              data_prevista_conclusao: dataPrevista,
              pago: !pagarServicoDepois,
            }

            console.log("Criando serviço realizado:", servicoRealizadoData)

            const { error: servicoError } = await supabase.from("servicos_realizados").insert(servicoRealizadoData)

            if (servicoError) {
              console.error("Erro ao criar serviço realizado:", servicoError)
              throw servicoError
            }

            console.log("Serviço realizado criado com sucesso para item:", item.nome)
          }
        }

        // 4. ATUALIZAR ESTOQUE (apenas para produtos)
        for (const item of vendaAtual.itens) {
          if (item.tipo === "produto") {
            const produto = produtos.find((p) => p.id === item.id)
            if (produto) {
              await supabase
                .from("produtos")
                .update({ estoque: produto.estoque - item.quantidade })
                .eq("id", item.id)
            }
          }
        }

        // 5. CRIAR PARCELAS A RECEBER
        const valorParcela = total / numeroParcelas
        const parcelas = []

        for (let i = 0; i < numeroParcelas; i++) {
          const dataVenc = new Date(dataVencimento)
          dataVenc.setMonth(dataVenc.getMonth() + i)

          parcelas.push({
            loja_id: lojaId,
            venda_id: vendaData.id,
            cliente_id: vendaAtual.clienteId,
            numero_parcela: i + 1,
            valor: valorParcela,
            data_vencimento: dataVenc.toISOString(),
            status: "pendente",
          })
        }

        await supabase.from("parcelas_receber").insert(parcelas)

        // Manter no Zustand para compatibilidade
        const cliente = clientes.find((c) => c.id === vendaAtual.clienteId)!
        const vendaPrazoZustand = {
          id: vendaData.id,
          vendaId: vendaData.id,
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          valorTotal: total,
          valorPago: 0,
          valorRestante: total,
          dataVenda: new Date().toISOString(),
          dataVencimento: parcelas[0].data_vencimento,
          status: "pendente" as const,
          parcelas: parcelas.map((p) => ({
            id: p.venda_id + "-" + p.numero_parcela,
            numero: p.numero_parcela,
            valor: p.valor,
            dataVencimento: p.data_vencimento,
            status: p.status as "pendente",
          })),
        }

        adicionarVendaPrazo(vendaPrazoZustand)
        limparVenda()
        setDialogPagamento(false)
        setVendaAPrazo(false)
        setNumeroParcelas(1)
        setPagarServicoDepois(true)

        const temServicos = vendaAtual.itens.some(item => item.tipo === 'servico')
        if (temServicos && pagarServicoDepois) {
          mostrarToast("✅ Venda a prazo registrada! Serviços abertos na página Serviços (pagamento após conclusão)")
        } else {
          mostrarToast("✅ Venda a prazo registrada!")
        }
      } else {
        // VENDA À VISTA
        console.log("=== VENDA À VISTA ===")

        // 1. SALVAR VENDA NO BANCO
        console.log("Tentando criar venda à vista com dados:", {
          loja_id: lojaId,
          cliente_id: vendaAtual.clienteId && vendaAtual.clienteId !== "none" ? vendaAtual.clienteId : null,
          funcionario_id: userId,
          desconto: vendaAtual.desconto || 0,
          total: totalRegistroVenda,
          forma_pagamento: formaPagamento,
          tipo: "avista",
          status: "concluida",
        })

        const { data: vendaData, error: vendaError } = await supabase
          .from("vendas")
          .insert({
            loja_id: lojaId,
            cliente_id: vendaAtual.clienteId && vendaAtual.clienteId !== "none" ? vendaAtual.clienteId : null,
            funcionario_id: userId,
            desconto: vendaAtual.desconto || 0,
            total: totalRegistroVenda,
            forma_pagamento: formaPagamento,
            tipo: "avista",
            status: "concluida",
          })
          .select()
          .single()

        console.log("Resultado da criação da venda à vista:", { vendaData, vendaError })

        if (vendaError) {
          console.error("Erro ao criar venda à vista:", vendaError)
          console.error("Mensagem de erro detalhada:", {
            message: vendaError.message,
            details: vendaError.details,
            hint: vendaError.hint,
            code: vendaError.code,
          })
          throw vendaError
        }

        console.log("Venda à vista criada com sucesso! ID:", vendaData.id)

        // 2. SALVAR ITENS DA VENDA
        console.log("Salvando itens da venda à vista:", vendaAtual.itens.length, "itens")
        const itensVenda = vendaAtual.itens.map((item) => ({
          venda_id: vendaData.id,
          tipo: item.tipo,
          item_id: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.subtotal,
        }))

        await supabase.from("vendas_itens").insert(itensVenda)

        // 3. CRIAR SERVIÇOS REALIZADOS (apenas para serviços)
        for (const item of vendaAtual.itens) {
          if (item.tipo === "servico") {
            // Buscar duração estimada do serviço
            const servico = servicos.find((s) => s.id === item.id)
            let dataPrevista = null

            if (servico?.duracaoEstimada) {
              const minutosEstimados = servico.duracaoEstimada
              dataPrevista = new Date(Date.now() + minutosEstimados * 60 * 1000).toISOString()
            }

            await supabase.from("servicos_realizados").insert({
              loja_id: lojaId,
              venda_id: vendaData.id,
              servico_id: item.id,
              cliente_id: vendaAtual.clienteId && vendaAtual.clienteId !== "none" ? vendaAtual.clienteId : null,
              status: "aberto",
              data_inicio: new Date().toISOString(),
              data_prevista_conclusao: dataPrevista,
              pago: !pagarServicoDepois,
            })
          }
        }

        // 4. ATUALIZAR ESTOQUE (apenas para produtos)
        for (const item of vendaAtual.itens) {
          if (item.tipo === "produto") {
            const produto = produtos.find((p) => p.id === item.id)
            if (produto) {
              await supabase
                .from("produtos")
                .update({ estoque: produto.estoque - item.quantidade })
                .eq("id", item.id)
            }
          }
        }

        // 5. REGISTRAR MOVIMENTAÇÃO NO CAIXA
        if (caixaAbertoDB) {
          const categoriaMap: Record<string, string> = {
            dinheiro: "Venda - Dinheiro",
            pix: "Venda - PIX",
            cartao_credito: "Venda - Cartão Crédito",
            cartao_debito: "Venda - Cartão Débito",
            outros: "Venda - Outros",
          }

          const cliente =
            vendaAtual.clienteId && vendaAtual.clienteId !== "none"
              ? clientes.find((c) => c.id === vendaAtual.clienteId)
              : null

          const descricao = cliente
            ? `Venda para ${cliente.nome} - ${vendaAtual.itens.length} item(ns)`
            : `Venda - ${vendaAtual.itens.length} item(ns)`

          await supabase.from("caixa_movimentacoes").insert({
            caixa_id: caixaAbertoDB.id,
            loja_id: lojaId,
            tipo: "entrada",
            categoria: categoriaMap[formaPagamento] || "Venda",
            descricao: descricao,
            valor: total,
            funcionario_id: userId,
            venda_id: vendaData.id,
          })

          refetchCaixa()
        }

        // Manter no Zustand para compatibilidade
        finalizarVenda(formaPagamento)
        limparVenda()
        setDialogPagamento(false)
        setFormaPagamento("dinheiro")
        setValorRecebido("")
        setPagarServicoDepois(true)

        const temServicos = vendaAtual.itens.some(item => item.tipo === 'servico')
        const soProdutos = vendaAtual.itens.every(item => item.tipo === 'produto')
        const soServicos = vendaAtual.itens.every(item => item.tipo === 'servico')

        if (soServicos && pagarServicoDepois) {
          mostrarToast("✅ Serviço(s) aberto(s) na página Serviços! Pagamento após conclusão.")
        } else if (temServicos && pagarServicoDepois) {
          mostrarToast("✅ Venda finalizada! Serviço(s) aberto(s) com pagamento após conclusão.")
        } else if (temServicos && !pagarServicoDepois) {
          mostrarToast("✅ Venda finalizada! Serviço(s) pago(s) antecipadamente.")
        } else {
          mostrarToast("✅ Venda finalizada com sucesso!")
        }
      }
    } catch (err: any) {
      console.error("Erro ao finalizar venda:", err)
      console.error("Detalhes do erro:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack
      })

      let mensagemErro = "Erro desconhecido"

      if (err?.message) {
        mensagemErro = err.message
      }

      if (err?.code === "23503") {
        mensagemErro = "Erro de chave estrangeira - verifique se todos os dados estão corretos"
      }

      if (err?.code === "23505") {
        mensagemErro = "Registro duplicado"
      }

      mostrarToast("❌ Erro ao finalizar venda: " + mensagemErro)
    }
  }

  // 6. Effects
  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
    }
    fetchUserId()
  }, [])

  // Filtrar produtos e serviços baseado na busca (categoria, nome ou código)
  const filtrarPorBusca = useCallback((items: any[], tipo: 'produto' | 'servico') => {
    if (searchQuery.trim() === "") return items
    const query = searchQuery.toLowerCase()
    return items.filter(item => 
      item.nome.toLowerCase().includes(query) ||
      item.codigo.toLowerCase().includes(query) ||
      item.categoria.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const produtosFiltrados = filtrarPorBusca(produtos.filter(p => p.ativo), 'produto')
  const servicosFiltrados = filtrarPorBusca(servicos.filter(s => s.ativo), 'servico')
  const produtosMaisVendidosFiltrados = filtrarPorBusca(produtosMaisVendidos, 'produto')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.key === 'F3') { e.preventDefault(); document.getElementById('select-cliente')?.click() }
      if (e.key === 'F4') { e.preventDefault(); descontoInputRef.current?.focus() }
      if (e.key === 'F9') {
        e.preventDefault()
        if (vendaAtual.itens.length > 0 && vendaAtual.funcionarioId) setDialogPagamento(true)
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery("")
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, vendaAtual])

  useEffect(() => {
    const valor = Number.parseFloat(descontoInput) || 0
    const novoDesconto = descontoTipo === 'percentual' ? (subtotal * valor) / 100 : valor
    if (novoDesconto !== vendaAtual.desconto) {
      setDesconto(novoDesconto)
    }
  }, [descontoInput, descontoTipo, subtotal, vendaAtual.desconto, setDesconto])

  // Sincronizar cache com banco de dados quando caixa é aberto/fechado
  useEffect(() => {
    if (caixaAbertoDB) {
      salvarCache(true, caixaAbertoDB.id)
    }
  }, [caixaAbertoDB, salvarCache])

  // Sincronizar resultado da verificação silenciosa com cache
  useEffect(() => {
    if (!isVerifyingCaixa && caixaVerificado) {
      // Caixa está aberto segundo verificação
      salvarCache(true, caixaVerificado.id)
    }
  }, [caixaVerificado, isVerifyingCaixa, salvarCache])

  // Atualizar verificação do caixa quando a página receber foco (ex: ao voltar da página de caixa)
  useEffect(() => {
    const handleFocus = () => {
      refetchCaixaVerification()
      refetchCaixa()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchCaixaVerification()
        refetchCaixa()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refetchCaixaVerification, refetchCaixa])

  // Determinar se o caixa está fechado após verificação
  const caixaFechado = verificacaoCompleta && !caixaVerificado

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Sidebar com auto-hide */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-16 transition-all duration-300",
          sidebarVisible && "w-64"
        )}
        onMouseEnter={() => setSidebarVisible(true)}
        onMouseLeave={() => setSidebarVisible(false)}
      >
        <div className={cn("h-full", sidebarVisible ? "block" : "hidden")}>
          <Sidebar />
        </div>
        {!sidebarVisible && (
          <div className="flex h-full flex-col items-center gap-4 border-r border-border bg-sidebar py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top-5">
          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="flex items-center gap-2 p-3">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">{toastMessage}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarVisible ? "ml-64" : "ml-16"
      )}>
        {/* Loading enquanto verifica o caixa */}
        {(!isHydrated || isVerifyingCaixa) ? (
          <div className="flex h-screen items-center justify-center">
            <p className="text-muted-foreground">Verificando caixa...</p>
          </div>
        ) : caixaFechado ? (
          /* Caixa fechado - mostrar formulário de abertura na área principal */
          <div className="flex h-screen items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Caixa Fechado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Abra o caixa para começar a registrar vendas
                </p>
                <div className="space-y-3">
                  <div>
                    <Label>Funcionário Responsável *</Label>
                    <Select value={funcionarioIdCaixa} onValueChange={setFuncionarioIdCaixa}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.filter(f => f.ativo).map((func) => (
                          <SelectItem key={func.id} value={func.id}>
                            {func.nome} - {func.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor de Abertura (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorAberturaCaixa}
                      onChange={(e) => setValorAberturaCaixa(Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <Button onClick={handleAbrirCaixa} className="w-full" size="lg">
                  Abrir Caixa
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid h-screen grid-rows-[auto_1fr] gap-0">
            {/* Header com Status e Busca */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 p-4">
                {/* Busca Rápida */}
                <div className="relative flex-1 max-w-2xl flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Filtrar por nome, código ou categoria (F2)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 h-11 text-base"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => setDialogNovaPerda(true)}
                    variant="outline"
                    size="lg"
                    className="h-11 gap-2"
                    title="Registrar perda de produto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Perda</span>
                  </Button>
                </div>

                {/* Status e Ações */}
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-2 px-3 py-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">Caixa Aberto</span>
                  </Badge>

                  {vendaAtual.itens.length > 0 && (
                    <Badge className="gap-2 bg-primary px-3 py-1.5">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="font-bold">{vendaAtual.itens.length}</span>
                    </Badge>
                  )}

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Vendas Hoje</p>
                    <p className="text-lg font-bold">R$ {(resumo?.totalReceita || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Área Principal - Grid Disperso */}
            <div className="grid grid-cols-12 gap-4 overflow-hidden p-4">
              {/* Coluna Esquerda - Produtos/Serviços */}
              <div className="col-span-7 flex flex-col gap-4 overflow-auto">
                {/* Tabs de Visualização */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'vendidos' ? 'default' : 'outline'}
                    onClick={() => setViewMode('vendidos')}
                    size="sm"
                    className="gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Mais Vendidos
                  </Button>
                  <Button
                    variant={viewMode === 'produtos' ? 'default' : 'outline'}
                    onClick={() => setViewMode('produtos')}
                    size="sm"
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Todos Produtos
                  </Button>
                  <Button
                    variant={viewMode === 'servicos' ? 'default' : 'outline'}
                    onClick={() => setViewMode('servicos')}
                    size="sm"
                    className="gap-2"
                  >
                    <Wrench className="h-4 w-4" />
                    Serviços
                  </Button>
                </div>

                {/* Grid de Produtos/Serviços */}
                <div className="grid grid-cols-3 gap-3 auto-rows-min">
                  {viewMode === 'vendidos' && produtosMaisVendidosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => adicionarItemRapido(produto.id, 'produto')}
                      className="group relative rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                    >
                      {produto.estoque <= 5 && (
                        <Badge variant="destructive" className="absolute right-1.5 top-1.5 text-xs px-1.5 py-0">
                          Est: {produto.estoque}
                        </Badge>
                      )}
                      <div className="flex items-start gap-2">
                        {produto.imagem && (
                          <img 
                            src={produto.imagem} 
                            alt={produto.nome}
                            className="h-10 w-10 rounded object-cover shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImagemModalUrl(produto.imagem!)
                              setImagemModalNome(produto.nome)
                              setImagemModalAberta(true)
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2 text-sm">{produto.nome}</p>
                          <p className="text-lg font-bold text-primary">R$ {produto.preco.toFixed(2)}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {viewMode === 'produtos' && produtosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => adicionarItemRapido(produto.id, 'produto')}
                      className="group relative rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                    >
                      {produto.estoque <= 5 && (
                        <Badge variant="destructive" className="absolute right-1.5 top-1.5 text-xs px-1.5 py-0">
                          Est: {produto.estoque}
                        </Badge>
                      )}
                      <div className="flex items-start gap-2">
                        {produto.imagem && (
                          <img 
                            src={produto.imagem} 
                            alt={produto.nome}
                            className="h-10 w-10 rounded object-cover shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImagemModalUrl(produto.imagem!)
                              setImagemModalNome(produto.nome)
                              setImagemModalAberta(true)
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2 text-sm">{produto.nome}</p>
                          <p className="text-lg font-bold text-primary">R$ {produto.preco.toFixed(2)}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {viewMode === 'servicos' && servicosFiltrados.map((servico) => (
                    <button
                      key={servico.id}
                      onClick={() => adicionarItemRapido(servico.id, 'servico')}
                      className="group relative rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                    >
                      <p className="font-medium line-clamp-2 text-sm">{servico.nome}</p>
                      <p className="text-lg font-bold text-primary mt-1">R$ {servico.preco.toFixed(2)}</p>
                    </button>
                  ))}

                  {/* Mensagem quando não há resultados */}
                  {searchQuery && (
                    (viewMode === 'vendidos' && produtosMaisVendidosFiltrados.length === 0) ||
                    (viewMode === 'produtos' && produtosFiltrados.length === 0) ||
                    (viewMode === 'servicos' && servicosFiltrados.length === 0)
                  ) && (
                    <div className="col-span-3 flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-12 w-12 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">Nenhum resultado para "{searchQuery}"</p>
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="text-primary hover:underline text-sm mt-1"
                      >
                        Limpar busca
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita - Carrinho e Ações */}
              <div className="col-span-5 flex flex-col gap-3 overflow-hidden">
                {/* Seleções Rápidas */}
                <Card>
                  <CardContent className="grid grid-cols-2 gap-2 p-2">
                    <div>
                      <Label className="text-xs mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Vendedor <span className="text-destructive">*</span>
                      </Label>
                      <Select value={vendaAtual.funcionarioId || ""} onValueChange={setFuncionarioVenda}>
                        <SelectTrigger className={!vendaAtual.funcionarioId ? "border-destructive h-9" : "h-9"}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter((f) => f.ativo).map((func) => (
                            <SelectItem key={func.id} value={func.id}>
                              {func.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1">Cliente (F3)</Label>
                      <div className="relative">
                        <div className="flex gap-1">
                          <Input
                            ref={clienteSearchInputRef}
                            placeholder="Pesquisar cliente..."
                            value={searchClienteQuery}
                            onChange={(e) => {
                              setSearchClienteQuery(e.target.value)
                              setShowClienteResults(true)
                            }}
                            onFocus={() => setShowClienteResults(true)}
                            className="h-9 text-sm"
                          />
                          {vendaAtual.clienteId && vendaAtual.clienteId !== "none" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleLimparCliente}
                              className="h-9 px-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {showClienteResults && filtroClienteResultados.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                            {filtroClienteResultados.map((cliente) => (
                              <button
                                key={cliente.id}
                                onClick={() => handleSelecionarCliente(cliente)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors text-sm"
                              >
                                <div className="font-medium">{cliente.nome}</div>
                                <div className="text-xs text-gray-500">
                                  {cliente.endereco && <span>{cliente.endereco}</span>}
                                  {cliente.endereco && cliente.telefone && <span> • </span>}
                                  {cliente.telefone && <span>{cliente.telefone}</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {showClienteResults && searchClienteQuery && filtroClienteResultados.length === 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 text-xs text-gray-500">
                            Nenhum cliente encontrado
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carrinho */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="pb-1.5 px-2 pt-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>Carrinho</span>
                      {vendaAtual.itens.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7" onClick={limparVenda}>
                          <X className="h-3 w-3 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto space-y-1 px-2 pb-2">
                    {vendaAtual.itens.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm">Carrinho vazio</p>
                      </div>
                    ) : (
                      vendaAtual.itens.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-1.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{item.nome}</p>
                            <p className="text-[10px] text-muted-foreground">
                              R$ {item.preco.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => atualizarQuantidade(index, Math.max(1, item.quantidade - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-7 text-center text-xs font-medium">{item.quantidade}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xs">R$ {item.subtotal.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              removerItem(index)
                              mostrarToast("❌ Item removido")
                            }}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Total e Ações */}
                {vendaAtual.itens.length > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="space-y-2 p-2">
                      {/* Desconto */}
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs">Desconto (F4)</Label>
                        <div className="flex gap-0.5">
                          <Button
                            variant={descontoTipo === 'valor' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDescontoTipo('valor')}
                          >
                            R$
                          </Button>
                          <Button
                            variant={descontoTipo === 'percentual' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDescontoTipo('percentual')}
                          >
                            %
                          </Button>
                        </div>
                        <Input
                          ref={descontoInputRef}
                          type="number"
                          min="0"
                          step="0.01"
                          value={descontoInput}
                          onChange={(e) => setDescontoInput(e.target.value)}
                          className="flex-1 h-7 text-sm"
                          placeholder="0"
                        />
                      </div>

                      {/* Resumo */}
                      <div className="space-y-0.5 border-t border-border pt-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        {vendaAtual.desconto > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Desconto:</span>
                            <span className="text-destructive">- R$ {vendaAtual.desconto.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-bold pt-1">
                          <span>Total:</span>
                          <span className="text-primary">R$ {total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Botão Finalizar */}
                      <Button
                        onClick={() => setDialogPagamento(true)}
                        disabled={!vendaAtual.funcionarioId}
                        size="lg"
                        className="w-full gap-2 text-base font-bold h-11"
                      >
                        <Check className="h-5 w-5" />
                        Finalizar Venda (F9)
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dialog de Pagamento */}
      <Dialog open={dialogPagamento} onOpenChange={setDialogPagamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Forma de Pagamento */}
            <div className="space-y-3">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={formaPagamento === 'dinheiro' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('dinheiro')}
                  className="justify-start gap-2"
                >
                  <Banknote className="h-4 w-4" />
                  Dinheiro
                </Button>
                <Button
                  variant={formaPagamento === 'pix' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('pix')}
                  className="justify-start gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  PIX
                </Button>
                <Button
                  variant={formaPagamento === 'cartao_credito' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('cartao_credito')}
                  className="justify-start gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Crédito
                </Button>
                <Button
                  variant={formaPagamento === 'cartao_debito' ? 'default' : 'outline'}
                  onClick={() => setFormaPagamento('cartao_debito')}
                  className="justify-start gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Débito
                </Button>
              </div>
            </div>

            {/* Valor Recebido (apenas dinheiro) */}
            {formaPagamento === 'dinheiro' && (
              <div className="space-y-2">
                <Label>Valor Recebido</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  placeholder="0.00"
                />
                {valorRecebido && calcularTroco() > 0 && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Troco: </span>
                    <span className="font-bold text-green-600">R$ {calcularTroco().toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Venda a Prazo */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="venda-prazo" className="cursor-pointer">Venda a Prazo</Label>
              </div>
              <Switch id="venda-prazo" checked={vendaAPrazo} onCheckedChange={setVendaAPrazo} />
            </div>

            {vendaAPrazo && (
              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Data Vencimento</Label>
                    <Input
                      type="date"
                      min={dataMinima}
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Parcelas</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={numeroParcelas}
                      onChange={(e) => setNumeroParcelas(Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {numeroParcelas}x de R$ {(total / numeroParcelas).toFixed(2)}
                </p>
              </div>
            )}

            {/* Pagamento de Serviços Após Conclusão */}
            {vendaAtual.itens.some(item => item.tipo === 'servico') && (
              <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  <div className="flex flex-col">
                    <Label htmlFor="pagar-depois" className="cursor-pointer text-sm font-medium">
                      Pagamento após conclusão
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {pagarServicoDepois ? 'Serviços serão pagos depois' : 'Serviços pagos antecipadamente'}
                    </span>
                  </div>
                </div>
                <Switch
                  id="pagar-depois"
                  checked={pagarServicoDepois}
                  onCheckedChange={setPagarServicoDepois}
                />
              </div>
            )}

            {/* Breakdown de valores quando há serviços e pagamento depois */}
            {vendaAtual.itens.some(item => item.tipo === 'servico') && pagarServicoDepois && (
              <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produtos:</span>
                  <span className="font-medium">R$ {totalProdutos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Serviços (após conclusão):</span>
                  <span className="font-medium text-orange-600">R$ {totalServicos.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border"></div>
                <p className="text-xs text-orange-600 font-medium">
                  ⚠️ Total de serviços será cobrado após conclusão
                </p>
              </div>
            )}

            {/* Total */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total a pagar:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPagamento(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinalizarVenda}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Perda */}
      <Dialog open={dialogNovaPerda} onOpenChange={setDialogNovaPerda}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nova Perda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Linha 1: Tipo e Produto/Serviço */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={novaPerda.tipo} onValueChange={(v) => setNovaPerda({ ...novaPerda, tipo: v as 'produto' | 'servico', produtoId: "", valor: "" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{novaPerda.tipo === 'produto' ? 'Produto' : 'Serviço'} *</Label>
                <Select value={novaPerda.produtoId} onValueChange={(v) => {
                  // Auto-preencher valor baseado no custo do item selecionado
                  let novoValor = ""
                  if (novaPerda.tipo === 'produto') {
                    const prod = produtos.find(p => p.id === v)
                    novoValor = prod ? prod.custoUnitario.toString() : ""
                  } else {
                    const serv = servicos.find(s => s.id === v)
                    if (serv) {
                      // Se perdaTipoValor for 'custo', usar soma dos custos; senão usar preço
                      if (perdaTipoValor === 'custo') {
                        const somaCustos = calcularSomaCustosServico(v)
                        novoValor = somaCustos.toString()
                      } else {
                        novoValor = serv.preco.toString()
                      }
                    }
                  }
                  setNovaPerda({ ...novaPerda, produtoId: v, valor: novoValor })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione o ${novaPerda.tipo}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {novaPerda.tipo === 'produto' ? (
                      produtos.filter(p => p.ativo).map(produto => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} - Custo: R$ {produto.custoUnitario.toFixed(2)}
                        </SelectItem>
                      ))
                    ) : (
                      servicos.filter(s => s.ativo).map(servico => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome} - Preço: R$ {servico.preco.toFixed(2)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Valor Unitário */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="valor-perda">Valor Unitário (R$) *</Label>
                <div className="flex gap-2 bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => {
                      setPerdaTipoValor('custo')
                      if (novaPerda.produtoId) {
                        if (novaPerda.tipo === 'produto') {
                          const prod = produtos.find(p => p.id === novaPerda.produtoId)
                          if (prod) setNovaPerda(prev => ({ ...prev, valor: prod.custoUnitario.toString() }))
                        } else {
                          // Para serviços, usar a soma dos custos
                          const somaCustos = calcularSomaCustosServico(novaPerda.produtoId)
                          setNovaPerda(prev => ({ ...prev, valor: somaCustos.toString() }))
                        }
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${perdaTipoValor === 'custo'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Custo
                  </button>
                  <button
                    onClick={() => {
                      setPerdaTipoValor('preco')
                      if (novaPerda.produtoId) {
                        if (novaPerda.tipo === 'produto') {
                          const prod = produtos.find(p => p.id === novaPerda.produtoId)
                          if (prod) setNovaPerda(prev => ({ ...prev, valor: prod.preco.toString() }))
                        } else {
                          const serv = servicos.find(s => s.id === novaPerda.produtoId)
                          if (serv) setNovaPerda(prev => ({ ...prev, valor: serv.preco.toString() }))
                        }
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${perdaTipoValor === 'preco'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Valor Final
                  </button>
                </div>
              </div>
              <Input
                id="valor-perda"
                type="number"
                step="0.01"
                min="0"
                value={novaPerda.valor}
                onChange={(e) => setNovaPerda({ ...novaPerda, valor: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {/* Linha 3: Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantidade-perda">Quantidade *</Label>
              <Input
                id="quantidade-perda"
                type="number"
                min="1"
                value={novaPerda.quantidade}
                onChange={(e) => setNovaPerda({ ...novaPerda, quantidade: e.target.value })}
              />
            </div>

            {/* Linha 4: Total da Perda (calculado automaticamente) */}
            {novaPerda.valor && novaPerda.quantidade && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm font-medium text-blue-900">
                  Total da Perda: R$ {(Number.parseFloat(novaPerda.valor) * Number.parseInt(novaPerda.quantidade)).toFixed(2)}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {novaPerda.valor} × {novaPerda.quantidade} unidades
                </div>
              </div>
            )}

            {/* Linha 5: Funcionário e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funcionário Responsável *</Label>
                <Select value={novaPerda.funcionarioId} onValueChange={(v) => setNovaPerda({ ...novaPerda, funcionarioId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.filter(f => f.ativo).map(func => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Categoria *</Label>
                  <button
                    type="button"
                    onClick={() => setMostrarFormCategoria(!mostrarFormCategoria)}
                    className="text-xs text-primary hover:underline"
                  >
                    {mostrarFormCategoria ? "Cancelar" : "+ Nova Categoria"}
                  </button>
                </div>
                {mostrarFormCategoria ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da categoria..."
                      value={novaCategoriaNome}
                      onChange={(e) => setNovaCategoriaNome(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!novaCategoriaNome.trim() || salvandoCategoria}
                      onClick={async () => {
                        if (!novaCategoriaNome.trim() || !lojaId) return
                        setSalvandoCategoria(true)
                        try {
                          const supabase = createClient()
                          const { data, error } = await supabase
                            .from("categorias_perdas")
                            .insert({ loja_id: lojaId, nome: novaCategoriaNome.trim() })
                            .select()
                            .single()
                          if (error) throw error
                          await refetchCategoriasPerdas()
                          setNovaPerda({ ...novaPerda, categoriaId: data.id })
                          setNovaCategoriaNome("")
                          setMostrarFormCategoria(false)
                          mostrarToast("✅ Categoria criada!")
                        } catch (err: any) {
                          console.error("Erro ao criar categoria:", err)
                          mostrarToast("❌ Erro ao criar categoria")
                        } finally {
                          setSalvandoCategoria(false)
                        }
                      }}
                    >
                      {salvandoCategoria ? "..." : "Salvar"}
                    </Button>
                  </div>
                ) : (
                  <Select value={novaPerda.categoriaId} onValueChange={(v) => setNovaPerda({ ...novaPerda, categoriaId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasPerdas.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhuma categoria. Clique em "+ Nova Categoria"
                        </div>
                      ) : (
                        categoriasPerdas.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes-perda">Observações</Label>
              <Textarea
                id="observacoes-perda"
                value={novaPerda.observacoes}
                onChange={(e) => setNovaPerda({ ...novaPerda, observacoes: e.target.value })}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogNovaPerda(false)
              setNovaPerda({ produtoId: "", tipo: "produto", quantidade: "", valor: "", funcionarioId: "", categoriaId: "", observacoes: "" })
              setMostrarFormCategoria(false)
              setNovaCategoriaNome("")
            }}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPerda} className="bg-orange-500 hover:bg-orange-600">
              Registrar Perda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Imagem do Produto */}
      <Dialog open={imagemModalAberta} onOpenChange={setImagemModalAberta}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>{imagemModalNome}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 pt-0">
            {imagemModalUrl && (
              <img 
                src={imagemModalUrl} 
                alt={imagemModalNome}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
