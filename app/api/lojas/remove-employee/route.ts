Dimport { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const body = await req.json()
  const credentialId = (body?.credentialId || "").toString()

  if (!credentialId) {
    return NextResponse.json({ message: "credentialId é obrigatório" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Verificar autorização (apenas donos/admins podem remover funcionários)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 })
  }

  try {
    // Buscar a credencial a ser removida
    const { data: credential, error: credErr } = await supabase
      .from("lojas_credenciais_funcionarios")
      .select("id, loja_id, auth_user_id")
      .eq("id", credentialId)
      .single()

    if (credErr || !credential) {
      return NextResponse.json({ message: "Credencial não encontrada" }, { status: 404 })
    }

    // Verificar se o usuário é dono da loja
    const { data: loja } = await supabase
      .from("lojas")
      .select("dono_id")
      .eq("id", credential.loja_id)
      .single()

    if (loja?.dono_id !== user.id) {
      return NextResponse.json({ message: "Você não tem permissão para remover funcionários desta loja" }, { status: 403 })
    }

    // Remover entrada em lojas_usuarios se existir
    if (credential.auth_user_id) {
      const { error: accessErr } = await supabase
        .from("lojas_usuarios")
        .delete()
        .eq("loja_id", credential.loja_id)
        .eq("usuario_id", credential.auth_user_id)

      if (accessErr) {
        console.error("Erro ao remover acesso em lojas_usuarios", accessErr)
        // Continua mesmo se falhar (tenta remover credencial)
      }
    }

    // Remover credencial
    const { error: delErr } = await supabase
      .from("lojas_credenciais_funcionarios")
      .delete()
      .eq("id", credentialId)

    if (delErr) {
      return NextResponse.json({ message: "Erro ao remover credencial" }, { status: 500 })
    }

    // Remover usuário do Auth se existir (usa service role)
    if (credential.auth_user_id) {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
          await supabaseAdmin.auth.admin.deleteUser(credential.auth_user_id)
        } catch (authErr: any) {
          console.error("Erro ao remover usuário do Auth", authErr)
          // Não falha a resposta se o usuário Auth não puder ser removido
          // (a credencial já foi removida do banco de dados)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Erro ao remover funcionário:", err)
    return NextResponse.json({ message: err.message || "Erro interno" }, { status: 500 })
  }
}
