"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Building2, Phone, MapPin, Loader2, Mail, Lock } from "lucide-react"

export default function CriarLojaPage() {
  const [etapa, setEtapa] = useState<"loja" | "funcionario">("loja")
  const [nomeLoja, setNomeLoja] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [endereco, setEndereco] = useState("")
  const [telefone, setTelefone] = useState("")
  const [emailFuncionario, setEmailFuncionario] = useState("")
  const [senhaFuncionario, setSenhaFuncionario] = useState("")
  const [lojaId, setLojaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    verificarUsuario()
  }, [])

  const verificarUsuario = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  const handleCriarLoja = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data: loja, error } = await supabase
        .from("lojas")
        .insert({
          nome: nomeLoja,
          cnpj: cnpj || null,
          endereco: endereco || null,
          telefone: telefone || null,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setLojaId(loja.id)
      setEtapa("funcionario")
    } catch (error: any) {
      console.error("[v0] Erro ao criar loja:", error)
      setErro(error.message || "Erro ao criar loja. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCriarAcessoFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro("")

    try {
      // Criar usuário funcionário no Supabase Auth
      const { data: novoUsuario, error: authError } = await supabase.auth.admin.createUser({
        email: emailFuncionario,
        password: senhaFuncionario,
        email_confirm: true,
      })

      if (authError) {
        // Tentar criar via signUp se admin não funcionar
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailFuncionario,
          password: senhaFuncionario,
        })

        if (signUpError) throw signUpError

        if (signUpData.user) {
          // Adicionar acesso à loja
          const { error: acessoError } = await supabase.from("loja_usuarios").insert({
            loja_id: lojaId,
            usuario_id: signUpData.user.id,
            nivel_acesso: "funcionario",
          })

          if (acessoError) throw acessoError
        }
      } else if (novoUsuario.user) {
        // Adicionar acesso à loja
        const { error: acessoError } = await supabase.from("loja_usuarios").insert({
          loja_id: lojaId,
          usuario_id: novoUsuario.user.id,
          nivel_acesso: "funcionario",
        })

        if (acessoError) throw acessoError
      }

      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Erro ao criar acesso funcionário:", error)
      setErro(error.message || "Erro ao criar acesso. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (etapa === "loja") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md border-0 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shadow-lg">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Criar Estabelecimento</CardTitle>
              <CardDescription className="mt-2">Cadastre os dados do seu estabelecimento</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCriarLoja} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeLoja" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nome do estabelecimento *
                </Label>
                <Input
                  id="nomeLoja"
                  type="text"
                  placeholder="Chaveiro Central"
                  value={nomeLoja}
                  onChange={(e) => setNomeLoja(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço (opcional)
                </Label>
                <Input
                  id="endereco"
                  type="text"
                  placeholder="Rua Principal, 123"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone (opcional)
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              {erro && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Próximo"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="w-full max-w-md border-0 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Acesso dos Funcionários</CardTitle>
            <CardDescription className="mt-2">
              Crie um login compartilhado para os funcionários acessarem o sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCriarAcessoFuncionario} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailFuncionario" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email para funcionários *
              </Label>
              <Input
                id="emailFuncionario"
                type="email"
                placeholder="funcionarios@suachaveiro.com"
                value={emailFuncionario}
                onChange={(e) => setEmailFuncionario(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senhaFuncionario" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Senha para funcionários *
              </Label>
              <Input
                id="senhaFuncionario"
                type="password"
                placeholder="••••••••"
                value={senhaFuncionario}
                onChange={(e) => setSenhaFuncionario(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 Todos os funcionários usarão este mesmo email e senha para acessar o sistema.
              </p>
            </div>

            {erro && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                "Finalizar configuração"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/")}
              disabled={loading}
            >
              Pular esta etapa
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
