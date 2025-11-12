-- Tabela de clientes
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  nome text not null,
  email text,
  telefone text,
  cpf text,
  endereco text,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.clientes enable row level security;

-- RLS Policies
create policy "Usuários podem ver clientes das lojas que têm acesso"
  on public.clientes for select
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and (
        dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = lojas.id and usuario_id = auth.uid()
        )
      )
    )
  );

create policy "Usuários podem inserir clientes"
  on public.clientes for insert
  with check (
    exists (
      select 1 from public.lojas
      where id = loja_id and (
        dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = lojas.id and usuario_id = auth.uid()
        )
      )
    )
  );

create policy "Usuários podem atualizar clientes"
  on public.clientes for update
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and (
        dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = lojas.id and usuario_id = auth.uid()
        )
      )
    )
  );

create policy "Donos podem deletar clientes"
  on public.clientes for delete
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

-- Trigger
create trigger clientes_updated_at
  before update on public.clientes
  for each row
  execute function public.handle_updated_at();
