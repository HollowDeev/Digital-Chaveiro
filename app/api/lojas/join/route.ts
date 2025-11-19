import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const body = await req.json()
  const code = (body?.code || "").toString().trim()

  const supabase = await createServerSupabaseClient()

  // Get user from cookies (server-side)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 })

  if (!code) return NextResponse.json({ message: "Código inválido" }, { status: 400 })

  try {
    // Buscar código com admin client (ignora RLS) para que qualquer usuário possa usar
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    let supabaseAdmin = supabase
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    }

    // Busca código válido e não usado (com admin client para ignorar RLS)
    const { data: codes, error: selErr } = await supabaseAdmin
      .from("loja_access_codes")
      .select("id, code, loja_id, used, expires_at")
      .eq("code", code)
      .limit(1)
      .maybeSingle()

    if (selErr) throw selErr
    if (!codes) return NextResponse.json({ message: "Código não encontrado" }, { status: 404 })
    if (codes.used) return NextResponse.json({ message: "Código já utilizado" }, { status: 400 })
    if (codes.expires_at && new Date(codes.expires_at) < new Date()) return NextResponse.json({ message: "Código expirado" }, { status: 400 })

    // Inserir na tabela de lojas_usuarios (usa admin client para contornar RLS do dono)
    const { error: insErr } = await supabaseAdmin.from("lojas_usuarios").insert({ loja_id: codes.loja_id, usuario_id: user.id, nivel_acesso: "funcionario" })
    if (insErr) throw insErr

    // Marcar código como usado (usa admin client)
    const { error: updErr } = await supabaseAdmin.from("loja_access_codes").update({ used: true, used_by: user.id }).eq("id", codes.id)
    if (updErr) throw updErr

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Erro ao consumir código:", err)
    return NextResponse.json({ message: err.message || "Erro interno" }, { status: 500 })
  }
}
