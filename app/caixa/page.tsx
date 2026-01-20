"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "@/lib/contexts/loja-context"
import { useData } from "@/lib/contexts/data-context"
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, Package, Wrench, ChevronDown, AlertTriangle } from "lucide-react"

// Tipo para os detalhes da venda
interface VendaDetalhe {
  id: string
  clienteNome: string | null
  desconto: number
  total: number
  formaPagamento: string
  status: string
  dataVenda: string
  itens: {
    id: string
    nome: string
    tipo: string
    quantidade: number
    precoUnitario: number
    subtotal: number
  }[]
}

export default function CaixaPage() {
  const { lojaAtual } = useLoja()
  const lojaId = lojaAtual?.id
  const [userId, setUserId] = useState<string | undefined>()
  const { caixaAberto: caixaAtual, funcionarios, refetchCaixa: refetch, loading: dataLoading } = useData()

  const [dialogAbrir, setDialogAbrir] = useState(false)
  const [dialogFechar, setDialogFechar] = useState(false)
  const [funcionarioId, setFuncionarioId] = useState("")
  const [valorAbertura, setValorAbertura] = useState(0)
  const [loading, setLoading] = useState(false)

  // Estados para vendas detalhadas
  const [vendasDetalhes, setVendasDetalhes] = useState<Record<string, VendaDetalhe>>({})
  const [loadingVendas, setLoadingVendas] = useState<Record<string, boolean>>({})

  // Estados para exclusão de venda
  const [dialogExcluirVenda, setDialogExcluirVenda] = useState(false)
  const [vendaParaExcluir, setVendaParaExcluir] = useState<{ movimentacaoId: string; vendaId: string; valor: number } | null>(null)
  const [excluindoVenda, setExcluindoVenda] = useState(false)

  // Buscar usuário
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
    }

    fetchData()
  }, [])

  // Função para buscar detalhes de uma venda
  const fetchVendaDetalhes = useCallback(async (vendaId: string) => {
    if (vendasDetalhes[vendaId] || loadingVendas[vendaId]) return

    setLoadingVendas(prev => ({ ...prev, [vendaId]: true }))

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          *,
          vendas_itens (
            id,
            tipo,
            nome,
            quantidade,
            preco_unitario,
            subtotal
          ),
          clientes (nome)
        `)
        .eq("id", vendaId)
        .single()

      if (error) throw error

      console.log("Dados da venda retornados:", data)
      console.log("Itens da venda:", data?.vendas_itens)

      if (data) {
        setVendasDetalhes(prev => ({
          ...prev,
          [vendaId]: {
            id: data.id,
            clienteNome: data.clientes?.nome || null,
            desconto: data.desconto || 0,
            total: data.total,
            formaPagamento: data.forma_pagamento,
            status: data.status,
            dataVenda: data.data_venda,
            itens: (data.vendas_itens || []).map((item: any) => ({
              id: item.id,
              nome: item.nome,
              tipo: item.tipo,
              quantidade: item.quantidade,
              precoUnitario: item.preco_unitario,
              subtotal: item.subtotal,
            })),
          },
        }))
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes da venda:", err)
    } finally {
      setLoadingVendas(prev => ({ ...prev, [vendaId]: false }))
    }
  }, [vendasDetalhes, loadingVendas])

  // Função para excluir uma venda
  const handleExcluirVenda = async () => {
    if (!vendaParaExcluir || !lojaId) return

    setExcluindoVenda(true)
    try {
      const supabase = createClient()

      // 1. Buscar itens da venda para restaurar o estoque
      const { data: itensVenda } = await supabase
        .from("vendas_itens")
        .select("*")
        .eq("venda_id", vendaParaExcluir.vendaId)

      // 2. Restaurar estoque dos produtos
      if (itensVenda) {
        for (const item of itensVenda) {
          if (item.tipo === 'produto' && item.item_id) {
            const { data: produto } = await supabase
              .from("produtos")
              .select("estoque")
              .eq("id", item.item_id)
              .single()

            if (produto) {
              await supabase
                .from("produtos")
                .update({ estoque: produto.estoque + item.quantidade })
                .eq("id", item.item_id)
            }
          }
        }
      }

      // 3. Excluir serviços realizados vinculados à venda
      await supabase
        .from("servicos_realizados")
        .delete()
        .eq("venda_id", vendaParaExcluir.vendaId)

      // 4. Excluir parcelas a receber vinculadas à venda
      await supabase
        .from("parcelas_receber")
        .delete()
        .eq("venda_id", vendaParaExcluir.vendaId)

      // 5. Excluir a movimentação do caixa
      await supabase
        .from("caixa_movimentacoes")
        .delete()
        .eq("id", vendaParaExcluir.movimentacaoId)

      // 6. Excluir itens da venda (cascade delete pode cuidar disso, mas garantimos)
      await supabase
        .from("vendas_itens")
        .delete()
        .eq("venda_id", vendaParaExcluir.vendaId)

      // 7. Excluir a venda
      const { error: vendaError } = await supabase
        .from("vendas")
        .delete()
        .eq("id", vendaParaExcluir.vendaId)

      if (vendaError) throw vendaError

      // Atualizar dados
      refetch()
      setDialogExcluirVenda(false)
      setVendaParaExcluir(null)

      // Remover do cache de detalhes
      setVendasDetalhes(prev => {
        const updated = { ...prev }
        delete updated[vendaParaExcluir.vendaId]
        return updated
      })
    } catch (err: any) {
      console.error("Erro ao excluir venda:", err)
      alert("Erro ao excluir venda: " + (err.message || "Erro desconhecido"))
    } finally {
      setExcluindoVenda(false)
    }
  }

  // Helper para formatar forma de pagamento
  const formatarFormaPagamento = (forma: string) => {
    const formas: Record<string, { label: string; icon: React.ReactNode }> = {
      dinheiro: { label: "Dinheiro", icon: <Banknote className="h-3 w-3" /> },
      pix: { label: "PIX", icon: <Smartphone className="h-3 w-3" /> },
      cartao_credito: { label: "Crédito", icon: <CreditCard className="h-3 w-3" /> },
      cartao_debito: { label: "Débito", icon: <CreditCard className="h-3 w-3" /> },
      outros: { label: "Outros", icon: <DollarSign className="h-3 w-3" /> },
    }
    return formas[forma] || { label: forma, icon: <DollarSign className="h-3 w-3" /> }
  }

  const handleAbrirCaixa = async () => {
    if (!funcionarioId || !lojaId || !userId) {
      alert("Selecione um funcionário")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("caixas").insert({
        loja_id: lojaId,
        funcionario_abertura_id: userId,
        valor_abertura: valorAbertura,
        status: "aberto",
      })

      if (error) throw error

      setDialogAbrir(false)
      setFuncionarioId("")
      setValorAbertura(0)
      refetch()
    } catch (err: any) {
      alert(err.message || "Erro ao abrir caixa")
    } finally {
      setLoading(false)
    }
  }

  const handleFecharCaixa = async () => {
    if (!funcionarioId || !caixaAtual || !userId) {
      alert("Selecione um funcionário")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const saldoFinal = (caixaAtual.valorAbertura || 0) + saldoCaixa

      const { error } = await supabase
        .from("caixas")
        .update({
          status: "fechado",
          funcionario_fechamento_id: userId,
          valor_fechamento: saldoFinal,
          data_fechamento: new Date().toISOString(),
        })
        .eq("id", caixaAtual.id)

      if (error) throw error

      setDialogFechar(false)
      setFuncionarioId("")
      refetch()
    } catch (err: any) {
      alert(err.message || "Erro ao fechar caixa")
    } finally {
      setLoading(false)
    }
  }

  const saldoCaixa =
    caixaAtual?.movimentacoes.reduce((acc, m) => {
      return acc + (m.tipo === "entrada" ? m.valor : -m.valor)
    }, 0) || 0

  const entradasHoje =
    caixaAtual?.movimentacoes.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.valor, 0) || 0

  const saidasHoje =
    caixaAtual?.movimentacoes.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.valor, 0) || 0

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Gestão de Caixa"
          subtitle="Controle de movimentações financeiras"
          icon={<Wallet className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            caixaAtual?.status === "aberto" ? (
              <Dialog open={dialogFechar} onOpenChange={setDialogFechar}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Fechar Caixa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fechar Caixa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Funcionário Responsável *</Label>
                      <Select value={funcionarioId} onValueChange={setFuncionarioId}>
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
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Saldo Final do Caixa</p>
                      <p className="text-2xl font-bold">R$ {((caixaAtual?.valorAbertura || 0) + saldoCaixa).toFixed(2)}</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogFechar(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleFecharCaixa}>
                      Confirmar Fechamento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={dialogAbrir} onOpenChange={setDialogAbrir}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Abrir Caixa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Caixa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Funcionário Responsável *</Label>
                      <Select value={funcionarioId} onValueChange={setFuncionarioId}>
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
                    <div className="space-y-2">
                      <Label>Valor de Abertura (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorAbertura}
                        onChange={(e) => setValorAbertura(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogAbrir(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAbrirCaixa}>
                      Confirmar Abertura
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Status do Caixa */}
          <Card
            className={`overflow-hidden ${caixaAtual?.status === "aberto" ? "border-accent bg-accent/5" : "border-muted"}`}
          >
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground lg:text-2xl">Status do Caixa</h2>
                    <Badge
                      variant={caixaAtual?.status === "aberto" ? "default" : "secondary"}
                      className={`flex-shrink-0 ${caixaAtual?.status === "aberto" ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {caixaAtual?.status === "aberto" ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                  {caixaAtual && (
                    <p className="mt-1 text-xs text-muted-foreground lg:text-sm break-words">
                      Aberto por {caixaAtual.funcionarioAberturaNome} em{" "}
                      {new Date(caixaAtual.dataAbertura).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>

                {caixaAtual && (
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-muted-foreground lg:text-sm">Saldo Atual</p>
                    <p className="text-3xl font-bold text-foreground lg:text-4xl">R$ {saldoCaixa.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Valor de Abertura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  R$ {caixaAtual?.valorAbertura.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-accent/50 bg-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-accent">
                  <TrendingUp className="h-4 w-4" />
                  Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">R$ {entradasHoje.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-destructive/50 bg-destructive/5 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <TrendingDown className="h-4 w-4" />
                  Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">R$ {saidasHoje.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Movimentações */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {!caixaAtual || caixaAtual.movimentacoes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada</p>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {caixaAtual.movimentacoes
                    .slice()
                    .reverse()
                    .map((movimentacao) => {
                      const temVenda = !!movimentacao.vendaId
                      const vendaDetalhe = temVenda ? vendasDetalhes[movimentacao.vendaId] : null
                      const carregandoVenda = temVenda ? loadingVendas[movimentacao.vendaId] : false

                      return (
                        <AccordionItem
                          key={movimentacao.id}
                          value={movimentacao.id}
                          className="rounded-lg border border-border overflow-hidden"
                        >
                          <AccordionTrigger
                            className="px-3 py-3 lg:px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/30"
                            onClick={() => {
                              if (temVenda && !vendaDetalhe && !carregandoVenda) {
                                fetchVendaDetalhes(movimentacao.vendaId)
                              }
                            }}
                          >
                            <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between pr-4">
                              <div className="flex items-start gap-3 lg:gap-4">
                                <div
                                  className={`rounded-lg p-2 lg:p-3 flex-shrink-0 ${movimentacao.tipo === "entrada"
                                    ? "bg-accent/10 text-accent"
                                    : "bg-destructive/10 text-destructive"
                                    }`}
                                >
                                  {movimentacao.tipo === "entrada" ? (
                                    <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-medium lg:text-base break-words">{movimentacao.descricao}</h3>
                                    <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                                      {movimentacao.categoria}
                                    </Badge>
                                    {temVenda && (
                                      <Badge variant="secondary" className="text-xs flex-shrink-0 gap-1">
                                        <ShoppingCart className="h-3 w-3" />
                                        Venda
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground lg:gap-3 lg:text-sm">
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(movimentacao.data).toLocaleString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-left lg:text-right">
                                <p
                                  className={`text-xl font-bold lg:text-2xl ${movimentacao.tipo === "entrada" ? "text-accent" : "text-destructive"}`}
                                >
                                  {movimentacao.tipo === "entrada" ? "+" : "-"} R$ {movimentacao.valor.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-3 pb-3 lg:px-4 lg:pb-4">
                            {temVenda ? (
                              carregandoVenda ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  Carregando detalhes da venda...
                                </div>
                              ) : vendaDetalhe ? (
                                <div className="space-y-4">
                                  {/* Informações da Venda */}
                                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                      {vendaDetalhe.clienteNome && (
                                        <span className="flex items-center gap-1">
                                          <span className="text-muted-foreground">Cliente:</span>
                                          <span className="font-medium">{vendaDetalhe.clienteNome}</span>
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        {formatarFormaPagamento(vendaDetalhe.formaPagamento).icon}
                                        <span className="font-medium">{formatarFormaPagamento(vendaDetalhe.formaPagamento).label}</span>
                                      </span>
                                      <Badge variant={vendaDetalhe.status === 'concluida' ? 'default' : 'secondary'} className="text-xs">
                                        {vendaDetalhe.status === 'concluida' ? 'Concluída' : vendaDetalhe.status === 'pendente' ? 'Pendente' : vendaDetalhe.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Itens da Venda */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Itens da Venda</h4>
                                    <div className="rounded-lg border border-border overflow-hidden">
                                      <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                          <tr>
                                            <th className="px-3 py-2 text-left font-medium">Item</th>
                                            <th className="px-3 py-2 text-center font-medium">Qtd</th>
                                            <th className="px-3 py-2 text-right font-medium">Preço Un.</th>
                                            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                          {vendaDetalhe.itens.map((item) => (
                                            <tr key={item.id}>
                                              <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                  {item.tipo === 'produto' ? (
                                                    <Package className="h-3 w-3 text-muted-foreground" />
                                                  ) : (
                                                    <Wrench className="h-3 w-3 text-muted-foreground" />
                                                  )}
                                                  <span>{item.nome}</span>
                                                </div>
                                              </td>
                                              <td className="px-3 py-2 text-center">{item.quantidade}</td>
                                              <td className="px-3 py-2 text-right">R$ {item.precoUnitario.toFixed(2)}</td>
                                              <td className="px-3 py-2 text-right font-medium">R$ {item.subtotal.toFixed(2)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot className="bg-muted/30">
                                          {vendaDetalhe.desconto > 0 && (
                                            <tr>
                                              <td colSpan={3} className="px-3 py-2 text-right text-muted-foreground">Desconto:</td>
                                              <td className="px-3 py-2 text-right text-destructive">- R$ {vendaDetalhe.desconto.toFixed(2)}</td>
                                            </tr>
                                          )}
                                          <tr>
                                            <td colSpan={3} className="px-3 py-2 text-right font-medium">Total:</td>
                                            <td className="px-3 py-2 text-right font-bold text-accent">R$ {vendaDetalhe.total.toFixed(2)}</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Botão Excluir */}
                                  <div className="flex justify-end pt-2">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="gap-2"
                                      onClick={() => {
                                        setVendaParaExcluir({
                                          movimentacaoId: movimentacao.id,
                                          vendaId: movimentacao.vendaId,
                                          valor: movimentacao.valor,
                                        })
                                        setDialogExcluirVenda(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Excluir Venda
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  Não foi possível carregar os detalhes da venda
                                </div>
                              )
                            ) : (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                Esta movimentação não está vinculada a uma venda
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={dialogExcluirVenda} onOpenChange={setDialogExcluirVenda}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Venda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir esta venda? Esta ação irá:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Remover a venda e seus itens do histórico</li>
              <li>Restaurar o estoque dos produtos vendidos</li>
              <li>Remover a movimentação do caixa</li>
              <li>Cancelar serviços vinculados à venda</li>
              <li>Remover parcelas a receber (se houver)</li>
            </ul>
            {vendaParaExcluir && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">
                  Valor da venda: R$ {vendaParaExcluir.valor.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogExcluirVenda(false)} disabled={excluindoVenda}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleExcluirVenda} disabled={excluindoVenda}>
              {excluindoVenda ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
