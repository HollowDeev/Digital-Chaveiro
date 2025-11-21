-- Fix RLS Policies para servicos
-- Este script corrige as policies para permitir que donos de loja tenham acesso total aos serviços

-- Remove policies antigas
drop policy if exists "Usuários podem ver serviços das lojas que têm acesso" on public.servicos;
drop policy if exists "Donos e gerentes podem inserir serviços" on public.servicos;
drop policy if exists "Donos e gerentes podem atualizar serviços" on public.servicos;
drop policy if exists "Donos podem deletar serviços" on public.servicos;

-- Policy SELECT - Donos e funcionários com acesso podem ver serviços
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

-- Policy INSERT - Donos podem inserir serviços
create policy "Donos podem inserir serviços"
  on public.servicos for insert
  with check (
    exists (
      select 1 from public.lojas
      where lojas.id = loja_id 
      and lojas.dono_id = auth.uid()
    )
  );

-- Policy UPDATE - Donos e gerentes podem atualizar serviços
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

-- Policy DELETE - Apenas donos podem deletar serviços
create policy "Donos podem deletar serviços"
  on public.servicos for delete
  using (
    exists (
      select 1 from public.lojas
      where lojas.id = servicos.loja_id 
      and lojas.dono_id = auth.uid()
    )
  );
