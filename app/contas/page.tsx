"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useContasPagar, useContasReceber } from "@/lib/hooks/useLojaData"
import { useStore } from "@/lib/store"
import {
  Wallet,
  Plus,
  DollarSign,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Users,
  Tag,
  AlertTriangle,
  PackageX,
} from "lucide-react"
import type { ContaPagar, CategoriaDespesa, Perda, CategoriaPerda } from "@/lib/types"

export default function ContasPage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { contas: contasPagar } = useContasPagar(lojaId)
  const { contas: contasReceber } = useContasReceber(lojaId)

  // Dados do store para estado e ações
  const {
    adicionarContaPagar,
    adicionarCategoriaDespesa,
    adicionarCategoriaPerda,
    adicionarPerda,
    pagarConta,
    pagarParcelaVendaPrazo,
    categoriasDespesas,
    perdas,
    categoriasPerdas,
  } = useStore()

  // Buscar loja selecionada do usuário
  useEffect(() => {
    const fetchLojaDoUsuario = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

  const [openNovaConta, setOpenNovaConta] = useState(false)
  const [openNovaCategoria, setOpenNovaCategoria] = useState(false)
  const [openNovaCategoriaPerda, setOpenNovaCategoriaPerda] = useState(false)
  const [openNovaPerda, setOpenNovaPerda] = useState(false)
  const [busca, setBusca] = useState("")

  // Cálculos
  const totalPagar = contasPagar
    .filter((c) => c.status === "pendente")
    .reduce((acc, c) => acc + c.valor, 0)
  const totalReceberPendente = contasReceber
    .filter((c) => c.status === "pendente")
    .reduce((acc, c) => acc + c.valor, 0)
  const totalPerdas = perdas.reduce((acc, p) => acc + p.custoTotal, 0)

  // Filtros
  const contasPagarFiltradas = contasPagar.filter(
    (c) =>
      c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      c.categoria?.toLowerCase().includes(busca.toLowerCase()),
  )

  const perdasFiltradas = perdas.filter(
    (p) =>
      p.produtoNome.toLowerCase().includes(busca.toLowerCase()) ||
      p.funcionarioNome.toLowerCase().includes(busca.toLowerCase()) ||
      p.motivo.toLowerCase().includes(busca.toLowerCase()),
  )

  const handleNovaConta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const novaConta: ContaPagar = {
      id: String(contasPagar.length + 1),
      descricao: formData.get("descricao") as string,
      valor: Number.parseFloat(formData.get("valor") as string),
      dataVencimento: formData.get("dataVencimento") as string,
      categoriaId: formData.get("categoria") as string,
      categoria: categoriasDespesas.find((c) => c.id === formData.get("categoria"))?.nome || "",
      status: "pendente",
      recorrente: formData.get("recorrente") === "true",
      observacoes: formData.get("observacoes") as string,
    }
    adicionarContaPagar(novaConta)
    setOpenNovaConta(false)
  }

  const handleNovaCategoria = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const novaCategoria: CategoriaDespesa = {
      id: String(categoriasDespesas.length + 1),
      nome: formData.get("nome") as string,
      cor: formData.get("cor") as string,
      ativo: true,
    }

    adicionarCategoriaDespesa(novaCategoria)
    setOpenNovaCategoria(false)
  }

  const handleNovaCategoriaPerda = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const novaCategoria: CategoriaPerda = {
      id: `CP${Date.now()}`,
      nome: formData.get("nome") as string,
      cor: formData.get("cor") as string,
      ativo: true,
    }

    adicionarCategoriaPerda(novaCategoria)
    setOpenNovaCategoriaPerda(false)
  }

  const handleNovaPerda = (e: React.FormEvent<HTMLFormElement>) => {
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

    const novaPerda: Perda = {
      id: `P${Date.now()}`,
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
    }

    adicionarPerda(novaPerda)
    setOpenNovaPerda(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paga":
      case "recebida":
      case "quitada":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Pago</Badge>
      case "pendente":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pendente</Badge>
      case "atrasada":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Atrasado</Badge>
      case "parcial":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Parcial</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Contas"
          subtitle="Gestão de contas a pagar, vendas a prazo e perdas"
          icon={<Wallet className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <div className="flex gap-2">
              <Dialog open={openNovaCategoria} onOpenChange={setOpenNovaCategoria}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden lg:flex bg-transparent">
                    <Tag className="mr-2 h-4 w-4" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleNovaCategoria}>
                    <DialogHeader>
                      <DialogTitle>Nova Categoria de Despesa</DialogTitle>
                      <DialogDescription>Crie uma nova categoria para organizar suas despesas</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da Categoria</Label>
                        <Input id="nome" name="nome" placeholder="Ex: Manutenção" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cor">Cor</Label>
                        <Input id="cor" name="cor" type="color" defaultValue="#3b82f6" required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Criar Categoria</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={openNovaConta} onOpenChange={setOpenNovaConta}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleNovaConta}>
                    <DialogHeader>
                      <DialogTitle>Nova Despesa</DialogTitle>
                      <DialogDescription>Registre uma nova conta a pagar</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input id="descricao" name="descricao" placeholder="Descreva a despesa" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (R$)</Label>
                        <Input id="valor" name="valor" type="number" step="0.01" placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                        <Input id="dataVencimento" name="dataVencimento" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select name="categoria" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriasDespesas
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
                        <Label htmlFor="recorrente">Despesa Recorrente</Label>
                        <Select name="recorrente" defaultValue="false">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Não</SelectItem>
                            <SelectItem value="true">Sim (Mensal)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Input id="observacoes" name="observacoes" placeholder="Observações adicionais" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Criar Despesa</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-red-500" />A Pagar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">R$ {totalPagar.toFixed(2)}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {contasPagar.filter((c) => c.status !== "paga").length} contas pendentes
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4 text-blue-500" />
                  Vendas a Prazo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">R$ {totalVendasPrazo.toFixed(2)}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {vendasPrazo.filter((v) => v.status !== "quitada").length} vendas em aberto
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PackageX className="h-4 w-4 text-orange-500" />
                  Total em Perdas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">R$ {totalPerdas.toFixed(2)}</div>
                <p className="mt-1 text-xs text-muted-foreground">{perdas.length} perdas registradas</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Saldo Líquido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">-R$ {(totalPagar + totalPerdas).toFixed(2)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Despesas + Perdas</p>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar contas ou perdas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pagar" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pagar">A Pagar</TabsTrigger>
              <TabsTrigger value="prazo">Vendas a Prazo</TabsTrigger>
              <TabsTrigger value="perdas">Perdas</TabsTrigger>
            </TabsList>

            <TabsContent value="pagar" className="space-y-4">
              {contasPagarFiltradas.length === 0 ? (
                <Card className="overflow-hidden">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">Nenhuma conta a pagar encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 lg:gap-6">
                  {contasPagarFiltradas.map((conta) => (
                    <Card key={conta.id} className="overflow-hidden">
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground break-words">{conta.descricao}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <div
                                      className="mr-1 h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor: categoriasDespesas.find((c) => c.id === conta.categoriaId)
                                          ?.cor,
                                      }}
                                    />
                                    {conta.categoria}
                                  </Badge>
                                  {conta.recorrente && (
                                    <Badge variant="outline" className="text-xs">
                                      Recorrente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {getStatusBadge(conta.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Venc: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}
                              </div>
                              {conta.dataPagamento && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Pago em: {new Date(conta.dataPagamento).toLocaleDateString("pt-BR")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-500">R$ {conta.valor.toFixed(2)}</p>
                            </div>
                            {conta.status === "pendente" && (
                              <Button
                                size="sm"
                                onClick={() => pagarConta(conta.id)}
                                className="bg-emerald-500 text-white hover:bg-emerald-600"
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Pagar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="prazo" className="space-y-4">
              {vendasPrazo.length === 0 ? (
                <Card className="overflow-hidden">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">Nenhuma venda a prazo encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 lg:gap-6">
                  {vendasPrazo.map((venda) => (
                    <Card key={venda.id} className="overflow-hidden">
                      <CardContent className="p-4 lg:p-6">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-foreground">{venda.clienteNome}</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">Venda #{venda.vendaId}</p>
                                </div>
                                {getStatusBadge(venda.status)}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-2xl font-bold text-foreground">R$ {venda.valorTotal.toFixed(2)}</p>
                              <p className="mt-1 text-sm text-emerald-500">Pago: R$ {venda.valorPago.toFixed(2)}</p>
                              <p className="text-sm text-red-500">Restante: R$ {venda.valorRestante.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Parcelas */}
                          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Parcelas</p>
                            <div className="space-y-2">
                              {venda.parcelas.map((parcela) => (
                                <div
                                  key={parcela.id}
                                  className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">Parcela {parcela.numero}</p>
                                      {getStatusBadge(parcela.status)}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Venc: {new Date(parcela.dataVencimento).toLocaleDateString("pt-BR")}
                                      {parcela.dataPagamento &&
                                        ` • Pago: ${new Date(parcela.dataPagamento).toLocaleDateString("pt-BR")}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-lg font-semibold text-foreground">
                                      R$ {parcela.valor.toFixed(2)}
                                    </p>
                                    {parcela.status === "pendente" && (
                                      <Button
                                        size="sm"
                                        onClick={() => pagarParcelaVendaPrazo(venda.id, parcela.id)}
                                        className="bg-emerald-500 text-white hover:bg-emerald-600"
                                      >
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Receber
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="perdas" className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Dialog open={openNovaCategoriaPerda} onOpenChange={setOpenNovaCategoriaPerda}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-transparent">
                      <Tag className="mr-2 h-4 w-4" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleNovaCategoriaPerda}>
                      <DialogHeader>
                        <DialogTitle>Nova Categoria de Perda</DialogTitle>
                        <DialogDescription>Crie uma nova categoria para classificar perdas</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome-cat-perda">Nome da Categoria</Label>
                          <Input id="nome-cat-perda" name="nome" placeholder="Ex: Quebra no transporte" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cor-cat-perda">Cor</Label>
                          <Input id="cor-cat-perda" name="cor" type="color" defaultValue="#f59e0b" required />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Criar Categoria</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={openNovaPerda} onOpenChange={setOpenNovaPerda}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 text-white hover:bg-orange-600">
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Perda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleNovaPerda}>
                      <DialogHeader>
                        <DialogTitle>Registrar Perda de Produto</DialogTitle>
                        <DialogDescription>
                          Registre perdas de produtos por quebra, erro ou outros motivos
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="produto">Produto Perdido *</Label>
                          <Select name="produto" required>
                            <SelectTrigger>
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
                          <Label htmlFor="quantidade">Quantidade Perdida *</Label>
                          <Input id="quantidade" name="quantidade" type="number" min="1" defaultValue="1" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="funcionario">Funcionário Responsável *</Label>
                          <Select name="funcionario" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o funcionário" />
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
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="categoria">Categoria da Perda *</Label>
                          <Select name="categoria" required>
                            <SelectTrigger>
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
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea
                            id="observacoes"
                            name="observacoes"
                            placeholder="Descreva detalhes sobre a perda..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                          Registrar Perda
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {perdasFiltradas.length === 0 ? (
                <Card className="overflow-hidden">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <PackageX className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">Nenhuma perda registrada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 lg:gap-6">
                  {perdasFiltradas.map((perda) => (
                    <Card key={perda.id} className="overflow-hidden border-orange-500/20">
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-500" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground break-words">{perda.produtoNome}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{perda.motivo}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(perda.data).toLocaleDateString("pt-BR")} às{" "}
                                    {new Date(perda.data).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  <div>Responsável: {perda.funcionarioNome}</div>
                                  <div>Qtd: {perda.quantidade} un.</div>
                                </div>
                                {perda.observacoes && (
                                  <p className="mt-2 text-xs text-muted-foreground italic">{perda.observacoes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Custo Total</p>
                            <p className="text-2xl font-bold text-orange-500">R$ {perda.custoTotal.toFixed(2)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              R$ {perda.custoUnitario.toFixed(2)} cada
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
