-- Tabela de produtos
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  nome text not null,
  descricao text,
  preco decimal(10,2) not null,
  custo decimal(10,2) not null default 0,
  estoque integer not null default 0,
  estoque_minimo integer not null default 0,
  codigo_barras text,
  categoria text,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.produtos enable row level security;

-- RLS Policies
create policy "Usuários podem ver produtos das lojas que têm acesso"
  on public.produtos for select
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

create policy "Donos e gerentes podem inserir produtos"
  on public.produtos for insert
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

create policy "Donos e gerentes podem atualizar produtos"
  on public.produtos for update
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

create policy "Donos podem deletar produtos"
  on public.produtos for delete
  using (
    exists (
      select 1 from public.lojas
      where id = loja_id and dono_id = auth.uid()
    )
  );

-- Trigger para updated_at
create trigger produtos_updated_at
  before update on public.produtos
  for each row
  execute function public.handle_updated_at();
