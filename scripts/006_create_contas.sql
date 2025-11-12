-- Tabela de categorias de despesas
create table if not exists public.categorias_despesas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  nome text not null,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de contas a pagar
create table if not exists public.contas_pagar (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  categoria_id uuid references public.categorias_despesas(id) on delete set null,
  descricao text not null,
  valor decimal(10,2) not null,
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente', 'paga', 'vencida')),
  recorrente boolean default false,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de contas a receber (vendas a prazo)
create table if not exists public.vendas_prazo_parcelas (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references public.vendas(id) on delete cascade not null,
  loja_id uuid references public.lojas(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete set null not null,
  numero_parcela integer not null,
  valor decimal(10,2) not null,
  data_vencimento date not null,
  data_recebimento date,
  status text not null default 'pendente' check (status in ('pendente', 'recebida', 'vencida')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categorias_despesas enable row level security;
alter table public.contas_pagar enable row level security;
alter table public.vendas_prazo_parcelas enable row level security;

-- RLS Policies para categorias
create policy "Usuários podem ver categorias das lojas que têm acesso"
  on public.categorias_despesas for select
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

create policy "Donos e gerentes podem inserir categorias"
  on public.categorias_despesas for insert
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

-- RLS Policies para contas a pagar
create policy "Usuários podem ver contas a pagar"
  on public.contas_pagar for select
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

create policy "Donos e gerentes podem inserir contas a pagar"
  on public.contas_pagar for insert
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

create policy "Usuários podem atualizar contas a pagar"
  on public.contas_pagar for update
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

-- RLS Policies para parcelas a receber
create policy "Usuários podem ver parcelas a receber"
  on public.vendas_prazo_parcelas for select
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

create policy "Usuários podem inserir parcelas a receber"
  on public.vendas_prazo_parcelas for insert
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

create policy "Usuários podem atualizar parcelas a receber"
  on public.vendas_prazo_parcelas for update
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

-- Triggers
create trigger contas_pagar_updated_at
  before update on public.contas_pagar
  for each row
  execute function public.handle_updated_at();

create trigger vendas_prazo_parcelas_updated_at
  before update on public.vendas_prazo_parcelas
  for each row
  execute function public.handle_updated_at();
