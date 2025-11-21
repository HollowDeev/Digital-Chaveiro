-- ============================================
-- SCRIPT CONSOLIDADO PARA CORRIGIR RLS POLICIES
-- ============================================
-- Este script corrige as policies de todas as tabelas para garantir que donos 
-- de loja tenham acesso apropriado aos dados, separando corretamente as verificações
-- de dono_id e lojas_usuarios

-- ============================================
-- PRODUTOS
-- ============================================

drop policy if exists "Usuários podem ver produtos das lojas que têm acesso" on public.produtos;
drop policy if exists "Usuários podem ver produtos das suas lojas" on public.produtos;
drop policy if exists "Donos e gerentes podem inserir produtos" on public.produtos;
drop policy if exists "Donos podem inserir produtos" on public.produtos;
drop policy if exists "Donos e gerentes podem atualizar produtos" on public.produtos;
drop policy if exists "Donos podem deletar produtos" on public.produtos;

create policy "Usuários podem ver produtos das suas lojas"
  on public.produtos for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = produtos.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = produtos.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Donos podem inserir produtos"
  on public.produtos for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

create policy "Donos e gerentes podem atualizar produtos"
  on public.produtos for update
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = produtos.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = produtos.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

create policy "Donos podem deletar produtos"
  on public.produtos for delete
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = produtos.loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

-- ============================================
-- SERVIÇOS
-- ============================================

drop policy if exists "Usuários podem ver serviços das lojas que têm acesso" on public.servicos;
drop policy if exists "Usuários podem ver serviços das suas lojas" on public.servicos;
drop policy if exists "Donos e gerentes podem inserir serviços" on public.servicos;
drop policy if exists "Donos podem inserir serviços" on public.servicos;
drop policy if exists "Donos e gerentes podem atualizar serviços" on public.servicos;
drop policy if exists "Donos podem deletar serviços" on public.servicos;

create policy "Usuários podem ver serviços das suas lojas"
  on public.servicos for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = servicos.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = servicos.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Donos podem inserir serviços"
  on public.servicos for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

create policy "Donos e gerentes podem atualizar serviços"
  on public.servicos for update
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = servicos.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = servicos.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

create policy "Donos podem deletar serviços"
  on public.servicos for delete
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = servicos.loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

-- ============================================
-- CLIENTES
-- ============================================

drop policy if exists "Usuários podem ver clientes das lojas que têm acesso" on public.clientes;
drop policy if exists "Usuários podem ver clientes das suas lojas" on public.clientes;
drop policy if exists "Usuários podem inserir clientes" on public.clientes;
drop policy if exists "Usuários podem atualizar clientes" on public.clientes;
drop policy if exists "Donos podem deletar clientes" on public.clientes;

create policy "Usuários podem ver clientes das suas lojas"
  on public.clientes for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = clientes.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = clientes.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem inserir clientes"
  on public.clientes for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem atualizar clientes"
  on public.clientes for update
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = clientes.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = clientes.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Donos podem deletar clientes"
  on public.clientes for delete
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = clientes.loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

-- ============================================
-- VENDAS
-- ============================================

drop policy if exists "Usuários podem ver vendas das lojas que têm acesso" on public.vendas;
drop policy if exists "Usuários podem ver vendas das suas lojas" on public.vendas;
drop policy if exists "Usuários podem inserir vendas" on public.vendas;
drop policy if exists "Usuários podem atualizar vendas" on public.vendas;

create policy "Usuários podem ver vendas das suas lojas"
  on public.vendas for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = vendas.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = vendas.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem inserir vendas"
  on public.vendas for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem atualizar vendas"
  on public.vendas for update
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = vendas.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = vendas.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

-- ============================================
-- VENDAS_ITENS
-- ============================================

drop policy if exists "Usuários podem ver itens das vendas" on public.vendas_itens;
drop policy if exists "Usuários podem inserir itens das vendas" on public.vendas_itens;

create policy "Usuários podem ver itens das vendas"
  on public.vendas_itens for select
  using (
    exists (
      select 1 from public.vendas
      join public.lojas on lojas.id = vendas.loja_id
      where vendas.id = vendas_itens.venda_id
      and (
        lojas.dono_id = auth.uid()
        or
        exists (
          select 1 from public.lojas_usuarios
          where lojas_usuarios.loja_id = lojas.id 
          and lojas_usuarios.usuario_id = auth.uid()
        )
      )
    )
  );

