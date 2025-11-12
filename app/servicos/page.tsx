"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { Wrench, Search, Clock } from "lucide-react"
import { useState } from "react"

export default function ServicosPage() {
  const { servicos } = useStore()
  const [busca, setBusca] = useState("")

  const servicosFiltrados = servicos.filter(
    (s) =>
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      s.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      s.categoria.toLowerCase().includes(busca.toLowerCase()),
  )

  const totalServicos = servicos.filter((s) => s.ativo).length
  const valorMedioServico = servicos.reduce((acc, s) => acc + s.preco, 0) / servicos.length

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Gestão de Serviços"
          subtitle="Controle de serviços oferecidos"
          icon={<Wrench className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">Adicionar Serviço</Button>}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalServicos}</div>
                <p className="text-sm text-muted-foreground">Serviços ativos</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">R$ {valorMedioServico.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Preço médio dos serviços</p>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <Card className="overflow-hidden">
            <CardContent className="pt-4 lg:pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Serviços */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Serviços Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {servicosFiltrados.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum serviço encontrado</p>
                ) : (
                  servicosFiltrados.map((servico) => (
                    <div
                      key={servico.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/5 lg:flex-row lg:items-center lg:justify-between lg:p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium lg:text-base break-words">{servico.nome}</h3>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {servico.categoria}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground lg:gap-4 lg:text-sm">
                          <span className="break-all">Código: {servico.codigo}</span>
                          {servico.duracao && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                {servico.duracao} min
                              </span>
                            </>
                          )}
                        </div>
                        {servico.descricao && (
                          <p className="mt-1 text-xs text-muted-foreground lg:text-sm break-words">
                            {servico.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 lg:gap-6">
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-muted-foreground lg:text-sm">Preço</p>
                          <p className="text-xl font-bold text-foreground lg:text-2xl">R$ {servico.preco.toFixed(2)}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
