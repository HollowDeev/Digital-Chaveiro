import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: Request) {
  const body = await req.json()
  const lojaId = (body?.lojaId || "").toString()
  const email = (body?.email || "").toString().trim()
  const password = (body?.password || "").toString()
  const nome = (body?.nome || "").toString().trim()
  const telefone = (body?.telefone || "").toString().trim()
  const cargo = (body?.cargo || "Funcionário").toString().trim()
  const salario = parseFloat(body?.salario) || 0

  if (!lojaId || !email || !password) {
    return NextResponse.json({ message: "lojaId, email e password são obrigatórios" }, { status: 400 })
  }

  // Validação de senha mínima
  if (password.length < 6) {
    return NextResponse.json({ message: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: "Variáveis de ambiente obrigatórias não configuradas no servidor" }, { status: 500 })
  }

  // ─── SEC-01: Verificar autenticação de quem está chamando ────────────────
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
    // ─── SEC-01: Verificar se o solicitante tem permissão de dono/gerente ──
    const { data: loja } = await supabaseAdmin
      .from("lojas")
      .select("dono_id")
      .eq("id", lojaId)
      .single()

    const isDono = loja?.dono_id === user.id

    const { data: requesterAccess } = await supabaseAdmin
      .from("lojas_usuarios")
      .select("nivel_acesso")
      .eq("loja_id", lojaId)
      .eq("usuario_id", user.id)
      .maybeSingle()

    const hasManagerAccess =
      requesterAccess &&
      (requesterAccess.nivel_acesso === "dono" || requesterAccess.nivel_acesso === "gerente")

    if (!isDono && !hasManagerAccess) {
      return NextResponse.json(
        { message: "Sem permissão. Apenas o dono ou gerente pode adicionar funcionários." },
        { status: 403 }
      )
    }

    // Cria usuário no Auth usando a service role
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    } as any)

    if (createErr) {
      console.error("Erro ao criar usuário no auth", createErr)
      return NextResponse.json({ message: createErr.message || "Erro ao criar usuário no auth" }, { status: 500 })
    }

    const userId = (createdUser as any)?.user?.id || (createdUser as any)?.id || null

    // Insere na tabela de credenciais (usando service role para contornar RLS)
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("lojas_credenciais_funcionarios")
      .insert({ loja_id: lojaId, email, password_hash: password, auth_user_id: userId })
      .select("id, loja_id, auth_user_id, created_at") // ← SEC-02: Nunca seleciona password_hash
      .single()

    if (insErr) {
      console.error("Erro ao inserir credencial na tabela", insErr)
      try {
        if (userId) await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (e) {
        console.error("Erro ao remover usuário após falha na inserção", e)
      }
      return NextResponse.json({ message: insErr.message || "Erro ao inserir credencial" }, { status: 500 })
    }

    // Garantir que o usuário também receba acesso à loja (tabela lojas_usuarios)
    if (userId) {
      const { error: accessErr } = await supabaseAdmin
        .from("lojas_usuarios")
        .insert({
          loja_id: lojaId,
          usuario_id: userId,
          nivel_acesso: "funcionario",
          nome: nome || email.split("@")[0],
          email: email,
          telefone: telefone || null,
          cargo: cargo,
          salario: salario,
          data_admissao: new Date().toISOString().split("T")[0],
          ativo: true,
        })

      if (accessErr) {
        console.error("Erro ao inserir acesso em lojas_usuarios", accessErr)
        try {
          if (inserted && (inserted as any).id) {
            await supabaseAdmin
              .from("lojas_credenciais_funcionarios")
              .delete()
              .eq("id", (inserted as any).id)
          }
        } catch (e) {
          console.error("Erro ao remover credencial após falha em lojas_usuarios", e)
        }
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
        } catch (e) {
          console.error("Erro ao remover usuário após falha em lojas_usuarios", e)
        }
        return NextResponse.json({ message: accessErr.message || "Erro ao conceder acesso à loja" }, { status: 500 })
      }
    }

    // ─── SEC-02: Retornar apenas dados não-sensíveis ────────────────────────
    return NextResponse.json({ ok: true, userId }, { status: 201 })

  } catch (err: any) {
    console.error("Erro create-employee:", err)
    return NextResponse.json({ message: err.message || "Erro interno" }, { status: 500 })
  }
}
