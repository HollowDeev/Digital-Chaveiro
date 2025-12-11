-- Fix: Corrigir políticas RLS para servicos_realizados
-- Problema: Políticas não estão permitindo SELECT mesmo para donos de loja

-- 1. Remover políticas antigas (nomes anteriores e atuais)
DROP POLICY IF EXISTS "Usuários podem visualizar serviços realizados das suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem inserir serviços realizados nas suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem atualizar serviços realizados das suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem remover serviços realizados das suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem ver serviços realizados de suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem inserir serviços realizados em suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem atualizar serviços realizados de suas lojas" ON public.servicos_realizados;
DROP POLICY IF EXISTS "Usuários podem remover serviços realizados de suas lojas" ON public.servicos_realizados;

-- 2. Criar nova política de SELECT
CREATE POLICY "Usuários podem ver serviços realizados de suas lojas"
  ON public.servicos_realizados
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos_realizados.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos_realizados.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- 3. Criar nova política de INSERT
CREATE POLICY "Usuários podem inserir serviços realizados em suas lojas"
  ON public.servicos_realizados
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
CREATE POLICY "Usuários podem atualizar serviços realizados de suas lojas"
  ON public.servicos_realizados
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos_realizados.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos_realizados.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- 4. Criar nova política de DELETE
CREATE POLICY "Usuários podem remover serviços realizados de suas lojas"
  ON public.servicos_realizados
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas
      WHERE lojas.id = servicos_realizados.loja_id 
      AND lojas.dono_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lojas_usuarios
      WHERE lojas_usuarios.loja_id = servicos_realizados.loja_id 
      AND lojas_usuarios.usuario_id = auth.uid()
    )
  );

-- 5. Verificar se RLS está habilitado
ALTER TABLE public.servicos_realizados ENABLE ROW LEVEL SECURITY;

-- 6. Teste: Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'servicos_realizados';
