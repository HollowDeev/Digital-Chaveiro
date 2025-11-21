"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, User, Store, Eye, EyeOff, Copy, Trash2, Plus, Code } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ConfiguracaoPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Dados da Conta
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [emailUsuario, setEmailUsuario] = useState("")
  const [msgConta, setMsgConta] = useState("")

  // Dados da Loja
  const [stores, setStores] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [nomeLoja, setNomeLoja] = useState("")
  const [telefoneLoja, setTelefoneLoja] = useState("")
  const [emailLoja, setEmailLoja] = useState("")
  const [msgLoja, setMsgLoja] = useState("")
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [codigosDialogOpen, setCodigosDialogOpen] = useState(false)
  const [codigos, setCodigos] = useState<any[]>([])
  const [novoCodigoHoras, setNovoCodigoHoras] = useState(24)

  useEffect(() => {
    loadConta()
    fetchStores()
  }, [])

  // Funções da Conta
  async function loadConta() {
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) return
    setNomeUsuario((user.user_metadata as any)?.nome || "")
    setEmailUsuario(user.email || "")
  }

  async function saveConta() {
    setLoading(true)
    setMsgConta("")
    try {
      const { data, error } = await supabase.auth.updateUser({ data: { nome: nomeUsuario } })
      if (error) throw error
      setMsgConta("Dados atualizados")
    } catch (err: any) {
      setMsgConta(err.message || "Erro")
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    const confirmLogout = confirm("Tem certeza que deseja sair?")
    if (!confirmLogout) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/auth/login")
    } catch (err: any) {
      setMsgConta(err.message || "Erro ao sair")
    } finally {
      setLoading(false)
    }
  }

  // Funções da Loja
  async function fetchStores() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return

    const { data: donoStores } = await supabase.from("lojas").select("*").eq("dono_id", user.id)
    const { data: acessos } = await supabase.from("lojas_usuarios").select("loja_id").eq("usuario_id", user.id)

    const acessosIds = (acessos || []).map((a: any) => a.loja_id)
    const { data: outrasLojas } = await supabase.from("lojas").select("*").in("id", acessosIds || [])

    const all = [...(donoStores || []), ...(outrasLojas || [])]
    setStores(all)
    if (all.length > 0) selectStore(all[0])
    setLoading(false)
  }

  function selectStore(s: any) {
    setSelected(s)
    setNomeLoja(s.nome || "")
    setTelefoneLoja(s.telefone || "")
    setEmailLoja(s.email || "")
    fetchUsuarios(s.id)
    fetchCodigos(s.id)
  }

  async function saveLoja() {
    if (!selected) return
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) throw new Error("Usuário não autenticado")

      if (selected.dono_id !== user.id) {
        setMsgLoja("Apenas o dono pode alterar os dados da loja")
        return
      }

      const { error } = await supabase
        .from("lojas")
        .update({ nome: nomeLoja, telefone: telefoneLoja, email: emailLoja })
        .eq("id", selected.id)
      if (error) throw error
      setMsgLoja("Dados atualizados")
      fetchStores()
    } catch (err: any) {
      setMsgLoja(err.message || "Erro")
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsuarios(lojaId: string) {
    const { data } = await supabase.from("lojas_usuarios").select("*").eq("loja_id", lojaId)
    setUsuarios(data || [])
  }

  async function fetchCodigos(lojaId: string) {
    const { data } = await supabase.from("loja_access_codes").select("*").eq("loja_id", lojaId).order("created_at", { ascending: false })
    setCodigos(data || [])
  }

  async function gerarCodigo() {
    if (!selected) return
    setLoading(true)
    setMsgLoja("")
    try {
      const res = await fetch("/api/lojas/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lojaId: selected.id, hours: novoCodigoHoras }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao gerar código")
      setMsgLoja(`Código gerado: ${data.codigo}`)
      fetchCodigos(selected.id)
    } catch (err: any) {
      setMsgLoja(err.message || "Erro")
    } finally {
      setLoading(false)
    }
  }

  async function removerUsuario(usuarioId: string) {
    if (!selected) return
    const confirm = window.confirm("Tem certeza que deseja remover este usuário?")
    if (!confirm) return
    setLoading(true)
    try {
      const res = await fetch("/api/lojas/remove-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lojaId: selected.id, usuarioId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao remover usuário")
      setMsgLoja("Usuário removido")
      fetchUsuarios(selected.id)
    } catch (err: any) {
      setMsgLoja(err.message || "Erro")
    } finally {
      setLoading(false)
    }
  }

  async function revogarCodigo(codigoId: string) {
    setLoading(true)
    try {
      const { error } = await supabase.from("loja_access_codes").update({ revoked: true }).eq("id", codigoId)
      if (error) throw error
      setMsgLoja("Código revogado")
      if (selected) fetchCodigos(selected.id)
    } catch (err: any) {
      setMsgLoja(err.message || "Erro")
    } finally {
      setLoading(false)
    }
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo)
    setMsgLoja("Código copiado!")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <PageHeader
          title="Configurações"
          subtitle="Gerencie sua conta e configurações da loja"
          icon={<Settings className="h-5 w-5 lg:h-6 lg:w-6" />}
        />

        <div className="space-y-4 p-4 lg:space-y-6 lg:p-8">
          <Tabs defaultValue="conta" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conta">
                <User className="mr-2 h-4 w-4" />
                Minha Conta
              </TabsTrigger>
              <TabsTrigger value="loja">
                <Store className="mr-2 h-4 w-4" />
                Loja
              </TabsTrigger>
            </TabsList>

            {/* Tab Conta */}
            <TabsContent value="conta" className="space-y-4 mt-4">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="emailUsuario">Email (não editável)</Label>
                      <Input id="emailUsuario" value={emailUsuario} disabled />
                    </div>

                    <div>
                      <Label htmlFor="nomeUsuario">Nome</Label>
                      <Input id="nomeUsuario" value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={saveConta} disabled={loading}>
                        Salvar
                      </Button>
                      <Button variant="ghost" className="ml-auto" onClick={logout} disabled={loading}>
                        Logout
                      </Button>
                    </div>

                    {msgConta && <div className="p-2 rounded bg-muted/30">{msgConta}</div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Loja */}
            <TabsContent value="loja" className="space-y-4 mt-4">
              {/* Seleção de Loja */}
              {stores.length > 1 && (
                <Card>
                  <CardContent className="pt-4">
                    <Label>Selecione a Loja</Label>
                    <div className="flex gap-2 mt-2">
                      {stores.map((s) => (
                        <Button
                          key={s.id}
                          variant={selected?.id === s.id ? "default" : "outline"}
                          onClick={() => selectStore(s)}
                        >
                          {s.nome}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dados da Loja */}
              {selected && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados da Loja</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="nomeLoja">Nome da Loja</Label>
                        <Input id="nomeLoja" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} />
                      </div>

                      <div>
                        <Label htmlFor="telefoneLoja">Telefone</Label>
                        <Input id="telefoneLoja" value={telefoneLoja} onChange={(e) => setTelefoneLoja(e.target.value)} />
                      </div>

                      <div>
                        <Label htmlFor="emailLoja">Email</Label>
                        <Input id="emailLoja" value={emailLoja} onChange={(e) => setEmailLoja(e.target.value)} />
                      </div>

                      <Button onClick={saveLoja} disabled={loading}>
                        Salvar
                      </Button>

                      {msgLoja && <div className="p-2 rounded bg-muted/30">{msgLoja}</div>}
                    </CardContent>
                  </Card>

                  {/* Usuários */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Usuários da Loja</CardTitle>
                        <Dialog open={codigosDialogOpen} onOpenChange={setCodigosDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Gerar Código de Acesso
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gerar Código de Acesso</DialogTitle>
                              <DialogDescription>Crie um código para convidar novos usuários</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="horas">Validade (horas)</Label>
                                <Input
                                  id="horas"
                                  type="number"
                                  value={novoCodigoHoras}
                                  onChange={(e) => setNovoCodigoHoras(Number(e.target.value))}
                                  min={1}
                                  max={168}
                                />
                              </div>
                              <Button onClick={gerarCodigo} disabled={loading} className="w-full">
                                Gerar Código
                              </Button>

                              {/* Lista de códigos */}
                              <div className="mt-4 space-y-2">
                                <h4 className="text-sm font-medium">Códigos Gerados</h4>
                                {codigos.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Nenhum código gerado</p>
                                ) : (
                                  codigos.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between rounded border p-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <Code className="h-4 w-4" />
                                          <span className="font-mono text-sm">{c.codigo}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          Expira: {new Date(c.expires_at).toLocaleString("pt-BR")}
                                          {c.revoked && " (Revogado)"}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => copiarCodigo(c.codigo)}>
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        {!c.revoked && (
                                          <Button size="sm" variant="ghost" onClick={() => revogarCodigo(c.id)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {usuarios.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum usuário vinculado</p>
                        ) : (
                          usuarios.map((u) => (
                            <div key={u.id} className="flex items-center justify-between rounded border p-3">
                              <div>
                                <p className="font-medium">Usuário {u.usuario_id.substring(0, 8)}</p>
                                <p className="text-xs text-muted-foreground capitalize">{u.nivel_acesso}</p>
                              </div>
                              {selected.dono_id !== u.usuario_id && (
                                <Button size="sm" variant="ghost" onClick={() => removerUsuario(u.usuario_id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
