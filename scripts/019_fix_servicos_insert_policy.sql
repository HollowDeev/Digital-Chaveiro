-- Script 019: Corrigir todas as policies de serviços
-- Data: 2025-12-06
-- Descrição: Permitir que usuários em lojas_usuarios possam criar e visualizar serviços

-- Remover todas as policies antigas de serviços
DROP POLICY IF EXISTS "Donos podem inserir serviços" ON public.servicos;
DROP POLICY IF EXISTS "Usuários podem inserir serviços nas suas lojas" ON public.servicos;
DROP POLICY IF EXISTS "Usuários podem visualizar serviços das suas lojas" ON public.servicos;
DROP POLICY IF EXISTS "Usuários podem ver serviços das suas lojas" ON public.servicos;
DROP POLICY IF EXISTS "Usuários podem ver serviços das lojas que têm acesso" ON public.servicos;

-- Policy SELECT - Usuários podem ver serviços da sua loja
CREATE POLICY "Usuários podem visualizar serviços das suas lojas"
  ON public.servicos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- Policy INSERT - Usuários podem criar serviços nas suas lojas
CREATE POLICY "Usuários podem inserir serviços nas suas lojas"
  ON public.servicos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );
