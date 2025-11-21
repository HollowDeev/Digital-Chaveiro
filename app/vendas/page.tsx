"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useVendas } from "@/lib/hooks/useLojaData"
import { ShoppingCart, Search, Calendar } from "lucide-react"
import { useStore } from "@/lib/store"

export default function VendasPage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { vendas } = useVendas(lojaId)
  const [busca, setBusca] = useState("")
  const { caixaAtual } = useStore()
  const [modalCaixa, setModalCaixa] = useState(false)

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

  useEffect(() => {
    if (caixaAtual?.status !== "aberto") {
      setModalCaixa(true)
    } else {
      setModalCaixa(false)
    }
  }, [caixaAtual])

  const vendasFiltradas = vendas.filter(
    (v) =>
      v.id.includes(busca) ||
      v.clienteId?.includes(busca) ||
      v.funcionarioId?.includes(busca),
  )

  const totalVendas = vendas.filter((v) => v.status === "concluida").length
  const receitaTotal = vendas.filter((v) => v.status === "concluida").reduce((acc, v) => acc + v.total, 0)
  const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0

  return (
    <div className="flex min-h-screen bg-background relative">
      <Sidebar />
      <main className={`flex-1 ml-0 lg:ml-64 ${modalCaixa ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <PageHeader
          title="Histórico de Vendas"
          subtitle="Todas as transações realizadas"
          icon={<ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground lg:text-3xl">{totalVendas}</div>
                <p className="text-xs text-muted-foreground lg:text-sm">Vendas concluídas</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground lg:text-3xl">R$ {receitaTotal.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground lg:text-sm">Total faturado</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground lg:text-3xl">R$ {ticketMedio.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground lg:text-sm">Valor médio por venda</p>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <Card className="overflow-hidden">
            <CardContent className="pt-4 lg:pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente ou funcionário..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Vendas */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Todas as Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendasFiltradas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma venda encontrada</p>
                ) : (
                  vendasFiltradas
                    .slice()
                    .reverse()
                    .map((venda) => (
                      <div
                        key={venda.id}
                        className="rounded-lg border border-border p-3 transition-colors hover:bg-accent/5 lg:p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium lg:text-base">Venda #{venda.id}</h3>
                              <Badge
                                variant={venda.status === "concluida" ? "default" : "destructive"}
                                className={venda.status === "concluida" ? "bg-accent text-accent-foreground" : ""}
                              >
                                {venda.status === "concluida" ? "Concluída" : "Cancelada"}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                {venda.formaPagamento.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="mt-2 space-y-1 text-xs text-muted-foreground lg:text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(venda.data).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="break-words">
                                <span className="font-medium">Cliente:</span> {venda.clienteNome || "Não informado"}
                              </div>
                              <div className="break-words">
                                <span className="font-medium">Atendente:</span> {venda.funcionarioNome}
                              </div>
                            </div>

                            <div className="mt-3 space-y-1 rounded-lg bg-muted/50 p-2 lg:p-3">
                              <p className="text-xs font-medium text-muted-foreground">Itens da venda:</p>
                              {venda.itens.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-wrap items-center justify-between gap-2 text-xs lg:text-sm"
                                >
                                  <span className="min-w-0 flex-1 break-words">
                                    {item.nome} x{item.quantidade}
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {item.tipo}
                                    </Badge>
                                  </span>
                                  <span className="font-medium flex-shrink-0">R$ {item.subtotal.toFixed(2)}</span>
                                </div>
                              ))}
                              {venda.desconto > 0 && (
                                <div className="flex justify-between border-t border-border pt-1 text-xs text-destructive lg:text-sm">
                                  <span>Desconto</span>
                                  <span>- R$ {venda.desconto.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between lg:ml-6 lg:flex-col lg:items-end lg:justify-start">
                            <div className="text-left lg:text-right">
                              <p className="text-xs text-muted-foreground lg:text-sm">Total</p>
                              <p className="text-xl font-bold text-foreground lg:text-3xl">
                                R$ {venda.total.toFixed(2)}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-transparent lg:mt-3">
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {modalCaixa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm w-full">
            <h2 className="text-xl font-bold text-destructive">Caixa fechado</h2>
            <p className="text-sm text-muted-foreground text-center">Abra o caixa para registrar vendas ou serviços.</p>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
              onClick={() => {/* lógica para abrir caixa */ }}
            >
              Abrir Caixa
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
