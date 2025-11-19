import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userIds: string[] = body?.userIds || []

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ message: 'Service role key missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Query auth.users directly using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .in('id', userIds)

    if (error) {
      console.error('Erro ao buscar users em auth.users', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    const users = (data || []).map((u: any) => {
      const meta = u.raw_user_meta_data || {}
      const displayName = meta?.full_name || meta?.name || u.email
      return { id: u.id, email: u.email, displayName }
    })

    return NextResponse.json({ users })
  } catch (err: any) {
    console.error('Erro /api/lojas/users-info', err)
    return NextResponse.json({ message: err.message || 'Erro interno' }, { status: 500 })
  }
}
