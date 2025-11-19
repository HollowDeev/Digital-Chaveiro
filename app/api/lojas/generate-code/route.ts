import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function POST(req: Request) {
  const body = await req.json()
  const lojaId = (body?.lojaId || "").toString()
  const expiresHours = Number(body?.hours || 24)

  if (!lojaId) return NextResponse.json({ message: "lojaId é obrigatório" }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 })

  try {
    // verifica se usuário é dono da loja
    const { data: loja } = await supabase.from('lojas').select('dono_id').eq('id', lojaId).maybeSingle()
    if (!loja) return NextResponse.json({ message: 'Loja não encontrada' }, { status: 404 })
    if (loja.dono_id !== user.id) return NextResponse.json({ message: 'Apenas o dono pode gerar códigos' }, { status: 403 })

    const code = randomCode(8)
    const expiresAt = new Date(Date.now() + expiresHours * 3600 * 1000).toISOString()

    const { data: inserted, error } = await supabase.from('loja_access_codes').insert({ loja_id: lojaId, code, created_by: user.id, expires_at: expiresAt }).select().single()
    if (error) throw error

    return NextResponse.json({ ok: true, code: inserted.code, expires_at: inserted.expires_at })
  } catch (err: any) {
    console.error('Erro gerar código:', err)
    return NextResponse.json({ message: err.message || 'Erro interno' }, { status: 500 })
  }
}
