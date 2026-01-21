"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useVendasComFiltro, useFuncionarios } from "@/lib/hooks/useLojaData"
import { ProtectedRoute } from "@/components/protected-route"
import { BarChart3, Calendar, DollarSign, TrendingUp, Users, ShoppingCart, Percent } from "lucide-react"

export default function GraficosPage() {
  return (
    <ProtectedRoute>
      <GraficosContent />
    </ProtectedRoute>
  )
}

function GraficosContent() {
    const [lojaId, setLojaId] = useState<string | undefined>()
    const [dataInicio, setDataInicio] = useState<Date>()
    const [dataFim, setDataFim] = useState<Date>()
    const [filtroRapido, setFiltroRapido] = useState<string>("mes")

    const { vendas, loading } = useVendasComFiltro(lojaId, dataInicio, dataFim)
    const { funcionarios } = useFuncionarios(lojaId)

    useEffect(() => {
        const fetchLoja = async () => {
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

        fetchLoja()
    }, [])

    useEffect(() => {
        aplicarFiltroRapido(filtroRapido)
    }, [filtroRapido])

    const aplicarFiltroRapido = (filtro: string) => {
        const hoje = new Date()
        let inicio: Date
        let fim = hoje

        switch (filtro) {
            case "hoje":
                inicio = new Date(hoje.setHours(0, 0, 0, 0))
                fim = new Date(hoje.setHours(23, 59, 59, 999))
                break
            case "semana":
                inicio = new Date(hoje)
                inicio.setDate(hoje.getDate() - 7)
                break
            case "mes":
                inicio = new Date(hoje)
                inicio.setMonth(hoje.getMonth() - 1)
                break
            case "trimestre":
                inicio = new Date(hoje)
                inicio.setMonth(hoje.getMonth() - 3)
                break
            case "ano":
                inicio = new Date(hoje)
                inicio.setFullYear(hoje.getFullYear() - 1)
                break
            default:
                inicio = new Date(hoje)
                inicio.setMonth(hoje.getMonth() - 1)
        }

        setDataInicio(inicio)
        setDataFim(fim)
    }

    // Cálculos de estatísticas
    const vendasConcluidas = vendas.filter((v) => v.status === "concluida")
    const totalVendas = vendasConcluidas.length
    const receitaTotal = vendasConcluidas.reduce((acc, v) => acc + v.total, 0)
    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0

    // Vendas por forma de pagamento
    const vendasPorFormaPagamento = vendasConcluidas.reduce(
        (acc, v) => {
            const forma = v.formaPagamento || "outros"
            acc[forma] = (acc[forma] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    const formasPagamento = Object.entries(vendasPorFormaPagamento).map(([forma, count]) => ({
        forma,
        count,
        percentual: totalVendas > 0 ? (count / totalVendas) * 100 : 0,
        receita: vendasConcluidas.filter((v) => v.formaPagamento === forma).reduce((acc, v) => acc + v.total, 0),
    }))

    // Vendas por vendedor
    const vendasPorVendedor = vendasConcluidas.reduce(
        (acc, v) => {
            const funcId = v.funcionarioId || "desconhecido"
            if (!acc[funcId]) {
                acc[funcId] = { total: 0, receita: 0, quantidade: 0 }
            }
            acc[funcId].total += v.total
            acc[funcId].receita += v.total
            acc[funcId].quantidade += 1
            return acc
        },
        {} as Record<string, { total: number; receita: number; quantidade: number }>
    )

    const vendedoresRanking = Object.entries(vendasPorVendedor)
        .map(([funcId, dados]) => ({
            funcionarioId: funcId,
            funcionarioNome: funcionarios.find((f) => f.id === funcId)?.nome || "Desconhecido",
            totalVendas: dados.quantidade,
            receita: dados.receita,
            ticketMedio: dados.quantidade > 0 ? dados.receita / dados.quantidade : 0,
        }))
        .sort((a, b) => b.receita - a.receita)

    // Vendas por mês
    const vendasPorMes = vendasConcluidas.reduce(
        (acc, v) => {
            const data = new Date(v.dataVenda)
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`
            if (!acc[mesAno]) {
                acc[mesAno] = { quantidade: 0, receita: 0 }
            }
            acc[mesAno].quantidade += 1
            acc[mesAno].receita += v.total
            return acc
        },
        {} as Record<string, { quantidade: number; receita: number }>
    )

    const mesesOrdenados = Object.entries(vendasPorMes)
        .map(([mesAno, dados]) => ({
            mesAno,
            quantidade: dados.quantidade,
            receita: dados.receita,
            ticketMedio: dados.quantidade > 0 ? dados.receita / dados.quantidade : 0,
        }))
        .sort((a, b) => {
            const [mesA, anoA] = a.mesAno.split("/").map(Number)
            const [mesB, anoB] = b.mesAno.split("/").map(Number)
            return anoA === anoB ? mesA - mesB : anoA - anoB
        })

    const melhorMes = mesesOrdenados.reduce((max, m) => (m.receita > max.receita ? m : max), {
        mesAno: "N/A",
        receita: 0,
        quantidade: 0,
        ticketMedio: 0,
    })

    const maiorTicketMedio = mesesOrdenados.reduce((max, m) => (m.ticketMedio > max.ticketMedio ? m : max), {
        mesAno: "N/A",
        receita: 0,
        quantidade: 0,
        ticketMedio: 0,
    })

    const nomeMes = (mesAno: string) => {
        const [mes, ano] = mesAno.split("/")
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        return `${meses[Number.parseInt(mes) - 1]}/${ano}`
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 ml-0 lg:ml-64">
                <PageHeader
                    title="Gráficos e Análises"
                    subtitle="Visualização detalhada de vendas e desempenho"
                    icon={<BarChart3 className="h-5 w-5 lg:h-6 lg:w-6" />}
                />

                <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
                    {/* Filtros */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm lg:text-base">Filtros de Período</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Filtro Rápido</Label>
                                    <Select value={filtroRapido} onValueChange={setFiltroRapido}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hoje">Hoje</SelectItem>
                                            <SelectItem value="semana">Última Semana</SelectItem>
                                            <SelectItem value="mes">Último Mês</SelectItem>
                                            <SelectItem value="trimestre">Último Trimestre</SelectItem>
                                            <SelectItem value="ano">Último Ano</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Data Início</Label>
                                    <Input
                                        type="date"
                                        value={dataInicio?.toISOString().split("T")[0] || ""}
                                        onChange={(e) => setDataInicio(e.target.value ? new Date(e.target.value) : undefined)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Data Fim</Label>
                                    <Input
                                        type="date"
                                        value={dataFim?.toISOString().split("T")[0] || ""}
                                        onChange={(e) => setDataFim(e.target.value ? new Date(e.target.value) : undefined)}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setDataInicio(undefined)
                                            setDataFim(undefined)
                                            setFiltroRapido("mes")
                                        }}
                                    >
                                        Limpar Filtros
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cards de Resumo */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <ShoppingCart className="h-4 w-4" />
                                    Total de Vendas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{totalVendas}</div>
                                <p className="text-xs text-muted-foreground">vendas concluídas</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    Receita Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">R$ {receitaTotal.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">no período selecionado</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Percent className="h-4 w-4" />
                                    Ticket Médio
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">R$ {ticketMedio.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">por venda</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Melhor Mês
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{nomeMes(melhorMes.mesAno)}</div>
                                <p className="text-xs text-muted-foreground">R$ {melhorMes.receita.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráfico de Vendas por Forma de Pagamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm lg:text-base">Vendas por Forma de Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {formasPagamento.map((fp) => (
                                    <div key={fp.forma} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="capitalize font-medium">{fp.forma.replace("_", " ")}</span>
                                            <span className="text-muted-foreground">
                                                {fp.count} vendas ({fp.percentual.toFixed(1)}%) - R$ {fp.receita.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${fp.percentual}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ranking de Vendedores */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                                <Users className="h-4 w-4" />
                                Ranking de Vendedores
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {vendedoresRanking.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum dado disponível</p>
                                ) : (
                                    vendedoresRanking.map((vendedor, index) => (
                                        <div
                                            key={vendedor.funcionarioId}
                                            className="flex items-center justify-between rounded-lg border border-border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                                                    {index + 1}º
                                                </div>
                                                <div>
                                                    <p className="font-medium">{vendedor.funcionarioNome}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {vendedor.totalVendas} vendas • Ticket Médio: R$ {vendedor.ticketMedio.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-primary">R$ {vendedor.receita.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">receita total</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gráfico de Vendas por Mês */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                                <TrendingUp className="h-4 w-4" />
                                Vendas por Mês
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mesesOrdenados.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum dado disponível</p>
                                ) : (
                                    mesesOrdenados.map((mes) => {
                                        const maxReceita = Math.max(...mesesOrdenados.map((m) => m.receita))
                                        const largura = maxReceita > 0 ? (mes.receita / maxReceita) * 100 : 0

                                        return (
                                            <div key={mes.mesAno} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{nomeMes(mes.mesAno)}</span>
                                                    <span className="text-muted-foreground">
                                                        {mes.quantidade} vendas • Ticket Médio: R$ {mes.ticketMedio.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="h-8 w-full overflow-hidden rounded-lg bg-muted">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-primary/70 flex items-center px-3 text-xs font-medium text-primary-foreground transition-all"
                                                        style={{ width: `${largura}%` }}
                                                    >
                                                        {largura > 15 && `R$ ${mes.receita.toFixed(2)}`}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Destaques */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm lg:text-base">Melhor Mês em Receita</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-primary">{nomeMes(melhorMes.mesAno)}</p>
                                    <p className="mt-2 text-2xl font-semibold">R$ {melhorMes.receita.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">{melhorMes.quantidade} vendas realizadas</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm lg:text-base">Maior Ticket Médio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-accent">{nomeMes(maiorTicketMedio.mesAno)}</p>
                                    <p className="mt-2 text-2xl font-semibold">R$ {maiorTicketMedio.ticketMedio.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {maiorTicketMedio.quantidade} vendas • Receita: R$ {maiorTicketMedio.receita.toFixed(2)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
