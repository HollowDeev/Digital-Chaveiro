"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ContaConfiguracaoPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) return
    setNome((user.user_metadata as any)?.nome || "")
    setEmail(user.email || "")
  }

  async function save() {
    setLoading(true)
    setMsg("")
    try {
      const { data, error } = await supabase.auth.updateUser({ data: { nome } })
      if (error) throw error
      setMsg('Dados atualizados')
    } catch (err: any) {
      setMsg(err.message || 'Erro')
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
      setMsg(err.message || "Erro ao sair")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-64">
        <PageHeader title="Configurações da Conta" subtitle="Gerencie seus dados pessoais" icon={<User className="h-5 w-5 lg:h-6 lg:w-6" />} />

        <div className="space-y-6 p-4 lg:space-y-8 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Minha Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email (não editável)</Label>
                  <Input id="email" value={email} disabled />
                </div>

                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <Button onClick={save} disabled={loading}>Salvar</Button>
                  <Button variant="ghost" className="ml-auto" onClick={logout} disabled={loading}>Logout</Button>
                </div>

                {msg && <div className="p-2 rounded bg-muted/30">{msg}</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
