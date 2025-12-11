"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useProdutos, useServicos } from "@/lib/hooks/useLojaData"
import { useStore } from "@/lib/store"
import { Package, Search, AlertTriangle, Plus, Edit, Trash2, TrendingUp, TrendingDown, Wrench, Clock, DollarSign, Percent, ArrowUpCircle, History, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function GestaoInventarioPage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { produtos, refetch: refetchProdutos } = useProdutos(lojaId)
  const { servicos, refetch: refetchServicos } = useServicos(lojaId)
  const { categoriasPerdas, perdas, adicionarPerda, adicionarCategoriaPerda, funcionarios } = useStore()

  const [busca, setBusca] = useState("")
  const [activeTab, setActiveTab] = useState("produtos")

  // Estados dos Dialogs
  const [dialogNovoProduto, setDialogNovoProduto] = useState(false)
  const [dialogNovoServico, setDialogNovoServico] = useState(false)
  const [dialogEntradaEstoque, setDialogEntradaEstoque] = useState(false)
  const [dialogNovaPerda, setDialogNovaPerda] = useState(false)
  const [dialogEditarProduto, setDialogEditarProduto] = useState(false)
  const [dialogEditarServico, setDialogEditarServico] = useState(false)

  // Estados de Formulários
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    codigo: "",
    categoria: "",
    preco: "",
    custoUnitario: "",
    estoque: "0",
    descricao: ""
  })

  const [novoServico, setNovoServico] = useState({
    nome: "",
    codigo: "",
    categoria: "",
    preco: "",
    duracao: "",
    descricao: ""
  })

  const [entradaEstoque, setEntradaEstoque] = useState({
    produtoId: "",
    quantidade: "",
    valorPago: "",
    valorVenda: ""
  })

  const [novaPerda, setNovaPerda] = useState({
    produtoId: "",
    tipo: "produto" as 'produto' | 'servico',
    quantidade: "",
    valor: "",
    funcionarioId: "",
    categoriaId: "",
    observacoes: ""
  })

  const [perdaTipoValor, setPerdaTipoValor] = useState<'custo' | 'preco'>('custo')

  const [produtoEditando, setProdutoEditando] = useState<any>(null)
  const [servicoEditando, setServicoEditando] = useState<any>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Buscar loja
  useEffect(() => {
    const fetchLoja = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Tentar buscar loja onde é dono
      let { data: lojas } = await supabase.from("lojas").select("id").eq("dono_id", user.id).limit(1)

      // Se não encontrou, buscar através de lojas_usuarios
      if (!lojas || lojas.length === 0) {
        const { data: lojaUsuario } = await supabase
          .from("lojas_usuarios")
          .select("loja_id")
          .eq("usuario_id", user.id)
          .limit(1)

        if (lojaUsuario && lojaUsuario.length > 0) {
          lojas = [{ id: lojaUsuario[0].loja_id }]
        }
      }

      if (lojas && lojas.length > 0) {
        console.log("Loja ID encontrado:", lojas[0].id) // Debug
        setLojaId(lojas[0].id)
      } else {
        console.log("Nenhuma loja encontrada para o usuário") // Debug
      }
    }
    fetchLoja()
  }, [])

  // Toast
  const mostrarToast = (mensagem: string) => {
    setToastMessage(mensagem)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Cálculos de margem
  const calcularMargemLucro = () => {
    const valorPago = Number.parseFloat(entradaEstoque.valorPago) || 0
    const valorVenda = Number.parseFloat(entradaEstoque.valorVenda) || 0
    if (valorPago === 0) return 0
    return ((valorVenda - valorPago) / valorPago) * 100
  }

  const calcularMargemProduto = () => {
    const custo = Number.parseFloat(novoProduto.custoUnitario) || 0
    const preco = Number.parseFloat(novoProduto.preco) || 0
    if (custo === 0) return 0
    return ((preco - custo) / custo) * 100
  }

  // CRUD Produto
  const handleCriarProduto = async () => {
    if (!lojaId || !novoProduto.nome || !novoProduto.codigo) {
      mostrarToast("⚠️ Preencha os campos obrigatórios")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("produtos").insert({
      loja_id: lojaId,
      nome: novoProduto.nome,
      codigo_barras: novoProduto.codigo,
      categoria: novoProduto.categoria,
      preco: Number.parseFloat(novoProduto.preco) || 0,
      custo: Number.parseFloat(novoProduto.custoUnitario) || 0,
      estoque: Number.parseInt(novoProduto.estoque) || 0,
      descricao: novoProduto.descricao,
      ativo: true
    })

    if (error) {
      mostrarToast("❌ Erro ao criar produto")
      console.error(error)
    } else {
      mostrarToast("✅ Produto criado com sucesso!")
      setDialogNovoProduto(false)
      setNovoProduto({ nome: "", codigo: "", categoria: "", preco: "", custoUnitario: "", estoque: "0", descricao: "" })
      refetchProdutos()
    }
  }

  const handleAtualizarProduto = async () => {
    if (!produtoEditando) return

    const supabase = createClient()
    const { error } = await supabase.from("produtos").update({
      nome: produtoEditando.nome,
      codigo_barras: produtoEditando.codigo,
      categoria: produtoEditando.categoria,
      preco: produtoEditando.preco,
      custo: produtoEditando.custoUnitario,
      estoque: produtoEditando.estoque,
      descricao: produtoEditando.descricao
    }).eq("id", produtoEditando.id)

    if (error) {
      mostrarToast("❌ Erro ao atualizar produto")
    } else {
      mostrarToast("✅ Produto atualizado!")
      setDialogEditarProduto(false)
      setProdutoEditando(null)
      refetchProdutos()
    }
  }

  const handleDeletarProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este produto?")) return

    const supabase = createClient()
    const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", id)

    if (error) {
      mostrarToast("❌ Erro ao desativar produto")
    } else {
      mostrarToast("✅ Produto desativado!")
      refetchProdutos()
    }
  }

  // CRUD Serviço
  const handleCriarServico = async () => {
    if (!lojaId || !novoServico.nome) {
      mostrarToast("⚠️ Preencha os campos obrigatórios")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("servicos").insert({
      loja_id: lojaId,
      nome: novoServico.nome,
      preco: Number.parseFloat(novoServico.preco) || 0,
      duracao_estimada: Number.parseInt(novoServico.duracao) || null,
      descricao: novoServico.descricao,
      ativo: true
    })

    if (error) {
      mostrarToast("❌ Erro ao criar serviço")
      console.error(error)
    } else {
      mostrarToast("✅ Serviço criado com sucesso!")
      setDialogNovoServico(false)
      setNovoServico({ nome: "", codigo: "", categoria: "", preco: "", duracao: "", descricao: "" })
      refetchServicos()
    }
  }

  const handleAtualizarServico = async () => {
    if (!servicoEditando) return

    const supabase = createClient()
    const { error } = await supabase.from("servicos").update({
      nome: servicoEditando.nome,
      preco: servicoEditando.preco,
      duracao_estimada: servicoEditando.duracao,
      descricao: servicoEditando.descricao
    }).eq("id", servicoEditando.id)

    if (error) {
      mostrarToast("❌ Erro ao atualizar serviço")
    } else {
      mostrarToast("✅ Serviço atualizado!")
      setDialogEditarServico(false)
      setServicoEditando(null)
      refetchServicos()
    }
  }

  const handleDeletarServico = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este serviço?")) return

    const supabase = createClient()
    const { error } = await supabase.from("servicos").update({ ativo: false }).eq("id", id)

    if (error) {
      mostrarToast("❌ Erro ao desativar serviço")
    } else {
      mostrarToast("✅ Serviço desativado!")
      refetchServicos()
    }
  }

  // Entrada de Estoque
  const handleEntradaEstoque = async () => {
    if (!entradaEstoque.produtoId || !entradaEstoque.quantidade) {
      mostrarToast("⚠️ Preencha os campos obrigatórios")
      return
    }

    const supabase = createClient()
    const produto = produtos.find(p => p.id === entradaEstoque.produtoId)
    if (!produto) return

    // Atualizar estoque
    const novoEstoque = produto.estoque + Number.parseInt(entradaEstoque.quantidade)
    const { error } = await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", produto.id)

    if (error) {
      mostrarToast("❌ Erro ao registrar entrada")
    } else {
      // TODO: Registrar movimentação no histórico
      mostrarToast("✅ Entrada registrada com sucesso!")
      setDialogEntradaEstoque(false)
      setEntradaEstoque({ produtoId: "", quantidade: "", valorPago: "", valorVenda: "" })
      refetchProdutos()
    }
  }

  // Registrar Perda
  const handleRegistrarPerda = () => {
    if (!novaPerda.produtoId || !novaPerda.quantidade || !novaPerda.funcionarioId || !novaPerda.categoriaId || !novaPerda.valor) {
      mostrarToast("⚠️ Preencha todos os campos")
      return
    }

    const quantidade = Number.parseInt(novaPerda.quantidade)
    const valor = Number.parseFloat(novaPerda.valor)

    if (isNaN(quantidade) || quantidade <= 0 || isNaN(valor) || valor <= 0) {
      mostrarToast("⚠️ Quantidade e valor devem ser maiores que zero")
      return
    }

    const funcionario = funcionarios.find(f => f.id === novaPerda.funcionarioId)
    const categoria = categoriasPerdas.find(c => c.id === novaPerda.categoriaId)

    if (!funcionario || !categoria) return

    let itemNome = ""
    if (novaPerda.tipo === 'produto') {
      const produto = produtos.find(p => p.id === novaPerda.produtoId)
      if (!produto) return
      itemNome = produto.nome
    } else {
      const servico = servicos.find(s => s.id === novaPerda.produtoId)
      if (!servico) return
      itemNome = servico.nome
    }

    const perda = {
      id: `P${Date.now()}`,
      produtoId: novaPerda.produtoId,
      produtoNome: itemNome,
      quantidade,
      custoUnitario: valor / quantidade,
      custoTotal: valor,
      funcionarioId: funcionario.id,
      funcionarioNome: funcionario.nome,
      categoriaId: categoria.id,
      categoria: categoria.nome,
      motivo: categoria.nome,
      data: new Date().toISOString(),
      observacoes: novaPerda.observacoes
    }

    adicionarPerda(perda)
    mostrarToast("✅ Perda registrada!")
    setDialogNovaPerda(false)
    setNovaPerda({ produtoId: "", tipo: "produto", quantidade: "", valor: "", funcionarioId: "", categoriaId: "", observacoes: "" })
  }

  // Filtros
  const produtosFiltrados = produtos.filter(p =>
    p.ativo && (
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())
    )
  )

  console.log("Total de serviços:", servicos.length, servicos) // Debug
  const servicosFiltrados = servicos.filter(s => {
    const matchBusca = s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      s.codigo.toLowerCase().includes(busca.toLowerCase())
    return matchBusca
  })

  // Métricas
  const produtosBaixoEstoque = produtos.filter(p => p.estoque < 20 && p.ativo).length
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + p.custoUnitario * p.estoque, 0)
  const totalProdutos = produtos.filter(p => p.ativo).length
  const totalServicos = servicos.filter(s => s.ativo).length
  const totalPerdas = perdas.reduce((acc, p) => acc + p.custoTotal, 0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Toast */}
      {showToast && (
        <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top-5">
          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="flex items-center gap-2 p-3">
              <span className="text-sm font-medium">{toastMessage}</span>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="flex-1 lg:ml-64">
        <PageHeader
          title="Gestão de Inventário"
          subtitle="Controle completo de produtos, serviços e movimentações"
          icon={<Package className="h-5 w-5 lg:h-6 lg:w-6" />}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Métricas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProdutos}</div>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServicos}</div>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Valor Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total investido</p>
              </CardContent>
            </Card>

            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Baixo Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{produtosBaixoEstoque}</div>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1 text-xs text-orange-600">
                  <XCircle className="h-3 w-3" />
                  Perdas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">R$ {totalPerdas.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total em perdas</p>
              </CardContent>
            </Card>
          </div>

          {/* Busca e Ações */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código ou categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Dialog open={dialogNovoProduto} onOpenChange={setDialogNovoProduto}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Produto</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome-produto">Nome *</Label>
                        <Input
                          id="nome-produto"
                          value={novoProduto.nome}
                          onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                          placeholder="Nome do produto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigo-produto">Código *</Label>
                        <Input
                          id="codigo-produto"
                          value={novoProduto.codigo}
                          onChange={(e) => setNovoProduto({ ...novoProduto, codigo: e.target.value })}
                          placeholder="SKU ou código de barras"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoria-produto">Categoria</Label>
                        <Input
                          id="categoria-produto"
                          value={novoProduto.categoria}
                          onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                          placeholder="Ex: Chaves, Cópias..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estoque-produto">Estoque Inicial</Label>
                        <Input
                          id="estoque-produto"
                          type="number"
                          min="0"
                          value={novoProduto.estoque}
                          onChange={(e) => setNovoProduto({ ...novoProduto, estoque: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="custo-produto">Custo Unitário (R$)</Label>
                        <Input
                          id="custo-produto"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoProduto.custoUnitario}
                          onChange={(e) => setNovoProduto({ ...novoProduto, custoUnitario: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preco-produto">Preço de Venda (R$)</Label>
                        <Input
                          id="preco-produto"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoProduto.preco}
                          onChange={(e) => setNovoProduto({ ...novoProduto, preco: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {novoProduto.custoUnitario && novoProduto.preco && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="flex items-center justify-between p-3">
                          <span className="text-sm text-muted-foreground">Margem de Lucro:</span>
                          <span className={cn(
                            "text-lg font-bold",
                            calcularMargemProduto() > 0 ? "text-green-600" : "text-destructive"
                          )}>
                            {calcularMargemProduto().toFixed(1)}%
                          </span>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="descricao-produto">Descrição</Label>
                      <Textarea
                        id="descricao-produto"
                        value={novoProduto.descricao}
                        onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                        placeholder="Detalhes adicionais sobre o produto..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogNovoProduto(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCriarProduto}>
                      Criar Produto
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogNovoServico} onOpenChange={setDialogNovoServico}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome-servico">Nome *</Label>
                        <Input
                          id="nome-servico"
                          value={novoServico.nome}
                          onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                          placeholder="Nome do serviço"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigo-servico">Código *</Label>
                        <Input
                          id="codigo-servico"
                          value={novoServico.codigo}
                          onChange={(e) => setNovoServico({ ...novoServico, codigo: e.target.value })}
                          placeholder="Código identificador"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoria-servico">Categoria</Label>
                        <Input
                          id="categoria-servico"
                          value={novoServico.categoria}
                          onChange={(e) => setNovoServico({ ...novoServico, categoria: e.target.value })}
                          placeholder="Ex: Chaveiro, Conserto..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duracao-servico">Duração (minutos)</Label>
                        <Input
                          id="duracao-servico"
                          type="number"
                          min="0"
                          value={novoServico.duracao}
                          onChange={(e) => setNovoServico({ ...novoServico, duracao: e.target.value })}
                          placeholder="30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preco-servico">Preço (R$)</Label>
                      <Input
                        id="preco-servico"
                        type="number"
                        min="0"
                        step="0.01"
                        value={novoServico.preco}
                        onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao-servico">Descrição</Label>
                      <Textarea
                        id="descricao-servico"
                        value={novoServico.descricao}
                        onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                        placeholder="Detalhes sobre o serviço..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogNovoServico(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCriarServico}>
                      Criar Serviço
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogEntradaEstoque} onOpenChange={setDialogEntradaEstoque}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    Entrada
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <Select value={entradaEstoque.produtoId} onValueChange={(v) => setEntradaEstoque({ ...entradaEstoque, produtoId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.filter(p => p.ativo).map(produto => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} (Estoque atual: {produto.estoque})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidade-entrada">Quantidade *</Label>
                      <Input
                        id="quantidade-entrada"
                        type="number"
                        min="1"
                        value={entradaEstoque.quantidade}
                        onChange={(e) => setEntradaEstoque({ ...entradaEstoque, quantidade: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor-pago">Valor Pago (R$)</Label>
                        <Input
                          id="valor-pago"
                          type="number"
                          min="0"
                          step="0.01"
                          value={entradaEstoque.valorPago}
                          onChange={(e) => setEntradaEstoque({ ...entradaEstoque, valorPago: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valor-venda">Preço de Venda (R$)</Label>
                        <Input
                          id="valor-venda"
                          type="number"
                          min="0"
                          step="0.01"
                          value={entradaEstoque.valorVenda}
                          onChange={(e) => setEntradaEstoque({ ...entradaEstoque, valorVenda: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {entradaEstoque.valorPago && entradaEstoque.valorVenda && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Margem de Lucro:</span>
                            <span className={cn(
                              "text-xl font-bold",
                              calcularMargemLucro() > 0 ? "text-green-600" : "text-destructive"
                            )}>
                              <Percent className="inline h-4 w-4 mr-1" />
                              {calcularMargemLucro().toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Lucro por unidade:</span>
                            <span className="font-medium">
                              R$ {((Number.parseFloat(entradaEstoque.valorVenda) || 0) - (Number.parseFloat(entradaEstoque.valorPago) || 0)).toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogEntradaEstoque(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEntradaEstoque}>
                      Confirmar Entrada
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs Principal */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="produtos" className="gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="servicos" className="gap-2">
                <Wrench className="h-4 w-4" />
                Serviços
              </TabsTrigger>
              <TabsTrigger value="movimentacoes" className="gap-2">
                <History className="h-4 w-4" />
                Movimentações
              </TabsTrigger>
              <TabsTrigger value="perdas" className="gap-2">
                <XCircle className="h-4 w-4" />
                Perdas
              </TabsTrigger>
            </TabsList>

            {/* Tab Produtos */}
            <TabsContent value="produtos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Produtos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {produtosFiltrados.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum produto encontrado
                      </p>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <div
                          key={produto.id}
                          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium">{produto.nome}</h3>
                              <Badge variant="outline">{produto.categoria}</Badge>
                              {produto.estoque < 20 && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Baixo
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                              <span>Código: {produto.codigo}</span>
                              <span>•</span>
                              <span>Preço: R$ {produto.preco.toFixed(2)}</span>
                              <span>•</span>
                              <span>Custo: R$ {produto.custoUnitario.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Estoque</p>
                              <p className={cn(
                                "text-2xl font-bold",
                                produto.estoque < 20 ? "text-destructive" : "text-foreground"
                              )}>
                                {produto.estoque}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setProdutoEditando(produto)
                                  setDialogEditarProduto(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeletarProduto(produto.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Serviços */}
            <TabsContent value="servicos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {servicosFiltrados.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum serviço encontrado
                      </p>
                    ) : (
                      servicosFiltrados.map((servico) => (
                        <div
                          key={servico.id}
                          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium">{servico.nome}</h3>
                              <Badge variant="secondary">{servico.categoria}</Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                              <span>Código: {servico.codigo}</span>
                              {servico.duracao && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {servico.duracao} min
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                R$ {servico.preco.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setServicoEditando(servico)
                                setDialogEditarServico(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeletarServico(servico.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Movimentações */}
            <TabsContent value="movimentacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma movimentação registrada
                    </p>
                    {/* TODO: Implementar histórico de movimentações */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Perdas */}
            <TabsContent value="perdas" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={dialogNovaPerda} onOpenChange={setDialogNovaPerda}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Registrar Perda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Perda</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Linha 1: Tipo e Produto/Serviço */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo *</Label>
                          <Select value={novaPerda.tipo} onValueChange={(v) => setNovaPerda({ ...novaPerda, tipo: v as 'produto' | 'servico', produtoId: "", valor: "" })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="produto">Produto</SelectItem>
                              <SelectItem value="servico">Serviço</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{novaPerda.tipo === 'produto' ? 'Produto' : 'Serviço'} *</Label>
                          <Select value={novaPerda.produtoId} onValueChange={(v) => {
                            setNovaPerda({ ...novaPerda, produtoId: v })
                            // Auto-preencher valor baseado no custo do item selecionado
                            if (novaPerda.tipo === 'produto') {
                              const prod = produtos.find(p => p.id === v)
                              if (prod) setNovaPerda(prev => ({ ...prev, valor: prod.custoUnitario.toString() }))
                            } else {
                              const serv = servicos.find(s => s.id === v)
                              if (serv) setNovaPerda(prev => ({ ...prev, valor: serv.preco.toString() }))
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder={`Selecione o ${novaPerda.tipo}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {novaPerda.tipo === 'produto' ? (
                                produtos.filter(p => p.ativo).map(produto => (
                                  <SelectItem key={produto.id} value={produto.id}>
                                    {produto.nome} - Custo: R$ {produto.custoUnitario.toFixed(2)}
                                  </SelectItem>
                                ))
                              ) : (
                                servicos.filter(s => s.ativo).map(servico => (
                                  <SelectItem key={servico.id} value={servico.id}>
                                    {servico.nome} - Preço: R$ {servico.preco.toFixed(2)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Linha 2: Valor Unitário */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="valor-perda">Valor Unitário (R$) *</Label>
                          <div className="flex gap-2 bg-gray-100 rounded-md p-1">
                            <button
                              onClick={() => {
                                setPerdaTipoValor('custo')
                                if (novaPerda.produtoId) {
                                  if (novaPerda.tipo === 'produto') {
                                    const prod = produtos.find(p => p.id === novaPerda.produtoId)
                                    if (prod) setNovaPerda(prev => ({ ...prev, valor: prod.custoUnitario.toString() }))
                                  } else {
                                    const serv = servicos.find(s => s.id === novaPerda.produtoId)
                                    if (serv) setNovaPerda(prev => ({ ...prev, valor: serv.preco.toString() }))
                                  }
                                }
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                perdaTipoValor === 'custo'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Custo
                            </button>
                            <button
                              onClick={() => {
                                setPerdaTipoValor('preco')
                                if (novaPerda.produtoId) {
                                  if (novaPerda.tipo === 'produto') {
                                    const prod = produtos.find(p => p.id === novaPerda.produtoId)
                                    if (prod) setNovaPerda(prev => ({ ...prev, valor: prod.preco.toString() }))
                                  } else {
                                    const serv = servicos.find(s => s.id === novaPerda.produtoId)
                                    if (serv) setNovaPerda(prev => ({ ...prev, valor: serv.preco.toString() }))
                                  }
                                }
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                perdaTipoValor === 'preco'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Valor Final
                            </button>
                          </div>
                        </div>
                        <Input
                          id="valor-perda"
                          type="number"
                          step="0.01"
                          min="0"
                          value={novaPerda.valor}
                          onChange={(e) => setNovaPerda({ ...novaPerda, valor: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Linha 3: Quantidade */}
                      <div className="space-y-2">
                        <Label htmlFor="quantidade-perda">Quantidade *</Label>
                        <Input
                          id="quantidade-perda"
                          type="number"
                          min="1"
                          value={novaPerda.quantidade}
                          onChange={(e) => setNovaPerda({ ...novaPerda, quantidade: e.target.value })}
                        />
                      </div>

                      {/* Linha 4: Total da Perda (calculado automaticamente) */}
                      {novaPerda.valor && novaPerda.quantidade && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="text-sm font-medium text-blue-900">
                            Total da Perda: R$ {(Number.parseFloat(novaPerda.valor) * Number.parseInt(novaPerda.quantidade)).toFixed(2)}
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            {novaPerda.valor} × {novaPerda.quantidade} unidades
                          </div>
                        </div>
                      )}

                      {/* Linha 5: Funcionário e Categoria */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Funcionário Responsável *</Label>
                          <Select value={novaPerda.funcionarioId} onValueChange={(v) => setNovaPerda({ ...novaPerda, funcionarioId: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o funcionário" />
                            </SelectTrigger>
                            <SelectContent>
                              {funcionarios.filter(f => f.ativo).map(func => (
                                <SelectItem key={func.id} value={func.id}>
                                  {func.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Categoria *</Label>
                          <Select value={novaPerda.categoriaId} onValueChange={(v) => setNovaPerda({ ...novaPerda, categoriaId: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasPerdas.filter(c => c.ativo).map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                                    {cat.nome}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacoes-perda">Observações</Label>
                        <Textarea
                          id="observacoes-perda"
                          value={novaPerda.observacoes}
                          onChange={(e) => setNovaPerda({ ...novaPerda, observacoes: e.target.value })}
                          placeholder="Detalhes adicionais..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogNovaPerda(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleRegistrarPerda} className="bg-orange-500 hover:bg-orange-600">
                        Registrar Perda
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Perdas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {perdas.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma perda registrada
                      </p>
                    ) : (
                      perdas.map((perda) => (
                        <div
                          key={perda.id}
                          className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20 p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{perda.produtoNome}</h3>
                              <p className="text-sm text-muted-foreground">
                                {perda.quantidade} unidade(s) • {perda.categoria}
                              </p>
                            </div>
                            <Badge variant="destructive">
                              R$ {perda.custoTotal.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>Funcionário: {perda.funcionarioNome}</p>
                            <p>Data: {new Date(perda.data).toLocaleDateString('pt-BR')}</p>
                            {perda.observacoes && <p>Obs: {perda.observacoes}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog Editar Produto */}
      <Dialog open={dialogEditarProduto} onOpenChange={setDialogEditarProduto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {produtoEditando && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={produtoEditando.nome}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={produtoEditando.codigo}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, codigo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={produtoEditando.categoria}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, categoria: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque</Label>
                  <Input
                    type="number"
                    value={produtoEditando.estoque}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, estoque: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custo Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtoEditando.custoUnitario}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, custoUnitario: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtoEditando.preco}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, preco: Number.parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={produtoEditando.descricao || ""}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEditarProduto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAtualizarProduto}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Serviço */}
      <Dialog open={dialogEditarServico} onOpenChange={setDialogEditarServico}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          {servicoEditando && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={servicoEditando.nome}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={servicoEditando.codigo}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, codigo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={servicoEditando.categoria}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, categoria: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={servicoEditando.duracao || ""}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, duracao: Number.parseInt(e.target.value) || null })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={servicoEditando.preco}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, preco: Number.parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={servicoEditando.descricao || ""}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, descricao: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEditarServico(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAtualizarServico}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
