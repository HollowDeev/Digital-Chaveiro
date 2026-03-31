import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: Request) {
  const body = await req.json()
  const nome = (body?.nome || "").toString().trim()
  const cnpj = body?.cnpj ? body.cnpj.toString().trim() : null
  const endereco = body?.endereco ? body.endereco.toString().trim() : null
  const telefone = body?.telefone ? body.telefone.toString().trim() : null

  if (!nome) {
    return NextResponse.json({ message: "Nome da loja é obrigatório" }, { status: 400 })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  // Validate required env vars
  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    console.error('create-loja: missing env vars ->', missing.join(', '))
    return NextResponse.json(
      {
        message: 'Variáveis de ambiente obrigatórias não configuradas no servidor',
        missing,
      },
      { status: 500 }
    )
  }

  // Get the current authenticated user using the request cookies
  const cookieStore = await cookies()
  const supabaseClient = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

  if (userError || !user) {
    console.error('create-loja: user not authenticated', userError)
    return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 })
  }

  // Use service role to bypass RLS
  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Create the loja using service role (bypasses RLS)
    const { data: loja, error: lojaError } = await supabaseAdmin
      .from('lojas')
      .insert({
        nome,
        cnpj,
        endereco,
        telefone,
        dono_id: user.id,
      })
      .select()
      .single()

    if (lojaError) {
      console.error('Erro ao criar loja', lojaError)
      return NextResponse.json({ message: lojaError.message || 'Erro ao criar loja' }, { status: 500 })
    }

    // Also add the owner to lojas_usuarios table with 'dono' access level
    // Include user metadata (name) from auth
    const userName = user.user_metadata?.nome || user.user_metadata?.name || user.email?.split('@')[0] || 'Dono'
    
    const { error: usuarioError } = await supabaseAdmin
      .from('lojas_usuarios')
      .insert({
        loja_id: loja.id,
        usuario_id: user.id,
        nivel_acesso: 'dono',
        nome: userName,
        email: user.email,
        cargo: 'Dono',
        data_admissao: new Date().toISOString().split('T')[0],
        ativo: true
      })

    if (usuarioError) {
      console.error('Erro ao adicionar dono em lojas_usuarios', usuarioError)
      // Don't fail the request, the loja was created successfully
      // The owner can still access via dono_id
    }

    return NextResponse.json({ 
      message: 'Loja criada com sucesso', 
      loja 
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro inesperado ao criar loja', error)
    return NextResponse.json({ message: error.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