create policy "Usuários podem inserir itens das vendas"
  on public.vendas_itens for insert
  with check (
    exists (
      select 1 from public.vendas
      join public.lojas on lojas.id = vendas.loja_id
      where vendas.id = venda_id
      and (
        lojas.dono_id = auth.uid()
        or
        exists (
          select 1 from public.lojas_usuarios
          where lojas_usuarios.loja_id = lojas.id 
          and lojas_usuarios.usuario_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- CATEGORIAS_CONTAS
-- ============================================

drop policy if exists "Usuários podem ver categorias das lojas que têm acesso" on public.categorias_contas;
drop policy if exists "Usuários podem ver categorias de contas das suas lojas" on public.categorias_contas;
drop policy if exists "Donos e gerentes podem inserir categorias" on public.categorias_contas;
drop policy if exists "Donos e gerentes podem inserir categorias de contas" on public.categorias_contas;

create policy "Usuários podem ver categorias de contas das suas lojas"
  on public.categorias_contas for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = categorias_contas.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = categorias_contas.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Donos e gerentes podem inserir categorias de contas"
  on public.categorias_contas for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

-- ============================================
-- CONTAS_PAGAR
-- ============================================

drop policy if exists "Usuários podem ver contas a pagar" on public.contas_pagar;
drop policy if exists "Usuários podem ver contas a pagar das suas lojas" on public.contas_pagar;
drop policy if exists "Donos e gerentes podem inserir contas a pagar" on public.contas_pagar;
drop policy if exists "Usuários podem atualizar contas a pagar" on public.contas_pagar;
drop policy if exists "Donos e gerentes podem atualizar contas a pagar" on public.contas_pagar;

create policy "Usuários podem ver contas a pagar das suas lojas"
  on public.contas_pagar for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = contas_pagar.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = contas_pagar.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Donos e gerentes podem inserir contas a pagar"
  on public.contas_pagar for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

create policy "Donos e gerentes podem atualizar contas a pagar"
  on public.contas_pagar for update
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = contas_pagar.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = contas_pagar.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

-- ============================================
-- PARCELAS_RECEBER
-- ============================================

drop policy if exists "Usuários podem ver parcelas a receber" on public.parcelas_receber;
drop policy if exists "Usuários podem ver parcelas a receber das suas lojas" on public.parcelas_receber;
drop policy if exists "Usuários podem inserir parcelas a receber" on public.parcelas_receber;
drop policy if exists "Usuários podem atualizar parcelas a receber" on public.parcelas_receber;

create policy "Usuários podem ver parcelas a receber das suas lojas"
  on public.parcelas_receber for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = parcelas_receber.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = parcelas_receber.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem inserir parcelas a receber"
  on public.parcelas_receber for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem atualizar parcelas a receber"
  on public.parcelas_receber for update
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = parcelas_receber.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = parcelas_receber.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

-- ============================================
-- CATEGORIAS_PERDAS
-- ============================================

drop policy if exists "Usuários podem ver categorias de perdas" on public.categorias_perdas;
drop policy if exists "Usuários podem ver categorias de perdas das suas lojas" on public.categorias_perdas;
drop policy if exists "Donos e gerentes podem inserir categorias de perdas" on public.categorias_perdas;

create policy "Usuários podem ver categorias de perdas das suas lojas"
  on public.categorias_perdas for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = categorias_perdas.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = categorias_perdas.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Donos e gerentes podem inserir categorias de perdas"
  on public.categorias_perdas for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
      and lojas_usuarios.nivel_acesso in ('gerente')
    )
  );

-- ============================================
-- PERDAS
-- ============================================

drop policy if exists "Usuários podem ver perdas" on public.perdas;
drop policy if exists "Usuários podem ver perdas das suas lojas" on public.perdas;
drop policy if exists "Usuários podem inserir perdas" on public.perdas;

create policy "Usuários podem ver perdas das suas lojas"
  on public.perdas for select
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = perdas.loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = perdas.loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );

create policy "Usuários podem inserir perdas"
  on public.perdas for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
    or
    exists (
      select 1 from public.lojas_usuarios
      where lojas_usuarios.loja_id = loja_id 
      and lojas_usuarios.usuario_id = auth.uid()
    )
  );
