"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import {
  User, Mail, Phone, Briefcase, ArrowLeft, DollarSign,
  TrendingUp, ShoppingCart, PackageX, Percent, Calendar,
  Wrench, AlertTriangle, CheckCircle, Clock, Image,
  ChevronDown, ChevronUp, Search, X, Eye, AlertCircle, Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Status badges
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aberto:      { label: "Aberto",      color: "bg-blue-500/10 text-blue-600 border-blue-200",   icon: <Clock className="h-3 w-3" /> },
  em_andamento:{ label: "Em Andamento",color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", icon: <Wrench className="h-3 w-3" /> },
  concluido:   { label: "Concluído",   color: "bg-green-500/10 text-green-700 border-green-200",icon: <CheckCircle className="h-3 w-3" /> },
  finalizado:  { label: "Finalizado",  color: "bg-green-500/10 text-green-700 border-green-200",icon: <CheckCircle className="h-3 w-3" /> },
  cancelado:   { label: "Cancelado",   color: "bg-red-500/10 text-red-600 border-red-200",      icon: <X className="h-3 w-3" /> },
  pendente:    { label: "Pendente",    color: "bg-orange-500/10 text-orange-700 border-orange-200", icon: <AlertCircle className="h-3 w-3" /> },
}

function StatusBadge({ status }: { status: string }) {
  const normStatus = (status || "").toLowerCase()
  const cfg = statusConfig[normStatus] || { label: status, color: "bg-muted text-muted-foreground", icon: null }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", cfg.color)}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

function formatMoeda(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }
function formatData(d: string)  { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) }
function formatDataHora(d: string) { return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

// ─── Expandable Service Row ────────────────────────────────────────────────
function ServicoRow({ s }: { s: any }) {
  const [open, setOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const hasProblemas = s.problemas && s.problemas.length > 0
  const hasFotos     = s.fotos_comprovacao && s.fotos_comprovacao.length > 0
  const st = (s.status || "").toLowerCase()
  const isConcluido = st === "concluido" || st === "finalizado"

  return (
    <>
      <div
        className={cn(
          "rounded-xl border transition-all",
          open ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/20"
        )}
      >
        {/* Header row */}
        <div
          className="flex cursor-pointer items-center gap-3 p-4"
          onClick={() => setOpen(!open)}
        >
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            hasProblemas ? "bg-red-100" : isConcluido ? "bg-green-100" : "bg-blue-100"
          )}>
            {hasProblemas
              ? <AlertTriangle className="h-4 w-4 text-red-600" />
              : isConcluido
                ? <CheckCircle className="h-4 w-4 text-green-600" />
                : <Wrench className="h-4 w-4 text-blue-600" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">{s.servico?.nome || "Serviço"}</p>
              <StatusBadge status={s.status} />
              {hasProblemas && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  {s.problemas.length} problema(s)
                </span>
              )}
              {hasFotos && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                  <Image className="h-3 w-3" />
                  {s.fotos_comprovacao.length} foto(s)
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Cliente: <strong>{s.cliente?.nome || s.venda?.clientes?.nome || "—"}</strong></span>
              <span>Iniciado: <strong>{formatDataHora(s.data_inicio || s.created_at)}</strong></span>
              {s.data_conclusao && <span>Concluído: <strong>{formatDataHora(s.data_conclusao)}</strong></span>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p className="font-bold text-sm text-primary">{formatMoeda(s.servico?.preco || 0)}</p>
              <p className="text-xs text-muted-foreground">{s.pago ? "Pago" : "A pagar"}</p>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded content */}
        {open && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
            {!s.observacoes && !hasProblemas && !hasFotos && (!s.outros_arquivos || s.outros_arquivos.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum detalhe adicional registrado para este serviço.</p>
            )}

            {/* Observações */}
            {s.observacoes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">OBSERVAÇÕES</p>
                <p className="text-sm bg-muted/50 rounded p-2">{s.observacoes}</p>
              </div>
            )}

            {/* Problemas */}
            {hasProblemas && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> PROBLEMAS REPORTADOS
                </p>
                <div className="space-y-2">
                  {s.problemas.map((p: any) => (
                    <div key={p.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-red-800">{p.motivo?.nome || "Problema"}</p>
                          {p.motivo?.descricao && <p className="text-xs text-red-600 mt-0.5">{p.motivo.descricao}</p>}
                          {p.descricao && <p className="text-sm text-red-700 mt-1">{p.descricao}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDataHora(p.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos de Comprovação */}
            {hasFotos && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Image className="h-3 w-3" /> FOTOS DE COMPROVAÇÃO
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {s.fotos_comprovacao.map((foto: any) => (
                    <button
                      key={foto.id}
                      onClick={() => setSelectedPhoto(foto.url)}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border hover:border-primary transition-all"
                    >
                      <img src={foto.url} alt={foto.nome_arquivo || "Foto"} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                        <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Outros arquivos */}
            {s.outros_arquivos && s.outros_arquivos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">OUTROS ARQUIVOS</p>
                <div className="space-y-1">
                  {s.outros_arquivos.map((a: any) => (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Eye className="h-3 w-3" />{a.nome_arquivo}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Foto de Comprovação</DialogTitle></DialogHeader>
          {selectedPhoto && <img src={selectedPhoto} alt="Comprovação" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function FuncionarioPerfilPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [funcionario, setFuncionario] = useState<any>(null)
  const [lojaId, setLojaId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const isLoading = loading

  // Raw data from DB
  const [vendas, setVendas] = useState<any[]>([])
  const [perdas, setPerdas] = useState<any[]>([])
  const [servicos, setServicos] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Commission
  const [comissaoPct, setComissaoPct] = useState("5")

  // Period filter
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [periodoInicio, setPeriodoInicio] = useState(firstDayOfMonth.toISOString().split("T")[0])
  const [periodoFim, setPeriodoFim]       = useState(today.toISOString().split("T")[0])

  // Services filter
  const [servicoSearch, setServicoSearch]   = useState("")
  const [servicoStatus, setServicoStatus]   = useState("todos")

  // ── Fetch loja + funcionário juntos por ID direto ──
  useEffect(() => {
    const fetchFuncionarioELoja = async () => {
      setLoading(true)
      const supabase = createClient()

      // 1. Pegar o usuário autenticado para descobrir o loja_id
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user) { 
        setDebugInfo({ stage: "1. No user", userError })
        setLoading(false); return 
      }

      // 2. Descobrir o loja_id do usuário logado
      let resolvedLojaId: string | null = null
      let ownerError = null, userStoreError = null

      const { data: lojaOwner, error: e1 } = await supabase
        .from("lojas")
        .select("id")
        .eq("dono_id", user.id)
        .maybeSingle()

      ownerError = e1

      if (lojaOwner) {
        resolvedLojaId = lojaOwner.id
      } else {
        const { data: lojaUser, error: e2 } = await supabase
          .from("lojas_usuarios")
          .select("loja_id")
          .eq("usuario_id", user.id)
          .maybeSingle()
        userStoreError = e2
        if (lojaUser) resolvedLojaId = lojaUser.loja_id
      }

      if (!resolvedLojaId) { 
        setDebugInfo({ stage: "2. No resolvedLojaId", user_id: user.id, ownerError, userStoreError })
        setLoading(false); return 
      }

      // 3. Buscar o funcionário pelo ID da rota, filtrado pelo loja_id correto
      let resolvedParamsId = params.id
      // Next.js 15 params may be promise, just double check if params.id is undefined
      if (!resolvedParamsId) {
        try {
          const paramsAwaited = await (params as any);
          resolvedParamsId = paramsAwaited.id;
        } catch (e) {}
      }

      const { data: fu, error } = await supabase
        .from("lojas_usuarios")
        .select("*")
        .eq("loja_id", resolvedLojaId)
        .eq("id", resolvedParamsId)
        .maybeSingle()

      console.log("[FuncionarioPerfil] fetch result:", { fu, error, params_id: resolvedParamsId, resolvedLojaId })

      if (!fu || error) {
        console.error("[FuncionarioPerfil] funcionário não encontrado:", error)
        setDebugInfo({ stage: "3. Funcionario not found", resolvedLojaId, resolvedParamsId, error })
        setLoading(false)
        return
      }

      setLojaId(fu.loja_id)
      setFuncionario({
        id: fu.id,
        nome: fu.nome || "Usuário desconhecido",
        email: fu.email || "",
        telefone: fu.telefone || "",
        cargo: fu.cargo || (fu.nivel_acesso === "dono" ? "Dono" : fu.nivel_acesso === "gerente" ? "Gerente" : "Funcionário"),
        salario: fu.salario || 0,
        dataAdmissao: fu.data_admissao || fu.created_at,
        ativo: fu.ativo !== false,
        usuario_id: fu.usuario_id,
      })
      setLoading(false)
    }
    fetchFuncionarioELoja()
  }, [params.id])

  // ── Fetch all data for this employee ──
  const fetchData = useCallback(async () => {
    if (!lojaId || !funcionario) return
    setLoadingData(true)
    const supabase = createClient()
    const usuarioId = funcionario.usuario_id

    const inicio = new Date(periodoInicio + "T00:00:00")
    const fim    = new Date(periodoFim   + "T23:59:59")

    // Vendas filtradas por período (funcionario_id = usuario_id)
    const { data: vendasData } = await supabase
      .from("vendas")
      .select("id, total, desconto, forma_pagamento, status, created_at, tipo")
      .eq("loja_id", lojaId)
      .eq("funcionario_id", usuarioId)
      .eq("status", "concluida")
      .gte("created_at", inicio.toISOString())
      .lte("created_at", fim.toISOString())
      .order("created_at", { ascending: false })

    // Perdas (funcionario_id = lojas_usuarios.id)
    const { data: perdasData } = await supabase
      .from("perdas")
      .select("id, custo_total, quantidade, motivo, data_perda, observacoes, produtos(nome), categorias_perdas(nome)")
      .eq("loja_id", lojaId)
      .eq("funcionario_id", funcionario.id)
      .gte("data_perda", inicio.toISOString())
      .lte("data_perda", fim.toISOString())
      .order("data_perda", { ascending: false })

    // Get all venda IDs for this employee (all time, for cross-reference)
    const { data: vendasTodas } = await supabase
      .from("vendas")
      .select("id")
      .eq("loja_id", lojaId)
      .eq("funcionario_id", usuarioId)
    const vendaIds = (vendasTodas || []).map((v: any) => v.id)

    // Fetch servicos realizados filtered directly by venda_id
    let servicosDoFunc: any[] = []
    if (vendaIds.length > 0) {
      const { data: servicosData } = await supabase
        .from("servicos_realizados")
        .select(`
          id, venda_id, status, data_inicio, data_conclusao, pago, observacoes, created_at,
          servico:servicos(nome, preco),
          cliente:clientes(nome, telefone),
          venda:vendas(clientes(nome, telefone))
        `)
        .eq("loja_id", lojaId)
        .in("venda_id", vendaIds)
        .order("created_at", { ascending: false })
      servicosDoFunc = servicosData || []
    }

    // Enrich servicos with problemas and fotos
    const servicosEnriquecidos = await Promise.all(
      servicosDoFunc.map(async (s: any) => {
        const [{ data: problemas }, { data: fotos }] = await Promise.all([
          supabase
            .from("servicos_problemas")
            .select("id, descricao, created_at, motivo:motivos_problemas_servicos(nome, descricao)")
            .eq("servico_realizado_id", s.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("servicos_arquivos")
            .select("id, url, nome_arquivo, tipo")
            .eq("servico_realizado_id", s.id)
        ])
        return {
          ...s,
          problemas: problemas || [],
          fotos_comprovacao: (fotos || []).filter((f: any) => f.tipo === "comprovacao"),
          outros_arquivos:   (fotos || []).filter((f: any) => f.tipo !== "comprovacao"),
        }
      })
    )

    setVendas(vendasData || [])
    setPerdas(perdasData || [])
    setServicos(servicosEnriquecidos)
    setLoadingData(false)
  }, [lojaId, funcionario, periodoInicio, periodoFim])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Computed ──
  const totalVendas      = vendas.reduce((a, v) => a + (v.total || 0), 0)
  const qtdVendas        = vendas.length
  const totalPerdas      = perdas.reduce((a, p) => a + (p.custo_total || 0), 0)
  const qtdPerdas        = perdas.length
  const comissaoValor    = totalVendas * (parseFloat(comissaoPct) || 0) / 100

  const vendasPorForma   = useMemo(() => {
    const map: Record<string, { qtd: number; total: number }> = {}
    vendas.forEach(v => {
      const key = v.forma_pagamento || "outros"
      if (!map[key]) map[key] = { qtd: 0, total: 0 }
      map[key].qtd++
      map[key].total += v.total || 0
    })
    return map
  }, [vendas])

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      const normStatus = (s.status || "").toLowerCase()
      const matchStatus = servicoStatus === "todos" || 
                          normStatus === servicoStatus ||
                          (servicoStatus === "concluido" && normStatus === "finalizado")
      const matchSearch = !servicoSearch ||
        s.servico?.nome?.toLowerCase().includes(servicoSearch.toLowerCase()) ||
        s.cliente?.nome?.toLowerCase().includes(servicoSearch.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [servicos, servicoStatus, servicoSearch])

  const servicosComProblemas = servicos.filter(s => s.problemas && s.problemas.length > 0)
  const servicosConcluidos   = servicos.filter(s => {
    const st = (s.status || "").toLowerCase();
    return st === "concluido" || st === "finalizado";
  })
  const servicosAbertos      = servicos.filter(s => {
    const st = (s.status || "").toLowerCase();
    return st === "aberto" || st === "em_andamento";
  })

  const formaLabel: Record<string, string> = {
    dinheiro: "Dinheiro", pix: "PIX",
    cartao_credito: "Cartão Crédito", cartao_debito: "Cartão Débito", outros: "Outros"
  }

  if (isLoading) return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando dados do funcionário...</p>
        </div>
      </main>
    </div>
  )

  if (!funcionario) return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
          <p className="text-muted-foreground text-lg font-medium">Funcionário não encontrado</p>
          {debugInfo && (
            <div className="w-full bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg overflow-auto">
              <p className="font-bold mb-2">Debug Info:</p>
              <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64">
        <PageHeader
          title={funcionario.nome}
          subtitle="Dashboard do Funcionário"
          icon={<User className="h-5 w-5 lg:h-6 lg:w-6" />}
          action={
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />Voltar
            </Button>
          }
        />

        <div className="space-y-6 p-4 lg:p-8">

          {/* ── Infos do Funcionário ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Mail className="h-4 w-4 text-primary" />, bg: "bg-primary/10",     label: "Email",    value: funcionario.email || "—" },
              { icon: <Phone className="h-4 w-4 text-emerald-500" />, bg: "bg-emerald-500/10", label: "Telefone", value: funcionario.telefone || "—" },
              { icon: <Briefcase className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/10",   label: "Cargo",    value: funcionario.cargo },
              { icon: <Calendar className="h-4 w-4 text-orange-500" />, bg: "bg-orange-500/10", label: "Admissão",  value: formatData(funcionario.dataAdmissao) },
            ].map(({ icon, bg, label, value }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("rounded-lg p-2.5", bg)}>{icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold truncate">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Filtro de Período ── */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex shrink-0 items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Período de Análise</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[130px]">
                    <Label className="text-xs mb-1">Data Início</Label>
                    <Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="h-8 text-sm w-auto" />
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <Label className="text-xs mb-1">Data Fim</Label>
                    <Input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="h-8 text-sm w-auto" />
                  </div>
                  <div className="flex items-end gap-2">
                    {/* Quick filters */}
                    {[
                      { label: "Este Mês", onClick: () => { setPeriodoInicio(firstDayOfMonth.toISOString().split("T")[0]); setPeriodoFim(today.toISOString().split("T")[0]) } },
                      { label: "Mês Passado", onClick: () => {
                        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
                        setPeriodoInicio(lastMonth.toISOString().split("T")[0])
                        setPeriodoFim(lastMonthEnd.toISOString().split("T")[0])
                      }},
                      { label: "7 dias", onClick: () => {
                        const d7 = new Date(today); d7.setDate(d7.getDate() - 7)
                        setPeriodoInicio(d7.toISOString().split("T")[0]); setPeriodoFim(today.toISOString().split("T")[0])
                      }},
                    ].map(({ label, onClick }) => (
                      <Button key={label} variant="outline" size="sm" onClick={onClick} className="h-8 text-xs">{label}</Button>
                    ))}
                  </div>
                </div>
                {loadingData && <span className="text-xs text-muted-foreground animate-pulse">Atualizando...</span>}
              </div>
            </CardContent>
          </Card>

          {/* ── KPIs ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />Vendas no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-600">{formatMoeda(totalVendas)}</div>
                <p className="mt-1 text-sm text-muted-foreground">{qtdVendas} venda(s)</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Percent className="h-4 w-4 text-primary" />Comissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{formatMoeda(comissaoValor)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number" min="0" max="100" step="0.5"
                    value={comissaoPct}
                    onChange={e => setComissaoPct(e.target.value)}
                    className="h-6 w-16 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">% de comissão</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PackageX className="h-4 w-4 text-red-500" />Desperdícios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-600">{formatMoeda(totalPerdas)}</div>
                <p className="mt-1 text-sm text-muted-foreground">{qtdPerdas} perda(s)</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wrench className="h-4 w-4 text-blue-500" />Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-blue-600">{servicos.length}</div>
                <div className="mt-1 flex gap-2 flex-wrap">
                  <span className="text-xs text-green-600">{servicosConcluidos.length} concluídos</span>
                  <span className="text-xs text-blue-600">{servicosAbertos.length} em aberto</span>
                  {servicosComProblemas.length > 0 && <span className="text-xs text-red-600">{servicosComProblemas.length} c/ problema</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="vendas" className="space-y-4">
            <TabsList className="flex w-full overflow-x-auto hide-scrollbar whitespace-nowrap justify-start lg:w-auto h-auto p-1 bg-muted rounded-lg">
              <TabsTrigger value="vendas" className="gap-1.5 shrink-0"><TrendingUp className="h-3.5 w-3.5" />Vendas</TabsTrigger>
              <TabsTrigger value="comissao" className="gap-1.5 shrink-0"><Percent className="h-3.5 w-3.5" />Comissão</TabsTrigger>
              <TabsTrigger value="desperdicio" className="gap-1.5 shrink-0"><PackageX className="h-3.5 w-3.5" />Desperdícios</TabsTrigger>
              <TabsTrigger value="servicos" className="gap-1.5 shrink-0">
                <Wrench className="h-3.5 w-3.5" />Serviços
                {servicosComProblemas.length > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                    {servicosComProblemas.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── TAB VENDAS ── */}
            <TabsContent value="vendas" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Lista de vendas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Vendas Individuais</span>
                      <Badge variant="outline">{qtdVendas}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {vendas.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma venda no período</p>
                    ) : (
                      vendas.map(v => (
                        <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm">
                          <div>
                            <p className="font-medium">{formatData(v.created_at)}</p>
                            <p className="text-xs text-muted-foreground">{formaLabel[v.forma_pagamento] || v.forma_pagamento}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{formatMoeda(v.total)}</p>
                            {v.desconto > 0 && <p className="text-xs text-orange-500">Desc: {formatMoeda(v.desconto)}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Por forma de pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Por Forma de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.keys(vendasPorForma).length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
                    ) : (
                      Object.entries(vendasPorForma).map(([forma, d]) => {
                        const pct = totalVendas > 0 ? (d.total / totalVendas * 100) : 0
                        return (
                          <div key={forma}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{formaLabel[forma] || forma}</span>
                              <span className="text-muted-foreground">{d.qtd}x · {formatMoeda(d.total)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })
                    )}

                    {qtdVendas > 0 && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total Período</span>
                          <span className="text-emerald-700">{formatMoeda(totalVendas)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                          <span>Ticket Médio</span>
                          <span>{formatMoeda(totalVendas / qtdVendas)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── TAB COMISSÃO ── */}
            <TabsContent value="comissao" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    Calculadora de Comissão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Configuração */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Percentual de Comissão (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" min="0" max="100" step="0.1"
                          value={comissaoPct}
                          onChange={e => setComissaoPct(e.target.value)}
                          className="text-lg font-bold"
                        />
                        <Percent className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Comissão a Pagar</p>
                        <p className="text-4xl font-black text-primary">{formatMoeda(comissaoValor)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{comissaoPct}% de {formatMoeda(totalVendas)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de comissão por venda */}
                  <div>
                    <p className="text-sm font-semibold mb-3">Detalhamento por Venda</p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {vendas.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma venda no período</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 text-xs font-semibold text-muted-foreground border-b pb-2 px-3">
                            <span>Data</span><span className="text-center">Total</span><span className="text-right">Comissão</span>
                          </div>
                          {vendas.map(v => {
                            const comissaoVenda = (v.total || 0) * (parseFloat(comissaoPct) || 0) / 100
                            return (
                              <div key={v.id} className="grid grid-cols-3 items-center rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">{formatData(v.created_at)}</span>
                                <span className="text-center font-medium text-emerald-600">{formatMoeda(v.total)}</span>
                                <span className="text-right font-bold text-primary">{formatMoeda(comissaoVenda)}</span>
                              </div>
                            )
                          })}
                          <div className="grid grid-cols-3 rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2 text-sm font-bold">
                            <span>TOTAL</span>
                            <span className="text-center text-emerald-600">{formatMoeda(totalVendas)}</span>
                            <span className="text-right text-primary">{formatMoeda(comissaoValor)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB DESPERDÍCIOS ── */}
            <TabsContent value="desperdicio" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Registro de Perdas</span>
                      <Badge variant="destructive">{qtdPerdas}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {perdas.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma perda no período ✅</p>
                    ) : (
                      perdas.map(p => (
                        <div key={p.id} className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm">{p.produtos?.nome || "Produto"}</p>
                              <p className="text-xs text-muted-foreground">
                                Categoria: {p.categorias_perdas?.nome || p.motivo || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qtd: {p.quantidade} · {formatData(p.data_perda)}
                              </p>
                              {p.observacoes && <p className="text-xs mt-1 text-muted-foreground italic">{p.observacoes}</p>}
                            </div>
                            <p className="font-bold text-red-600 whitespace-nowrap">{formatMoeda(p.custo_total || 0)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Resumo perdas */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Resumo de Impacto</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Total de Perdas no Período</p>
                      <p className="text-4xl font-black text-red-600">{formatMoeda(totalPerdas)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{qtdPerdas} registro(s)</p>
                    </div>

                    {totalVendas > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Perdas vs Vendas</p>
                        <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500 transition-all"
                            style={{ width: `${Math.min(100, (totalPerdas / totalVendas * 100))}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {totalVendas > 0 ? (totalPerdas / totalVendas * 100).toFixed(1) : 0}% do valor vendido em perdas
                        </p>
                      </div>
                    )}

                    {totalPerdas > 0 && (
                      <div className="rounded-lg border p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Comissão calculada</span>
                          <span className="font-medium text-primary">{formatMoeda(comissaoValor)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo em perdas</span>
                          <span className="font-medium text-red-600">{formatMoeda(totalPerdas)}</span>
                        </div>
                        <div className="h-px bg-border my-1" />
                        <div className="flex justify-between font-bold">
                          <span>Resultado líquido</span>
                          <span className={comissaoValor - totalPerdas >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {formatMoeda(comissaoValor - totalPerdas)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── TAB SERVIÇOS ── */}
            <TabsContent value="servicos" className="space-y-4">
              {/* Filtros serviços */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar serviço ou cliente..."
                    value={servicoSearch}
                    onChange={e => setServicoSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                  {servicoSearch && (
                    <button onClick={() => setServicoSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 rounded-lg border p-1 bg-card">
                  {[
                    { v: "todos",        l: "Todos" },
                    { v: "aberto",       l: "Abertos" },
                    { v: "em_andamento", l: "Em Andamento" },
                    { v: "concluido",    l: "Concluídos" },
                    { v: "cancelado",    l: "Cancelados" },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => setServicoStatus(v)}
                      className={cn(
                        "rounded px-3 py-1 text-xs font-medium transition-all",
                        servicoStatus === v ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats rápidos */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total",          value: servicos.length,              color: "text-foreground" },
                  { label: "Concluídos",     value: servicosConcluidos.length,    color: "text-green-600" },
                  { label: "Em Aberto",      value: servicosAbertos.length,       color: "text-blue-600" },
                  { label: "Com Problemas",  value: servicosComProblemas.length,  color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border bg-card p-2 sm:p-3 text-center">
                    <p className={cn("text-xl sm:text-2xl font-black", color)}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Log de serviços */}
              <div className="space-y-3">
                {loadingData ? (
                  <div className="py-12 text-center text-muted-foreground">Carregando serviços...</div>
                ) : servicosFiltrados.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-12 text-center">
                    <Wrench className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">Nenhum serviço encontrado</p>
                  </div>
                ) : (
                  servicosFiltrados.map(s => <ServicoRow key={s.id} s={s} />)
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
