"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useClientes } from "@/lib/hooks/useLojaData"
import { useLoja } from "@/lib/contexts/loja-context"
import { Users, Search, Mail, Phone, Trash2, Edit2, Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ClientesPage() {
  const { lojaAtual } = useLoja()
  const lojaId = lojaAtual?.id
  const { clientes, loading, refetch } = useClientes(lojaId)
  const [busca, setBusca] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [salvando, setSalvando] = useState(false)
  const [carregandoCEP, setCarregandoCEP] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    tipo: "pf" as "pf" | "pj",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
  })

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email?.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone?.includes(busca) ||
      c.cpf_cnpj?.includes(busca),
  )

  const handleNovoCliente = () => {
    setClienteSelecionado(null)
    setErros({})
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      cpf_cnpj: "",
      tipo: "pf",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      observacoes: "",
    })
    setModalAberto(true)
  }

  const handleEditarCliente = (cliente: any) => {
    setClienteSelecionado(cliente)
    setErros({})
    setFormData({
      nome: cliente.nome,
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      cpf_cnpj: cliente.cpf_cnpj || "",
      tipo: cliente.tipo || "pf",
      endereco: cliente.endereco || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      cep: cliente.cep || "",
      observacoes: cliente.observacoes || "",
    })
    setModalAberto(true)
  }

  // Validadores
  const validarCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, "")
    if (cleaned.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleaned)) return false

    let sum = 0
    let remainder
    for (let i = 1; i <= 9; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i)
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i)
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false

    return true
  }

  const validarCNPJ = (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, "")
    if (cleaned.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cleaned)) return false

    let size = cleaned.length - 2
    let numbers = cleaned.substring(0, size)
    let digits = cleaned.substring(size)
    let sum = 0
    let pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--
      if (pos < 2) pos = 9
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(0))) return false

    size = size + 1
    numbers = cleaned.substring(0, size)
    sum = 0
    pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--
      if (pos < 2) pos = 9
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(1))) return false

    return true
  }

  const buscarCEP = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "")
    if (cleaned.length !== 8) {
      setErros((prev) => ({ ...prev, cep: "CEP deve ter 8 dígitos" }))
      return
    }

    setCarregandoCEP(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await response.json()

      if (data.erro) {
        setErros((prev) => ({ ...prev, cep: "CEP não encontrado" }))
      } else {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }))
        setErros((prev) => ({ ...prev, cep: "" }))
      }
    } catch (error) {
      setErros((prev) => ({ ...prev, cep: "Erro ao buscar CEP" }))
    } finally {
      setCarregandoCEP(false)
    }
  }

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}

    if (!formData.nome.trim()) {
      novosErros.nome = "Nome é obrigatório"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      novosErros.email = "Email inválido"
    }

    if (formData.telefone && formData.telefone.replace(/\D/g, "").length > 0) {
      const telefoneLimpo = formData.telefone.replace(/\D/g, "")
      if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
        novosErros.telefone = "Telefone deve ter 10 ou 11 dígitos"
      }
    }

    if (formData.cpf_cnpj && formData.cpf_cnpj.replace(/\D/g, "").length > 0) {
      if (formData.tipo === "pf" && !validarCPF(formData.cpf_cnpj)) {
        novosErros.cpf_cnpj = "CPF inválido"
      } else if (formData.tipo === "pj" && !validarCNPJ(formData.cpf_cnpj)) {
        novosErros.cpf_cnpj = "CNPJ inválido"
      }
    }

    if (formData.estado && formData.estado.length !== 2) {
      novosErros.estado = "Estado deve ter 2 caracteres (ex: SP)"
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  // Formatadores
  const formatarTelefone = (valor: string): string => {
    const limpo = valor.replace(/\D/g, "")
    if (limpo.length === 0) return ""
    if (limpo.length <= 2) return limpo
    if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`
    if (limpo.length <= 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`
  }

  const formatarCPF = (valor: string): string => {
    const limpo = valor.replace(/\D/g, "")
    if (limpo.length === 0) return ""
    if (limpo.length <= 3) return limpo
    if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`
    if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`
    return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`
  }

  const formatarCNPJ = (valor: string): string => {
    const limpo = valor.replace(/\D/g, "")
    if (limpo.length === 0) return ""
    if (limpo.length <= 2) return limpo
    if (limpo.length <= 5) return `${limpo.slice(0, 2)}.${limpo.slice(2)}`
    if (limpo.length <= 8) return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5)}`
    if (limpo.length <= 12) return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8)}`
    return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12, 14)}`
  }

  const formatarCEP = (valor: string): string => {
    const limpo = valor.replace(/\D/g, "")
    if (limpo.length === 0) return ""
    if (limpo.length <= 5) return limpo
    return `${limpo.slice(0, 5)}-${limpo.slice(5, 8)}`
  }

  const handleSalvarCliente = async () => {
    if (!validarFormulario()) {
      return
    }

    if (!lojaId) return

    setSalvando(true)
    try {
      const supabase = createClient()

      if (clienteSelecionado) {
        // Atualizar
        const { error } = await supabase
          .from("clientes")
          .update(formData)
          .eq("id", clienteSelecionado.id)

        if (error) throw error
        alert("Cliente atualizado com sucesso!")
      } else {
        // Criar
        const { error } = await supabase.from("clientes").insert([
          {
            ...formData,
            loja_id: lojaId,
            ativo: true,
          },
        ])

        if (error) throw error
        alert("Cliente cadastrado com sucesso!")
      }

      setModalAberto(false)
      refetch()
    } catch (error: any) {
      alert(`Erro ao salvar cliente: ${error?.message || "Erro desconhecido"}`)
    } finally {
      setSalvando(false)
    }
  }

  const handleDeletarCliente = async (clienteId: string) => {
    if (!confirm("Tem certeza que deseja deletar este cliente?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("clientes").delete().eq("id", clienteId)

      if (error) throw error
      alert("Cliente deletado com sucesso!")
      refetch()
    } catch (error: any) {
      alert(`Erro ao deletar cliente: ${error?.message || "Erro desconhecido"}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="flex h-screen items-center justify-center">
            <p>Carregando clientes...</p>
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
          title="Gestão de Clientes"
          subtitle="Cadastro e histórico de clientes"
          icon={<Users className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <Button
              onClick={handleNovoCliente}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          }
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
                        <div className="text-left lg:text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground lg:text-sm">CPF/CNPJ</p>
                          <p className="text-xs font-medium lg:text-sm">
                            {cliente.cpf_cnpj || "—"}
                          </p>
                          {cliente.tipo && (
                            <p className="text-xs text-muted-foreground">
                              {cliente.tipo === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarCliente(cliente)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletarCliente(cliente.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Modal de Cadastro/Edição */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {clienteSelecionado ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {clienteSelecionado
                  ? "Atualize as informações do cliente"
                  : "Cadastre um novo cliente na loja"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value })
                    if (erros.nome) setErros((prev) => ({ ...prev, nome: "" }))
                  }}
                  placeholder="Nome completo"
                  className={erros.nome ? "border-red-500" : ""}
                />
                {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
              </div>

              {/* Tipo */}
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* CPF/CNPJ */}
              <div>
                <Label htmlFor="cpf_cnpj">
                  {formData.tipo === "pf" ? "CPF" : "CNPJ"}
                </Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => {
                    const limpo = e.target.value.replace(/\D/g, "")
                    if (formData.tipo === "pf") {
                      if (limpo.length <= 11) {
                        const formatado = formatarCPF(limpo)
                        setFormData({ ...formData, cpf_cnpj: formatado })
                        if (erros.cpf_cnpj) setErros((prev) => ({ ...prev, cpf_cnpj: "" }))
                      }
                    } else {
                      if (limpo.length <= 14) {
                        const formatado = formatarCNPJ(limpo)
                        setFormData({ ...formData, cpf_cnpj: formatado })
                        if (erros.cpf_cnpj) setErros((prev) => ({ ...prev, cpf_cnpj: "" }))
                      }
                    }
                  }}
                  placeholder={formData.tipo === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  className={erros.cpf_cnpj ? "border-red-500" : ""}
                />
                {erros.cpf_cnpj && <p className="text-xs text-red-500 mt-1">{erros.cpf_cnpj}</p>}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (erros.email) setErros((prev) => ({ ...prev, email: "" }))
                  }}
                  placeholder="cliente@exemplo.com"
                  className={erros.email ? "border-red-500" : ""}
                />
                {erros.email && <p className="text-xs text-red-500 mt-1">{erros.email}</p>}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => {
                    const limpo = e.target.value.replace(/\D/g, "")
                    if (limpo.length <= 11) {
                      const formatado = formatarTelefone(limpo)
                      setFormData({ ...formData, telefone: formatado })
                      if (erros.telefone) setErros((prev) => ({ ...prev, telefone: "" }))
                    }
                  }}
                  placeholder="(11) 99999-9999"
                  className={erros.telefone ? "border-red-500" : ""}
                />
                {erros.telefone && <p className="text-xs text-red-500 mt-1">{erros.telefone}</p>}
              </div>

              {/* Endereço */}
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                  placeholder="Rua, número"
                />
              </div>

              {/* Cidade */}
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                  placeholder="São Paulo"
                />
              </div>

              {/* Estado */}
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => {
                    setFormData({ ...formData, estado: e.target.value.toUpperCase() })
                    if (erros.estado) setErros((prev) => ({ ...prev, estado: "" }))
                  }}
                  placeholder="SP"
                  maxLength={2}
                  className={erros.estado ? "border-red-500" : ""}
                />
                {erros.estado && <p className="text-xs text-red-500 mt-1">{erros.estado}</p>}
              </div>

              {/* CEP */}
              <div>
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => {
                      const limpo = e.target.value.replace(/\D/g, "")
                      if (limpo.length <= 8) {
                        const formatado = formatarCEP(limpo)
                        setFormData({ ...formData, cep: formatado })
                        if (erros.cep) setErros((prev) => ({ ...prev, cep: "" }))
                      }
                    }}
                    placeholder="00000-000"
                    className={erros.cep ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => buscarCEP(formData.cep)}
                    disabled={carregandoCEP || !formData.cep}
                  >
                    {carregandoCEP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>
                {erros.cep && <p className="text-xs text-red-500 mt-1">{erros.cep}</p>}
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Notas sobre o cliente"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarCliente} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
