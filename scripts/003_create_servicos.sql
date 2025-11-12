-- Tabela de serviços
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  nome text not null,
  descricao text,
  preco decimal(10,2) not null,
  custo decimal(10,2) not null default 0,
  duracao_estimada integer, -- em minutos
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.servicos enable row level security;

-- RLS Policies (mesmo padrão dos produtos)
create policy "Usuários podem ver serviços das lojas que têm acesso"
  on public.servicos for select
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

create policy "Donos e gerentes podem inserir serviços"
  on public.servicos for insert
  with check (
    exists (
      select 1 from public.lojas
      where id = loja_id and (
        dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = lojas.id and usuario_id = auth.uid()
          and nivel_acesso in ('dono', 'gerente')
        )
      )
    )
  );

create policy "Donos e gerentes podem atualizar serviços"
  on public.servicos for update
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and (
        dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = lojas.id and usuario_id = auth.uid()
          and nivel_acesso in ('dono', 'gerente')
        )
      )
    )
  );

create policy "Donos podem deletar serviços"
  on public.servicos for delete
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

-- Trigger
create trigger servicos_updated_at
  before update on public.servicos
  for each row
  execute function public.handle_updated_at();
