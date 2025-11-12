-- Tabela de lojas/estabelecimentos
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  endereco text,
  telefone text,
  email text,
  dono_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de permissões de usuários nas lojas
create table if not exists public.lojas_usuarios (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  usuario_id uuid references auth.users(id) on delete cascade not null,
  nivel_acesso text not null check (nivel_acesso in ('dono', 'gerente', 'funcionario')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(loja_id, usuario_id)
);

-- Tabela de credenciais de funcionários (login compartilhado)
create table if not exists public.lojas_credenciais_funcionarios (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null unique,
  email text not null unique,
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.lojas enable row level security;
alter table public.lojas_usuarios enable row level security;
alter table public.lojas_credenciais_funcionarios enable row level security;

-- RLS Policies para lojas
create policy "Usuários podem ver lojas que têm acesso"
  on public.lojas for select
  using (
    auth.uid() = dono_id or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = lojas.id and usuario_id = auth.uid()
    )
  );

create policy "Donos podem criar lojas"
  on public.lojas for insert
  with check (auth.uid() = dono_id);

create policy "Donos podem atualizar suas lojas"
  on public.lojas for update
  using (auth.uid() = dono_id);

create policy "Donos podem deletar suas lojas"
  on public.lojas for delete
  using (auth.uid() = dono_id);

-- RLS Policies para lojas_usuarios
create policy "Usuários podem ver suas próprias permissões"
  on public.lojas_usuarios for select
  using (
    usuario_id = auth.uid() or
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

create policy "Donos podem adicionar usuários às suas lojas"
  on public.lojas_usuarios for insert
  with check (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

create policy "Donos podem atualizar permissões nas suas lojas"
  on public.lojas_usuarios for update
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

create policy "Donos podem remover usuários das suas lojas"
  on public.lojas_usuarios for delete
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

-- RLS Policies para credenciais de funcionários
create policy "Donos podem ver credenciais das suas lojas"
  on public.lojas_credenciais_funcionarios for select
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

create policy "Donos podem criar credenciais para suas lojas"
  on public.lojas_credenciais_funcionarios for insert
  with check (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

create policy "Donos podem atualizar credenciais das suas lojas"
  on public.lojas_credenciais_funcionarios for update
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger lojas_updated_at
  before update on public.lojas
  for each row
  execute function public.handle_updated_at();

create trigger lojas_credenciais_funcionarios_updated_at
  before update on public.lojas_credenciais_funcionarios
  for each row
  execute function public.handle_updated_at();
