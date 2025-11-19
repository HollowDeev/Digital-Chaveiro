"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Store } from "lucide-react"

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
        setLoading(false)
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
      const res = await fetch('/api/lojas/generate-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lojaId: selected.id, hours: 24 }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Erro')
      setMensagem(`Código: ${json.code} (expira: ${new Date(json.expires_at).toLocaleString()})`)
    } catch (err: any) {
      setMensagem(err.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsuarios(lojaId: string) {
    try {
      const { data } = await supabase.from('lojas_usuarios').select('*').eq('loja_id', lojaId)
      setUsuarios(data || [])
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
    setLoading(true)
    try {
      const res = await fetch('/api/lojas/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lojaId: selected.id, email: credEmail, password: credSenha }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Erro ao criar credencial')
      setMensagem('Credencial criada')
      setCredEmail('')
      setCredSenha('')
      fetchCredenciais(selected.id)
    } catch (err: any) {
      setMensagem(err.message || 'Erro ao criar credencial')
    } finally {
      setLoading(false)
    }
  }

  async function removerCredencial(id: string) {
    if (!selected) return
    setLoading(true)
    try {
      const { error } = await supabase.from('lojas_credenciais_funcionarios').delete().eq('id', id)
      if (error) throw error
      setMensagem('Credencial removida')
      fetchCredenciais(selected.id)
    } catch (err: any) {
      setMensagem(err.message || 'Erro ao remover credencial')
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-0">
              <CardHeader>
                <CardTitle>Suas lojas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stores.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma loja encontrada</p>}
                  {stores.map((s) => (
                    <button key={s.id} onClick={() => selectStore(s)} className={`w-full text-left p-3 border rounded-lg transition hover:shadow ${selected?.id === s.id ? 'bg-muted/30 ring-1 ring-primary/20' : ''}`}>
                      <div className="font-medium">{s.nome}</div>
                      <div className="text-xs text-muted-foreground">{s.cnpj || s.telefone || ''}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da loja</CardTitle>
                </CardHeader>
                <CardContent>
                  {selected ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <Button onClick={save} disabled={loading}>Salvar</Button>
                        <Button variant="ghost" onClick={gerarCodigo} disabled={loading}>Gerar Código de Acesso</Button>
                        {mensagem && <div className="text-sm text-muted-foreground">{mensagem}</div>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecione uma loja para editar</p>
                  )}
                </CardContent>
              </Card>

              {selected && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usuários com acesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {usuarios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>}
                      <div className="space-y-2 mt-2">
                        {usuarios.map((u) => (
                          <div key={u.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{u.usuario_id}</div>
                              <div className="text-xs text-muted-foreground">{u.nivel_acesso}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select value={u.nivel_acesso} onChange={(e) => alterarNivel(u.id, e.target.value)} className="px-2 py-1 border rounded">
                                <option value="dono">Dono</option>
                                <option value="gerente">Gerente</option>
                                <option value="funcionario">Funcionário</option>
                              </select>
                              <Button variant="destructive" size="sm" onClick={() => removeUsuario(u.id)}>Remover</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Credenciais de Funcionários</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {credenciais.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma credencial</p>}
                      <div className="space-y-2 mt-2">
                        {credenciais.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                            <div className="text-sm">{c.email}</div>
                            <div>
                              <Button variant="destructive" size="sm" onClick={() => removerCredencial(c.id)}>Remover</Button>
                            </div>
                          </div>
                        ))}

                        <div className="pt-2">
                          <Label htmlFor="credEmail">Email</Label>
                          <Input id="credEmail" value={credEmail} onChange={(e) => setCredEmail(e.target.value)} />
                          <Label htmlFor="credSenha" className="pt-2">Senha</Label>
                          <Input id="credSenha" type="password" value={credSenha} onChange={(e) => setCredSenha(e.target.value)} />
                          <div className="pt-2">
                            <Button onClick={criarCredencial} disabled={loading}>Criar credencial</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
