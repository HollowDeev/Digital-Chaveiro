import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  // Validate required env vars. Creating an Auth user requires the Supabase service role key.
  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    console.error('create-employee: missing env vars ->', missing.join(', '))
    return NextResponse.json(
      {
        message: 'Variáveis de ambiente obrigatórias não configuradas no servidor',
        missing,
        help: `Crie um arquivo .env.local na raiz do projeto com as variáveis abaixo (não comitar):\nNEXT_PUBLIC_SUPABASE_URL='https://<seu-projeto>.supabase.co'\nNEXT_PUBLIC_SUPABASE_ANON_KEY='sua-anon-key'\nSUPABASE_SERVICE_ROLE_KEY='sua-service-role-key-aqui'`,
      },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Cria usuário no Auth usando a service role
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    } as any)

    if (createErr) {
      console.error('Erro ao criar usuário no auth', createErr)
      return NextResponse.json({ message: createErr.message || 'Erro ao criar usuário no auth' }, { status: 500 })
    }

    const userId = (createdUser as any)?.user?.id || (createdUser as any)?.id || null

    // Insere na tabela de credenciais (usando service role para contornar RLS)
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('lojas_credenciais_funcionarios')
      .insert({ loja_id: lojaId, email, password_hash: password, auth_user_id: userId })
      .select()
      .single()

    if (insErr) {
      console.error('Erro ao inserir credencial na tabela', insErr)
      // Tentar remover o usuário criado para evitar lixo
      try {
        if (userId) await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (e) {
        console.error('Erro ao remover usuário após falha na inserção', e)
      }
      return NextResponse.json({ message: insErr.message || 'Erro ao inserir credencial' }, { status: 500 })
    }

    // Garantir que o usuário também receba acesso à loja (tabela lojas_usuarios)
    // Isso é necessário para que o fluxo de autorização baseado em lojas_usuarios reconheça o funcionário
    if (userId) {
      const { error: accessErr } = await supabaseAdmin
        .from('lojas_usuarios')
        .insert({
          loja_id: lojaId,
          usuario_id: userId,
          nivel_acesso: 'funcionario',
          nome: nome || email.split('@')[0],
          email: email,
          telefone: telefone || null,
          cargo: cargo,
          salario: salario,
          data_admissao: new Date().toISOString().split('T')[0],
          ativo: true
        })

      if (accessErr) {
        console.error('Erro ao inserir acesso em lojas_usuarios', accessErr)
        // Tentativa de rollback: remover credencial e usuário criado
        try {
          if (inserted && (inserted as any).id) {
            await supabaseAdmin.from('lojas_credenciais_funcionarios').delete().eq('id', (inserted as any).id)
          }
        } catch (e) {
          console.error('Erro ao remover credencial após falha em lojas_usuarios', e)
        }

        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
        } catch (e) {
          console.error('Erro ao remover usuário após falha em lojas_usuarios', e)
        }

        return NextResponse.json({ message: accessErr.message || 'Erro ao conceder acesso à loja' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, inserted, userId })
  } catch (err: any) {
    console.error('Erro create-employee:', err)
    return NextResponse.json({ message: err.message || 'Erro interno' }, { status: 500 })
  }
}
