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
  FileText,
  Download,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  CheckCircle2,
  Users,
  Tag,
  AlertTriangle,
  PackageX,
} from "lucide-react"
import type { ContaPagar, CategoriaDespesa, Perda, CategoriaPerda } from "@/lib/types"

export default function RelatoriosPage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { contas: contasPagar } = useContasPagar(lojaId)
  const { contas: contasReceber } = useContasReceber(lojaId)

  const {
    vendas,
    produtos,
    clientes,
    funcionarios,
    caixaAtual,
    adicionarContaPagar,
    adicionarCategoriaDespesa,
    adicionarCategoriaPerda,
    adicionarPerda,
    pagarConta,
    pagarParcelaVendaPrazo,
    categoriasDespesas,
    perdas,
    categoriasPerdas,
    vendasPrazo,
  } = useStore()

  // Buscar loja selecionada do usuário
  useEffect(() => {
    const fetchLojaDoUsuario = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: lojas } = await supabase.from("lojas").select("id").eq("dono_id", user.id).limit(1)

      if (lojas && lojas.length > 0) {
        setLojaId(lojas[0].id)
      }
    }

    fetchLojaDoUsuario()
  }, [])

  // Estados para contas
  const [openNovaConta, setOpenNovaConta] = useState(false)
  const [openNovaCategoria, setOpenNovaCategoria] = useState(false)
  const [openNovaCategoriaPerda, setOpenNovaCategoriaPerda] = useState(false)
  const [openNovaPerda, setOpenNovaPerda] = useState(false)
  const [busca, setBusca] = useState("")

  // Estatísticas gerais
  const totalVendas = vendas.filter((v) => v.status === "concluida").length
  const receitaTotal = vendas.filter((v) => v.status === "concluida").reduce((acc, v) => acc + v.total, 0)

  const produtoMaisVendido = produtos.reduce((prev, current) => {
    const vendasProduto = vendas.filter((v) => v.itens.some((i) => i.id === current.id && i.tipo === "produto")).length
    const vendasPrev = vendas.filter((v) => v.itens.some((i) => i.id === prev.id && i.tipo === "produto")).length
    return vendasProduto > vendasPrev ? current : prev
  }, produtos[0])

  const funcionarioDestaque = funcionarios.reduce((prev, current) => {
    const vendasFunc = vendas.filter((v) => v.funcionarioId === current.id).length
    const vendasPrev = vendas.filter((v) => v.funcionarioId === prev.id).length
    return vendasFunc > vendasPrev ? current : prev
  }, funcionarios[0])

  const formasPagamento = {
    dinheiro: vendas.filter((v) => v.formaPagamento === "dinheiro" && v.status === "concluida").length,
    pix: vendas.filter((v) => v.formaPagamento === "pix" && v.status === "concluida").length,
    cartao_credito: vendas.filter((v) => v.formaPagamento === "cartao_credito" && v.status === "concluida").length,
    cartao_debito: vendas.filter((v) => v.formaPagamento === "cartao_debito" && v.status === "concluida").length,
    outros: vendas.filter((v) => v.formaPagamento === "outros" && v.status === "concluida").length,
  }

  const despesasPagas = contasPagar.filter((c) => c.status === "paga").reduce((acc, c) => acc + c.valor, 0)
  const despesasPendentes = contasPagar.filter((c) => c.status !== "paga").reduce((acc, c) => acc + c.valor, 0)
  const receitasRecebidas = contasReceber.filter((c) => c.status === "recebida").reduce((acc, c) => acc + c.valor, 0)
  const receitasPendentes = contasReceber.filter((c) => c.status !== "recebida").reduce((acc, c) => acc + c.valor, 0)
  const vendasPrazoRecebidas = vendasPrazo.reduce((acc, v) => acc + v.valorPago, 0)
  const vendasPrazoPendentes = vendasPrazo.reduce((acc, v) => acc + v.valorRestante, 0)

  const totalPagar = contasPagar.filter((c) => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0)
  const totalReceberPendente = contasReceber.filter((c) => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0)
  const totalPerdas = perdas.reduce((acc, p) => acc + p.custoTotal, 0)

  const lucroLiquido = receitaTotal + receitasRecebidas + vendasPrazoRecebidas - despesasPagas

  // Filtros para contas
  const contasPagarFiltradas = contasPagar.filter(
    (c) => c.descricao.toLowerCase().includes(busca.toLowerCase()) || c.categoria?.toLowerCase().includes(busca.toLowerCase())
  )

  const contasReceberFiltradas = contasReceber.filter(
    (c) => c.descricao.toLowerCase().includes(busca.toLowerCase()) || c.origem?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Relatórios e Financeiro"
          subtitle="Análises, estatísticas e gestão financeira"
          icon={<FileText className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>

            {/* Tab Dashboard */}
            <TabsContent value="dashboard" className="space-y-4 lg:space-y-6 mt-4">
              {/* Métricas Principais */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <ShoppingCart className="h-4 w-4" />
                      Total de Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{totalVendas}</div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Receita Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">R$ {receitaTotal.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Produtos Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{produtos.filter((p) => p.ativo).length}</div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{clientes.length}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Formas de Pagamento */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Formas de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(formasPagamento).map(([forma, count]) => {
                      const percentual = totalVendas > 0 ? (count / totalVendas) * 100 : 0
                      return (
                        <div key={forma} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{forma.replace("_", " ")}</span>
                            <span className="text-muted-foreground">
                              {count} vendas ({percentual.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Destaques */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm lg:text-base">Destaques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 lg:space-y-6">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground lg:text-sm">Produto Mais Vendido</p>
                      <div className="mt-2 rounded-lg bg-accent/10 p-3">
                        <p className="text-sm font-medium text-foreground lg:text-base break-words">
                          {produtoMaisVendido?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground lg:text-sm">R$ {produtoMaisVendido?.preco.toFixed(2)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground lg:text-sm">Funcionário Destaque</p>
                      <div className="mt-2 rounded-lg bg-primary/10 p-3">
                        <p className="text-sm font-medium text-foreground lg:text-base break-words">
                          {funcionarioDestaque?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground lg:text-sm">
                          {vendas.filter((v) => v.funcionarioId === funcionarioDestaque?.id).length} vendas realizadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo Financeiro */}
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm lg:text-base">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 lg:p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs text-muted-foreground lg:text-sm">Receitas Recebidas</p>
                      </div>
                      <p className="mt-1 text-xl font-bold text-emerald-500 lg:text-2xl">
                        R$ {(receitaTotal + receitasRecebidas + vendasPrazoRecebidas).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 lg:p-4">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-muted-foreground lg:text-sm">Despesas Pagas</p>
                      </div>
                      <p className="mt-1 text-xl font-bold text-red-500 lg:text-2xl">R$ {despesasPagas.toFixed(2)}</p>
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 lg:p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground lg:text-sm">Lucro Líquido</p>
                      </div>
                      <p className="mt-1 text-xl font-bold text-primary lg:text-2xl">R$ {lucroLiquido.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Contas Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">A Pagar</p>
                        <p className="text-xl font-bold text-red-500">R$ {(despesasPendentes + vendasPrazoPendentes).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">A Receber</p>
                        <p className="text-xl font-bold text-emerald-500">R$ {(receitasPendentes + vendasPrazoPendentes).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <PackageX className="h-4 w-4" />
                      Perdas Registradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-destructive">R$ {totalPerdas.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{perdas.length} perdas registradas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Financeiro (contas) */}
            <TabsContent value="financeiro" className="space-y-4 lg:space-y-6 mt-4">
              {/* Cards de Resumo Financeiro */}
              <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
                <Card className="overflow-hidden border-red-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Total a Pagar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">R$ {totalPagar.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">{contasPagar.filter((c) => c.status === "pendente").length} pendentes</p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-emerald-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Total a Receber
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-500">R$ {totalReceberPendente.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">
                      {contasReceber.filter((c) => c.status === "pendente").length} pendentes
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-destructive/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <PackageX className="h-4 w-4 text-destructive" />
                      Perdas Totais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-destructive">R$ {totalPerdas.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">{perdas.length} perdas registradas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Busca e Sub-tabs */}
              <Card className="overflow-hidden">
                <CardContent className="pt-4 lg:pt-6">
                  <div className="relative">
                    <Input
                      placeholder="Buscar contas por descrição ou categoria..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-4"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sub-tabs para Contas */}
              <Tabs defaultValue="pagar" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
                  <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
                  <TabsTrigger value="perdas">Perdas</TabsTrigger>
                </TabsList>

                {/* Contas a Pagar */}
                <TabsContent value="pagar" className="space-y-4 mt-4">
                  <div className="flex justify-end gap-2">
                    <Dialog open={openNovaCategoria} onOpenChange={setOpenNovaCategoria}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Tag className="mr-2 h-4 w-4" />
                          Nova Categoria
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Categoria de Despesa</DialogTitle>
                          <DialogDescription>Crie uma categoria para organizar suas contas a pagar</DialogDescription>
                        </DialogHeader>
                        {/* Form para nova categoria */}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openNovaConta} onOpenChange={setOpenNovaConta}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Nova Conta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Conta a Pagar</DialogTitle>
                          <DialogDescription>Registre uma nova despesa ou conta a pagar</DialogDescription>
                        </DialogHeader>
                        {/* Form para nova conta */}
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {contasPagarFiltradas.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma conta a pagar encontrada</p>
                        ) : (
                          contasPagarFiltradas.map((conta) => (
                            <div key={conta.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium">{conta.descricao}</h4>
                                  {conta.categoria && (
                                    <Badge variant="outline" className="text-xs">
                                      {conta.categoria}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Vencimento: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}</span>
                                  {conta.status !== "paga" && (
                                    <Badge variant={conta.status === "atrasada" ? "destructive" : "secondary"} className="text-xs">
                                      {conta.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-red-500">R$ {conta.valor.toFixed(2)}</span>
                                {conta.status !== "paga" && (
                                  <Button size="sm" variant="outline" onClick={() => pagarConta(conta.id)}>
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Pagar
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contas a Receber */}
                <TabsContent value="receber" className="space-y-4 mt-4">
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {contasReceberFiltradas.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma conta a receber encontrada</p>
                        ) : (
                          contasReceberFiltradas.map((conta) => (
                            <div key={conta.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium">{conta.descricao}</h4>
                                  {conta.origem && (
                                    <Badge variant="outline" className="text-xs">
                                      {conta.origem}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Vencimento: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}</span>
                                  {conta.status !== "recebida" && (
                                    <Badge variant={conta.status === "atrasada" ? "destructive" : "secondary"} className="text-xs">
                                      {conta.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-emerald-500">R$ {conta.valor.toFixed(2)}</span>
                                {conta.status !== "recebida" && (
                                  <Button size="sm" variant="outline">
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Receber
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Perdas */}
                <TabsContent value="perdas" className="space-y-4 mt-4">
                  <div className="flex justify-end gap-2">
                    <Dialog open={openNovaCategoriaPerda} onOpenChange={setOpenNovaCategoriaPerda}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Tag className="mr-2 h-4 w-4" />
                          Nova Categoria
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Categoria de Perda</DialogTitle>
                        </DialogHeader>
                        {/* Form */}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openNovaPerda} onOpenChange={setOpenNovaPerda}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Perda
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Perda</DialogTitle>
                        </DialogHeader>
                        {/* Form */}
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {perdas.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma perda registrada</p>
                        ) : (
                          perdas.map((perda) => (
                            <div key={perda.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium">{perda.produtoNome}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {perda.categoria}
                                  </Badge>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {perda.quantidade} unidades • {new Date(perda.data).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                              <span className="text-lg font-bold text-destructive">R$ {perda.custoTotal.toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
