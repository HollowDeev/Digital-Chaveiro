"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { FileText, Download, TrendingUp, ShoppingCart, DollarSign, Package, TrendingDown } from "lucide-react"

export default function RelatoriosPage() {
  const { vendas, produtos, clientes, funcionarios, caixaAtual, contasPagar, contasReceber, vendasPrazo } = useStore()

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

  const lucroLiquido = receitaTotal + receitasRecebidas + vendasPrazoRecebidas - despesasPagas

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Relatórios"
          subtitle="Análises e estatísticas do negócio"
          icon={<FileText className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
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
                    <p className="text-xs text-muted-foreground lg:text-sm">
                      R$ {produtoMaisVendido?.preco.toFixed(2)}
                    </p>
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

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 lg:p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground lg:text-sm">A Receber</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-amber-500 lg:text-2xl">
                    R$ {(receitasPendentes + vendasPrazoPendentes).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 lg:p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-muted-foreground lg:text-sm">A Pagar</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-orange-500 lg:text-2xl">
                    R$ {despesasPendentes.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 lg:p-4">
                  <p className="text-xs text-muted-foreground lg:text-sm">Vendas a Prazo</p>
                  <p className="mt-1 text-xl font-bold text-foreground lg:text-2xl">
                    {vendasPrazo.filter((v) => v.status !== "quitada").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Período */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                <div className="rounded-lg border border-border p-3 lg:p-4">
                  <p className="text-xs text-muted-foreground lg:text-sm">Ticket Médio</p>
                  <p className="mt-1 text-xl font-bold text-foreground lg:text-2xl">
                    R$ {(totalVendas > 0 ? receitaTotal / totalVendas : 0).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 lg:p-4">
                  <p className="text-xs text-muted-foreground lg:text-sm">Produtos Vendidos</p>
                  <p className="mt-1 text-xl font-bold text-foreground lg:text-2xl">
                    {vendas.reduce(
                      (acc, v) =>
                        acc + v.itens.filter((i) => i.tipo === "produto").reduce((a, i) => a + i.quantidade, 0),
                      0,
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 lg:p-4">
                  <p className="text-xs text-muted-foreground lg:text-sm">Serviços Prestados</p>
                  <p className="mt-1 text-xl font-bold text-foreground lg:text-2xl">
                    {vendas.reduce((acc, v) => acc + v.itens.filter((i) => i.tipo === "servico").length, 0)}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 lg:p-4">
                  <p className="text-xs text-muted-foreground lg:text-sm">Descontos Concedidos</p>
                  <p className="mt-1 text-xl font-bold text-foreground lg:text-2xl">
                    R$ {vendas.reduce((acc, v) => acc + v.desconto, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
