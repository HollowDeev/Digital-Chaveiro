"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useProdutos, useServicos, useClientes, useFuncionarios, useCaixaAberto } from "@/lib/hooks/useLojaData"
import { useStore } from "@/lib/store"
import { ShoppingCart, Wrench, Plus, Trash2, DollarSign, Search, Minus, X, Check, CreditCard, Banknote, Smartphone, Percent, Package, Zap, TrendingUp, Users, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export default function PDVPage() {
  // 1. Hooks e Store
  const [lojaId, setLojaId] = useState<string | undefined>()
  const [userId, setUserId] = useState<string | undefined>()
  const { produtos } = useProdutos(lojaId)
  const { servicos } = useServicos(lojaId)
  const { clientes } = useClientes(lojaId)
  const { funcionarios } = useFuncionarios(lojaId)
  const { caixaAtual: caixaAbertoDB, refetch: refetchCaixa } = useCaixaAberto(lojaId)

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
    caixaAtual
  } = useStore()

  // 2. Estados
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string, nome: string, preco: number, tipo: 'produto' | 'servico', estoque?: number }>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0)
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

  // 3. Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const descontoInputRef = useRef<HTMLInputElement>(null)

  // 4. Cálculos
  const subtotal = vendaAtual.itens.reduce((acc, item) => acc + item.subtotal, 0)
  const total = subtotal - vendaAtual.desconto
  const resumo = getResumoVendas()
  const produtosMaisVendidos = produtos.filter(p => p.ativo).slice(0, 12)
  const dataMinima = new Date().toISOString().split("T")[0]

  // 5. Funções
  const mostrarToast = useCallback((mensagem: string) => {
    setToastMessage(mensagem)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }, [])

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

  const handleAbrirCaixa = () => {
    if (!funcionarioIdCaixa) {
      mostrarToast("⚠️ Selecione um funcionário")
      return
    }
    abrirCaixa(funcionarioIdCaixa, valorAberturaCaixa)
    setDialogAbrirCaixa(false)
    mostrarToast("✅ Caixa aberto com sucesso!")
  }

  const handleFinalizarVenda = async () => {
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
        const { data: vendaData, error: vendaError } = await supabase
          .from("vendas")
          .insert({
            loja_id: lojaId,
            cliente_id: vendaAtual.clienteId,
            funcionario_id: vendaAtual.funcionarioId,
            subtotal: subtotal,
            desconto: vendaAtual.desconto || 0,
            total: total,
            forma_pagamento: formaPagamento,
            status: "pendente",
          })
          .select()
          .single()

        if (vendaError) throw vendaError

        // 2. SALVAR ITENS DA VENDA
        const itensVenda = vendaAtual.itens.map((item) => ({
          venda_id: vendaData.id,
          produto_id: item.tipo === "produto" ? item.id : null,
          servico_id: item.tipo === "servico" ? item.id : null,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.subtotal,
        }))

        await supabase.from("vendas_itens").insert(itensVenda)

        // 3. ATUALIZAR ESTOQUE
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

        // 4. CRIAR PARCELAS A RECEBER
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
        mostrarToast("✅ Venda a prazo registrada!")
      } else {
        // VENDA À VISTA

        // 1. SALVAR VENDA NO BANCO
        const { data: vendaData, error: vendaError } = await supabase
          .from("vendas")
          .insert({
            loja_id: lojaId,
            cliente_id: vendaAtual.clienteId && vendaAtual.clienteId !== "none" ? vendaAtual.clienteId : null,
            funcionario_id: vendaAtual.funcionarioId,
            subtotal: subtotal,
            desconto: vendaAtual.desconto || 0,
            total: total,
            forma_pagamento: formaPagamento,
            status: "concluida",
          })
          .select()
          .single()

        if (vendaError) throw vendaError

        // 2. SALVAR ITENS DA VENDA
        const itensVenda = vendaAtual.itens.map((item) => ({
          venda_id: vendaData.id,
          produto_id: item.tipo === "produto" ? item.id : null,
          servico_id: item.tipo === "servico" ? item.id : null,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.subtotal,
        }))

        await supabase.from("vendas_itens").insert(itensVenda)

        // 3. ATUALIZAR ESTOQUE
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

        // 4. REGISTRAR MOVIMENTAÇÃO NO CAIXA
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
        mostrarToast("✅ Venda finalizada com sucesso!")
      }
    } catch (err: any) {
      console.error("Erro ao finalizar venda:", err)
      mostrarToast("❌ Erro ao finalizar venda: " + (err.message || "Erro desconhecido"))
    }
  }

  // 6. Effects
  useEffect(() => {
    const fetchLoja = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: lojas } = await supabase.from("lojas").select("id").eq("dono_id", user.id).limit(1)
      if (lojas && lojas.length > 0) setLojaId(lojas[0].id)
    }
    fetchLoja()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    const query = searchQuery.toLowerCase()
    const produtosResults = produtos
      .filter(p => p.ativo && (
        p.nome.toLowerCase().includes(query) ||
        p.codigo.toLowerCase().includes(query) ||
        p.categoria.toLowerCase().includes(query)
      ))
      .map(p => ({ id: p.id, nome: p.nome, preco: p.preco, tipo: 'produto' as const, estoque: p.estoque }))
      .slice(0, 5)
    const servicosResults = servicos
      .filter(s => s.ativo && (
        s.nome.toLowerCase().includes(query) ||
        s.codigo.toLowerCase().includes(query) ||
        s.categoria.toLowerCase().includes(query)
      ))
      .map(s => ({ id: s.id, nome: s.nome, preco: s.preco, tipo: 'servico' as const }))
      .slice(0, 5)
    setSearchResults([...produtosResults, ...servicosResults])
    setShowSearchResults(true)
    setSelectedSearchIndex(0)
  }, [searchQuery, produtos, servicos])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.key === 'F3') { e.preventDefault(); document.getElementById('select-cliente')?.click() }
      if (e.key === 'F4') { e.preventDefault(); descontoInputRef.current?.focus() }
      if (e.key === 'F9') {
        e.preventDefault()
        if (vendaAtual.itens.length > 0 && vendaAtual.funcionarioId) setDialogPagamento(true)
      }
      if (e.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false)
        setSearchQuery("")
      }
      if (e.key === 'Enter' && showSearchResults && searchResults.length > 0) {
        e.preventDefault()
        const item = searchResults[selectedSearchIndex]
        adicionarItemRapido(item.id, item.tipo)
        setSearchQuery("")
        setShowSearchResults(false)
      }
      if (showSearchResults && searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedSearchIndex(prev => (prev + 1) % searchResults.length)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedSearchIndex(prev => prev === 0 ? searchResults.length - 1 : prev - 1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearchResults, searchResults, selectedSearchIndex, vendaAtual, adicionarItemRapido])

  useEffect(() => {
    const valor = Number.parseFloat(descontoInput) || 0
    const novoDesconto = descontoTipo === 'percentual' ? (subtotal * valor) / 100 : valor
    if (novoDesconto !== vendaAtual.desconto) {
      setDesconto(novoDesconto)
    }
  }, [descontoInput, descontoTipo, subtotal, vendaAtual.desconto, setDesconto])

  // Modal para abrir caixa se estiver fechado
  if (caixaAtual?.status !== "aberto") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    )
  }

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
        <div className="grid h-screen grid-rows-[auto_1fr] gap-0">
          {/* Header com Status e Busca */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 p-4">
              {/* Busca Rápida */}
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar produto ou serviço (F2)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 text-base"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto shadow-xl">
                    <CardContent className="p-2">
                      {searchResults.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            adicionarItemRapido(item.id, item.tipo)
                            setSearchQuery("")
                            setShowSearchResults(false)
                          }}
                          className={cn(
                            "w-full flex items-center justify-between rounded-md p-3 text-left transition-colors",
                            index === selectedSearchIndex ? "bg-accent" : "hover:bg-accent/50"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.nome}</span>
                              <Badge variant={item.tipo === 'produto' ? 'default' : 'secondary'} className="text-xs">
                                {item.tipo === 'produto' ? 'Produto' : 'Serviço'}
                              </Badge>
                              {item.estoque !== undefined && item.estoque <= 5 && (
                                <Badge variant="destructive" className="text-xs">
                                  Estoque: {item.estoque}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-primary">R$ {item.preco.toFixed(2)}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
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
                {viewMode === 'vendidos' && produtosMaisVendidos.map((produto) => (
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
                    <p className="font-medium line-clamp-2 text-sm pr-14">{produto.nome}</p>
                    <p className="text-lg font-bold text-primary mt-1">R$ {produto.preco.toFixed(2)}</p>
                  </button>
                ))}

                {viewMode === 'produtos' && produtos.filter(p => p.ativo).map((produto) => (
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
                    <p className="font-medium line-clamp-2 text-sm pr-14">{produto.nome}</p>
                    <p className="text-lg font-bold text-primary mt-1">R$ {produto.preco.toFixed(2)}</p>
                  </button>
                ))}

                {viewMode === 'servicos' && servicos.filter(s => s.ativo).map((servico) => (
                  <button
                    key={servico.id}
                    onClick={() => adicionarItemRapido(servico.id, 'servico')}
                    className="group relative rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                  >
                    <p className="font-medium line-clamp-2 text-sm">{servico.nome}</p>
                    <p className="text-lg font-bold text-primary mt-1">R$ {servico.preco.toFixed(2)}</p>
                  </button>
                ))}
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
                    <Label className="text-xs mb-1" id="select-cliente">Cliente (F3)</Label>
                    <Select value={vendaAtual.clienteId} onValueChange={setCliente}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sem cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem cliente</SelectItem>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
    </div>
  )
}
