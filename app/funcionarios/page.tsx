"use client"

import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useFuncionarios } from "@/lib/hooks/useLojaData"
import { UserCircle, Search, Mail, Phone, Eye, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function FuncionariosPage() {
  const [lojaId, setLojaId] = useState<string | undefined>()
  const { funcionarios, refetch: refetchFuncionarios } = useFuncionarios(lojaId)
  const [busca, setBusca] = useState("")
  
  // Estados do Dialog
  const [dialogNovoFuncionario, setDialogNovoFuncionario] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [novoFuncionario, setNovoFuncionario] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    cargo: "Funcionário",
    salario: ""
  })
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")

  // Toast
  const mostrarToast = (mensagem: string, tipo: "success" | "error" = "success") => {
    setToastMessage(mensagem)
    setToastType(tipo)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Função para adicionar funcionário
  const handleAdicionarFuncionario = async () => {
    if (!lojaId || !novoFuncionario.nome || !novoFuncionario.email || !novoFuncionario.senha) {
      mostrarToast("Preencha nome, email e senha", "error")
      return
    }

    setSalvando(true)
    try {
      // Chamar API para criar o usuário no Auth e na tabela
      const res = await fetch("/api/lojas/create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojaId,
          email: novoFuncionario.email,
          password: novoFuncionario.senha
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message || "Erro ao criar funcionário")
      }

      // Atualizar os dados adicionais do funcionário na tabela lojas_usuarios
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("lojas_usuarios")
        .update({
          nome: novoFuncionario.nome,
          email: novoFuncionario.email,
          telefone: novoFuncionario.telefone,
          cargo: novoFuncionario.cargo,
          salario: parseFloat(novoFuncionario.salario) || 0,
          data_admissao: new Date().toISOString().split("T")[0],
          ativo: true
        })
        .eq("usuario_id", result.userId)
        .eq("loja_id", lojaId)

      if (updateError) {
        console.error("Erro ao atualizar dados:", updateError)
      }

      mostrarToast("Funcionário adicionado com sucesso!")
      setDialogNovoFuncionario(false)
      setNovoFuncionario({ nome: "", email: "", senha: "", telefone: "", cargo: "Funcionário", salario: "" })
      refetchFuncionarios()
    } catch (err: any) {
      console.error("Erro:", err)
      mostrarToast(err.message || "Erro ao adicionar funcionário", "error")
    } finally {
      setSalvando(false)
    }
  }

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

  const funcionariosFiltrados = funcionarios.filter(
    (f) =>
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.email.toLowerCase().includes(busca.toLowerCase()) ||
      f.cargo.toLowerCase().includes(busca.toLowerCase()),
  )

  const funcionariosAtivos = funcionarios.filter((f) => f.ativo).length
  const folhaPagamento = funcionarios.filter((f) => f.ativo).reduce((acc, f) => acc + f.salario, 0)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Gestão de Funcionários"
          subtitle="Controle de equipe e folha de pagamento"
          icon={<UserCircle className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setDialogNovoFuncionario(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Funcionário
            </Button>
          }
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Funcionários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{funcionariosAtivos}</div>
                <p className="text-sm text-muted-foreground">Colaboradores na equipe</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Folha de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">R$ {folhaPagamento.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Total mensal</p>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <Card className="overflow-hidden">
            <CardContent className="pt-4 lg:pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou cargo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Funcionários */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm lg:text-base">Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funcionariosFiltrados.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum funcionário encontrado</p>
                ) : (
                  funcionariosFiltrados.map((funcionario) => (
                    <div
                      key={funcionario.id}
                      className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/5 lg:flex-row lg:items-center lg:gap-4 lg:p-4"
                    >
                      <Avatar className="h-10 w-10 lg:h-12 lg:w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm">
                          {funcionario.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium lg:text-base break-words">{funcionario.nome}</h3>
                          <Badge
                            variant={funcionario.ativo ? "default" : "secondary"}
                            className="text-xs flex-shrink-0"
                          >
                            {funcionario.cargo}
                          </Badge>
                          {!funcionario.ativo && (
                            <Badge variant="destructive" className="text-xs flex-shrink-0">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground lg:text-sm">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{funcionario.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground lg:text-sm">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{funcionario.telefone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 lg:gap-4">
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-muted-foreground lg:text-sm">Salário</p>
                          <p className="text-lg font-bold text-foreground lg:text-xl">
                            R$ {funcionario.salario.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Desde {new Date(funcionario.dataAdmissao).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Link href={`/funcionarios/${funcionario.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Histórico
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog Novo Funcionário */}
        <Dialog open={dialogNovoFuncionario} onOpenChange={setDialogNovoFuncionario}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  placeholder="Nome do funcionário"
                  value={novoFuncionario.nome}
                  onChange={(e) => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={novoFuncionario.email}
                  onChange={(e) => setNovoFuncionario({ ...novoFuncionario, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha de Acesso *</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={novoFuncionario.senha}
                  onChange={(e) => setNovoFuncionario({ ...novoFuncionario, senha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={novoFuncionario.telefone}
                  onChange={(e) => setNovoFuncionario({ ...novoFuncionario, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={novoFuncionario.cargo}
                  onValueChange={(value) => setNovoFuncionario({ ...novoFuncionario, cargo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Funcionário">Funcionário</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Chaveiro">Chaveiro</SelectItem>
                    <SelectItem value="Atendente">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salario">Salário Mensal (R$)</Label>
                <Input
                  id="salario"
                  type="number"
                  placeholder="0.00"
                  value={novoFuncionario.salario}
                  onChange={(e) => setNovoFuncionario({ ...novoFuncionario, salario: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogNovoFuncionario(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionarFuncionario} disabled={salvando}>
                {salvando ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toast de Notificação */}
        {showToast && (
          <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${
            toastType === "success" ? "bg-green-600" : "bg-red-600"
          } text-white`}>
            {toastMessage}
          </div>
        )}
      </main>
    </div>
  )
}
