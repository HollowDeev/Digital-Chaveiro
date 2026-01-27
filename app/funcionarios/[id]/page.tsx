"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFuncionarios, useHistoricoFuncionario } from "@/lib/hooks/useLojaData"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  ShoppingCart,
  PackageX,
  TrendingUp,
  ArrowLeft,
} from "lucide-react"

export default function FuncionarioPerfilPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [lojaId, setLojaId] = useState<string | undefined>()

  // Buscar loja
  useEffect(() => {
    const fetchLoja = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Primeiro verificar se é dono
      const { data: lojaData } = await supabase
        .from("lojas")
        .select("id")
        .eq("dono_id", user.id)
        .maybeSingle()

      if (lojaData) {
        setLojaId(lojaData.id)
        return
      }

      // Se não é dono, buscar em lojas_usuarios
      const { data } = await supabase
        .from("lojas_usuarios")
        .select("loja_id")
        .eq("usuario_id", user.id)
        .maybeSingle()

      if (data) {
        setLojaId(data.loja_id)
      }
    }
    fetchLoja()
  }, [])

  const { funcionarios } = useFuncionarios(lojaId)
  const { historico, loading: historicoLoading } = useHistoricoFuncionario(params.id, lojaId)

  const funcionario = funcionarios.find((f) => f.id === params.id)

  if (!funcionario) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64">
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Funcionário não encontrado</p>
          </div>
        </main>
      </div>
    )
  }

  if (historicoLoading || !historico) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64">
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title={funcionario.nome}
          subtitle="Perfil e Histórico do Funcionário"
          icon={<User className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Informações do Funcionário */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Card className="overflow-hidden">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium break-all">{funcionario.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <Phone className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">{funcionario.telefone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="text-sm font-medium">{funcionario.cargo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-3">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Admissão</p>
                    <p className="text-sm font-medium">
                      {new Date(funcionario.dataAdmissao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />
                  Total de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{historico.totalVendas}</div>
                <p className="mt-1 text-xs text-muted-foreground">vendas realizadas</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">R$ {historico.valorTotalVendas.toFixed(2)}</div>
                <p className="mt-1 text-xs text-muted-foreground">em vendas</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PackageX className="h-4 w-4 text-orange-500" />
                  Total de Perdas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{historico.totalPerdas}</div>
                <p className="mt-1 text-xs text-muted-foreground">perdas registradas</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  Custo de Perdas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">R$ {historico.custoTotalPerdas.toFixed(2)}</div>
                <p className="mt-1 text-xs text-muted-foreground">em perdas</p>
              </CardContent>
            </Card>
          </div>

          {/* Histórico por Período */}
          <Tabs defaultValue="semanal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
            </TabsList>

            <TabsContent value="semanal" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Vendas Semanais */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Vendas por Semana</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.keys(historico.vendasPorSemana).length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">Nenhuma venda registrada</p>
                    ) : (
                      Object.entries(historico.vendasPorSemana).map(([semana, vendas]) => {
                        const totalSemana = vendas.reduce((acc, v) => acc + v.total, 0)
                        return (
                          <div
                            key={semana}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">{semana}</p>
                              <p className="text-xs text-muted-foreground">{vendas.length} vendas</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-500">R$ {totalSemana.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Perdas Semanais */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Perdas por Semana</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.keys(historico.perdasPorSemana).length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">Nenhuma perda registrada</p>
                    ) : (
                      Object.entries(historico.perdasPorSemana).map(([semana, perdas]) => {
                        const custoSemana = perdas.reduce((acc, p) => acc + p.custoTotal, 0)
                        return (
                          <div
                            key={semana}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">{semana}</p>
                              <p className="text-xs text-muted-foreground">{perdas.length} perdas</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-500">R$ {custoSemana.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mensal" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Vendas Mensais */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Vendas por Mês</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.keys(historico.vendasPorMes).length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">Nenhuma venda registrada</p>
                    ) : (
                      Object.entries(historico.vendasPorMes).map(([mes, vendas]) => {
                        const totalMes = vendas.reduce((acc, v) => acc + v.total, 0)
                        return (
                          <div
                            key={mes}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium capitalize">{mes}</p>
                              <p className="text-xs text-muted-foreground">{vendas.length} vendas</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-500">R$ {totalMes.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Perdas Mensais */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Perdas por Mês</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.keys(historico.perdasPorMes).length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">Nenhuma perda registrada</p>
                    ) : (
                      Object.entries(historico.perdasPorMes).map(([mes, perdas]) => {
                        const custoMes = perdas.reduce((acc, p) => acc + p.custoTotal, 0)
                        return (
                          <div
                            key={mes}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium capitalize">{mes}</p>
                              <p className="text-xs text-muted-foreground">{perdas.length} perdas</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-500">R$ {custoMes.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
