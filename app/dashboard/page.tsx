"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLoja } from "@/lib/contexts/loja-context"
import { useData } from "@/lib/contexts/data-context"
import { ProtectedRoute } from "@/components/protected-route"
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingDown,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { lojaAtual } = useLoja()
  const lojaId = lojaAtual?.id
  const {
    produtos,
    vendas,
    contasPagar,
    contasReceber,
    caixaAberto: caixaAtual,
    clientes,
    loading: dataLoading
  } = useData()

  // Calcular métricas
  const hoje = new Date().toISOString().split("T")[0]
  const vendasHoje = vendas.filter((v) => v.data.startsWith(hoje) && v.status === "concluida")
  const receitaHoje = vendasHoje.reduce((acc, v) => acc + v.total, 0)
  const totalVendas = vendasHoje.length

  const produtosBaixoEstoque = produtos.filter((p) => p.estoque < 20 && p.ativo)
  const valorEstoque = produtos.reduce((acc, p) => acc + p.custoUnitario * p.estoque, 0)

  // Saldo de caixa será buscado da tabela movimentacoes_caixa quando implementado
  const saldoCaixa = receitaHoje

  const metaMensal = 15000
  const progressoMeta = (receitaHoje / metaMensal) * 100

  const hojeDate = new Date()
  const semanaDepois = new Date(hojeDate)
  semanaDepois.setDate(hojeDate.getDate() + 7)

  const contasPagarSemana = contasPagar.filter((c) => {
    const venc = new Date(c.dataVencimento)
    return c.status === "pendente" && venc >= hojeDate && venc <= semanaDepois
  })

  const contasReceberSemana = contasReceber.filter((c) => {
    const venc = new Date(c.dataVencimento)
    return c.status === "pendente" && venc >= hojeDate && venc <= semanaDepois
  })

  const totalPagarSemana = contasPagarSemana.reduce((acc, c) => acc + c.valor, 0)
  const totalReceberSemana = contasReceberSemana.reduce((acc, c) => acc + c.valor, 0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        <PageHeader
          title="Dashboard"
          subtitle="Visão geral do seu negócio"
          icon={<LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Métricas Principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground lg:text-sm">Receita Hoje</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground lg:text-2xl">R$ {receitaHoje.toFixed(2)}</div>
                <div className="mt-1 flex items-center text-xs text-accent">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12.5% vs ontem
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground lg:text-sm">Vendas Hoje</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground lg:text-2xl">{totalVendas}</div>
                <div className="mt-1 flex items-center text-xs text-accent">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +8 novas vendas
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground lg:text-sm">Saldo em Caixa</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground lg:text-2xl">R$ {saldoCaixa.toFixed(2)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Caixa {caixaAtual?.status === "aberto" ? "aberto" : "fechado"}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground lg:text-sm">Clientes Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground lg:text-2xl">{clientes.length}</div>
                <div className="mt-1 text-xs text-muted-foreground">Base total de clientes</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            {/* Meta Mensal */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm lg:text-base">Meta Mensal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{progressoMeta.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressoMeta} className="h-3" />
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground lg:text-sm">Atual</p>
                    <p className="text-lg font-bold text-foreground lg:text-xl">R$ {receitaHoje.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground lg:text-sm">Meta</p>
                    <p className="text-lg font-bold text-foreground lg:text-xl">R$ {metaMensal.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valor do Estoque */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm lg:text-base">Valor do Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Package className="h-8 w-8 text-primary" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground lg:text-sm">Valor Total</p>
                      <p className="text-xl font-bold text-foreground lg:text-2xl">R$ {valorEstoque.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs lg:text-sm">
                  <span className="text-muted-foreground">Total de Produtos</span>
                  <span className="font-medium">{produtos.length} itens</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contas da Semana */}
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                  <TrendingDown className="h-4 w-4 text-red-500 lg:h-5 lg:w-5" />
                  Contas a Pagar (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contasPagarSemana.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground lg:text-sm">
                    Nenhuma conta a pagar nos próximos 7 dias
                  </p>
                ) : (
                  <>
                    <div className="mb-4 text-center">
                      <p className="text-3xl font-bold text-red-500">R$ {totalPagarSemana.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{contasPagarSemana.length} contas pendentes</p>
                    </div>
                    <div className="space-y-2">
                      {contasPagarSemana.slice(0, 3).map((conta) => (
                        <div
                          key={conta.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium break-words">{conta.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              Venc: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="ml-2 text-right">
                            <p className="text-sm font-medium text-red-500">R$ {conta.valor.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                  <TrendingUp className="h-4 w-4 text-emerald-500 lg:h-5 lg:w-5" />
                  Contas a Receber (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contasReceberSemana.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground lg:text-sm">
                    Nenhuma conta a receber nos próximos 7 dias
                  </p>
                ) : (
                  <>
                    <div className="mb-4 text-center">
                      <p className="text-3xl font-bold text-emerald-500">R$ {totalReceberSemana.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{contasReceberSemana.length} contas pendentes</p>
                    </div>
                    <div className="space-y-2">
                      {contasReceberSemana.slice(0, 3).map((conta) => (
                        <div
                          key={conta.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium break-words">{conta.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              Venc: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="ml-2 text-right">
                            <p className="text-sm font-medium text-emerald-500">R$ {conta.valor.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alertas e Produtos em Baixo Estoque */}
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                  <AlertTriangle className="h-4 w-4 text-destructive lg:h-5 lg:w-5" />
                  Produtos em Baixo Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                {produtosBaixoEstoque.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground lg:text-sm">
                    Todos os produtos estão com estoque adequado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {produtosBaixoEstoque.slice(0, 5).map((produto) => (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">{produto.codigo}</p>
                        </div>
                        <div className="ml-2 text-right">
                          <p className="text-sm font-medium text-destructive">{produto.estoque} unidades</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Últimas Vendas */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm lg:text-base">Últimas Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                {vendasHoje.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground lg:text-sm">
                    Nenhuma venda registrada hoje
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vendasHoje
                      .slice(-5)
                      .reverse()
                      .map((venda) => (
                        <div
                          key={venda.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {venda.clienteNome || "Cliente não informado"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(venda.data).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="ml-2 text-right">
                            <p className="text-sm font-medium text-accent">R$ {venda.total.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {venda.formaPagamento.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
