"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LojaOpcoesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userHasAccess, setUserHasAccess] = useState<boolean | null>(null)
  const [codigo, setCodigo] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      router.push("/auth/login")
      return
    }

    // verificar se é dono de loja ou possui permissão
    const { data: dono } = await supabase.from("lojas").select("id").eq("dono_id", user.id).limit(1).maybeSingle()
    if (dono) {
      setUserHasAccess(true)
      router.push("/")
      return
    }

    const { data: permissao } = await supabase.from("lojas_usuarios").select("id").eq("usuario_id", user.id).limit(1).maybeSingle()
    if (permissao) {
      setUserHasAccess(true)
      router.push("/")
      return
    }

    setUserHasAccess(false)
    setLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    setLoading(true)

    try {
      const res = await fetch("/api/lojas/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codigo }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Erro ao usar código")

      setMsg("Entrada na loja realizada com sucesso!")
      router.push("/")
    } catch (err: any) {
      setMsg(err.message || "Erro")
    } finally {
      setLoading(false)
    }
  }

  if (userHasAccess === null) {
    return <div className="min-h-screen flex items-center justify-center p-4">Carregando...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Bem-vindo — Escolha uma opção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold">Criar nova loja</h3>
                <p className="text-sm text-muted-foreground mt-2">Se você pretende ser dono da loja, crie um novo estabelecimento.</p>
                <div className="mt-4">
                  <Link href="/auth/criar-loja">
                    <Button className="w-full">Criar Loja</Button>
                  </Link>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold">Entrar em uma loja existente</h3>
                <p className="text-sm text-muted-foreground mt-2">Se você recebeu um código de acesso do dono, insira-o aqui (uso único).</p>
                <form onSubmit={handleJoin} className="mt-4 space-y-2">
                  <div>
                    <Label htmlFor="codigo">Código de Acesso</Label>
                    <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Entrar via código
                  </Button>
                </form>
              </div>
            </div>

            {msg && <div className="p-3 rounded bg-muted/30">{msg}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
