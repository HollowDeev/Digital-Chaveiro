-- Adiciona política para donos verem todos os usuários da sua loja
-- Esta política estava faltando e impedia que donos gerenciassem usuários

create policy "Donos podem ver usuários nas suas lojas"
  on public.lojas_usuarios for select
  using (auth.uid() = (select dono_id from public.lojas where id = loja_id));
