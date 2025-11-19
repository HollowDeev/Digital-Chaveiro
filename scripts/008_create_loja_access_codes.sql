-- Tabela de códigos de acesso para convidar usuários às lojas
create table if not exists public.loja_access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  loja_id uuid references public.lojas(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamp with time zone,
  used boolean default false not null,
  used_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Policies: donos podem criar e ver códigos
alter table public.loja_access_codes enable row level security;

create policy "Donos podem inserir códigos"
  on public.loja_access_codes for insert
  with check (auth.uid() = (select dono_id from public.lojas where id = loja_id));

create policy "Donos podem selecionar códigos"
  on public.loja_access_codes for select
  using (auth.uid() = (select dono_id from public.lojas where id = loja_id));

create policy "Donos podem atualizar códigos (marcar usados)"
  on public.loja_access_codes for update
  using (auth.uid() = (select dono_id from public.lojas where id = loja_id))
  with check (auth.uid() = (select dono_id from public.lojas where id = loja_id));

-- Cria índice para busca por código
create index if not exists idx_loja_access_codes_code on public.loja_access_codes(code);

-- Note: Execute este arquivo manualmente no banco de dados de produção/desenvolvimento.
