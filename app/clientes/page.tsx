"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { Users, Search, Mail, Phone } from "lucide-react"
import { useState } from "react"

export default function ClientesPage() {
  const { clientes } = useStore()
  const [busca, setBusca] = useState("")

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email?.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone?.includes(busca) ||
      c.cpf?.includes(busca),
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Gestão de Clientes"
          subtitle="Cadastro e histórico de clientes"
          icon={<Users className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">Adicionar Cliente</Button>}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Card de Resumo */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{clientes.length}</div>
              <p className="text-sm text-muted-foreground">Clientes cadastrados</p>
            </CardContent>
          </Card>

          {/* Busca */}
          <Card className="overflow-hidden">
            <CardContent className="pt-4 lg:pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Clientes Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientesFiltrados.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/5 lg:flex-row lg:items-center lg:justify-between lg:p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium lg:text-base break-words">{cliente.nome}</h3>
                        </div>
                        <div className="mt-2 space-y-1">
                          {cliente.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground lg:text-sm">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="break-all">{cliente.email}</span>
                            </div>
                          )}
                          {cliente.telefone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground lg:text-sm">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="break-all">{cliente.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 lg:gap-4">
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-muted-foreground lg:text-sm">Cadastro</p>
                          <p className="text-xs font-medium lg:text-sm">
                            {new Date(cliente.dataCadastro).toLocaleDateString("pt-BR")}
                          </p>
                          {cliente.ultimaCompra && (
                            <p className="text-xs text-muted-foreground">
                              Última compra: {new Date(cliente.ultimaCompra).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
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
