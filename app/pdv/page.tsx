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
import { useProdutos, useServicos, useClientes } from "@/lib/hooks/useLojaData"
import { useStore } from "@/lib/store"
import { ShoppingCart, Wrench, Plus, Trash2, DollarSign, Search, Minus, X, Check, CreditCard, Banknote, Smartphone, Percent, Package, Zap, TrendingUp, Users, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export default function PDVPage() {
  // 1. Hooks e Store
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { produtos } = useProdutos(lojaId)
  const { servicos } = useServicos(lojaId)
  const { clientes } = useClientes(lojaId)

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
    funcionarios,
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

  const handleFinalizarVenda = () => {
    if (vendaAPrazo) {
      if (!vendaAtual.clienteId || vendaAtual.clienteId === "none") {
        mostrarToast("⚠️ Selecione um cliente para venda a prazo!")
        return
      }
      if (!dataVencimento) {
        mostrarToast("⚠️ Defina a data de vencimento!")
        return
      }

      const cliente = clientes.find((c) => c.id === vendaAtual.clienteId)
      if (!cliente) return

      const valorParcela = total / numeroParcelas
      const now = Date.now()
      const parcelas = Array.from({ length: numeroParcelas }, (_, i) => {
        const dataVenc = new Date(dataVencimento)
        dataVenc.setMonth(dataVenc.getMonth() + i)
        return {
          id: `${now}-${i}`,
          numero: i + 1,
          valor: valorParcela,
          dataVencimento: dataVenc.toISOString(),
          status: "pendente" as const,
        }
      })

      const vendaPrazo = {
        id: `VP${now}`,
        vendaId: `VP${now}`,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        valorTotal: total,
        valorPago: 0,
        valorRestante: total,
        dataVenda: new Date().toISOString(),
        dataVencimento: parcelas[0].dataVencimento,
        status: "pendente" as const,
        parcelas,
      }

      adicionarVendaPrazo(vendaPrazo)
      adicionarContaReceber({
        id: `CR${now}`,
        descricao: `Venda a Prazo - ${cliente.nome} (Parcela 1/${numeroParcelas})`,
        valor: valorParcela,
        dataVencimento: parcelas[0].dataVencimento,
        status: "pendente",
        clienteId: cliente.id,
        clienteNome: cliente.nome,
      })

      limparVenda()
      setDialogPagamento(false)
      setVendaAPrazo(false)
      mostrarToast("✅ Venda a prazo registrada!")
    } else {
      finalizarVenda(formaPagamento)
      setDialogPagamento(false)
      mostrarToast("✅ Venda finalizada com sucesso!")
    }
  }

  // 6. Effects
  useEffect(() => {
    const fetchLoja = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
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
                    className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                  >
                    {produto.estoque <= 5 && (
                      <Badge variant="destructive" className="absolute right-2 top-2 text-xs">
                        Estoque: {produto.estoque}
                      </Badge>
                    )}
                    <div className="flex h-16 items-center justify-center rounded-md bg-accent/50">
                      <Package className="h-8 w-8 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-2 text-sm">{produto.nome}</p>
                      <p className="text-lg font-bold text-primary">R$ {produto.preco.toFixed(2)}</p>
                    </div>
                  </button>
                ))}

                {viewMode === 'produtos' && produtos.filter(p => p.ativo).map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarItemRapido(produto.id, 'produto')}
                    className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                  >
                    {produto.estoque <= 5 && (
                      <Badge variant="destructive" className="absolute right-2 top-2 text-xs">
                        Estoque: {produto.estoque}
                      </Badge>
                    )}
                    <div className="flex h-16 items-center justify-center rounded-md bg-accent/50">
                      <Package className="h-8 w-8 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-2 text-sm">{produto.nome}</p>
                      <p className="text-lg font-bold text-primary">R$ {produto.preco.toFixed(2)}</p>
                    </div>
                  </button>
                ))}

                {viewMode === 'servicos' && servicos.filter(s => s.ativo).map((servico) => (
                  <button
                    key={servico.id}
                    onClick={() => adicionarItemRapido(servico.id, 'servico')}
                    className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-95"
                  >
                    <div className="flex h-16 items-center justify-center rounded-md bg-muted">
                      <Wrench className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-2 text-sm">{servico.nome}</p>
                      <p className="text-lg font-bold text-primary">R$ {servico.preco.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coluna Direita - Carrinho e Ações */}
            <div className="col-span-5 flex flex-col gap-4">
              {/* Seleções Rápidas */}
              <Card>
                <CardContent className="grid grid-cols-2 gap-3 p-4">
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Vendedor <span className="text-destructive">*</span>
                    </Label>
                    <Select value={vendaAtual.funcionarioId || ""} onValueChange={setFuncionarioVenda}>
                      <SelectTrigger className={!vendaAtual.funcionarioId ? "border-destructive" : ""}>
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

                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5" id="select-cliente">Cliente (F3)</Label>
                    <Select value={vendaAtual.clienteId} onValueChange={setCliente}>
                      <SelectTrigger>
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
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Carrinho</span>
                    {vendaAtual.itens.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={limparVenda}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto space-y-2 pb-4">
                  {vendaAtual.itens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                      <p className="text-sm">Carrinho vazio</p>
                    </div>
                  ) : (
                    vendaAtual.itens.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {item.preco.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => atualizarQuantidade(index, Math.max(1, item.quantidade - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantidade}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">R$ {item.subtotal.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
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
                  <CardContent className="space-y-3 p-4">
                    {/* Desconto */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Desconto (F4)</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={descontoTipo === 'valor' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setDescontoTipo('valor')}
                        >
                          R$
                        </Button>
                        <Button
                          variant={descontoTipo === 'percentual' ? 'default' : 'outline'}
                          size="sm"
                          className="h-6 px-2 text-xs"
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
                        className="flex-1 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>

                    {/* Resumo */}
                    <div className="space-y-1 border-t border-border pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      {vendaAtual.desconto > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Desconto:</span>
                          <span className="text-destructive">- R$ {vendaAtual.desconto.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-2xl font-bold">
                        <span>Total:</span>
                        <span className="text-primary">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Botão Finalizar */}
                    <Button
                      onClick={() => setDialogPagamento(true)}
                      disabled={!vendaAtual.funcionarioId}
                      size="lg"
                      className="w-full gap-2 text-base font-bold"
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
