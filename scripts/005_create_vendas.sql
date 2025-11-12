-- Tabela de vendas
create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete set null,
  funcionario_id uuid references auth.users(id) on delete set null,
  total decimal(10,2) not null,
  desconto decimal(10,2) default 0,
  forma_pagamento text not null,
  tipo text not null check (tipo in ('avista', 'aprazo')),
  status text not null default 'concluida' check (status in ('concluida', 'cancelada', 'pendente')),
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de itens da venda
create table if not exists public.vendas_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references public.vendas(id) on delete cascade not null,
  tipo text not null check (tipo in ('produto', 'servico')),
  item_id uuid not null,
  nome text not null,
  quantidade integer not null,
  preco_unitario decimal(10,2) not null,
  subtotal decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.vendas enable row level security;
alter table public.vendas_itens enable row level security;

-- RLS Policies para vendas
create policy "Usuários podem ver vendas das lojas que têm acesso"
  on public.vendas for select
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

create policy "Usuários podem inserir vendas"
  on public.vendas for insert
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

create policy "Usuários podem atualizar vendas"
  on public.vendas for update
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

-- RLS Policies para itens das vendas
create policy "Usuários podem ver itens das vendas"
  on public.vendas_itens for select
  using (
    exists (
      select 1 from public.vendas v
      join public.lojas l on v.loja_id = l.id
      where v.id = venda_id and (
        l.dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = l.id and usuario_id = auth.uid()
        )
      )
    )
  );

create policy "Usuários podem inserir itens das vendas"
  on public.vendas_itens for insert
  with check (
    exists (
      select 1 from public.vendas v
      join public.lojas l on v.loja_id = l.id
      where v.id = venda_id and (
        l.dono_id = auth.uid() or
        exists (
          select 1 from public.lojas_usuarios
          where loja_id = l.id and usuario_id = auth.uid()
        )
      )
    )
  );
