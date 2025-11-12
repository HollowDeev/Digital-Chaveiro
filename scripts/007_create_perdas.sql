-- Tabela de categorias de perdas
create table if not exists public.categorias_perdas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  nome text not null,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de perdas
create table if not exists public.perdas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  produto_id uuid references public.produtos(id) on delete set null,
  categoria_id uuid references public.categorias_perdas(id) on delete set null,
  funcionario_id uuid references auth.users(id) on delete set null,
  nome_produto text not null,
  quantidade integer not null,
  valor_custo decimal(10,2) not null,
  motivo text not null,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categorias_perdas enable row level security;
alter table public.perdas enable row level security;

-- RLS Policies
create policy "Usuários podem ver categorias de perdas"
  on public.categorias_perdas for select
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

create policy "Donos e gerentes podem inserir categorias de perdas"
  on public.categorias_perdas for insert
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

create policy "Usuários podem ver perdas"
  on public.perdas for select
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

create policy "Usuários podem inserir perdas"
  on public.perdas for insert
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
