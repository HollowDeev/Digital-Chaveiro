-- Tabela de caixas (sessões de caixa)
create table if not exists public.caixas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  funcionario_abertura_id uuid references auth.users(id) not null,
  funcionario_fechamento_id uuid references auth.users(id),
  valor_abertura numeric(10, 2) not null default 0,
  valor_fechamento numeric(10, 2),
  status text not null check (status in ('aberto', 'fechado')) default 'aberto',
  data_abertura timestamp with time zone default timezone('utc'::text, now()) not null,
  data_fechamento timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de movimentações de caixa
create table if not exists public.caixa_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid references public.caixas(id) on delete cascade not null,
  loja_id uuid references public.lojas(id) on delete cascade not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  categoria text not null,
  descricao text not null,
  valor numeric(10, 2) not null,
  funcionario_id uuid references auth.users(id) not null,
  venda_id uuid references public.vendas(id) on delete set null,
  data timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para melhor performance
create index if not exists idx_caixas_loja_id on public.caixas(loja_id);
create index if not exists idx_caixas_status on public.caixas(status);
create index if not exists idx_caixa_movimentacoes_caixa_id on public.caixa_movimentacoes(caixa_id);
create index if not exists idx_caixa_movimentacoes_loja_id on public.caixa_movimentacoes(loja_id);
create index if not exists idx_caixa_movimentacoes_data on public.caixa_movimentacoes(data);

-- Enable RLS
alter table public.caixas enable row level security;
alter table public.caixa_movimentacoes enable row level security;

-- RLS Policies para caixas
drop policy if exists "Usuários podem ver caixas de suas lojas" on public.caixas;
create policy "Usuários podem ver caixas de suas lojas"
  on public.caixas for select
  using (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixas.loja_id
      and usuario_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem criar caixas em suas lojas" on public.caixas;
create policy "Usuários podem criar caixas em suas lojas"
  on public.caixas for insert
  with check (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixas.loja_id
      and usuario_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem atualizar caixas de suas lojas" on public.caixas;
create policy "Usuários podem atualizar caixas de suas lojas"
  on public.caixas for update
  using (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixas.loja_id
      and usuario_id = auth.uid()
    )
  );

-- RLS Policies para movimentações de caixa
drop policy if exists "Usuários podem ver movimentações de caixas de suas lojas" on public.caixa_movimentacoes;
create policy "Usuários podem ver movimentações de caixas de suas lojas"
  on public.caixa_movimentacoes for select
  using (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixa_movimentacoes.loja_id
      and usuario_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem criar movimentações em suas lojas" on public.caixa_movimentacoes;
create policy "Usuários podem criar movimentações em suas lojas"
  on public.caixa_movimentacoes for insert
  with check (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixa_movimentacoes.loja_id
      and usuario_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem atualizar movimentações de suas lojas" on public.caixa_movimentacoes;
create policy "Usuários podem atualizar movimentações de suas lojas"
  on public.caixa_movimentacoes for update
  using (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixa_movimentacoes.loja_id
      and usuario_id = auth.uid()
    )
  );

drop policy if exists "Usuários podem deletar movimentações de suas lojas" on public.caixa_movimentacoes;
create policy "Usuários podem deletar movimentações de suas lojas"
  on public.caixa_movimentacoes for delete
  using (
    auth.uid() = (select dono_id from public.lojas where id = loja_id)
    or
    exists (
      select 1 from public.lojas_usuarios
      where loja_id = caixa_movimentacoes.loja_id
      and usuario_id = auth.uid()
    )
  );

-- Comentários
comment on table public.caixas is 'Tabela de sessões de caixa (abertura e fechamento)';
comment on table public.caixa_movimentacoes is 'Tabela de movimentações financeiras do caixa';
