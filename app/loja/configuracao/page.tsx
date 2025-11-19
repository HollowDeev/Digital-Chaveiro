"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Store, Eye, EyeOff, Copy, Trash2, Plus, CheckCircle2, Clock, Code } from "lucide-react"

export default function LojaConfiguracaoPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [credenciais, setCredenciais] = useState<any[]>([])
  const [credEmail, setCredEmail] = useState("")
  const [credSenha, setCredSenha] = useState("")
  const [credSenhaConfirm, setCredSenhaConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [codigosDialogOpen, setCodigosDialogOpen] = useState(false)
  const [codigos, setCodigos] = useState<any[]>([])
  const [novoCodigoHoras, setNovoCodigoHoras] = useState(24)

  useEffect(() => {
    fetchStores()
  }, [])

  async function fetchStores() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return

    // busca lojas onde é dono
    const { data: donoStores } = await supabase.from('lojas').select('*').eq('dono_id', user.id)
    // busca lojas onde tem permissão
    const { data: acessos } = await supabase.from('lojas_usuarios').select('loja_id').eq('usuario_id', user.id)

    const acessosIds = (acessos || []).map((a: any) => a.loja_id)
    const { data: outrasLojas } = await supabase.from('lojas').select('*').in('id', acessosIds || [])

    const all = [...(donoStores || []), ...(outrasLojas || [])]
    setStores(all)
    setLoading(false)
  }

  function selectStore(s: any) {
    setSelected(s)
    setNome(s.nome || "")
    setTelefone(s.telefone || "")
    setEmail(s.email || "")
    fetchUsuarios(s.id)
    fetchCredenciais(s.id)
    fetchCodigos(s.id)
  }

  async function save() {
    if (!selected) return
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) throw new Error('Usuário não autenticado')

      // Apenas donos podem atualizar
      if (selected.dono_id !== user.id) {
        setMensagem('Apenas o dono pode alterar os dados da loja')
        return
      }

      const { error } = await supabase.from('lojas').update({ nome, telefone, email }).eq('id', selected.id)
      if (error) throw error
      setMensagem('Dados atualizados')
      fetchStores()
    } catch (err: any) {
      setMensagem(err.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  async function gerarCodigo() {
    if (!selected) return
    setLoading(true)
    setMensagem("")
    try {
      const res = await fetch('/api/lojas/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lojaId: selected.id, hours: novoCodigoHoras })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Erro')
      setMensagem('✓ Código gerado com sucesso!')
      setNovoCodigoHoras(24)
      setTimeout(() => setMensagem(''), 3000)
      await fetchCodigos(selected.id)
    } catch (err: any) {
      setMensagem('✗ ' + (err.message || 'Erro ao gerar código'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchCodigos(lojaId: string) {
    try {
      const { data } = await supabase.from('loja_access_codes').select('*').eq('loja_id', lojaId).order('created_at', { ascending: false })
      setCodigos(data || [])
    } catch (err) {
      console.error('Erro fetch códigos', err)
      setCodigos([])
    }
  }

  async function fetchUsuarios(lojaId: string) {
    try {
      const { data } = await supabase
        .from('lojas_usuarios')
        .select('id, usuario_id, nivel_acesso')
        .eq('loja_id', lojaId)

      if (!data) {
        setUsuarios([])
        return
      }

      // Buscamos as credenciais desta loja para mapear email / nome
      const { data: creds } = await supabase
        .from('lojas_credenciais_funcionarios')
        .select('id, email, auth_user_id')
        .eq('loja_id', lojaId)

      const credMap = new Map<string, any>()
        ; (creds || []).forEach((c: any) => {
          if (c.auth_user_id) credMap.set(c.auth_user_id, c)
        })

      let usuariosComNome = data.map((u: any) => ({
        ...u,
        displayName: credMap.get(u.usuario_id)?.email || undefined,
        email: credMap.get(u.usuario_id)?.email || undefined,
      }))

      // Para os usuario_ids que não possuem credencial (entraram via código),
      // buscamos no auth.users via endpoint server-side que usa a service role.
      const missing = usuariosComNome.filter((u: any) => !u.email).map((u: any) => u.usuario_id)
      if (missing.length > 0) {
        try {
          const res = await fetch('/api/lojas/users-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: missing })
          })
          if (res.ok) {
            const json = await res.json()
            const map = new Map((json.users || []).map((x: any) => [x.id, x]))
            usuariosComNome = usuariosComNome.map((u: any) => ({
              ...u,
              displayName: u.displayName || (map.get(u.usuario_id) as any)?.displayName,
              email: u.email || (map.get(u.usuario_id) as any)?.email,
            }))
          }
        } catch (e) {
          console.error('Erro ao buscar usuários em auth via endpoint', e)
        }
      }

      setUsuarios(usuariosComNome)
    } catch (err) {
      console.error('Erro fetch usuarios', err)
      setUsuarios([])
    }
  }

  async function fetchCredenciais(lojaId: string) {
    try {
      const { data } = await supabase.from('lojas_credenciais_funcionarios').select('*').eq('loja_id', lojaId)
      setCredenciais(data || [])
    } catch (err) {
      console.error('Erro fetch credenciais', err)
      setCredenciais([])
    }
  }

  async function removeUsuario(id: string) {
    if (!selected) return
    setLoading(true)
    try {
      const { error } = await supabase.from('lojas_usuarios').delete().eq('id', id)
      if (error) throw error
      setMensagem('Usuário removido')
      fetchUsuarios(selected.id)
    } catch (err: any) {
      setMensagem(err.message || 'Erro ao remover usuário')
    } finally {
      setLoading(false)
    }
  }

  async function alterarNivel(id: string, nivel: string) {
    if (!selected) return
    setLoading(true)
    try {
      const { error } = await supabase.from('lojas_usuarios').update({ nivel_acesso: nivel }).eq('id', id)
      if (error) throw error
      setMensagem('Nível atualizado')
      fetchUsuarios(selected.id)
    } catch (err: any) {
      setMensagem(err.message || 'Erro ao atualizar nível')
    } finally {
      setLoading(false)
    }
  }

  async function criarCredencial() {
    if (!selected) return
    if (!credEmail || !credSenha) {
      setMensagem('Email e senha são obrigatórios')
      return
    }
    if (credSenha !== credSenhaConfirm) {
      setMensagem('✗ As senhas não correspondem')
      return
    }
    if (credSenha.length < 6) {
      setMensagem('✗ Senha deve ter no mínimo 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/lojas/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lojaId: selected.id, email: credEmail, password: credSenha }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Erro ao criar credencial')
      setMensagem('✓ Credencial criada com sucesso!')
      setCredEmail('')
      setCredSenha('')
      setCredSenhaConfirm('')
      setTimeout(() => setMensagem(''), 3000)
      fetchCredenciais(selected.id)
    } catch (err: any) {
      setMensagem('✗ ' + (err.message || 'Erro ao criar credencial'))
    } finally {
      setLoading(false)
    }
  }

  async function removerCredencial(credentialId: string) {
    if (!window.confirm('Tem certeza que deseja remover este funcionário? Ele não poderá mais acessar o sistema.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/lojas/remove-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Erro ao remover funcionário')
      setMensagem('✓ Funcionário removido com sucesso!')
      setTimeout(() => setMensagem(''), 3000)
      if (selected) {
        fetchCredenciais(selected.id)
      }
    } catch (err: any) {
      setMensagem('✗ ' + (err.message || 'Erro ao remover funcionário'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        <PageHeader title="Configurações da Loja" subtitle="Gerencie suas lojas, usuários e credenciais" icon={<Store className="h-5 w-5 lg:h-6 lg:w-6" />} />

        <div className="space-y-6 p-4 lg:space-y-8 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Lista de Lojas */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Suas Lojas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stores.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma loja encontrada</p>}
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectStore(s)}
                      className={`w-full text-left p-3 border rounded-lg transition ${selected?.id === s.id
                          ? 'bg-primary/10 border-primary ring-1 ring-primary'
                          : 'hover:bg-muted/50 hover:border-muted-foreground/30'
                        }`}
                    >
                      <div className="font-semibold text-sm">{s.nome}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.cnpj || s.telefone || 'Sem dados'}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Painel Principal */}
            <div className="lg:col-span-3 space-y-6">
              {selected ? (
                <>
                  {/* Dados da Loja */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados da Loja</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                          <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Nome da loja"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                          <Input
                            id="telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            disabled={loading}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contato@loja.com"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={save} disabled={loading}>Salvar Alterações</Button>
                        <Dialog open={codigosDialogOpen} onOpenChange={setCodigosDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" disabled={loading} className="gap-2">
                              <Code className="w-4 h-4" />
                              Gerenciar Códigos
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Códigos de Acesso</DialogTitle>
                              <DialogDescription>
                                Gere e gerencie códigos para que novos funcionários acessem o sistema
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Gerar Novo Código */}
                              <div className="border rounded-lg p-4 bg-muted/50">
                                <h3 className="font-semibold text-sm mb-3">Gerar Novo Código</h3>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <Label htmlFor="horas" className="text-xs">Validade (horas)</Label>
                                    <Input
                                      id="horas"
                                      type="number"
                                      min="1"
                                      max="720"
                                      value={novoCodigoHoras}
                                      onChange={(e) => setNovoCodigoHoras(parseInt(e.target.value) || 24)}
                                      disabled={loading}
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button
                                      onClick={gerarCodigo}
                                      disabled={loading}
                                      className="gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Gerar
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Lista de Códigos */}
                              <div>
                                <h3 className="font-semibold text-sm mb-3">Códigos Criados</h3>
                                {codigos.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum código gerado ainda</p>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {codigos.map((c) => {
                                      const isExpired = c.expires_at && new Date(c.expires_at) < new Date()
                                      const isUsed = c.used

                                      return (
                                        <div
                                          key={c.id}
                                          className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <code className="text-sm font-mono font-bold bg-muted px-2 py-1 rounded">
                                                {c.code}
                                              </code>
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(c.code)
                                                  setMensagem('✓ Código copiado!')
                                                  setTimeout(() => setMensagem(''), 2000)
                                                }}
                                                className="p-1 hover:bg-muted rounded"
                                                title="Copiar código"
                                              >
                                                <Copy className="w-4 h-4" />
                                              </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                              {isUsed ? (
                                                <span className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                  <CheckCircle2 className="w-3 h-3" />
                                                  Utilizado
                                                </span>
                                              ) : isExpired ? (
                                                <span className="flex items-center gap-1 text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                                                  <Clock className="w-3 h-3" />
                                                  Expirado
                                                </span>
                                              ) : (
                                                <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                                                  <Clock className="w-3 h-3" />
                                                  Válido
                                                </span>
                                              )}
                                              <span className="text-xs text-muted-foreground">
                                                {new Date(c.expires_at).toLocaleString('pt-BR')}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Grid de Credenciais e Usuários */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Criar Funcionário */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Criar Funcionário</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                          <div>
                            <Label htmlFor="credEmail" className="text-sm font-medium">Email</Label>
                            <Input
                              id="credEmail"
                              type="email"
                              placeholder="funcionario@email.com"
                              value={credEmail}
                              onChange={(e) => setCredEmail(e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <Label htmlFor="credSenha" className="text-sm font-medium">Senha</Label>
                            <div className="relative">
                              <Input
                                id="credSenha"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={credSenha}
                                onChange={(e) => setCredSenha(e.target.value)}
                                disabled={loading}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                title={showPassword ? "Ocultar" : "Exibir"}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="credSenhaConfirm" className="text-sm font-medium">Confirmar Senha</Label>
                            <div className="relative">
                              <Input
                                id="credSenhaConfirm"
                                type={showPasswordConfirm ? "text" : "password"}
                                placeholder="••••••••"
                                value={credSenhaConfirm}
                                onChange={(e) => setCredSenhaConfirm(e.target.value)}
                                disabled={loading}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                title={showPasswordConfirm ? "Ocultar" : "Exibir"}
                              >
                                {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <Button onClick={criarCredencial} disabled={loading} className="w-full gap-2">
                            <Plus className="w-4 h-4" />
                            Criar Funcionário
                          </Button>
                        </div>

                        {/* lista de credenciais removida daqui — mantida apenas em Usuários com Acesso */}
                      </CardContent>
                    </Card>

                    {/* Usuários com Acesso */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Usuários com Acesso</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {usuarios.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário com acesso</p>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {usuarios.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{u.displayName || u.email || u.usuario_id?.substring(0, 8)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">{u.nivel_acesso}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={u.nivel_acesso}
                                    onChange={(e) => alterarNivel(u.id, e.target.value)}
                                    disabled={loading}
                                    className="px-2 py-1 text-xs border rounded bg-background"
                                  >
                                    <option value="dono">Dono</option>
                                    <option value="gerente">Gerente</option>
                                    <option value="funcionario">Funcionário</option>
                                  </select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeUsuario(u.id)}
                                    disabled={loading}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mensagens */}
                  {mensagem && (
                    <div className={`p-4 rounded-lg border animate-in fade-in ${mensagem.includes('✓')
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      }`}>
                      <p className={`text-sm ${mensagem.includes('✓')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {mensagem}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">Selecione uma loja para visualizar e editar suas configurações</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
