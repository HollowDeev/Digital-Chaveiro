"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useProdutos } from "@/lib/hooks/useLojaData"
import { Package, Search, AlertTriangle } from "lucide-react"
import { useStore } from "@/lib/store"

export default function EstoquePage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { produtos } = useProdutos(lojaId)
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

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase()),
  )

  const produtosBaixoEstoque = produtos.filter((p) => p.estoque < 20 && p.ativo).length
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + p.custoUnitario * p.estoque, 0)
  const totalProdutos = produtos.filter((p) => p.ativo).length

  return (
    <div className="flex min-h-screen bg-background relative">
      <Sidebar />
      <main className={`flex-1 lg:ml-64 ${modalCaixa ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <PageHeader
          title="Gestão de Estoque"
          subtitle="Controle de produtos e inventário"
          icon={<Package className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">Adicionar Produto</Button>}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground lg:text-sm">
                  Total de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground lg:text-3xl">{totalProdutos}</div>
                <p className="text-xs text-muted-foreground lg:text-sm">Produtos ativos</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground lg:text-sm">Valor do Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground lg:text-3xl">R$ {valorTotalEstoque.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground lg:text-sm">Valor total em estoque</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-medium text-destructive lg:text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Baixo Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive lg:text-3xl">{produtosBaixoEstoque}</div>
                <p className="text-xs text-muted-foreground lg:text-sm">Produtos com estoque baixo</p>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
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

          {/* Lista de Produtos */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Produtos em Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {produtosFiltrados.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado</p>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-accent/5 lg:flex-row lg:items-center lg:justify-between lg:p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium lg:text-base">{produto.nome}</h3>
                          <Badge variant="outline" className="text-xs">
                            {produto.categoria}
                          </Badge>
                          {produto.estoque < 20 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Baixo
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                          <span>Código: {produto.codigo}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Preço: R$ {produto.preco.toFixed(2)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Custo: R$ {produto.custoUnitario.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 lg:justify-end lg:gap-6">
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-muted-foreground lg:text-sm">Estoque</p>
                          <p
                            className={`text-xl font-bold lg:text-2xl ${produto.estoque < 20 ? "text-destructive" : "text-foreground"}`}
                          >
                            {produto.estoque}
                          </p>
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
