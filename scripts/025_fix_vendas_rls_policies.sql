-- Fix: Recriar políticas RLS para tabela vendas
-- Problema: Políticas existentes não estão permitindo INSERT mesmo para donos de loja

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver vendas das lojas que têm acesso" ON public.vendas;
DROP POLICY IF EXISTS "Usuários podem inserir vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários podem atualizar vendas" ON public.vendas;

-- 2. Criar nova política de SELECT (visualização)
CREATE POLICY "Usuários podem ver vendas de suas lojas"
  ON public.vendas 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = vendas.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = vendas.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- 3. Criar nova política de INSERT (mais permissiva)
CREATE POLICY "Usuários podem inserir vendas em suas lojas"
  ON public.vendas 
  FOR INSERT
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

-- 4. Criar nova política de UPDATE
CREATE POLICY "Usuários podem atualizar vendas de suas lojas"
  ON public.vendas 
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = vendas.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = vendas.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- 5. Verificar se RLS está habilitado
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- 6. Teste: Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'vendas';
