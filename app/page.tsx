import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se não está autenticado, vai para login
  if (!user) {
    redirect("/auth/login")
  }

  // Se está autenticado, verifica se tem loja
  const { data: lojasOwner } = await supabase.from("lojas").select("*").eq("owner_id", user.id).limit(1)

  const { data: acessos } = await supabase.from("loja_usuarios").select("loja_id").eq("usuario_id", user.id).limit(1)

  const temLoja = (lojasOwner && lojasOwner.length > 0) || (acessos && acessos.length > 0)

  // Se não tem loja, vai para criar loja
  if (!temLoja) {
    redirect("/auth/criar-loja")
  }

  // Tem loja, vai para o PDV
  redirect("/pdv")
}
