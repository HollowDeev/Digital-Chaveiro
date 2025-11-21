-- Fix RLS Policies para produtos
-- Este script corrige as policies para permitir que donos de loja tenham acesso total aos produtos

-- Remove policies antigas
drop policy if exists "Usuários podem ver produtos das lojas que têm acesso" on public.produtos;
drop policy if exists "Donos e gerentes podem inserir produtos" on public.produtos;
drop policy if exists "Donos e gerentes podem atualizar produtos" on public.produtos;
drop policy if exists "Donos podem deletar produtos" on public.produtos;

-- Policy SELECT - Donos e funcionários com acesso podem ver produtos
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

-- Policy INSERT - Donos podem inserir produtos
create policy "Donos podem inserir produtos"
  on public.produtos for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

-- Policy UPDATE - Donos e gerentes podem atualizar produtos
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

-- Policy DELETE - Apenas donos podem deletar produtos
create policy "Donos podem deletar produtos"
  on public.produtos for delete
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = produtos.loja_id 
      and lojas.dono_id = auth.uid()
    )
  );
