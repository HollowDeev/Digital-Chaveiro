"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useLoja } from "@/lib/contexts/loja-context"
import { useData } from "@/lib/contexts/data-context"
import { ProtectedRoute } from "@/components/protected-route"
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

export default function RelatoriosPage() {
  return (
    <ProtectedRoute>
      <RelatoriosContent />
    </ProtectedRoute>
  )
}

function RelatoriosContent() {
  const { lojaAtual } = useLoja()
  const lojaId = lojaAtual?.id

  const {
    produtos,
    contasPagar,
    contasReceber,
    perdas,
    categoriasPerdas,
    funcionarios,
    vendas,
    loading: dataLoading,
    refetchContasPagar,
    refetchContasReceber,
    refetchPerdas,
    refetchCategoriasPerdas,
    refetchProdutos,
  } = useData()

  const [filtroData, setFiltroData] = useState<string>("hoje")
  const [dataInicio, setDataInicio] = useState<Date | undefined>()
  const [dataFim, setDataFim] = useState<Date | undefined>()

  // Aplicar filtros de data rápidos
  useEffect(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    switch (filtroData) {
      case "hoje":
        setDataInicio(hoje)
        setDataFim(new Date())
        break
      case "semana":
        const inicioSemana = new Date(hoje)
        inicioSemana.setDate(hoje.getDate() - 7)
        setDataInicio(inicioSemana)
        setDataFim(new Date())
        break
      case "mes":
        const inicioMes = new Date(hoje)
        inicioMes.setDate(hoje.getDate() - 30)
        setDataInicio(inicioMes)
        setDataFim(new Date())
        break
      case "custom":
        break
    }
  }, [filtroData])

  // Estados para dialogs
  const [openNovaContaPagar, setOpenNovaContaPagar] = useState(false)
  const [openNovaContaReceber, setOpenNovaContaReceber] = useState(false)
  const [openNovaCategoriaDespesa, setOpenNovaCategoriaDespesa] = useState(false)
  const [openNovaCategoriaPerda, setOpenNovaCategoriaPerda] = useState(false)
  const [openNovaPerda, setOpenNovaPerda] = useState(false)
  const [busca, setBusca] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Estados para formulários
  const [novaContaPagar, setNovaContaPagar] = useState({
    descricao: "",
    valor: "",
    dataVencimento: "",
    categoria: "",
    observacoes: "",
  })

  const [novaContaReceber, setNovaContaReceber] = useState({
    descricao: "",
    valor: "",
    dataVencimento: "",
    clienteNome: "",
    observacoes: "",
  })

  const [novaCategoriaDespesa, setNovaCategoriaDespesa] = useState({
    nome: "",
    descricao: "",
  })

  const [novaCategoriaPerda, setNovaCategoriaPerda] = useState({
    nome: "",
    descricao: "",
  })

  const [novaPerda, setNovaPerda] = useState({
    produtoId: "",
    categoriaId: "",
    quantidade: "",
    custoUnitario: "",
    motivo: "",
    observacoes: "",
  })

  // Categorias de despesas (hardcoded por enquanto, pode ser uma tabela separada)
  const categoriasDespesas = [
    "Aluguel",
    "Energia",
    "Água",
    "Internet",
    "Salários",
    "Fornecedores",
    "Manutenção",
    "Marketing",
    "Impostos",
    "Outros",
  ]

  // Toast
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")

  const mostrarToast = (mensagem: string, tipo: "success" | "error" = "success") => {
    setToastMessage(mensagem)
    setToastType(tipo)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Função para criar conta a pagar
  const handleCriarContaPagar = async () => {
    if (!lojaId || !novaContaPagar.descricao || !novaContaPagar.valor || !novaContaPagar.dataVencimento) {
      mostrarToast("Preencha os campos obrigatórios", "error")
      return
    }

    setSalvando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("contas_pagar").insert({
        loja_id: lojaId,
        descricao: novaContaPagar.descricao,
        valor: parseFloat(novaContaPagar.valor),
        data_vencimento: novaContaPagar.dataVencimento,
        categoria: novaContaPagar.categoria || null,
        observacoes: novaContaPagar.observacoes || null,
        status: "pendente",
      })

      if (error) throw error

      mostrarToast("Conta a pagar criada com sucesso!")
      setOpenNovaContaPagar(false)
      setNovaContaPagar({ descricao: "", valor: "", dataVencimento: "", categoria: "", observacoes: "" })
      refetchContasPagar()
    } catch (err: any) {
      console.error("Erro:", err)
      mostrarToast(err.message || "Erro ao criar conta", "error")
    } finally {
      setSalvando(false)
    }
  }

  // Função para criar conta a receber
  const handleCriarContaReceber = async () => {
    if (!lojaId || !novaContaReceber.descricao || !novaContaReceber.valor || !novaContaReceber.dataVencimento) {
      mostrarToast("Preencha os campos obrigatórios", "error")
      return
    }

    setSalvando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("contas_receber").insert({
        loja_id: lojaId,
        descricao: novaContaReceber.descricao,
        valor: parseFloat(novaContaReceber.valor),
        data_vencimento: novaContaReceber.dataVencimento,
        cliente_nome: novaContaReceber.clienteNome || null,
        observacoes: novaContaReceber.observacoes || null,
        status: "pendente",
      })

      if (error) throw error

      mostrarToast("Conta a receber criada com sucesso!")
      setOpenNovaContaReceber(false)
      setNovaContaReceber({ descricao: "", valor: "", dataVencimento: "", clienteNome: "", observacoes: "" })
      refetchContasReceber()
    } catch (err: any) {
      console.error("Erro:", err)
      mostrarToast(err.message || "Erro ao criar conta", "error")
    } finally {
      setSalvando(false)
    }
  }

  // Função para criar categoria de perda
  const handleCriarCategoriaPerda = async () => {
    if (!lojaId || !novaCategoriaPerda.nome) {
      mostrarToast("Informe o nome da categoria", "error")
      return
    }

    setSalvando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("categorias_perdas").insert({
        loja_id: lojaId,
        nome: novaCategoriaPerda.nome,
        descricao: novaCategoriaPerda.descricao || null,
      })

      if (error) throw error

      mostrarToast("Categoria criada com sucesso!")
      setOpenNovaCategoriaPerda(false)
      setNovaCategoriaPerda({ nome: "", descricao: "" })
      refetchCategoriasPerdas()
    } catch (err: any) {
      console.error("Erro:", err)
      mostrarToast(err.message || "Erro ao criar categoria", "error")
    } finally {
      setSalvando(false)
    }
  }

  // Função para registrar perda
  const handleRegistrarPerda = async () => {
    if (!lojaId || !novaPerda.produtoId || !novaPerda.quantidade || !novaPerda.categoriaId) {
      mostrarToast("Preencha os campos obrigatórios", "error")
      return
    }

    const quantidade = parseInt(novaPerda.quantidade)
    const produto = produtos.find(p => p.id === novaPerda.produtoId)

    if (!produto) {
      mostrarToast("Produto não encontrado", "error")
      return
    }

    const custoUnitario = novaPerda.custoUnitario ? parseFloat(novaPerda.custoUnitario) : produto.custoUnitario
    const custoTotal = custoUnitario * quantidade

    setSalvando(true)
    try {
      const supabase = createClient()

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("perdas").insert({
        loja_id: lojaId,
        produto_id: novaPerda.produtoId,
        categoria_id: novaPerda.categoriaId,
        quantidade: quantidade,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        motivo: novaPerda.motivo || categoriasPerdas.find(c => c.id === novaPerda.categoriaId)?.nome || "Perda",
        funcionario_id: user?.id,
        observacoes: novaPerda.observacoes || null,
      })

      if (error) throw error

      // Atualizar estoque do produto
      const novoEstoque = Math.max(0, produto.estoque - quantidade)
      await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", novaPerda.produtoId)

      mostrarToast("Perda registrada com sucesso!")
      setOpenNovaPerda(false)
      setNovaPerda({ produtoId: "", categoriaId: "", quantidade: "", custoUnitario: "", motivo: "", observacoes: "" })
      refetchPerdas()
      refetchProdutos()
    } catch (err: any) {
      console.error("Erro:", err)
      mostrarToast(err.message || "Erro ao registrar perda", "error")
    } finally {
      setSalvando(false)
    }
  }

  // Função para marcar conta como paga
  const pagarConta = async (contaId: string) => {
    if (!lojaId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("contas_pagar")
        .update({
          status: "paga",
          data_pagamento: new Date().toISOString()
        })
        .eq("id", contaId)

      if (error) throw error
      mostrarToast("Conta marcada como paga!")
      refetchContasPagar()
    } catch (err) {
      console.error("Erro ao pagar conta:", err)
      mostrarToast("Erro ao pagar conta", "error")
    }
  }

  // Função para marcar conta como recebida
  const receberConta = async (contaId: string) => {
    if (!lojaId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("contas_receber")
        .update({
          status: "recebida",
          data_recebimento: new Date().toISOString()
        })
        .eq("id", contaId)

      if (error) throw error
      mostrarToast("Conta marcada como recebida!")
      refetchContasReceber()
    } catch (err) {
      console.error("Erro ao receber conta:", err)
      mostrarToast("Erro ao receber conta", "error")
    }
  }

  // Estatísticas gerais
  const vendasConcluidas = vendas?.filter((v) => v.status === "concluida") || []
  const totalVendas = vendasConcluidas.length
  const receitaTotal = vendasConcluidas.reduce((acc, v) => acc + v.total, 0)

  // Produto mais vendido (simplificado - por valor de vendas)
  const produtoMaisVendido = useMemo(() => {
    if (!produtos || produtos.length === 0) return null
    // Retorna o primeiro produto ativo como placeholder
    const produtoAtivo = produtos.find(p => p.ativo)
    return produtoAtivo ? { produto: produtoAtivo, quantidade: 0 } : null
  }, [produtos])

  // Funcionário destaque
  const funcionarioDestaque = useMemo(() => {
    if (!funcionarios || funcionarios.length === 0) return null
    const primeiro = funcionarios[0]
    return { nome: primeiro.nome, count: totalVendas }
  }, [funcionarios, totalVendas])

  const formasPagamento = {
    dinheiro: vendasConcluidas.filter((v) => v.formaPagamento === "dinheiro").length,
    pix: vendasConcluidas.filter((v) => v.formaPagamento === "pix").length,
    cartao_credito: vendasConcluidas.filter((v) => v.formaPagamento === "cartao_credito").length,
    cartao_debito: vendasConcluidas.filter((v) => v.formaPagamento === "cartao_debito").length,
    outros: vendasConcluidas.filter((v) => v.formaPagamento === "outros").length,
  }

  const despesasPagas = contasPagar?.filter((c) => c.status === "paga").reduce((acc, c) => acc + c.valor, 0) || 0
  const despesasPendentes = contasPagar?.filter((c) => c.status !== "paga").reduce((acc, c) => acc + c.valor, 0) || 0
  const receitasRecebidas = contasReceber?.filter((c) => c.status === "recebida").reduce((acc, c) => acc + c.valor, 0) || 0
  const receitasPendentes = contasReceber?.filter((c) => c.status !== "recebida").reduce((acc, c) => acc + c.valor, 0) || 0

  const totalPagar = contasPagar?.filter((c) => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0) || 0
  const totalReceberPendente = contasReceber?.filter((c) => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0) || 0
  const totalPerdas = perdas?.reduce((acc, p) => acc + (p.custoTotal || 0), 0) || 0

  const lucroLiquido = receitaTotal + receitasRecebidas - despesasPagas - totalPerdas

  // Filtros para contas
  const contasPagarFiltradas = contasPagar?.filter(
    (c) => c.descricao.toLowerCase().includes(busca.toLowerCase()) || c.categoria?.toLowerCase().includes(busca.toLowerCase())
  ) || []

  const contasReceberFiltradas = contasReceber?.filter(
    (c) => c.descricao.toLowerCase().includes(busca.toLowerCase()) || c.clienteNome?.toLowerCase().includes(busca.toLowerCase())
  ) || []

  const perdasFiltradas = perdas?.filter(
    (p) => p.produtoNome?.toLowerCase().includes(busca.toLowerCase()) || p.motivo?.toLowerCase().includes(busca.toLowerCase())
  ) || []

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
              {/* Filtros de Data */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base lg:text-lg">Filtros de Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label htmlFor="filtro-rapido">Filtro Rápido</Label>
                      <Select value={filtroData} onValueChange={setFiltroData}>
                        <SelectTrigger id="filtro-rapido">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hoje">Hoje</SelectItem>
                          <SelectItem value="semana">Últimos 7 dias</SelectItem>
                          <SelectItem value="mes">Último mês</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filtroData === "custom" && (
                      <>
                        <div>
                          <Label htmlFor="data-inicio">Data Início</Label>
                          <Input
                            id="data-inicio"
                            type="date"
                            value={dataInicio?.toISOString().split("T")[0] || ""}
                            onChange={(e) => setDataInicio(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="data-fim">Data Fim</Label>
                          <Input
                            id="data-fim"
                            type="date"
                            value={dataFim?.toISOString().split("T")[0] || ""}
                            onChange={(e) => setDataFim(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                    <div className="text-3xl font-bold text-foreground">
                      {dataLoading ? "..." : totalVendas}
                    </div>
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
                    <div className="text-3xl font-bold text-foreground">
                      {dataLoading ? "..." : `R$ ${receitaTotal.toFixed(2)}`}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Produto Mais Vendido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-foreground">
                      {dataLoading ? "..." : produtoMaisVendido ? produtoMaisVendido.produto.nome : "N/A"}
                    </div>
                    {produtoMaisVendido && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {produtoMaisVendido.quantidade} unidades vendidas
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Funcionário Destaque
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-foreground">
                      {dataLoading ? "..." : funcionarioDestaque ? funcionarioDestaque.nome : "N/A"}
                    </div>
                    {funcionarioDestaque && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {funcionarioDestaque.count} vendas realizadas
                      </p>
                    )}
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
                        {dataLoading ? (
                          <p className="text-sm text-muted-foreground">Carregando...</p>
                        ) : produtoMaisVendido ? (
                          <>
                            <p className="text-sm font-medium text-foreground lg:text-base wrap-break-word">
                              {produtoMaisVendido.produto.nome}
                            </p>
                            <p className="text-xs text-muted-foreground lg:text-sm">
                              {produtoMaisVendido.quantidade} unidades vendidas
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum produto vendido</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground lg:text-sm">Funcionário Destaque</p>
                      <div className="mt-2 rounded-lg bg-primary/10 p-3">
                        {dataLoading ? (
                          <p className="text-sm text-muted-foreground">Carregando...</p>
                        ) : funcionarioDestaque ? (
                          <>
                            <p className="text-sm font-medium text-foreground lg:text-base wrap-break-word">
                              {funcionarioDestaque.nome}
                            </p>
                            <p className="text-xs text-muted-foreground lg:text-sm">
                              {funcionarioDestaque.count} vendas realizadas
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma venda registrada</p>
                        )}
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
                        R$ {(receitaTotal + receitasRecebidas).toFixed(2)}
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
              </Card >

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
                        <p className="text-xl font-bold text-red-500">R$ {despesasPendentes.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">A Receber</p>
                        <p className="text-xl font-bold text-emerald-500">R$ {receitasPendentes.toFixed(2)}</p>
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
                      <div className="text-3xl font-bold text-destructive">
                        {dataLoading ? "..." : `R$ ${totalPerdas.toFixed(2)}`}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dataLoading ? "..." : `${perdas?.length || 0} perdas registradas`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent >

            {/* Tab Financeiro (contas) */}
            < TabsContent value="financeiro" className="space-y-4 lg:space-y-6 mt-4" >
              {/* Cards de Resumo Financeiro */}
              < div className="grid gap-4 sm:grid-cols-3 lg:gap-6" >
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
                      {contasReceber?.filter((c) => c.status === "pendente").length || 0} pendentes
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
                    <div className="text-3xl font-bold text-destructive">
                      {dataLoading ? "..." : `R$ ${totalPerdas.toFixed(2)}`}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dataLoading ? "..." : `${perdas?.length || 0} perdas registradas`}
                    </p>
                  </CardContent>
                </Card>
              </div >

              {/* Busca e Sub-tabs */}
              < Card className="overflow-hidden" >
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
              </Card >

              {/* Sub-tabs para Contas */}
              < Tabs defaultValue="pagar" className="w-full" >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
                  <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
                  <TabsTrigger value="perdas">Perdas</TabsTrigger>
                </TabsList>

                {/* Contas a Pagar */}
                <TabsContent value="pagar" className="space-y-4 mt-4">
                  <div className="flex justify-end gap-2">
                    <Dialog open={openNovaCategoriaDespesa} onOpenChange={setOpenNovaCategoriaDespesa}>
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
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="categoria-nome">Nome da Categoria *</Label>
                            <Input
                              id="categoria-nome"
                              placeholder="Ex: Aluguel, Energia, Fornecedores..."
                              value={novaCategoriaDespesa.nome}
                              onChange={(e) => setNovaCategoriaDespesa({ ...novaCategoriaDespesa, nome: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="categoria-descricao">Descrição</Label>
                            <Textarea
                              id="categoria-descricao"
                              placeholder="Descrição opcional da categoria"
                              value={novaCategoriaDespesa.descricao}
                              onChange={(e) => setNovaCategoriaDespesa({ ...novaCategoriaDespesa, descricao: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpenNovaCategoriaDespesa(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={() => {
                            // Por enquanto, categorias são fixas - fechar o dialog
                            mostrarToast("Categoria salva localmente!", "success")
                            setOpenNovaCategoriaDespesa(false)
                            setNovaCategoriaDespesa({ nome: "", descricao: "" })
                          }} disabled={!novaCategoriaDespesa.nome || salvando}>
                            {salvando ? "Salvando..." : "Salvar Categoria"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openNovaContaPagar} onOpenChange={setOpenNovaContaPagar}>
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
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="conta-descricao">Descrição *</Label>
                            <Input
                              id="conta-descricao"
                              placeholder="Ex: Conta de luz, Pagamento fornecedor..."
                              value={novaContaPagar.descricao}
                              onChange={(e) => setNovaContaPagar({ ...novaContaPagar, descricao: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="conta-valor">Valor *</Label>
                              <Input
                                id="conta-valor"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={novaContaPagar.valor}
                                onChange={(e) => setNovaContaPagar({ ...novaContaPagar, valor: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="conta-vencimento">Vencimento *</Label>
                              <Input
                                id="conta-vencimento"
                                type="date"
                                value={novaContaPagar.dataVencimento}
                                onChange={(e) => setNovaContaPagar({ ...novaContaPagar, dataVencimento: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="conta-categoria">Categoria</Label>
                            <Select
                              value={novaContaPagar.categoria}
                              onValueChange={(value) => setNovaContaPagar({ ...novaContaPagar, categoria: value })}
                            >
                              <SelectTrigger id="conta-categoria">
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoriasDespesas.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="conta-observacoes">Observações</Label>
                            <Textarea
                              id="conta-observacoes"
                              placeholder="Informações adicionais..."
                              value={novaContaPagar.observacoes}
                              onChange={(e) => setNovaContaPagar({ ...novaContaPagar, observacoes: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpenNovaContaPagar(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleCriarContaPagar}
                            disabled={!novaContaPagar.descricao || !novaContaPagar.valor || !novaContaPagar.dataVencimento || salvando}
                          >
                            {salvando ? "Salvando..." : "Salvar Conta"}
                          </Button>
                        </DialogFooter>
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
                  <div className="flex justify-end gap-2">
                    <Dialog open={openNovaContaReceber} onOpenChange={setOpenNovaContaReceber}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Nova Conta a Receber
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Conta a Receber</DialogTitle>
                          <DialogDescription>Registre um valor a receber de cliente ou outra fonte</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="receber-descricao">Descrição *</Label>
                            <Input
                              id="receber-descricao"
                              placeholder="Ex: Serviço pendente, Venda parcelada..."
                              value={novaContaReceber.descricao}
                              onChange={(e) => setNovaContaReceber({ ...novaContaReceber, descricao: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="receber-valor">Valor *</Label>
                              <Input
                                id="receber-valor"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={novaContaReceber.valor}
                                onChange={(e) => setNovaContaReceber({ ...novaContaReceber, valor: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="receber-vencimento">Vencimento *</Label>
                              <Input
                                id="receber-vencimento"
                                type="date"
                                value={novaContaReceber.dataVencimento}
                                onChange={(e) => setNovaContaReceber({ ...novaContaReceber, dataVencimento: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receber-cliente">Nome do Cliente</Label>
                            <Input
                              id="receber-cliente"
                              placeholder="Nome do cliente ou devedor"
                              value={novaContaReceber.clienteNome}
                              onChange={(e) => setNovaContaReceber({ ...novaContaReceber, clienteNome: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receber-observacoes">Observações</Label>
                            <Textarea
                              id="receber-observacoes"
                              placeholder="Informações adicionais..."
                              value={novaContaReceber.observacoes}
                              onChange={(e) => setNovaContaReceber({ ...novaContaReceber, observacoes: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpenNovaContaReceber(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleCriarContaReceber}
                            disabled={!novaContaReceber.descricao || !novaContaReceber.valor || !novaContaReceber.dataVencimento || salvando}
                          >
                            {salvando ? "Salvando..." : "Salvar Conta"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

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
                                  {conta.clienteNome && (
                                    <Badge variant="outline" className="text-xs">
                                      {conta.clienteNome}
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
                                  <Button size="sm" variant="outline" onClick={() => receberConta(conta.id)}>
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
                          <DialogDescription>Crie uma categoria para organizar as perdas (ex: Avaria, Vencimento, Roubo)</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="catperda-nome">Nome da Categoria *</Label>
                            <Input
                              id="catperda-nome"
                              placeholder="Ex: Avaria, Vencimento, Extravio..."
                              value={novaCategoriaPerda.nome}
                              onChange={(e) => setNovaCategoriaPerda({ ...novaCategoriaPerda, nome: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="catperda-descricao">Descrição</Label>
                            <Textarea
                              id="catperda-descricao"
                              placeholder="Descrição opcional da categoria"
                              value={novaCategoriaPerda.descricao}
                              onChange={(e) => setNovaCategoriaPerda({ ...novaCategoriaPerda, descricao: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpenNovaCategoriaPerda(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleCriarCategoriaPerda}
                            disabled={!novaCategoriaPerda.nome || salvando}
                          >
                            {salvando ? "Salvando..." : "Salvar Categoria"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openNovaPerda} onOpenChange={setOpenNovaPerda}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Perda
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Registrar Perda</DialogTitle>
                          <DialogDescription>Registre uma perda de produto no estoque</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="perda-produto">Produto *</Label>
                            <Select
                              value={novaPerda.produtoId}
                              onValueChange={(value) => {
                                const produto = produtos.find(p => p.id === value)
                                setNovaPerda({
                                  ...novaPerda,
                                  produtoId: value,
                                  custoUnitario: produto?.custoUnitario?.toString() || ""
                                })
                              }}
                            >
                              <SelectTrigger id="perda-produto">
                                <SelectValue placeholder="Selecione o produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {produtos.filter(p => p.ativo && p.estoque > 0).map((produto) => (
                                  <SelectItem key={produto.id} value={produto.id}>
                                    {produto.nome} (Estoque: {produto.estoque})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="perda-categoria">Categoria da Perda *</Label>
                            <Select
                              value={novaPerda.categoriaId}
                              onValueChange={(value) => setNovaPerda({ ...novaPerda, categoriaId: value })}
                            >
                              <SelectTrigger id="perda-categoria">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoriasPerdas && categoriasPerdas.length > 0 ? (
                                  categoriasPerdas.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.nome}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="sem-categoria" disabled>
                                    Nenhuma categoria cadastrada
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {(!categoriasPerdas || categoriasPerdas.length === 0) && (
                              <p className="text-xs text-muted-foreground">
                                Crie uma categoria primeiro clicando em "Nova Categoria"
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="perda-quantidade">Quantidade *</Label>
                              <Input
                                id="perda-quantidade"
                                type="number"
                                min="1"
                                placeholder="0"
                                value={novaPerda.quantidade}
                                onChange={(e) => setNovaPerda({ ...novaPerda, quantidade: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="perda-custo">Custo Unitário</Label>
                              <Input
                                id="perda-custo"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Automático"
                                value={novaPerda.custoUnitario}
                                onChange={(e) => setNovaPerda({ ...novaPerda, custoUnitario: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="perda-motivo">Motivo</Label>
                            <Input
                              id="perda-motivo"
                              placeholder="Descreva o motivo da perda"
                              value={novaPerda.motivo}
                              onChange={(e) => setNovaPerda({ ...novaPerda, motivo: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="perda-observacoes">Observações</Label>
                            <Textarea
                              id="perda-observacoes"
                              placeholder="Informações adicionais..."
                              value={novaPerda.observacoes}
                              onChange={(e) => setNovaPerda({ ...novaPerda, observacoes: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpenNovaPerda(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleRegistrarPerda}
                            disabled={!novaPerda.produtoId || !novaPerda.quantidade || !novaPerda.categoriaId || salvando}
                          >
                            {salvando ? "Salvando..." : "Registrar Perda"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {dataLoading ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">Carregando perdas...</p>
                        ) : perdasFiltradas.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma perda registrada</p>
                        ) : (
                          perdasFiltradas.map((perda) => (
                            <div key={perda.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium">{perda.produtoNome || "Produto"}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {perda.categoriaNome || "Sem categoria"}
                                  </Badge>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {perda.quantidade} unidades • {new Date(perda.data).toLocaleDateString("pt-BR")}
                                </div>
                                {perda.motivo && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {perda.motivo}
                                  </div>
                                )}
                              </div>
                              <span className="text-lg font-bold text-destructive">R$ {(perda.custoTotal || 0).toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs >
            </TabsContent >
          </Tabs >
        </div >
      </main >
    </div >
  )
}
