import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lojaId = searchParams.get('loja_id')

  if (!lojaId) {
    return NextResponse.json({ message: "loja_id é obrigatório" }, { status: 400 })
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
    // Verificando permissão do usuário que fez a requisição
    const { data: loja } = await supabaseAdmin
      .from('lojas')
      .select('dono_id')
      .eq('id', lojaId)
      .single()

    const isDono = loja?.dono_id === user.id

    const { data: requesterAccess } = await supabaseAdmin
      .from('lojas_usuarios')
      .select('id')
      .eq('loja_id', lojaId)
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (!isDono && !requesterAccess) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    // Buscando todos os membros da loja (incluindo o dono) com privilégios elevados
    const { data: membros, error: membrosError } = await supabaseAdmin
      .from('lojas_usuarios')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false })

    if (membrosError) throw membrosError

    // Incluir o dono se não estiver em lojas_usuarios
    const todosUsuarioIds = new Set((membros || []).map((m: any) => m.usuario_id))
    
    // Adicionar o dono se não incluído ainda
    if (loja?.dono_id && !todosUsuarioIds.has(loja.dono_id)) {
      // Buscar dados básicos do dono pela credencial
      const { data: credencialDono } = await supabaseAdmin
        .from('lojas_credenciais_funcionarios')
        .select('nome, cargo')
        .eq('auth_user_id', loja.dono_id)
        .maybeSingle()

      ;(membros as any[]).push({
        id: `dono-${loja.dono_id}`,
        usuario_id: loja.dono_id,
        loja_id: lojaId,
        nivel_acesso: 'dono',
        nome: credencialDono?.nome || null,
        cargo: credencialDono?.cargo || 'Dono',
        ativo: true,
        created_at: null,
      })
      todosUsuarioIds.add(loja.dono_id);
    }

    // Otimização: buscar todas as credenciais de uma vez
    const arrayUsuarioIds = Array.from(todosUsuarioIds);
    let credenciaisData: any[] = [];
    
    if (arrayUsuarioIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('lojas_credenciais_funcionarios')
        .select('auth_user_id, nome, username, cargo, salario, data_admissao, ativo')
        .in('auth_user_id', arrayUsuarioIds);
      credenciaisData = data || [];
    }

    const credenciaisMap = new Map();
    credenciaisData.forEach((c: any) => {
      credenciaisMap.set(c.auth_user_id, c);
    });

    // Encontrar usuários sem credenciais locais para fazer fallback
    const missingUserIds = arrayUsuarioIds.filter(id => !credenciaisMap.has(id));
    const authUsersMap = new Map();

    if (missingUserIds.length > 0) {
      const { data: authUsersData } = await supabaseAdmin
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .in('id', missingUserIds);
        
      (authUsersData || []).forEach((u: any) => {
        authUsersMap.set(u.id, u);
      });
    }

    // Enriquecer cada membro sincronicamente
    const funcionariosEnriquecidos = (membros || []).map((membro: any) => {
      const credencial = credenciaisMap.get(membro.usuario_id);
      let nomeAuth = null;
      let emailAuth = null;

      if (!credencial) {
        const authUser = authUsersMap.get(membro.usuario_id);
        if (authUser) {
          const meta = authUser.raw_user_meta_data || {};
          nomeAuth = meta.nome || meta.full_name || meta.name || authUser.email?.split('@')[0] || null;
          emailAuth = authUser.email || null;
        }
      }

      return {
        ...membro,
        nome: credencial?.nome || nomeAuth || `Usuário ${String(membro.usuario_id).substring(0, 8)}`,
        email: credencial?.username || emailAuth || '',
        cargo: credencial?.cargo || (membro.nivel_acesso === 'dono' ? 'Dono' : membro.nivel_acesso === 'gerente' ? 'Gerente' : 'Funcionário'),
        salario: credencial?.salario || 0,
        data_admissao: credencial?.data_admissao || membro.created_at,
        ativo: credencial?.ativo !== false,
      }
    });

    console.log("[DEBUG API] ArrayUsuarioIds final:", arrayUsuarioIds);
    return NextResponse.json(funcionariosEnriquecidos, { status: 200 })

  } catch (err: any) {
    console.error('[CRITICAL] Erro ao buscar funcionarios API:', err)
    return NextResponse.json({ message: err.message || 'Erro interno' }, { status: 500 })
  }
}

