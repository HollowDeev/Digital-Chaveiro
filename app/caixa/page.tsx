"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"

export default function CaixaPage() {
  const { caixaAtual, funcionarios, abrirCaixa, fecharCaixa } = useStore()
  const [dialogAbrir, setDialogAbrir] = useState(false)
  const [dialogFechar, setDialogFechar] = useState(false)
  const [funcionarioId, setFuncionarioId] = useState("")
  const [valorAbertura, setValorAbertura] = useState(0)

  const handleAbrirCaixa = () => {
    if (!funcionarioId) {
      alert("Selecione um funcionário")
      return
    }
    abrirCaixa(funcionarioId, valorAbertura)
    setDialogAbrir(false)
    setFuncionarioId("")
    setValorAbertura(0)
  }

  const handleFecharCaixa = () => {
    if (!funcionarioId) {
      alert("Selecione um funcionário")
      return
    }
    fecharCaixa(funcionarioId)
    setDialogFechar(false)
    setFuncionarioId("")
  }

  const saldoCaixa =
    caixaAtual?.movimentacoes.reduce((acc, m) => {
      return acc + (m.tipo === "entrada" ? m.valor : -m.valor)
    }, 0) || 0

  const entradasHoje =
    caixaAtual?.movimentacoes.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.valor, 0) || 0

  const saidasHoje =
    caixaAtual?.movimentacoes.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.valor, 0) || 0

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Gestão de Caixa"
          subtitle="Controle de movimentações financeiras"
          icon={<Wallet className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            caixaAtual?.status === "aberto" ? (
              <Dialog open={dialogFechar} onOpenChange={setDialogFechar}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Fechar Caixa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fechar Caixa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Funcionário Responsável *</Label>
                      <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter(f => f.ativo).map((func) => (
                            <SelectItem key={func.id} value={func.id}>
                              {func.nome} - {func.cargo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Saldo Final do Caixa</p>
                      <p className="text-2xl font-bold">R$ {((caixaAtual?.valorAbertura || 0) + saldoCaixa).toFixed(2)}</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogFechar(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleFecharCaixa}>
                      Confirmar Fechamento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={dialogAbrir} onOpenChange={setDialogAbrir}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Abrir Caixa</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Caixa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Funcionário Responsável *</Label>
                      <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter(f => f.ativo).map((func) => (
                            <SelectItem key={func.id} value={func.id}>
                              {func.nome} - {func.cargo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor de Abertura (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorAbertura}
                        onChange={(e) => setValorAbertura(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogAbrir(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAbrirCaixa}>
                      Confirmar Abertura
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Status do Caixa */}
          <Card
            className={`overflow-hidden ${caixaAtual?.status === "aberto" ? "border-accent bg-accent/5" : "border-muted"}`}
          >
            <CardContent className="pt-4 lg:pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground lg:text-2xl">Status do Caixa</h2>
                    <Badge
                      variant={caixaAtual?.status === "aberto" ? "default" : "secondary"}
                      className={`flex-shrink-0 ${caixaAtual?.status === "aberto" ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {caixaAtual?.status === "aberto" ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                  {caixaAtual && (
                    <p className="mt-1 text-xs text-muted-foreground lg:text-sm break-words">
                      Aberto por {caixaAtual.funcionarioAberturaNome} em{" "}
                      {new Date(caixaAtual.dataAbertura).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>

                {caixaAtual && (
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-muted-foreground lg:text-sm">Saldo Atual</p>
                    <p className="text-3xl font-bold text-foreground lg:text-4xl">R$ {saldoCaixa.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Valor de Abertura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  R$ {caixaAtual?.valorAbertura.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-accent/50 bg-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-accent">
                  <TrendingUp className="h-4 w-4" />
                  Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">R$ {entradasHoje.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-destructive/50 bg-destructive/5 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <TrendingDown className="h-4 w-4" />
                  Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">R$ {saidasHoje.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Movimentações */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {!caixaAtual || caixaAtual.movimentacoes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-3">
                  {caixaAtual.movimentacoes
                    .slice()
                    .reverse()
                    .map((movimentacao) => (
                      <div
                        key={movimentacao.id}
                        className="flex flex-col gap-3 rounded-lg border border-border p-3 lg:flex-row lg:items-center lg:justify-between lg:p-4"
                      >
                        <div className="flex items-start gap-3 lg:gap-4">
                          <div
                            className={`rounded-lg p-2 lg:p-3 flex-shrink-0 ${
                              movimentacao.tipo === "entrada"
                                ? "bg-accent/10 text-accent"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {movimentacao.tipo === "entrada" ? (
                              <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
                            ) : (
                              <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium lg:text-base break-words">{movimentacao.descricao}</h3>
                              <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                                {movimentacao.categoria}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground lg:gap-3 lg:text-sm">
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <Calendar className="h-3 w-3" />
                                {new Date(movimentacao.data).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="break-words">{movimentacao.funcionarioNome}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left lg:text-right">
                          <p
                            className={`text-xl font-bold lg:text-2xl ${
                              movimentacao.tipo === "entrada" ? "text-accent" : "text-destructive"
                            }`}
                          >
                            {movimentacao.tipo === "entrada" ? "+" : "-"} R$ {movimentacao.valor.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
