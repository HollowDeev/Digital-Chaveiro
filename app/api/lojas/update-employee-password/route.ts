import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: Request) {
  const body = await req.json()
  const lojaId = (body?.lojaId || "").toString()
  const usuarioId = (body?.usuarioId || "").toString()
  const newPassword = (body?.newPassword || "").toString()

  if (!lojaId || !usuarioId || !newPassword) {
    return NextResponse.json({ message: "lojaId, usuarioId e newPassword são obrigatórios" }, { status: 400 })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: 'Variáveis de ambiente obrigatórias não configuradas' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabaseClient = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 })
  }

  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Verificando permissão do usuário que fez a requisição (buscando em lojas e lojas_usuarios)
    const { data: loja } = await supabaseAdmin
      .from('lojas')
      .select('dono_id')
      .eq('id', lojaId)
      .single()

    const isDono = loja?.dono_id === user.id

    const { data: requesterAccess } = await supabaseAdmin
      .from('lojas_usuarios')
      .select('nivel_acesso')
      .eq('loja_id', lojaId)
      .eq('usuario_id', user.id)
      .maybeSingle()

    const hasManagerAccess = requesterAccess && (requesterAccess.nivel_acesso === 'dono' || requesterAccess.nivel_acesso === 'gerente')

    if (!isDono && !hasManagerAccess) {
        return NextResponse.json({ message: "Sem permissão. Apenas o dono ou gerente pode alterar senhas de funcionários." }, { status: 403 })
    }

    // Verificando se o usuário alvo pertence à mesma loja
    const { data: targetUserAccess } = await supabaseAdmin
      .from('lojas_usuarios')
      .select('id')
      .eq('loja_id', lojaId)
      .eq('usuario_id', usuarioId)
      .maybeSingle()

    if (!targetUserAccess) {
      return NextResponse.json({ message: "Funcionário alvo não pertence a esta loja." }, { status: 404 })
    }

    // Atualizando a senha no Supabase Auth
    const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(usuarioId, {
      password: newPassword
    })

    if (updateAuthErr) {
      return NextResponse.json({ message: updateAuthErr.message || 'Erro ao atualizar senha no Auth' }, { status: 500 })
    }

    // Mantendo consistência na tabela lojas_credenciais_funcionarios
    await supabaseAdmin
      .from('lojas_credenciais_funcionarios')
      .update({ password_hash: newPassword })
      .eq('auth_user_id', usuarioId)

    return NextResponse.json({ message: "Senha atualizada com sucesso" }, { status: 200 })

  } catch (err: any) {
    console.error('Erro update-employee-password:', err)
    return NextResponse.json({ message: err.message || 'Erro interno' }, { status: 500 })
  }
}
