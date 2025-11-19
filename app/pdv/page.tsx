  const [modalCaixa, setModalCaixa] = useState(false)
  useEffect(() => {
    if (caixaAtual?.status !== "aberto") {
      setModalCaixa(true)
    } else {
      setModalCaixa(false)
    }
  }, [caixaAtual])
"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useProdutos, useServicos, useClientes } from "@/lib/hooks/useLojaData"
import { useStore } from "@/lib/store"
import { ShoppingCart, Wrench, Plus, Trash2, DollarSign, Clock, Calendar, AlertTriangle, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import ThemeToggle from "@/components/theme-toggle"

export default function PDVPage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { produtos } = useProdutos(lojaId)
  const { servicos } = useServicos(lojaId)
  const { clientes } = useClientes(lojaId)

  // Dados do store para estado da venda
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
    adicionarPerda,
  } = useStore()
  const { funcionarios, categoriasPerdas, caixaAtual } = useStore()

  // Buscar loja selecionada do usuário
  useEffect(() => {
    const fetchLojaDoUsuario = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar primeira loja onde é dono ou tem acesso
      const { data: lojas } = await supabase
        .from("lojas")
        .select("id")
        .eq("dono_id", user.id)
        .limit(1)

      if (lojas && lojas.length > 0) {
        setLojaId(lojas[0].id)
      }
    }

    fetchLojaDoUsuario()
  }, [])

  // const [headerVisible, setHeaderVisible] = useState(true)
  // const [headerHoverTimeout, setHeaderHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setHeaderVisible(false)
  //   }, 3000)

  //   return () => clearTimeout(timeout)
  // }, [])

  // const handleHeaderMouseEnter = () => {
  //   if (headerHoverTimeout) {
  //     clearTimeout(headerHoverTimeout)
  //   }
  //   setHeaderVisible(true)
  // }

  // const handleHeaderMouseLeave = () => {
  //   const timeout = setTimeout(() => {
  //     setHeaderVisible(false)
  //   }, 3000)
  //   setHeaderHoverTimeout(timeout)
  // }

  const [produtoSelecionado, setProdutoSelecionado] = useState("")
  const [servicoSelecionado, setServicoSelecionado] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [dialogPagamento, setDialogPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState<
    "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outros"
  >("dinheiro")

  const [vendaAPrazo, setVendaAPrazo] = useState(false)
  const [numeroParcelas, setNumeroParcelas] = useState(1)
  const [dataVencimento, setDataVencimento] = useState("")

  const [openPerda, setOpenPerda] = useState(false)

  const resumo = getResumoVendas()
  const resumoSeguro = {
    totalVendas: resumo?.totalVendas || 0,
    totalServicos: resumo?.totalServicos || 0,
    totalReceita: resumo?.totalReceita || 0,
    mediaTransacao: resumo?.mediaTransacao || 0,
  }
  const subtotal = vendaAtual.itens.reduce((acc, item) => acc + item.subtotal, 0)
  const total = subtotal - vendaAtual.desconto

  const handleAdicionarProduto = () => {
    const produto = produtos.find((p) => p.id === produtoSelecionado)
    if (produto && quantidade > 0) {
      adicionarItem({
        tipo: "produto",
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade,
        subtotal: produto.preco * quantidade,
      })
      setProdutoSelecionado("")
      setQuantidade(1)
    }
  }

  const handleAdicionarServico = () => {
    const servico = servicos.find((s) => s.id === servicoSelecionado)
    if (servico) {
      adicionarItem({
        tipo: "servico",
        id: servico.id,
        nome: servico.nome,
        preco: servico.preco,
        quantidade: 1,
        subtotal: servico.preco,
      })
      setServicoSelecionado("")
    }
  }

  const handleFinalizarVendaPrazo = () => {
    if (vendaAtual.itens.length === 0) return
    if (!vendaAtual.clienteId || vendaAtual.clienteId === "none") {
      alert("Selecione um cliente para venda a prazo!")
      return (
        <div className="flex min-h-screen bg-background relative">
          <Sidebar />
          <main className={`flex-1 lg:ml-64 ${modalCaixa ? 'blur-sm pointer-events-none select-none' : ''}`}>
            {/* ...existing code... */}
          </main>
          {modalCaixa && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-background rounded-xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm w-full">
                <h2 className="text-xl font-bold text-destructive">Caixa fechado</h2>
                <p className="text-sm text-muted-foreground text-center">Abra o caixa para registrar vendas ou serviços.</p>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                  onClick={() => {/* lógica para abrir caixa */}}
                >
                  Abrir Caixa
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    const valorParcela = total / numeroParcelas;
    const now = Date.now();
    const parcelas = Array.from({ length: numeroParcelas }, (_, i) => {
      const dataVenc = new Date(dataVencimento);
      dataVenc.setMonth(dataVenc.getMonth() + i);
      return {
        id: `${now}-${i}`,
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: dataVenc.toISOString(),
        status: "pendente" as const,
      };
    });
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
    };
    adicionarVendaPrazo(vendaPrazo);
    adicionarContaReceber({
      id: `CR${now}`,
      descricao: `Venda a Prazo - ${cliente.nome} (Parcela 1/${numeroParcelas})`,
      valor: valorParcela,
      dataVencimento: parcelas[0].dataVencimento,
      status: "pendente",
      clienteId: cliente.id,
      clienteNome: cliente.nome,
    });
    limparVenda()
    setDialogPagamento(false)
    setVendaAPrazo(false)
    setNumeroParcelas(1)
    setDataVencimento("")
  }

  const handleFinalizarVenda = () => {
    if (vendaAPrazo) {
      handleFinalizarVendaPrazo()
    } else {
      if (vendaAtual.itens.length > 0) {
        finalizarVenda(formaPagamento)
        setDialogPagamento(false)
        setFormaPagamento("dinheiro")
      }
    }
  }

  const handleRegistrarPerda = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const produtoId = formData.get("produto") as string
    const produto = produtos.find((p) => p.id === produtoId)
    const quantidade = Number.parseInt(formData.get("quantidade") as string)
    const funcionarioId = formData.get("funcionario") as string
    const funcionario = funcionarios.find((f) => f.id === funcionarioId)
    const categoriaId = formData.get("categoria") as string
    const categoria = categoriasPerdas.find((c) => c.id === categoriaId)
    if (!produto || !funcionario || !categoria) return
    const now = Date.now();
    const novaPerda = {
      id: `P${now}`,
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade,
      custoUnitario: produto.custoUnitario,
      custoTotal: produto.custoUnitario * quantidade,
      funcionarioId: funcionario.id,
      funcionarioNome: funcionario.nome,
      categoriaId: categoria.id,
      categoria: categoria.nome,
      motivo: categoria.nome,
      data: new Date().toISOString(),
      observacoes: formData.get("observacoes") as string,
    };
    adicionarPerda(novaPerda)
    setOpenPerda(false)
  }

  const [hoje, setHoje] = useState("");
  useEffect(() => {
    setHoje(new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }));
  }, []);

  const hojeFormatada = new Date().toLocaleDateString("pt-BR")

  const dataMinima = new Date().toISOString().split("T")[0]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        <div className="fixed left-0 right-0 top-0 z-40 border-b border-border/40 bg-card/95 backdrop-blur-md lg:left-64">
          <div className="flex items-center justify-end gap-2 px-4 py-2">
            <Dialog open={openPerda} onOpenChange={setOpenPerda}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <AlertTriangle className="h-4 w-4 text-orange-500 lg:mr-2" />
                  <span className="hidden lg:inline">Registrar Perda</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleRegistrarPerda}>
                  <DialogHeader>
                    <DialogTitle>Registrar Perda Rápida</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="produto-perda">Produto *</Label>
                      <Select name="produto" required>
                        <SelectTrigger id="produto-perda">
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos
                            .filter((p) => p.ativo)
                            .map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome} - Custo: R$ {produto.custoUnitario.toFixed(2)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantidade-perda">Quantidade *</Label>
                      <Input id="quantidade-perda" name="quantidade" type="number" min="1" defaultValue="1" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="funcionario-perda">Funcionário Responsável *</Label>
                      <Select name="funcionario" required>
                        <SelectTrigger id="funcionario-perda">
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios
                            .filter((f) => f.ativo)
                            .map((func) => (
                              <SelectItem key={func.id} value={func.id}>
                                {func.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria-perda">Categoria *</Label>
                      <Select name="categoria" required>
                        <SelectTrigger id="categoria-perda">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriasPerdas
                            .filter((c) => c.ativo)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                                  {cat.nome}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes-perda">Observações</Label>
                      <Input id="observacoes-perda" name="observacoes" placeholder="Detalhes adicionais..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                      Confirmar Perda
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {caixaAtual?.status === "aberto" ? (
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Caixa Aberto
              </Button>
            ) : (
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Abrir Caixa
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 pb-[280px] pt-14 lg:flex-row lg:gap-6 lg:p-8 lg:pb-8 lg:pt-16">
          <div className="flex-1 space-y-4 lg:space-y-6">
            <Card className="overflow-hidden border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                  <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                    <Users className="h-4 w-4 lg:h-5 lg:w-5" />
                  </div>
                  Funcionário Responsável <span className="text-destructive">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={vendaAtual.funcionarioId || ""} onValueChange={setFuncionarioVenda} required>
                  <SelectTrigger className={`w-full ${!vendaAtual.funcionarioId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione o funcionário (obrigatório)" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios
                      .filter((f) => f.ativo)
                      .map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome} - {func.cargo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!vendaAtual.funcionarioId && (
                  <p className="mt-2 text-xs text-destructive">Selecione um funcionário antes de finalizar a venda</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                    <div className="rounded-lg bg-accent p-2 text-accent-foreground">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    Nova Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="produto" className="text-xs lg:text-sm">
                      Selecione o produto
                    </Label>
                    <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                      <SelectTrigger id="produto" className="w-full">
                        <SelectValue placeholder="Selecione um produto ou deixe em branco" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {produtos
                          .filter((p) => p.ativo)
                          .map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} - R$ {produto.preco.toFixed(2)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="quantidade" className="text-xs lg:text-sm">
                        Quantidade
                      </Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(Number.parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAdicionarProduto}
                        disabled={!produtoSelecionado}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        size="sm"
                      >
                        <Plus className="mr-1 h-4 w-4 lg:mr-2" />
                        <span className="hidden sm:inline">Adicionar</span>
                        <span className="sm:hidden">+</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                    <div className="rounded-lg bg-muted p-2">
                      <Wrench className="h-4 w-4" />
                    </div>
                    Novo Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="servico" className="text-xs lg:text-sm">
                      Selecione o serviço
                    </Label>
                    <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
                      <SelectTrigger id="servico" className="w-full">
                        <SelectValue placeholder="Selecione um serviço ou deixe em branco" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {servicos
                          .filter((s) => s.ativo)
                          .map((servico) => (
                            <SelectItem key={servico.id} value={servico.id}>
                              {servico.nome} - R$ {servico.preco.toFixed(2)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAdicionarServico}
                    disabled={!servicoSelecionado}
                    className="w-full bg-muted text-muted-foreground hover:bg-muted/80"
                    size="sm"
                  >
                    <Plus className="mr-1 h-4 w-4 lg:mr-2" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm lg:text-base">
                  <span>Cliente {vendaAPrazo && <span className="text-destructive">*</span>}</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="venda-prazo" className="text-xs font-normal text-muted-foreground">
                      Venda a Prazo
                    </Label>
                    <Switch id="venda-prazo" checked={vendaAPrazo} onCheckedChange={setVendaAPrazo} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={vendaAtual.clienteId} onValueChange={setCliente}>
                  <SelectTrigger
                    className={`w-full ${vendaAPrazo && (!vendaAtual.clienteId || vendaAtual.clienteId === "none") ? "border-destructive" : ""}`}
                  >
                    <SelectValue
                      placeholder={
                        vendaAPrazo ? "Selecione um cliente (obrigatório)" : "Selecione um cliente ou deixe em branco"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {!vendaAPrazo && <SelectItem value="none">Sem cliente</SelectItem>}
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.telefone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {vendaAPrazo && (
                  <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Configuração de Pagamento a Prazo</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="data-vencimento" className="text-xs">
                          Data do Primeiro Vencimento *
                        </Label>
                        <Input
                          id="data-vencimento"
                          type="date"
                          min={dataMinima}
                          value={dataVencimento}
                          onChange={(e) => setDataVencimento(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parcelas" className="text-xs">
                          Número de Parcelas
                        </Label>
                        <Input
                          id="parcelas"
                          type="number"
                          min="1"
                          max="12"
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(Number.parseInt(e.target.value) || 1)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {total > 0 && numeroParcelas > 0 && (
                      <div className="rounded bg-background/50 p-2 text-xs">
                        <p className="text-muted-foreground">
                          Valor por parcela:{" "}
                          <span className="font-semibold text-foreground">
                            R$ {(total / numeroParcelas).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm lg:text-base">Adicionar Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                {vendaAtual.itens.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground lg:py-12">
                    <ShoppingCart className="mx-auto mb-4 h-10 w-10 opacity-20 lg:h-12 lg:w-12" />
                    <p className="text-sm">Nenhum item adicionado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendaAtual.itens.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between lg:p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium lg:text-base">{item.nome}</span>
                            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs">
                              {item.tipo === "produto" ? "Produto" : "Serviço"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground lg:text-sm">
                            R$ {item.preco.toFixed(2)} x {item.quantidade} = R$ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => atualizarQuantidade(index, Number.parseInt(e.target.value) || 1)}
                            className="w-16 lg:w-20"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removerItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={`space-y-4 lg:w-96 lg:space-y-6 ${vendaAtual.itens.length > 0 ? "hidden lg:block" : ""}`}>
            <Card className="bg-primary text-primary-foreground overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                  <DollarSign className="h-4 w-4 lg:h-5 lg:w-5" />
                  Resumo do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                <div>
                  <p className="text-xs opacity-90 lg:text-sm">Receita Total</p>
                  <p className="text-2xl font-bold lg:text-3xl">R$ {resumoSeguro.totalReceita.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <p className="text-xs opacity-75">Vendas</p>
                    <p className="text-xl font-semibold lg:text-2xl">{resumoSeguro.totalVendas}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Serviços</p>
                    <p className="text-xl font-semibold lg:text-2xl">{resumoSeguro.totalServicos}</p>
                  </div>
                </div>

                <div className="border-t border-primary-foreground/20 pt-3">
                  <p className="text-xs opacity-75">Média por transação:</p>
                  <p className="text-lg font-semibold lg:text-xl">R$ {resumoSeguro.mediaTransacao.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5" />
                  Últimas Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação hoje</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {vendaAtual.itens.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 max-h-[250px] overflow-y-auto border-t border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md lg:left-64 lg:max-h-none lg:overflow-visible lg:p-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="space-y-2 lg:space-y-1">
                <p className="text-xs text-muted-foreground lg:text-sm">Subtotal: R$ {subtotal.toFixed(2)}</p>
                <div className="flex items-center gap-2 lg:gap-3">
                  <Label htmlFor="desconto" className="shrink-0 text-xs lg:text-sm">
                    Desconto:
                  </Label>
                  <Input
                    id="desconto"
                    type="number"
                    min="0"
                    max={subtotal}
                    value={vendaAtual.desconto}
                    onChange={(e) => setDesconto(Number.parseFloat(e.target.value) || 0)}
                    className="w-24 lg:w-32"
                  />
                </div>
              </div>

              <div className="text-center lg:text-right">
                <p className="text-xs text-muted-foreground lg:text-sm">Total</p>
                <p className="text-2xl font-bold text-foreground lg:text-4xl">R$ {total.toFixed(2)}</p>
              </div>

              <div className="flex gap-2 lg:gap-3">
                <Button variant="outline" size="sm" onClick={limparVenda} className="flex-1 bg-background lg:flex-none">
                  Cancelar
                </Button>

                <Dialog open={dialogPagamento} onOpenChange={setDialogPagamento}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 lg:flex-none"
                      disabled={!vendaAtual.funcionarioId}
                    >
                      Finalizar Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{vendaAPrazo ? "Finalizar Venda a Prazo" : "Finalizar Venda"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {vendaAPrazo ? (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-center gap-2 mb-3 text-primary">
                              <Calendar className="h-5 w-5" />
                              <span className="font-medium">Resumo do Pagamento a Prazo</span>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cliente:</span>
                                <span className="font-medium">
                                  {clientes.find((c) => c.id === vendaAtual.clienteId)?.nome || "Não selecionado"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor Total:</span>
                                <span className="font-medium">R$ {total.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Parcelas:</span>
                                <span className="font-medium">
                                  {numeroParcelas}x de R$ {(total / numeroParcelas).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Primeiro Vencimento:</span>
                                <span className="font-medium">
                                  {dataVencimento
                                    ? new Date(dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")
                                    : "Não definido"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {(!vendaAtual.clienteId || vendaAtual.clienteId === "none" || !dataVencimento) && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                              Por favor, selecione um cliente e defina a data de vencimento antes de finalizar.
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm">Forma de Pagamento</Label>
                            <Tabs value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as any)}>
                              <TabsList className="grid w-full grid-cols-3 gap-1">
                                <TabsTrigger value="dinheiro" className="text-xs lg:text-sm">
                                  Dinheiro
                                </TabsTrigger>
                                <TabsTrigger value="pix" className="text-xs lg:text-sm">
                                  PIX
                                </TabsTrigger>
                                <TabsTrigger value="cartao_credito" className="text-xs lg:text-sm">
                                  Crédito
                                </TabsTrigger>
                              </TabsList>
                              <TabsList className="mt-2 grid w-full grid-cols-2 gap-1">
                                <TabsTrigger value="cartao_debito" className="text-xs lg:text-sm">
                                  Débito
                                </TabsTrigger>
                                <TabsTrigger value="outros" className="text-xs lg:text-sm">
                                  Outros
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>

                          <div className="rounded-lg bg-muted p-4">
                            <div className="flex justify-between text-base font-semibold lg:text-lg">
                              <span>Total a pagar:</span>
                              <span>R$ {total.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                      <Button variant="outline" onClick={() => setDialogPagamento(false)} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleFinalizarVenda}
                        disabled={
                          vendaAPrazo && (!vendaAtual.clienteId || vendaAtual.clienteId === "none" || !dataVencimento)
                        }
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
                      >
                        Confirmar {vendaAPrazo ? "Venda a Prazo" : "Pagamento"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
